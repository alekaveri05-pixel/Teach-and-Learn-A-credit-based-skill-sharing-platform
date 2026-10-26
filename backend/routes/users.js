const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users.map(u => u.toJSON()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.userId !== req.params.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { name, bio, avatar, skillsToTeach, skillsToLearn, availability } = req.body;
    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;
    if (skillsToLearn !== undefined) user.skillsToLearn = skillsToLearn;
    if (skillsToTeach !== undefined) {
      // Merge: keep existing rating data for unchanged skills, add new ones
      const existingMap = {};
      user.skillsToTeach.forEach(s => { existingMap[s.name] = s; });
      user.skillsToTeach = skillsToTeach.map(s => {
        const existing = existingMap[s.name];
        if (existing) {
          return existing;
        }
        return { name: s.name, totalRatings: 0, avgRating: 0, sessionsCount: 0 };
      });
    }
    if (availability !== undefined) user.availability = availability;

    await user.save();
    res.json(user.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
