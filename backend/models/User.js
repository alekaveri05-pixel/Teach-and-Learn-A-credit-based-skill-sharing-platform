const mongoose = require('mongoose');

const teachSkillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  totalRatings: { type: Number, default: 0 },
  avgRating: { type: Number, default: 0 },
  sessionsCount: { type: Number, default: 0 },
}, { _id: false });

const learnSkillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  level: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
}, { _id: false });

const badgeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  icon: String,
  earnedAt: String,
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bio: { type: String, default: '' },
  avatar: { type: String, default: '' },
  credits: { type: Number, default: 1 },
  reputation: { type: Number, default: 0 },
  sessionsCompleted: { type: Number, default: 0 },
  uniqueConnections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  skillsToTeach: [teachSkillSchema],
  skillsToLearn: [learnSkillSchema],
  badges: [badgeSchema],
  availability: [{
    day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
    startTime: String,
    endTime: String,
  }],
  // Fraud detection fields
  warningCount: { type: Number, default: 0 },
  warnings: [{
    reason: String,
    createdAt: String,
  }],
  flagged: { type: Boolean, default: false },
  suspended: { type: Boolean, default: false },
  // OTP fields
  resetOtp: { type: String, default: null },
  resetOtpExpires: { type: Date, default: null },
}, { timestamps: true });

// Virtual for id (return _id as id string)
userSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    delete ret.password;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
