import React, { useState } from 'react';
import Sidebar  from './components/layout/Sidebar';
import TopBar   from './components/layout/TopBar';

// Page components
import Dashboard       from './components/pages/Dashboard';
import CoursesPage     from './components/pages/CoursesPage';
import AssignmentsPage from './components/pages/AssignmentsPage';
import AIAssistantPage from './components/pages/AIAssistantPage';
import StudyPlannerPage from './components/pages/StudyPlannerPage';
import NotesAIPage     from './components/pages/NotesAIPage';
import AnalyticsPage   from './components/pages/AnalyticsPage';
import AttendancePage  from './components/pages/AttendancePage';
import SettingsPage    from './components/pages/SettingsPage';

// Context + UI
import { useApp }  from './context/AppContext';
import Button      from './components/ui/Button';
import { Input, FormField, Select, RangeInput } from './components/ui/Input';
import { GraduationCap, Sparkles, ArrowRight, BookOpen } from 'lucide-react';

/* ================================================================
   Smart Semester AI — Root Application
   Handles page routing via state, layout structure,
   and first-time user onboarding.
   ================================================================ */

// Page registry — maps page IDs to their components and titles
const PAGES = {
  dashboard:   { component: Dashboard,        title: 'Dashboard' },
  courses:     { component: CoursesPage,      title: 'My Courses' },
  assignments: { component: AssignmentsPage,  title: 'Assignments' },
  assistant:   { component: AIAssistantPage,  title: 'AI Study Assistant' },
  planner:     { component: StudyPlannerPage, title: 'Study Planner' },
  notes:       { component: NotesAIPage,      title: 'Notes & Quiz' },
  analytics:   { component: AnalyticsPage,    title: 'Analytics' },
  attendance:  { component: AttendancePage,   title: 'Attendance Tracker' },
  settings:    { component: SettingsPage,     title: 'Settings' },
};

export default function App() {
  const { profile, setProfile } = useApp();

  // App-level navigation state
  const [currentPage, setCurrentPage] = useState('dashboard');

  // ── ONBOARDING STATE ──
  // Shows if the user hasn't set their name yet (first launch)
  const needsOnboarding = !profile.name;
  const [onboardForm, setOnboardForm] = useState({
    name:       '',
    major:      'Computer Science',
    year:       '3',
    semester:   'Spring 2026',
    gpaGoal:    3.7,
  });
  const [onboardStep, setOnboardStep] = useState(1);

  // Handle onboarding form save
  const handleOnboardSave = () => {
    if (!onboardForm.name.trim()) return;
    setProfile({ ...onboardForm, name: onboardForm.name.trim() });
  };

  // ── RENDER ACTIVE PAGE COMPONENT ──
  const { component: PageComponent, title } = PAGES[currentPage] || PAGES.dashboard;

  // ── ONBOARDING SCREEN ──
  if (needsOnboarding) {
    return <OnboardingScreen form={onboardForm} setForm={setOnboardForm} onSave={handleOnboardSave} />;
  }

  // ── MAIN APP LAYOUT ──
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: 'var(--bg-primary)',
      overflow: 'hidden',
    }}>
      {/* Left sidebar navigation */}
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />

      {/* Right content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Top bar */}
        <TopBar title={title} />

        {/* Page content */}
        <main
          key={currentPage} /* triggers fade animation on page change */
          className="page-enter bg-grid"
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '24px',
          }}
        >
          <PageComponent onNavigate={setCurrentPage} />
        </main>
      </div>
    </div>
  );
}

/* ── ONBOARDING WIZARD COMPONENT ── */
const OnboardingScreen = ({ form, setForm, onSave }) => {
  const update = (key, val) => setForm(p => ({ ...p, [key]: val }));
  const isValid = form.name.trim().length >= 2;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}
    className="bg-grid"
    >
      {/* Decorative glows */}
      <div style={{
        position: 'absolute', top: '10%', left: '10%',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(91,159,255,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '10%',
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,101,245,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="animate-scale-in" style={{
        width: '100%',
        maxWidth: 480,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-xl)',
        padding: '40px',
        boxShadow: 'var(--shadow-lg)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: 60,
            height: 60,
            borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, var(--primary), var(--purple))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: 'var(--shadow-primary)',
          }}>
            <GraduationCap size={28} style={{ color: '#fff' }} />
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '22px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '6px',
          }}>
            Welcome to{' '}
            <span className="text-gradient-primary">Smart Semester AI</span>
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Let's set up your academic profile. You can change this any time in Settings.
          </p>
        </div>

        {/* Form fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <FormField label="Your Name" htmlFor="name" required>
            <Input
              id="name"
              value={form.name}
              onChange={e => update('name', e.target.value)}
              placeholder="e.g., Rahul Verma"
              autoFocus
              error={form.name.length > 0 && form.name.trim().length < 2 ? 'Please enter at least 2 characters' : ''}
            />
          </FormField>

          <FormField label="Major / Field of Study" htmlFor="major">
            <Input
              id="major"
              value={form.major}
              onChange={e => update('major', e.target.value)}
              placeholder="e.g., Computer Science"
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <FormField label="Year" htmlFor="year">
              <Select id="year" value={form.year} onChange={e => update('year', e.target.value)}>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
                <option value="5">Graduate</option>
              </Select>
            </FormField>

            <FormField label="Current Semester" htmlFor="semester">
              <Input
                id="semester"
                value={form.semester}
                onChange={e => update('semester', e.target.value)}
                placeholder="e.g., Spring 2026"
              />
            </FormField>
          </div>

          <FormField label="GPA Goal">
            <RangeInput
              min={2.0}
              max={4.0}
              step={0.1}
              value={form.gpaGoal}
              onChange={e => update('gpaGoal', parseFloat(e.target.value))}
              label={`Target GPA: ${form.gpaGoal}`}
            />
          </FormField>

          {/* Submit */}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            icon={Sparkles}
            iconRight={ArrowRight}
            disabled={!isValid}
            onClick={onSave}
            style={{ marginTop: '8px' }}
          >
            Start My Semester
          </Button>
        </div>

        <p style={{
          textAlign: 'center',
          fontSize: '12px',
          color: 'var(--text-muted)',
          marginTop: '20px',
        }}>
          All data is stored locally on your device. No account needed.
        </p>
      </div>
    </div>
  );
};
