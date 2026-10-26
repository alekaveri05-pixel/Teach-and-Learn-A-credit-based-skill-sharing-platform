import { User, Session } from '@/types';

const USERS_KEY = 'teachtrade_users';
const SESSIONS_KEY = 'teachtrade_sessions';
const CURRENT_USER_KEY = 'teachtrade_current_user';

// Seed data
const seedUsers: User[] = [
  {
    id: 'user-1',
    name: 'Alex Rivera',
    email: 'alex@example.com',
    password: 'password123',
    bio: 'Full-stack developer passionate about teaching web technologies. 5+ years of experience with React, Node.js, and cloud services.',
    avatar: '',
    credits: 5,
    reputation: 4.7,
    sessionsCompleted: 12,
    uniqueConnections: ['user-2', 'user-3'],
    skillsToTeach: [
      { name: 'React', totalRatings: 8, avgRating: 4.8, sessionsCount: 8 },
      { name: 'TypeScript', totalRatings: 4, avgRating: 4.5, sessionsCount: 4 },
    ],
    skillsToLearn: [
      { name: 'Piano', level: 'Low' },
      { name: 'Watercolor Painting', level: 'Low' },
    ],
    badges: [
      { id: 'b1', name: 'First Session', description: 'Completed your first session', icon: '🎯', earnedAt: '2024-01-15' },
      { id: 'b2', name: 'Top Rated', description: 'Maintained 4.5+ rating', icon: '⭐', earnedAt: '2024-03-20' },
    ],
    createdAt: '2024-01-01',
  },
  {
    id: 'user-2',
    name: 'Maya Chen',
    email: 'maya@example.com',
    password: 'password123',
    bio: 'Classical pianist and music theory enthusiast. Love sharing the joy of music with others!',
    avatar: '',
    credits: 3,
    reputation: 4.9,
    sessionsCompleted: 18,
    uniqueConnections: ['user-1', 'user-3', 'user-4'],
    skillsToTeach: [
      { name: 'Piano', totalRatings: 15, avgRating: 4.9, sessionsCount: 15 },
      { name: 'Music Theory', totalRatings: 3, avgRating: 4.6, sessionsCount: 3 },
    ],
    skillsToLearn: [
      { name: 'React', level: 'Low' },
      { name: 'Photography', level: 'Medium' },
    ],
    badges: [
      { id: 'b1', name: 'First Session', description: 'Completed your first session', icon: '🎯', earnedAt: '2024-01-10' },
      { id: 'b3', name: 'Mentor', description: 'Completed 10+ sessions', icon: '🏆', earnedAt: '2024-04-01' },
    ],
    createdAt: '2024-01-05',
  },
  {
    id: 'user-3',
    name: 'Jordan Lee',
    email: 'jordan@example.com',
    password: 'password123',
    bio: 'Digital artist and photographer. Specializing in portrait photography and digital illustration.',
    avatar: '',
    credits: 2,
    reputation: 4.3,
    sessionsCompleted: 7,
    uniqueConnections: ['user-1', 'user-2'],
    skillsToTeach: [
      { name: 'Photography', totalRatings: 5, avgRating: 4.4, sessionsCount: 5 },
      { name: 'Watercolor Painting', totalRatings: 2, avgRating: 4.0, sessionsCount: 2 },
    ],
    skillsToLearn: [
      { name: 'TypeScript', level: 'Medium' },
      { name: 'Music Theory', level: 'Low' },
    ],
    badges: [
      { id: 'b1', name: 'First Session', description: 'Completed your first session', icon: '🎯', earnedAt: '2024-02-01' },
    ],
    createdAt: '2024-01-20',
  },
  {
    id: 'user-4',
    name: 'Sam Patel',
    email: 'sam@example.com',
    password: 'password123',
    bio: 'Yoga instructor and mindfulness coach with 8 years of practice. Certified in Hatha and Vinyasa yoga.',
    avatar: '',
    credits: 4,
    reputation: 4.6,
    sessionsCompleted: 10,
    uniqueConnections: ['user-2'],
    skillsToTeach: [
      { name: 'Yoga', totalRatings: 8, avgRating: 4.7, sessionsCount: 8 },
      { name: 'Meditation', totalRatings: 2, avgRating: 4.3, sessionsCount: 2 },
    ],
    skillsToLearn: [
      { name: 'Piano', level: 'Low' },
      { name: 'React', level: 'Medium' },
    ],
    badges: [
      { id: 'b1', name: 'First Session', description: 'Completed your first session', icon: '🎯', earnedAt: '2024-01-25' },
      { id: 'b4', name: 'Consistent', description: 'Completed sessions 5 weeks in a row', icon: '🔥', earnedAt: '2024-03-15' },
    ],
    createdAt: '2024-01-15',
  },
];

