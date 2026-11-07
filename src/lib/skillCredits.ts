
const SKILL_CREDIT_MAP: Record<string, number> = {
  // 3 Credits - Technical Skills
  'Programming': 3,
  'Web Development': 3,
  'Full Stack Development': 3,
  'Mobile Development': 3,
  'Software Engineering': 3,
  'Data Science': 3,
  'Machine Learning': 3,
  'Artificial Intelligence': 3,
  'AI': 3,
  'Cybersecurity': 3,
  'Cloud Computing': 3,
  'Blockchain': 3,
  'DevOps': 3,
  'Database Management': 3,
  'System Design': 3,
  'Python': 3,
  'JavaScript': 3,
  'TypeScript': 3,
  'React': 3,
  'Node.js': 3,
  'Java': 3,
  'C++': 3,
  'C#': 3,
  'Go': 3,
  'Rust': 3,
  'Swift': 3,
  'Kotlin': 3,
  'Angular': 3,
  'Vue.js': 3,
  'Next.js': 3,
  'Django': 3,
  'Spring Boot': 3,
  'Flutter': 3,
  'React Native': 3,
  'SQL': 3,
  'MongoDB': 3,
  'Docker': 3,
  'Kubernetes': 3,
  'AWS': 3,
  'Azure': 3,

  // 2 Credits - Creative / Business Skills
  'Graphic Design': 2,
  'UI/UX Design': 2,
  'Design': 2,
  'Video Editing': 2,
  'Photography': 2,
  'Digital Marketing': 2,
  'Marketing': 2,
  'Finance': 2,
  'Accounting': 2,
  'Music Production': 2,
  'Writing': 2,
  'Content Writing': 2,
  'Data Analysis': 2,
  'Project Management': 2,
  'Business Strategy': 2,
  'Watercolor Painting': 2,

  // 1 Credit - Basic / Hobby Skills
  'Languages': 1,
  'Spanish': 1,
  'French': 1,
  'German': 1,
  'Japanese': 1,
  'Hindi': 1,
  'Cooking': 1,
  'Fitness': 1,
  'Sports': 1,
  'Arts': 1,
  'Crafts': 1,
  'Music': 1,
  'Guitar': 1,
  'Piano': 1,
  'Singing': 1,
  'Drawing': 1,
  'Painting': 1,
  'Yoga': 1,
  'Meditation': 1,
  'Public Speaking': 1,
  'Chess': 1,
  'Dance': 1,
  'Music Theory': 1,
};

const DEFAULT_CREDITS = 5;

export function getSkillCredits(skillName: string): number {
  if (!skillName) return DEFAULT_CREDITS;

  const normalized = skillName.trim().toLowerCase();

  const matched = Object.entries(SKILL_CREDIT_MAP).find(
    ([key]) => key.toLowerCase() === normalized
  );

  return matched ? matched[1] : DEFAULT_CREDITS;
}

export { SKILL_CREDIT_MAP, DEFAULT_CREDITS };
