const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  rating: { type: Number, required: true },
  clarity: { type: Number, default: 0 },
  patience: { type: Number, default: 0 },
  knowledge: { type: Number, default: 0 },
  engagement: { type: Number, default: 0 },
  comment: { type: String, default: '' },
  submittedAt: { type: String, required: true },
}, { _id: false });

const materialSchema = new mongoose.Schema({
  name: String,
  size: Number,
  type: String,
  url: String,
  uploadedAt: String,
});

const sessionSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  learnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skillName: { type: String, required: true },
  type: { type: String, enum: ['trial', 'full'], required: true },
  status: { type: String, enum: ['scheduled', 'in-progress', 'pending-feedback', 'completed', 'cancelled'], default: 'scheduled' },
  scheduledDate: { type: String, required: true },
  scheduledTime: { type: String, required: true },
  duration: { type: Number, required: true },
  creditCost: { type: Number, default: 1 },
  actualDuration: Number,
  meetingLink: String,
  teacherJoined: { type: Boolean, default: false },
  learnerJoined: { type: Boolean, default: false },
  teacherFeedback: feedbackSchema,
  learnerFeedback: feedbackSchema,
  materials: [materialSchema],
  teacherNotes: { type: String, default: '' },
  noteFiles: [{
    name: String,
    size: Number,
    type: String,
    url: String,
    uploadedAt: String,
  }],
  reports: [{
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    details: String,
    createdAt: String,
  }],
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cancelledAt: String,
}, { timestamps: true });

sessionSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    ret.teacherId = ret.teacherId?.toString ? ret.teacherId.toString() : ret.teacherId;
    ret.learnerId = ret.learnerId?.toString ? ret.learnerId.toString() : ret.learnerId;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Session', sessionSchema);
