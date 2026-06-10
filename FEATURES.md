# 📋 Smart Semester AI — Feature Documentation

> Complete reference for every feature, how it works, and the technical decisions behind it.

---

## Table of Contents

1. [Onboarding Wizard](#1-onboarding-wizard)
2. [Dashboard](#2-dashboard)
3. [Courses Manager](#3-courses-manager)
4. [Assignments Tracker](#4-assignments-tracker)
5. [AI Study Assistant](#5-ai-study-assistant)
6. [AI Study Planner](#6-ai-study-planner)
7. [Notes & Quiz AI](#7-notes--quiz-ai)
8. [Attendance Tracker](#8-attendance-tracker)
9. [Analytics](#9-analytics)
10. [Settings](#10-settings)
11. [Data Architecture](#11-data-architecture)
12. [AI Integration Details](#12-ai-integration-details)

---

## 1. Onboarding Wizard

**Trigger:** Shown automatically on first launch when no profile is saved.

### Fields
| Field | Type | Purpose |
|---|---|---|
| Full Name | Text | Personalises all AI prompts and the greeting |
| Major | Text | Included in Claude's system prompt context |
| Academic Year | Select (1–5) | Helps AI calibrate advice complexity |
| Current Semester | Text | Shown in the top bar chip |
| GPA Goal | Range (2.0–4.0, step 0.1) | Drives the GPA progress indicator and AI motivation messaging |

### Behaviour
- Data is saved to `localStorage` key `ssa_profile` immediately on submit.
- Validation: Name must be ≥ 2 characters before the submit button activates.
- After saving, the main app renders and the wizard never appears again unless the name is cleared from Settings.

---

## 2. Dashboard

**Route:** `dashboard` (default on load)

### Stat Cards (4 KPIs)
| Card | Formula | Color Logic |
|---|---|---|
| Current GPA | Weighted average: Σ(gpaPoints × credits) / Σcredits | Gold accent |
| Active Courses | `courses.length` | Primary blue |
| Pending Tasks | `assignments.filter(status !== 'completed').length` | Purple; red if >5 |
| Due This Week | Assignments with `dueDate` within 7 days, not completed | Cyan; orange if >3 |

### Today's Focus Panel
- Lists all assignments where `getDaysUntil(dueDate) === 0` AND status is not `completed`.
- Also lists any **overdue** assignments (past due, not completed) with a red warning background.
- Each row has an inline checkbox that calls `toggleAssignment(id)` — immediately marks as done/undone in localStorage.
- Empty state: "All clear for today!" with a motivational message.

### AI Daily Insight Card
- Powered by Claude Sonnet 4.
- Calls the API once per session (guarded by `insightGenerated` state — doesn't re-call on re-render).
- System prompt: Full student context (name, major, GPA, all courses with grades, top 10 pending assignments).
- User message: Constructed from real data — current GPA, pending count, due-this-week count, weakest course name and grade.
- Response capped at **400 tokens** to keep it punchy (2–3 sentences).
- Result shown in an italic blockquote style.

### GPA Progress Bar
- Visual: linear-gradient bar, width = `(currentGPA / 4.0) × 100%`.
- Color: green if `gpa >= gpaGoal`, blue→purple gradient otherwise.

### Upcoming Deadlines Panel
- Shows assignments due in the next 7 days (not completed), sorted by due date ascending.
- Labels: "Today", "Tomorrow", "In N days", or short date if >7 days away.
- Color coding: red for today, gold for 1–2 days, muted grey for further out.

### Course Snapshot Panel
- Shows all courses with a color stripe, name, grade percentage, letter grade, and a horizontal progress bar.
- Progress bar fill color maps to grade: green ≥90%, blue ≥80%, gold ≥70%, orange ≥60%, red <60%.

---

## 3. Courses Manager

**Route:** `courses`

### Course Data Model
```js
{
  id:          string,   // generateId() — timestamp + random
  name:        string,   // Full course name
  code:        string,   // Short code e.g. "CS301"
  credits:     number,   // 1–10
  grade:       number,   // Current grade 0–100%
  instructor:  string,
  color:       string,   // Hex from COURSE_COLORS palette (10 options)
  targetGrade: number,   // Desired final grade 0–100%
}
```

### Add/Edit Modal Fields
- Course Name (required), Code (required, auto-uppercased), Credits (select 1–6), Instructor, Current Grade %, Target Grade %, Color (visual swatch picker).

### Course Card Features
- **Color accent bar** at the top matching the chosen course color.
- **Letter grade badge** (A+/A/A−/B+…F) calculated from the percentage.
- **GPA points** shown below the letter (4.0 scale).
- **Grade progress bar** with a vertical "target" marker showing gap to goal.
- **Gap badge**: shows "+3%" if meeting target, "↑8% needed" in red if below.
- **Cascade delete**: deleting a course also removes all its assignments and attendance records.
- Cards animate in with staggered delay (`animationDelay: idx * 60ms`).

### GPA Calculation
Uses credit-weighted average (standard university formula):
```
GPA = Σ (letterToGPA(grade) × credits) / Σ credits
```

Letter → GPA mapping follows the standard 4.0 scale: A = 4.0, A− = 3.7, B+ = 3.3, etc.

---

## 4. Assignments Tracker

**Route:** `assignments`

### Assignment Data Model
```js
{
  id:             string,
  courseId:       string,   // FK → courses[].id
  title:          string,
  description:    string,
  dueDate:        string,   // ISO date "YYYY-MM-DD"
  priority:       'high' | 'medium' | 'low',
  status:         'pending' | 'in-progress' | 'completed',
  estimatedHours: number,
  createdAt:      string,   // ISO datetime
  completedAt:    string | null,
}
```

### Filter Tabs
| Tab | Logic |
|---|---|
| All | Everything |
| Today | `getDaysUntil(dueDate) === 0` AND not completed |
| This Week | `daysUntil >= 0 && daysUntil <= 7` AND not completed |
| High Priority | `priority === 'high'` AND not completed |
| Completed | `status === 'completed'` |

Tab badges show live counts that update on every state change.

### Sort Options
- **Due Date** (default) — ascending by `new Date(dueDate)`
- **Priority** — High → Medium → Low (custom `getPriorityOrder()` map)
- **Course** — alphabetical by course name
- **Status** — alphabetical (completed last when combined with filter)

### Inline Checkbox
- Calls `toggleAssignment(id)` which flips status between `'pending'` and `'completed'`.
- On completing: sets `completedAt` to `new Date().toISOString()`.
- On un-completing: clears `completedAt` to `null`.
- Visual: green background + checkmark SVG when completed; red border + alert icon when overdue.

### Overdue Detection
A row gets a red tinted background if `getDaysUntil(dueDate) < 0` AND `status !== 'completed'`.

---

## 5. AI Study Assistant

**Route:** `assistant`

### Context System
Every conversation sends a **full student context** system prompt to Claude:
- Student name, major, year, semester, GPA, GPA goal
- All enrolled courses with: name, code, credits, current grade, target grade
- Top 10 upcoming (non-completed) assignments with: title, course, days until due, priority

This means Claude can answer things like *"Which course needs the most attention?"* with real numbers.

### Message Persistence
- Chat history stored in `localStorage` key `ssa_chat`.
- Full conversation history sent on every API call (multi-turn conversation).
- History is included in the API `messages` array, so Claude maintains conversation context across multiple turns.

### Quick Prompts
Four pre-built prompts shown on the empty state to help users get started:
1. "How can I improve my weakest course grade?"
2. "Explain dynamic programming with examples."
3. "What study technique works best before an exam?"
4. "Create a study plan for my pending assignments."

### Technical Details
- **Max tokens per response:** 1,200 (enough for detailed explanations with code blocks).
- **Keyboard shortcut:** `Enter` to send, `Shift+Enter` for newline in textarea.
- Textarea **auto-grows** up to 140px using `scrollHeight` calculation on every keystroke.
- Auto-scrolls to latest message using `messagesEndRef.scrollIntoView({ behavior: 'smooth' })`.
- Typing indicator shows three animated dots while API is in flight.

---

## 6. AI Study Planner

**Route:** `planner`

### AI Schedule Generation
Claude receives:
- Student profile (name, major, year, GPA goal)
- All courses (name, code, credits, current grade)
- All pending assignments sorted by due date (title, course, days until due, priority, estimated hours)
- Existing course colors (hex) for visual consistency

Claude returns **strict JSON** with this schema:
```json
{
  "blocks": [
    {
      "day": "Monday",
      "startTime": "09:00",
      "endTime": "11:00",
      "courseId": "c1",
      "courseName": "Data Structures",
      "color": "#5B9FFF",
      "activity": "Work on Graph Algorithms problem set",
      "priority": "high"
    }
  ],
  "totalHours": 22,
  "insights": "Schedule prioritises CS301 and ML assignments due within 48 hours."
}
```

The system prompt instructs Claude to:
- Max 3 blocks/day, each 1–2 hours
- Prioritise by deadline proximity
- Allocate more time to lower-grade or higher-credit courses
- Skip Sundays unless items are overdue

### Safety Parsing
JSON is cleaned of markdown fences before parsing:
```js
const cleaned = raw.replace(/```json|```/gi, '').trim();
const parsed  = JSON.parse(cleaned);
```
If parsing fails, a user-friendly error is shown prompting a retry.

### Calendar View
7-column grid (Mon–Sun), each column showing study blocks stacked vertically.
- Today's column has a blue border + header highlight.
- Each block shows: course name (color-coded), activity description, time range + duration in hours.
- Hover to reveal a delete button per block.

### Manual Blocks
Users can add blocks manually via the "Add Block" modal (day, start time, end time, course, activity).

---

## 7. Notes & Quiz AI

**Route:** `notes`

### Note Data Model
```js
{
  id:         string,
  title:      string,
  content:    string,        // Raw note text
  courseId:   string | null, // Optional course link
  summary:    string,        // Saved after AI runs
  keyPoints:  string[],      // Saved after AI runs
  flashcards: Array<{ question: string, answer: string }>,
  quiz:       Array<{ question, options[4], correct: 0-3, explanation }>,
  createdAt:  string,
  updatedAt:  string,
}
```
AI results are **saved back to the note** in localStorage after each run, so they persist.

### AI Actions

#### Summarize
Prompt asks Claude for 3–4 clear academic paragraphs focusing on key concepts and relationships.
Response rendered as `pre-wrap` text in the AI panel.

#### Key Points
Prompt asks for 6–10 numbered key concepts (1–2 sentences each).
Response parsed by splitting on newlines and stripping numbering prefixes (`/^\d+\.\s*/`).
Each point displayed as a numbered card with a blue circle indicator.

#### Flashcards
Prompt asks for JSON array `[{ question, answer }]` with 8–10 cards.
Each card renders as a **flip card** — click to toggle front/back.
State stored in `flippedCards` object `{ cardIndex: boolean }`.

#### Quiz Generator
Prompt asks for JSON array of 6 MCQ questions:
```json
[{
  "question": "What is the time complexity of BFS?",
  "options": ["O(1)", "O(log n)", "O(V + E)", "O(n²)"],
  "correct": 2,
  "explanation": "BFS visits every vertex and edge once."
}]
```
- Each option is a styled button.
- Selected answer highlighted in blue.
- On "Submit Quiz": correct answers turn green, wrong selections turn red.
- Score displayed as `X/6` with percentage.
- "Retry" button resets `quizAnswers` and `quizSubmitted`.
- Explanations revealed per question after submission.

### Auto-save
Note title and content changes set `isDirty = true`. Switching notes auto-saves via `updateNote()`. A "Save" button also appears in the editor header when unsaved.

---

## 8. Attendance Tracker

**Route:** `attendance`

### Attendance Record Model
```js
{
  id:        string,
  courseId:  string,
  date:      string,   // "YYYY-MM-DD"
  status:    'present' | 'late' | 'absent',
  note:      string,
  createdAt: string,
}
```

### Percentage Calculation
Late counts as **0.5** (partial attendance):
```js
pct = Math.round(((present + late * 0.5) / total) * 100)
```
This is more accurate than binary present/absent.

### At-Risk Warning
Any course with attendance < **75%** (configurable `MIN_ATTENDANCE` constant) shows:
- A red border on the course card.
- A red "Below 75% minimum attendance!" warning banner inside the card.

### Quick Mark Buttons
Every course card has three one-click buttons (P / L / A) that instantly log today's attendance for that course without opening the modal. Useful for rapid daily logging.

### Log Modal
Full form: select course, pick date (defaults to today), select status, optional note.

---

## 9. Analytics

**Route:** `analytics`

### Charts (Recharts)

| Chart | Type | Data |
|---|---|---|
| Grade by Course | `BarChart` | Current grade + target per course, color-coded |
| GPA Trend | `AreaChart` | 5-point mock historical + current GPA; goal shown as dashed line |
| Assignment Status | `PieChart` | Completed / Pending / Overdue counts |
| Credit Load | `BarChart` | Credits per course, course-colored bars |

All Recharts components use custom `CustomTooltip` styled with CSS variables for consistent dark theming.

### Performance Insights
Auto-generated text insights (no AI call, pure logic):
1. GPA vs goal — success if meeting it, deficit amount if not.
2. Weakest course alert if grade < 75%.
3. Overdue task count if > 0.
4. Completion rate celebration if ≥ 80%.

### Course Performance Table
Full tabular summary per course: name, code, credits, grade%, letter, GPA points, vs-target delta (green/red badge), attendance %.

---

## 10. Settings

**Route:** `settings`

### Profile Section
- Edits `ssa_profile` in localStorage.
- Changes are **local until Save is clicked** (form state separate from context state).
- Save button shows "Saved! ✓" for 2.5 seconds after saving, then reverts.
- Button is disabled when form matches saved profile (no changes).

### API Key Section
- Shows current key status (configured / not configured) from `import.meta.env.VITE_ANTHROPIC_API_KEY`.
- Step-by-step instructions for setting the key in `.env`.
- Key is displayed masked by default with a Show/Hide toggle.
- **Key is read-only in this UI** — changing it requires editing `.env` and restarting the dev server.

### Data Management
| Action | What it does |
|---|---|
| Clear All My Data | Empties courses, assignments, notes, attendance, chat. Keeps profile. |
| Full Reset to Demo Data | Replaces everything with the default sample data (4 CS courses + 7 assignments). |

Both actions require a confirmation modal before executing.

---

## 11. Data Architecture

### localStorage Keys
| Key | Contents | Default |
|---|---|---|
| `ssa_profile` | Student profile object | `{ name:'', major:'Computer Science', year:'3', ... }` |
| `ssa_courses` | Array of Course objects | 4 demo CS courses |
| `ssa_assignments` | Array of Assignment objects | 7 demo assignments with relative due dates |
| `ssa_notes` | Array of Note objects | `[]` |
| `ssa_chat` | Array of chat messages | `[]` |
| `ssa_studyblocks` | Array of StudyBlock objects | `[]` |
| `ssa_attendance` | Array of Attendance records | `[]` |
| `ssa_insights` | Last AI planner insights string | `''` |

### `useLocalStorage` Hook
Custom hook that wraps `useState` + `localStorage`:
- **Initialization**: reads + JSON-parses from localStorage on mount; falls back to `initialValue` if missing or invalid.
- **setValue**: updates React state + serializes to localStorage atomically.
- **Cross-tab sync**: listens for the `storage` event and syncs state when another tab modifies the same key.
- **Error safety**: all operations wrapped in try/catch — never crashes on quota exceeded or private mode.

### `AppContext`
Single React Context that holds all state and all action functions.
- All CRUD functions wrapped in `useCallback` to prevent unnecessary re-renders.
- `gpa` is a `useMemo` value — recomputed only when `courses` changes.
- Cascade deletes: `deleteCourse` also deletes related assignments and attendance records.

---

## 12. AI Integration Details

### Model
`claude-sonnet-4-20250514` — Anthropic's latest Sonnet model, chosen for the balance of speed, intelligence, and cost.

### API Call Pattern
```js
fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true', // Required for browser
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    system: systemPrompt,
    messages: [{ role: 'user', content: '...' }],
  }),
})
```

### Token Budget by Feature
| Feature | Max Tokens | Reason |
|---|---|---|
| Dashboard Insight | 400 | 2–3 sentences only |
| AI Assistant | 1,200 | Detailed explanations + code |
| Study Planner | 2,000 | Large JSON response |
| Notes Summary | 1,500 | 3–4 paragraphs |
| Key Points | 1,500 | Numbered list |
| Flashcards | 1,500 | 8–10 JSON objects |
| Quiz | 1,500 | 6 MCQ JSON objects |

### JSON Response Parsing
For structured responses (planner, flashcards, quiz), the raw response is cleaned before parsing:
```js
const cleaned = raw.replace(/```json|```/gi, '').trim();
try {
  const parsed = JSON.parse(cleaned);
} catch (err) {
  // Show user-friendly retry message
}
```

### Error Handling
- Missing/invalid API key: throws with a clear setup instruction message.
- Network errors: caught and shown in the UI via `error` state from `useClaudeAPI`.
- JSON parse failures (planner/quiz): shown as a retry prompt — Claude occasionally adds explanatory text.
- All errors are **non-crashing** — the UI stays functional.

### Production Security Note
Direct browser API calls expose the key in the network tab. For production:
1. Create a lightweight backend proxy (Node.js/Express or Next.js API route).
2. Store the key server-side as an environment variable.
3. Route all API calls through `/api/claude` instead of directly to Anthropic.

---

*Smart Semester AI — Built for HackIndia Vibe Coding Hackathon 2026*
