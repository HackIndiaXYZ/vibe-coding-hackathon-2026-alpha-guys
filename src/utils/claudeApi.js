/* ================================================================
   Smart Semester AI — Claude API Client
   Tries the real Anthropic API first; falls back to the offline
   Mock AI engine if the key is missing, invalid, or the network
   call fails. All four AI features work in both modes.
   ================================================================ */

import { getMockResponse } from './mockAI.js';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL   = 'claude-sonnet-4-20250514';

/**
 * Send messages to Claude. If no valid API key is present, or if
 * the request fails, automatically falls back to the offline mock.
 *
 * @param {Array<{role: 'user'|'assistant', content: string}>} messages
 * @param {string} systemPrompt
 * @param {number} maxTokens
 * @returns {Promise<string>}
 */
export const sendClaudeMessage = async (
  messages,
  systemPrompt = '',
  maxTokens = 1500
) => {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  const hasKey = apiKey && apiKey !== 'sk-ant-your-api-key-here' && apiKey.startsWith('sk-');

  // ── Try real API if key is configured ──
  if (hasKey) {
    try {
      const response = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: maxTokens,
          system: systemPrompt,
          messages,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const textBlock = data.content?.find(b => b.type === 'text');
        if (textBlock?.text) return textBlock.text;
      }
      // Non-OK response → fall through to mock
    } catch (_networkErr) {
      // Network error → fall through to mock
    }
  }

  // ── Offline mock fallback ──
  return getMockResponse(messages, systemPrompt);
};

/* ── PROMPT BUILDERS (unchanged — used by pages) ── */

export const buildAssistantSystemPrompt = (profile, courses, assignments) => {
  const { name, major, year, semester, gpaGoal } = profile;

  const courseList = courses.length > 0
    ? courses.map(c =>
        `  • ${c.name} (${c.code}) — ${c.credits} credits — Grade: ${c.grade}% — Target: ${c.targetGrade}%`
      ).join('\n')
    : '  No courses added yet.';

  const upcoming = assignments
    .filter(a => a.status !== 'completed')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 10);

  const assignmentList = upcoming.length > 0
    ? upcoming.map(a => {
        const course = courses.find(c => c.id === a.courseId);
        const daysLeft = Math.ceil((new Date(a.dueDate) - new Date()) / 86400000);
        const urgency = daysLeft <= 0 ? '🚨 OVERDUE' : daysLeft === 1 ? '⚠️ Tomorrow' : `In ${daysLeft}d`;
        return `  • [${a.priority.toUpperCase()}] ${a.title} — ${course?.name || 'Unknown'} — ${urgency}`;
      }).join('\n')
    : '  No pending assignments.';

  return `You are Smart Semester AI — an intelligent academic companion built to help students study smarter and perform better.

## Student Profile
- Name: ${name || 'Student'}
- Major: ${major || 'Not set'} | Year: ${year || '1'}
- Semester: ${semester || 'Current'}
- GPA Goal: ${gpaGoal || 3.5}

## Enrolled Courses (${courses.length})
${courseList}

## Pending Assignments (${upcoming.length})
${assignmentList}

## Your Behavior Guidelines
- Be concise, warm, and academically focused
- Reference the student's actual courses and assignments when relevant
- Give specific, actionable advice — not generic platitudes
- Use bullet points and headers to organize longer responses
- For math/code/formulas, use clear formatting
- Encourage and motivate realistically — not with empty praise
- If asked about a topic in a course they're taking, teach it contextually`;
};

export const buildPlannerPrompt = (profile, courses, assignments) => {
  const courseInfo = courses.map(c =>
    `${c.name} (${c.code}): Grade ${c.grade}%, ${c.credits} credits`
  ).join('\n');

  const assignmentInfo = assignments
    .filter(a => a.status !== 'completed')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .map(a => {
      const course = courses.find(c => c.id === a.courseId);
      const daysLeft = Math.ceil((new Date(a.dueDate) - new Date()) / 86400000);
      return `${a.title} (${course?.name}) — due in ${daysLeft} days — ${a.priority} priority — est. ${a.estimatedHours || 2}h`;
    }).join('\n');

  const courseColors = courses.reduce((acc, c) => {
    acc[c.id] = c.color || '#5B9FFF';
    return acc;
  }, {});

  return `Create a realistic weekly study schedule for this student.

Student: ${profile.name || 'Student'}, ${profile.major}, Year ${profile.year}
GPA Goal: ${profile.gpaGoal}

Courses:
${courseInfo || 'None added yet'}

Pending Assignments:
${assignmentInfo || 'None pending'}

Course colors for schedule: ${JSON.stringify(courseColors)}
Available days: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday

Rules:
1. Max 3 study blocks per day, each 1-2 hours
2. Prioritize assignments with closer deadlines
3. Give more blocks to courses with lower grades or more credits
4. Don't schedule on Sunday unless there are overdue items
5. Include variety — alternate subjects throughout the week

Return ONLY valid JSON in this EXACT format (no markdown, no explanations):
{
  "blocks": [
    {
      "day": "Monday",
      "startTime": "09:00",
      "endTime": "11:00",
      "courseId": "course_id_here",
      "courseName": "Course Name",
      "color": "#5B9FFF",
      "activity": "Work on [specific assignment or topic]",
      "priority": "high"
    }
  ],
  "totalHours": 18,
  "insights": "One sentence about why this schedule was structured this way."
}`;
};

export const buildSummaryPrompt = (notesContent) =>
  `Summarize the following academic notes into 3-4 clear paragraphs. Focus on key concepts, relationships between ideas, and important facts. Write at a level appropriate for a university student reviewing before an exam:

Notes:
${notesContent}`;

export const buildKeyPointsPrompt = (notesContent) =>
  `Extract 6-10 key concepts and important points from these academic notes. Format as a clean numbered list. Each point should be concise (1-2 sentences) and cover a distinct concept:

Notes:
${notesContent}`;

export const buildFlashcardsPrompt = (notesContent) =>
  `Generate 8-10 study flashcards from these academic notes. Return ONLY valid JSON (no markdown, no explanation):
[
  { "question": "Question about key concept?", "answer": "Clear, concise answer." }
]

Notes:
${notesContent}`;

export const buildQuizPrompt = (notesContent) =>
  `Create a 6-question multiple-choice quiz based on these academic notes. Return ONLY valid JSON:
[
  {
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "explanation": "Why this answer is correct."
  }
]

Notes:
${notesContent}`;