const seedSessions: Session[] = [
  {
    id: 'sess-1',
    teacherId: 'user-1',
    learnerId: 'user-2',
    skillName: 'React',
    type: 'full',
    status: 'completed',
    scheduledDate: '2024-06-10',
    scheduledTime: '14:00',
    duration: 60,
    actualDuration: 55,
    meetingLink: 'https://meet.jit.si/teachtrade-sess-1',
    teacherFeedback: { rating: 5, clarity: 5, patience: 5, knowledge: 5, engagement: 5, comment: 'Maya was an excellent student!', submittedAt: '2024-06-10T15:10:00Z' },
    learnerFeedback: { rating: 5, clarity: 5, patience: 5, knowledge: 5, engagement: 5, comment: 'Alex explains concepts so clearly!', submittedAt: '2024-06-10T15:12:00Z' },
    materials: [],
    createdAt: '2024-06-08',
  },
  {
    id: 'sess-2',
    teacherId: 'user-2',
    learnerId: 'user-1',
    skillName: 'Piano',
    type: 'full',
    status: 'completed',
    scheduledDate: '2024-06-15',
    scheduledTime: '10:00',
    duration: 60,
    actualDuration: 58,
    meetingLink: 'https://meet.jit.si/teachtrade-sess-2',
    teacherFeedback: { rating: 5, clarity: 5, patience: 4, knowledge: 5, engagement: 5, comment: 'Great progress!', submittedAt: '2024-06-15T11:05:00Z' },
    learnerFeedback: { rating: 5, clarity: 5, patience: 5, knowledge: 5, engagement: 5, comment: 'Amazing teacher!', submittedAt: '2024-06-15T11:08:00Z' },
    materials: [],
    createdAt: '2024-06-13',
  },
];

function initializeData() {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(seedUsers));
  }
  if (!localStorage.getItem(SESSIONS_KEY)) {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(seedSessions));
  }
}

// Users
export function getUsers(): User[] {
  initializeData();
  return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
}

export function getUser(id: string): User | undefined {
  return getUsers().find(u => u.id === id);
}

export function getUserByEmail(email: string): User | undefined {
  return getUsers().find(u => u.email === email);
}

export function saveUser(user: User) {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === user.id);
  if (idx >= 0) users[idx] = user;
  else users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function createUser(data: Omit<User, 'id' | 'credits' | 'reputation' | 'sessionsCompleted' | 'uniqueConnections' | 'badges' | 'createdAt'>): User {
  const user: User = {
    ...data,
    id: 'user-' + Date.now(),
    credits: 1,
    reputation: 0,
    sessionsCompleted: 0,
    uniqueConnections: [],
    badges: [],
    createdAt: new Date().toISOString().split('T')[0],
  };
  saveUser(user);
  return user;
}

// Sessions
export function getSessions(): Session[] {
  initializeData();
  return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]');
}

export function getSession(id: string): Session | undefined {
  return getSessions().find(s => s.id === id);
}

export function saveSession(session: Session) {
  const sessions = getSessions();
  const idx = sessions.findIndex(s => s.id === session.id);
  if (idx >= 0) sessions[idx] = session;
  else sessions.push(session);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function getUserSessions(userId: string): Session[] {
  return getSessions().filter(s => s.teacherId === userId || s.learnerId === userId);
}

// Current user
export function getCurrentUserId(): string | null {
  return localStorage.getItem(CURRENT_USER_KEY);
}

export function setCurrentUserId(id: string | null) {
  if (id) localStorage.setItem(CURRENT_USER_KEY, id);
  else localStorage.removeItem(CURRENT_USER_KEY);
}

// Generate meeting link
export function generateMeetingLink(): string {
  const roomId = 'teachtrade-' + Math.random().toString(36).substring(2, 10);
  return `https://meet.jit.si/${roomId}`;
}
