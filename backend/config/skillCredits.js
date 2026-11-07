
const SKILL_CREDIT_MAP = {
  // 3 Credits
  'Programming': 3,
  'Web Development': 3,
  'Data Science': 3,
  'Machine Learning': 3,
  'Artificial Intelligence': 3,
  'AI': 3,
  'Cybersecurity': 3,
  'Cloud Computing': 3,
  'Blockchain': 3,
  'DevOps': 3,
  'Software Engineering': 3,
  'Database Management': 3,
  'System Design': 3,
  'Mobile Development': 3,
  'Full Stack Development': 3,

  // 2 Credits
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

  // 1 Credit
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

function getSkillCredits(skillName) {
  if (!skillName) return DEFAULT_CREDITS;

  const lower = skillName.trim().toLowerCase();

  const matched = Object.entries(SKILL_CREDIT_MAP).find(
    ([key]) => key.toLowerCase() === lower
  );

  return matched ? matched[1] : DEFAULT_CREDITS;
}

module.exports = {
  SKILL_CREDIT_MAP,
  DEFAULT_CREDITS,
  getSkillCredits,
};
