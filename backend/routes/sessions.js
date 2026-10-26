const express = require('express');
const Session = require('../models/Session');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { checkUserStatus, detectBookingAbuse, detectCompletionAbuse } = require('../middleware/fraudDetection');
const { getSkillCredits } = require('../config/skillCredits');

const router = express.Router();

function generateMeetingLink() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let roomId = 'teachtrade';
  for (let i = 0; i < 10; i++) roomId += chars[Math.floor(Math.random() * chars.length)];
  return `https://meet.jit.si/${roomId}`;
}

// Get user's sessions
router.get('/', auth, async (req, res) => {
  try {
    const sessions = await Session.find({
      $or: [{ teacherId: req.userId }, { learnerId: req.userId }]
    }).sort({ createdAt: -1 });
    res.json(sessions.map(s => s.toJSON()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get session by ID
router.get('/:id', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create session
router.post('/', auth, checkUserStatus, detectBookingAbuse, async (req, res) => {
  try {
    const { teacherId, skillName, type, scheduledDate, scheduledTime, duration } = req.body;

    const creditCost = getSkillCredits(skillName);

    // Check and deduct credits for full sessions at booking time
    if (type === 'full') {
      const learner = await User.findById(req.userId);
      if (!learner || learner.credits < creditCost) {
        return res.status(400).json({ error: `Not enough credits. This skill requires ${creditCost} credit(s)` });
      }
      learner.credits -= creditCost;
      await learner.save();
    }

    // Only 1 trial session allowed per teacher-learner pair
    if (type === 'trial') {
      const existingTrial = await Session.findOne({
        teacherId,
        learnerId: req.userId,
        type: 'trial',
        status: { $ne: 'cancelled' },
      });
      if (existingTrial) {
        return res.status(400).json({
          error: 'You have already had a trial session with this teacher. Please book a full session to continue learning.',
        });
      }
    }

    const session = await Session.create({
      teacherId,
      learnerId: req.userId,
      skillName,
      type,
      status: 'scheduled',
      scheduledDate,
      scheduledTime,
      duration,
      creditCost,
      meetingLink: generateMeetingLink(),
      materials: [],
    });

    res.status(201).json(session.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update session (status, etc.)
router.put('/:id', auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const { status, actualDuration } = req.body;
    if (status) session.status = status;
    if (actualDuration !== undefined) session.actualDuration = actualDuration;

    await session.save();
    res.json(session.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Join session
router.post('/:id/join', auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const isTeacher = session.teacherId.toString() === req.userId;
    const isLearner = session.learnerId.toString() === req.userId;

    if (!isTeacher && !isLearner) {
      return res.status(403).json({ error: 'Not a participant' });
    }

    if (isTeacher) session.teacherJoined = true;
    if (isLearner) session.learnerJoined = true;

    if (session.teacherJoined && session.learnerJoined) {
      session.status = 'in-progress';
    }

    await session.save();
    res.json(session.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit feedback
router.post('/:id/feedback', auth, checkUserStatus, detectCompletionAbuse, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const isTeacher = session.teacherId.toString() === req.userId;
    const isLearner = session.learnerId.toString() === req.userId;

    if (!isTeacher && !isLearner) {
      return res.status(403).json({ error: 'Not a participant' });
    }

    const feedback = {
      ...req.body,
      submittedAt: new Date().toISOString(),
    };

    if (isTeacher) session.teacherFeedback = feedback;
    if (isLearner) session.learnerFeedback = feedback;

    // If both submitted, complete session and transfer credits
    if (session.teacherFeedback && session.learnerFeedback) {
      const alreadyCompleted = session.status === 'completed';
      session.status = 'completed';

      if (!alreadyCompleted && session.type === 'full') {
        const minDuration = session.duration * 0.5;
        const credits = session.creditCost || 1;
        const effectiveDuration = session.actualDuration || session.duration;
        if (effectiveDuration >= minDuration) {
          const teacher = await User.findById(session.teacherId);
          const learner = await User.findById(session.learnerId);

          if (teacher && learner) {
            teacher.credits += credits;  // Teacher gets paid
            // Learner already paid at booking — do NOT deduct again
            teacher.sessionsCompleted += 1;
            learner.sessionsCompleted += 1;

            // Unique connections
            if (!teacher.uniqueConnections.includes(learner._id)) teacher.uniqueConnections.push(learner._id);
            if (!learner.uniqueConnections.includes(teacher._id)) learner.uniqueConnections.push(teacher._id);

            // Update teacher skill rating
            const skill = teacher.skillsToTeach.find(s => s.name === session.skillName);
            if (skill && session.learnerFeedback) {
              skill.totalRatings += 1;
              skill.avgRating = ((skill.avgRating * (skill.totalRatings - 1)) + session.learnerFeedback.rating) / skill.totalRatings;
              skill.sessionsCount += 1;
            }

            // Reputation
            const allRatings = teacher.skillsToTeach.map(s => s.avgRating).filter(r => r > 0);
            teacher.reputation = allRatings.length > 0 ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length : 0;

            await teacher.save();
            await learner.save();
          }
        }
      }
    }

    await session.save();
    res.json(session.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload material (teacher only)
router.post('/:id/materials', auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const isTeacher = session.teacherId.toString() === req.userId;
    if (!isTeacher) return res.status(403).json({ error: 'Only teachers can upload materials' });

    const { name, size, type, data } = req.body;
    if (!name || !data) return res.status(400).json({ error: 'Name and data are required' });

    // Limit file size (~10MB base64)
    if (data.length > 14 * 1024 * 1024) {
      return res.status(400).json({ error: 'File too large (max 10MB)' });
    }

    const material = {
      name,
      size: size || 0,
      type: type || 'application/octet-stream',
      url: data, // base64 data URL
      uploadedAt: new Date().toISOString(),
    };

    session.materials.push(material);
    await session.save();
    res.json(session.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete material (teacher only)
router.delete('/:id/materials/:materialId', auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const isTeacher = session.teacherId.toString() === req.userId;
    if (!isTeacher) return res.status(403).json({ error: 'Only teachers can delete materials' });

    session.materials = session.materials.filter(m => m._id.toString() !== req.params.materialId);
    await session.save();
    res.json(session.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update teacher notes (teacher only)
router.put('/:id/notes', auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const isTeacher = session.teacherId.toString() === req.userId;
    if (!isTeacher) return res.status(403).json({ error: 'Only teachers can edit notes' });

    session.teacherNotes = req.body.notes || '';
    await session.save();
    res.json(session.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload note file (teacher only)
router.post('/:id/note-files', auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const isTeacher = session.teacherId.toString() === req.userId;
    if (!isTeacher) return res.status(403).json({ error: 'Only teachers can upload note files' });

    const { name, size, type, data } = req.body;
    if (!name || !data) return res.status(400).json({ error: 'Name and data are required' });
    if (data.length > 7 * 1024 * 1024) return res.status(400).json({ error: 'File too large (max 5MB)' });

    session.noteFiles.push({
      name,
      size: size || 0,
      type: type || 'application/octet-stream',
      url: data,
      uploadedAt: new Date().toISOString(),
    });
    await session.save();
    res.json(session.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete note file (teacher only)
router.delete('/:id/note-files/:fileId', auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const isTeacher = session.teacherId.toString() === req.userId;
    if (!isTeacher) return res.status(403).json({ error: 'Only teachers can delete note files' });

    session.noteFiles = session.noteFiles.filter(f => f._id.toString() !== req.params.fileId);
    await session.save();
    res.json(session.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel session
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const isParticipant = session.teacherId.toString() === req.userId || session.learnerId.toString() === req.userId;
    if (!isParticipant) return res.status(403).json({ error: 'Not a participant' });

    if (session.status !== 'scheduled') {
      return res.status(400).json({ error: 'Only scheduled sessions can be cancelled' });
    }

    session.status = 'cancelled';
    session.cancelledBy = req.userId;
    session.cancelledAt = new Date().toISOString();
    await session.save();

    // Refund credits if full session
    if (session.type === 'full') {
      const learner = await User.findById(session.learnerId);
      if (learner) {
        learner.credits += session.creditCost || 1;
        await learner.save();
      }
    }

    res.json(session.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reschedule session
router.post('/:id/reschedule', auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const isParticipant = session.teacherId.toString() === req.userId || session.learnerId.toString() === req.userId;
    if (!isParticipant) return res.status(403).json({ error: 'Not a participant' });

    if (session.status !== 'scheduled') {
      return res.status(400).json({ error: 'Only scheduled sessions can be rescheduled' });
    }

    const { scheduledDate, scheduledTime } = req.body;
    if (!scheduledDate || !scheduledTime) return res.status(400).json({ error: 'Date and time are required' });

    session.scheduledDate = scheduledDate;
    session.scheduledTime = scheduledTime;
    session.teacherJoined = false;
    session.learnerJoined = false;
    await session.save();
    res.json(session.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Report session
router.post('/:id/report', auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const isParticipant = session.teacherId.toString() === req.userId || session.learnerId.toString() === req.userId;
    if (!isParticipant) return res.status(403).json({ error: 'Not a participant' });

    const { reason, details } = req.body;
    if (!reason || !details) return res.status(400).json({ error: 'Reason and details are required' });

    session.reports.push({
      reporterId: req.userId,
      reason,
      details,
      createdAt: new Date().toISOString(),
    });
    await session.save();
    res.json(session.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
