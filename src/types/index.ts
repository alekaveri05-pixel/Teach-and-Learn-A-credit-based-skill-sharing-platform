export interface AvailabilitySlot {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string;
  endTime: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  bio: string;
  avatar: string;
  credits: number;
  reputation: number;
  sessionsCompleted: number;
  uniqueConnections: string[];
  skillsToTeach: Skill[];
  skillsToLearn: LearnSkill[];
  badges: Badge[];
  availability?: AvailabilitySlot[];
  createdAt: string;
}

export interface Skill {
  name: string;
  totalRatings: number;
  avgRating: number;
  sessionsCount: number;
}

export interface LearnSkill {
  name: string;
  level: 'Low' | 'Medium' | 'High';
}

export interface Session {
  id: string;
  teacherId: string;
  learnerId: string;
  skillName: string;
  type: 'trial' | 'full';
  status: 'scheduled' | 'in-progress' | 'pending-feedback' | 'completed' | 'cancelled';
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  creditCost?: number;
  actualDuration?: number;
  meetingLink: string;
  teacherFeedback?: Feedback;
  learnerFeedback?: Feedback;
  teacherJoined?: boolean;
  learnerJoined?: boolean;
  materials: Material[];
  teacherNotes?: string;
  noteFiles?: NoteFile[];
  createdAt: string;
}

export interface Feedback {
  rating: number;
  clarity: number;
  patience: number;
  knowledge: number;
  engagement: number;
  comment: string;
  submittedAt: string;
}

export interface Material {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
}

export interface NoteFile {
  _id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
}

export type SkillLevel = 'Low' | 'Medium' | 'High';
