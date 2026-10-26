// Skill credit costs based on professionalism level
// High professionalism = 3 credits, Medium = 2 credits, Low = 1 credit

const SKILL_CREDIT_MAP = {
  // High professionalism (3 credits)
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

  // Medium professionalism (2 credits)
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

  // Low professionalism (1 credit)
  'Languages': 1,
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
};

const DEFAULT_CREDITS = 1;

function getSkillCredits(skillName) {
  if (!skillName) return DEFAULT_CREDITS;
  // Try exact match first (case-insensitive)
  const lower = skillName.toLowerCase();
  for (const [key, value] of Object.entries(SKILL_CREDIT_MAP)) {
    if (key.toLowerCase() === lower) return value;
  }
  // Try partial match
  for (const [key, value] of Object.entries(SKILL_CREDIT_MAP)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) return value;
  }
  return DEFAULT_CREDITS;
}

module.exports = { SKILL_CREDIT_MAP, DEFAULT_CREDITS, getSkillCredits };
