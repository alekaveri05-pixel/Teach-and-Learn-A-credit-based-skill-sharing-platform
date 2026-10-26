const Session = require('../models/Session');
const User = require('../models/User');

// Thresholds — more lenient to avoid false positives
const MAX_SESSIONS_PER_DAY = 8;
const MAX_SESSIONS_SAME_PARTNER_PER_WEEK = 5;
const MAX_RAPID_COMPLETIONS_PER_HOUR = 4;
const MIN_SESSION_GAP_MINUTES = 5;
const MAX_CANCELLATIONS_PER_DAY = 5;
const SUSPICION_THRESHOLD = 5;   // warnings before flag
const SUSPEND_THRESHOLD = 10;    // warnings before suspend

/**
 * Check if a user is flagged/suspended before allowing session actions
 */
async function checkUserStatus(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.suspended) {
      return res.status(403).json({
        error: 'Your account has been suspended due to suspicious activity. Contact support.',
      });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * Detect abuse patterns when creating a new session
 */
async function detectBookingAbuse(req, res, next) {
  try {
    const userId = req.userId;
    const { teacherId } = req.body;
    const now = new Date();

    // 1. Can't book session with yourself
    if (teacherId === userId) {
      return res.status(400).json({ error: 'You cannot book a session with yourself' });
    }

    // 2. Daily session limit
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todaySessions = await Session.countDocuments({
      $or: [{ teacherId: userId }, { learnerId: userId }],
      createdAt: { $gte: startOfDay },
      status: { $ne: 'cancelled' },
    });

    if (todaySessions >= MAX_SESSIONS_PER_DAY) {
      await addWarning(userId, 'excessive_daily_bookings');
      return res.status(429).json({
        error: `You've reached the maximum of ${MAX_SESSIONS_PER_DAY} sessions per day. Try again tomorrow.`,
      });
    }

    // 3. Repeated pairing detection (same two users too frequently)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentPairSessions = await Session.countDocuments({
      $or: [
        { teacherId, learnerId: userId },
        { teacherId: userId, learnerId: teacherId },
      ],
      createdAt: { $gte: oneWeekAgo },
      status: { $ne: 'cancelled' },
    });

    if (recentPairSessions >= MAX_SESSIONS_SAME_PARTNER_PER_WEEK) {
      await addWarning(userId, 'repeated_pairing');
      return res.status(429).json({
        error: `You've had too many sessions with this user recently. Connect with other learners and teachers to keep the community diverse.`,
      });
    }

    // 4. Too many sessions too close together (rapid booking)
    const recentSession = await Session.findOne({
      $or: [{ teacherId: userId }, { learnerId: userId }],
      status: 'scheduled',
      createdAt: { $gte: new Date(now.getTime() - MIN_SESSION_GAP_MINUTES * 60 * 1000) },
    });

    if (recentSession) {
      return res.status(429).json({
        error: `Please wait at least ${MIN_SESSION_GAP_MINUTES} minutes between booking sessions.`,
      });
    }

    // 5. Excessive cancellations today
    const todayCancellations = await Session.countDocuments({
      cancelledBy: userId,
      cancelledAt: { $gte: startOfDay.toISOString() },
    });

    if (todayCancellations >= MAX_CANCELLATIONS_PER_DAY) {
      await addWarning(userId, 'excessive_cancellations');
      return res.status(429).json({
        error: 'Too many cancellations today. Please be more thoughtful when booking sessions.',
      });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * Detect suspicious patterns during feedback/completion
 */
async function detectCompletionAbuse(req, res, next) {
  try {
    const userId = req.userId;
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const now = new Date();

    // 1. Rapid completions (completing too many sessions in short time)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentCompletions = await Session.countDocuments({
      $or: [{ teacherId: userId }, { learnerId: userId }],
      status: 'completed',
      updatedAt: { $gte: oneHourAgo },
    });

    if (recentCompletions >= MAX_RAPID_COMPLETIONS_PER_HOUR) {
      await addWarning(userId, 'rapid_completions');
      // Don't block, but flag for review
    }

    // 2. Suspiciously short actual duration
    if (session.actualDuration !== undefined && session.actualDuration < 2 && session.type === 'full') {
      await addWarning(userId, 'suspiciously_short_session');
    }

    // 3. Check for mutual boosting pattern (A teaches B AND B teaches A repeatedly)
    // IMPORTANT: Only flag if BOTH users are actively teaching each other
    // Never flag a teacher just because a learner keeps booking them
    const partnerId = session.teacherId.toString() === userId
      ? session.learnerId.toString()
      : session.teacherId.toString();

    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const mutualSessions = await Session.find({
      $or: [
        { teacherId: userId, learnerId: partnerId },
        { teacherId: partnerId, learnerId: userId },
      ],
      status: 'completed',
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Count how many times EACH person was teacher
    const userAsTeacher = mutualSessions.filter(s => s.teacherId.toString() === userId).length;
    const partnerAsTeacher = mutualSessions.filter(s => s.teacherId.toString() === partnerId).length;

    // Only flag BOTH if both are actively teaching each other 5+ times
    // This means both are gaming the system together
    if (userAsTeacher >= 5 && partnerAsTeacher >= 5) {
      await addWarning(userId, 'mutual_credit_farming');
      await addWarning(partnerId, 'mutual_credit_farming');
    }
    // If only one person is repeatedly booking the other — warn only the booker
    else if (userAsTeacher === 0 && partnerAsTeacher >= 8) {
      // User is only a learner — partner is suspiciously only teaching this one person
      await addWarning(partnerId, 'repeated_one_sided_teaching');
    }

    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * Add a warning to a user; auto-suspend if threshold exceeded
 */
async function addWarning(userId, reason) {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    user.warnings = user.warnings || [];
    user.warnings.push({
      reason,
      createdAt: new Date().toISOString(),
    });

    user.warningCount = (user.warningCount || 0) + 1;

    // Flag after 5 warnings
    if (user.warningCount >= SUSPICION_THRESHOLD) {
      user.flagged = true;
    }

    // Suspend only after 10 warnings
    if (user.warningCount >= SUSPEND_THRESHOLD) {
      user.suspended = true;
    }

    await user.save({ validateBeforeSave: false });
  } catch (err) {
    console.error('Failed to add warning:', err.message);
  }
}

module.exports = {
  checkUserStatus,
  detectBookingAbuse,
  detectCompletionAbuse,
};