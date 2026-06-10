# 🎓 Smart Semester AI

> **AI-powered academic management platform** — plan smarter, study better, achieve more.
> Built for **HackIndia Vibe Coding Hackathon 2026**.

[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=flat&logo=vite)](https://vitejs.dev)
[![Claude](https://img.shields.io/badge/Claude-Sonnet_4-D97706?style=flat)](https://anthropic.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat)](LICENSE)

---

## 📸 What Is It?

Smart Semester AI is a full-stack frontend application that acts as a student's AI-powered academic companion. It combines course management, assignment tracking, AI-driven study planning, intelligent notes analysis, quiz generation, and attendance tracking — all in one beautifully designed dark-themed interface.

---

## ✨ Features

| Module | What it does |
|---|---|
| **Dashboard** | KPI cards (GPA, tasks, deadlines), AI daily insight, today's agenda |
| **Courses** | Add/edit/delete courses with grade tracking, progress bars, and GPA calculation |
| **Assignments** | Full CRUD with filters, priority sorting, overdue detection, quick-complete |
| **AI Assistant** | Context-aware Claude chat — knows your courses, grades, and assignments |
| **Study Planner** | AI generates an optimized weekly schedule as a 7-day calendar grid |
| **Notes & Quiz** | Write notes → AI summarizes, extracts key points, makes flashcards & quiz |
| **Attendance** | Per-course tracking with attendance %, overdue warnings, quick-mark |
| **Analytics** | GPA trend, grade distribution, completion pie, credits chart, insights |
| **Settings** | Profile, API key guide, data management, full reset |

---

## 🏗 Tech Stack

```
Frontend     React 18 + Vite 5
Styling      Tailwind CSS + CSS Variables (dark theme)
Charts       Recharts
Icons        Lucide React
AI           Anthropic Claude Sonnet 4 (direct API)
Storage      localStorage (offline, no backend needed)
Fonts        Outfit + DM Sans + JetBrains Mono (Google Fonts)
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ ([download](https://nodejs.org))
- **npm** v9+
- **Anthropic API key** ([get free key](https://console.anthropic.com/))

### 1 — Clone & Install

```bash
git clone https://github.com/your-username/smart-semester-ai.git
cd smart-semester-ai
npm install
```

### 2 — Configure API Key

```bash
cp .env.example .env
```

Open `.env` and paste your key:

```env
VITE_ANTHROPIC_API_KEY=sk-ant-your-key-here
```

> ⚠️ **Never commit `.env` to git.** It's already in `.gitignore`.

### 3 — Run Development Server

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## 📦 Build for Production

```bash
npm run build
npm run preview   # Preview the production build locally
```

The output is in the `dist/` folder — a static site ready to deploy anywhere.

---

## ☁️ Deployment Guide

### Option A — Vercel (Recommended, free)

```bash
npm install -g vercel
vercel
```

Add your environment variable in the Vercel dashboard:
`Settings → Environment Variables → VITE_ANTHROPIC_API_KEY`

### Option B — Netlify

```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

Set env variable in `Netlify → Site Settings → Environment Variables`.

### Option C — GitHub Pages

```bash
npm install --save-dev gh-pages
```

Add to `package.json` scripts:
```json
"deploy": "npm run build && gh-pages -d dist"
```

```bash
npm run deploy
```

### Option D — Docker

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_ANTHROPIC_API_KEY
ENV VITE_ANTHROPIC_API_KEY=$VITE_ANTHROPIC_API_KEY
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
docker build --build-arg VITE_ANTHROPIC_API_KEY=sk-ant-xxx -t smart-semester-ai .
docker run -p 8080:80 smart-semester-ai
```

---

## 🗂 Project Structure

```
smart-semester-ai/
├── index.html                    # HTML entry point + Google Fonts
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.example                  # Copy to .env and add your key
├── .gitignore
├── README.md
└── src/
    ├── main.jsx                  # React root
    ├── App.jsx                   # Layout + routing + onboarding
    ├── index.css                 # Design system (CSS vars, animations)
    ├── context/
    │   └── AppContext.jsx        # Global state + all CRUD actions
    ├── hooks/
    │   ├── useLocalStorage.js    # localStorage sync hook
    │   └── useClaudeAPI.js       # API call hook (loading + error)
    ├── utils/
    │   ├── claudeApi.js          # Anthropic API client + prompts
    │   └── helpers.js            # GPA calc, date utils, grade colors
    └── components/
        ├── layout/
        │   ├── Sidebar.jsx       # Collapsible navigation
        │   └── TopBar.jsx        # Page title + notifications
        ├── ui/
        │   ├── Button.jsx        # Multi-variant button
        │   ├── Card.jsx          # Card, StatCard, EmptyState
        │   ├── Modal.jsx         # Accessible modal + backdrop
        │   ├── Badge.jsx         # Status + priority badges
        │   └── Input.jsx         # Input, Textarea, Select, ColorPicker
        └── pages/
            ├── Dashboard.jsx
            ├── CoursesPage.jsx
            ├── AssignmentsPage.jsx
            ├── AIAssistantPage.jsx
            ├── StudyPlannerPage.jsx
            ├── NotesAIPage.jsx
            ├── AnalyticsPage.jsx
            ├── AttendancePage.jsx
            └── SettingsPage.jsx
```

---

## 🔑 Key Design Decisions

1. **No backend required** — All data lives in `localStorage`. The app works offline for everything except AI features.
2. **Context-aware AI** — Every AI feature receives the student's actual courses, grades, and assignments as context. Claude gives personalized, not generic, responses.
3. **Real-time GPA** — Weighted GPA is recalculated on every render using a pure function.
4. **Offline-first** — Full CRUD works with no internet. AI features gracefully degrade when the API is unreachable.

---

## 🔮 Future Roadmap

### v1.1 — Collaboration
- [ ] Export/import data as JSON
- [ ] Share study plans with classmates
- [ ] Collaborative notes with multiplayer cursors

### v1.2 — Integrations
- [ ] Google Calendar sync for assignments
- [ ] Moodle / Canvas LMS import
- [ ] WhatsApp reminders for due dates

### v1.3 — Advanced AI
- [ ] AI-powered grade prediction based on remaining assessments
- [ ] Adaptive quiz difficulty (harder after correct answers)
- [ ] AI-generated syllabus breakdown from PDF upload
- [ ] Voice-based study assistant

### v2.0 — Backend + Accounts
- [ ] User authentication (email / Google)
- [ ] Cloud sync across devices
- [ ] Instructor portal for class-wide analytics
- [ ] Mobile app (React Native)

---

## 💰 Monetization Ideas

| Model | Description |
|---|---|
| **Freemium** | Free tier: 3 courses, 50 AI messages/month. Pro: unlimited |
| **University B2B** | License to universities as a student success platform |
| **API Usage Split** | Users bring their own Claude API key (current model) |
| **Premium Features** | PDF import, LMS integrations, team notes, voice AI |
| **Institutional Analytics** | Anonymized aggregate data dashboards for academic advisors |
| **Tutoring Marketplace** | Connect struggling students with tutors based on weak subjects |

---

## 🏆 Hackathon — 2-Minute Pitch

### Problem
Students juggle 4-6 courses, dozens of assignments, attendance, and exam prep — all tracked across scattered notebooks, spreadsheets, and phone reminders. There's no single intelligent place that understands their academic situation and helps them act on it.

### Solution
**Smart Semester AI** — one platform that combines:
- **Automatic GPA tracking** across all courses
- **Smart task management** that flags overdue work before it's too late
- **An AI study assistant** that knows your exact courses and assignments — not generic tutoring
- **AI-generated study schedules** based on your actual deadline pressure and grade gaps
- **Notes intelligence** — paste your lecture notes, get a summary, flashcards, and a quiz in seconds
- **Attendance tracking** with warnings before you breach the 75% minimum

### Impact
A student using Smart Semester AI for one semester could:
- Reduce assignment deadline misses by ~70% (through overdue alerts and deadline tracking)
- Cut study planning time from 2 hours/week to 5 minutes (AI schedule generation)
- Improve weak-subject grades by proactively identifying which course needs more attention

### Why now?
With LLMs now capable of genuine academic reasoning, and with students increasingly overwhelmed by complex course loads, the timing for an AI academic companion is perfect. We're not replacing studying — we're removing the organizational friction that stops students from doing it.

### Future Vision
University licensing for student success programs. Integration with LMS platforms (Canvas, Moodle). A mobile app that sends smart reminders 48 hours before deadlines.

---

## 🎭 Judge Demo Script

**Step 1 — Onboarding (30s)**
Open the app fresh. The setup wizard appears — fill in name ("Rahul Verma"), major ("CS"), Year 3, semester ("Spring 2026"), and GPA goal (3.7). Click "Start My Semester".

**Step 2 — Dashboard (45s)**
Show the dashboard with pre-loaded demo data. Point to the 4 KPI cards. Click "Generate Insight" and show Claude returning a personalized study tip referencing the actual weakest course.

**Step 3 — AI Assistant (30s)**
Navigate to AI Assistant. Ask: *"My DBMS grade is 79% and I have an SQL lab due today. What should I focus on?"* Show Claude's context-aware response mentioning the actual course.

**Step 4 — Study Planner (30s)**
Navigate to Study Planner. Click "Generate AI Plan". Show the 7-column calendar grid populated with color-coded study blocks optimized around assignment deadlines.

**Step 5 — Notes & Quiz (30s)**
Paste any 3-4 paragraph text into Notes. Click "Quiz" → show Claude generating 6 MCQ questions. Answer them and submit. Show the score and explanations.

**Step 6 — Analytics (15s)**
Quick flip to Analytics. Show the grade bar chart, GPA trend line, and the performance insights that flag the weakest course and overdue assignments.

**Total demo: ~3 minutes**

---

## 👨‍💻 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit: `git commit -m 'Add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

MIT © 2026 Smart Semester AI Team

---

<div align="center">
  <strong>Built with ❤️ for HackIndia Vibe Coding Hackathon 2026</strong><br/>
  <em>Powered by Anthropic Claude · React · Vite</em>
</div>
