const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Session = require('./models/Session');

async function seed() {
  const userCount = await User.countDocuments();
  if (userCount > 0) {
    console.log('Database already has data, skipping seed.');
    return;
  }

  console.log('Seeding database...');

  const password = await bcrypt.hash('password123', 10);

  const users = await User.insertMany([
    {
      name: 'Alex Rivera',
      email: 'alex@example.com',
      password,
      bio: 'Full-stack developer passionate about teaching web technologies. 5+ years of experience with React, Node.js, and cloud services.',
      credits: 5,
      reputation: 4.7,
      sessionsCompleted: 12,
      skillsToTeach: [
        { name: 'React', totalRatings: 8, avgRating: 4.8, sessionsCount: 8 },
        { name: 'TypeScript', totalRatings: 4, avgRating: 4.5, sessionsCount: 4 },
      ],
      skillsToLearn: [
        { name: 'Piano', level: 'Low' },
        { name: 'Watercolor Painting', level: 'Low' },
      ],
      badges: [
        { name: 'First Session', description: 'Completed your first session', icon: '🎯', earnedAt: '2024-01-15' },
        { name: 'Top Rated', description: 'Maintained 4.5+ rating', icon: '⭐', earnedAt: '2024-03-20' },
      ],
    },
    {
      name: 'Maya Chen',
      email: 'maya@example.com',
      password,
      bio: 'Classical pianist and music theory enthusiast. Love sharing the joy of music with others!',
      credits: 3,
      reputation: 4.9,
      sessionsCompleted: 18,
      skillsToTeach: [
        { name: 'Piano', totalRatings: 15, avgRating: 4.9, sessionsCount: 15 },
        { name: 'Music Theory', totalRatings: 3, avgRating: 4.6, sessionsCount: 3 },
      ],
      skillsToLearn: [
        { name: 'React', level: 'Low' },
        { name: 'Photography', level: 'Medium' },
      ],
      badges: [
        { name: 'First Session', description: 'Completed your first session', icon: '🎯', earnedAt: '2024-01-10' },
        { name: 'Mentor', description: 'Completed 10+ sessions', icon: '🏆', earnedAt: '2024-04-01' },
      ],
    },
    {
      name: 'Jordan Lee',
      email: 'jordan@example.com',
      password,
      bio: 'Digital artist and photographer. Specializing in portrait photography and digital illustration.',
      credits: 2,
      reputation: 4.3,
      sessionsCompleted: 7,
      skillsToTeach: [
        { name: 'Photography', totalRatings: 5, avgRating: 4.4, sessionsCount: 5 },
        { name: 'Watercolor Painting', totalRatings: 2, avgRating: 4.0, sessionsCount: 2 },
      ],
      skillsToLearn: [
        { name: 'TypeScript', level: 'Medium' },
        { name: 'Music Theory', level: 'Low' },
      ],
      badges: [
        { name: 'First Session', description: 'Completed your first session', icon: '🎯', earnedAt: '2024-02-01' },
      ],
    },
    {
      name: 'Sam Patel',
      email: 'sam@example.com',
      password,
      bio: 'Yoga instructor and mindfulness coach with 8 years of practice. Certified in Hatha and Vinyasa yoga.',
      credits: 4,
      reputation: 4.6,
      sessionsCompleted: 10,
      skillsToTeach: [
        { name: 'Yoga', totalRatings: 8, avgRating: 4.7, sessionsCount: 8 },
        { name: 'Meditation', totalRatings: 2, avgRating: 4.3, sessionsCount: 2 },
      ],
      skillsToLearn: [
        { name: 'Piano', level: 'Low' },
        { name: 'React', level: 'Medium' },
      ],
      badges: [
        { name: 'First Session', description: 'Completed your first session', icon: '🎯', earnedAt: '2024-01-25' },
        { name: 'Consistent', description: 'Completed sessions 5 weeks in a row', icon: '🔥', earnedAt: '2024-03-15' },
      ],
    },
  ]);

  // Set unique connections using actual IDs
  const [alex, maya, jordan, sam] = users;
  await User.findByIdAndUpdate(alex._id, { uniqueConnections: [maya._id, jordan._id] });
  await User.findByIdAndUpdate(maya._id, { uniqueConnections: [alex._id, jordan._id, sam._id] });
  await User.findByIdAndUpdate(jordan._id, { uniqueConnections: [alex._id, maya._id] });
  await User.findByIdAndUpdate(sam._id, { uniqueConnections: [maya._id] });

  // Seed sessions
  await Session.insertMany([
    {
      teacherId: alex._id,
      learnerId: maya._id,
      skillName: 'React',
      type: 'full',
      status: 'completed',
      scheduledDate: '2024-06-10',
      scheduledTime: '14:00',
      duration: 60,
      actualDuration: 55,
      meetingLink: 'https://meet.jit.si/teachtrade-sess-1',
      teacherJoined: true,
      learnerJoined: true,
      teacherFeedback: { rating: 5, clarity: 5, patience: 5, knowledge: 5, engagement: 5, comment: 'Maya was an excellent student!', submittedAt: '2024-06-10T15:10:00Z' },
      learnerFeedback: { rating: 5, clarity: 5, patience: 5, knowledge: 5, engagement: 5, comment: 'Alex explains concepts so clearly!', submittedAt: '2024-06-10T15:12:00Z' },
    },
    {
      teacherId: maya._id,
      learnerId: alex._id,
      skillName: 'Piano',
      type: 'full',
      status: 'completed',
      scheduledDate: '2024-06-15',
      scheduledTime: '10:00',
      duration: 60,
      actualDuration: 58,
      meetingLink: 'https://meet.jit.si/teachtrade-sess-2',
      teacherJoined: true,
      learnerJoined: true,
      teacherFeedback: { rating: 5, clarity: 5, patience: 4, knowledge: 5, engagement: 5, comment: 'Great progress!', submittedAt: '2024-06-15T11:05:00Z' },
      learnerFeedback: { rating: 5, clarity: 5, patience: 5, knowledge: 5, engagement: 5, comment: 'Amazing teacher!', submittedAt: '2024-06-15T11:08:00Z' },
    },
  ]);

  console.log('Seed complete!');
}

module.exports = seed;
