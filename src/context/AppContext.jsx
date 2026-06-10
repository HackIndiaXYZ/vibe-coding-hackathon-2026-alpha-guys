import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useLocalStorage }  from '../hooks/useLocalStorage';
import { generateId, calculateGPA } from '../utils/helpers';

/* ── CONTEXT CREATION ── */
const AppContext = createContext(null);

/* ── DEFAULT DEMO DATA ──────────────────────────────────────────
   Pre-populated so the app looks alive on first launch.
   Users can reset this from the Settings page.
   ────────────────────────────────────────────────────────────── */
const DEFAULT_COURSES = [
  {
    id: 'c1',
    name: 'Data Structures & Algorithms',
    code: 'CS301',
    credits: 4,
    grade: 88,
    instructor: 'Dr. Arjun Mehta',
    color: '#5B9FFF',
    targetGrade: 92,
  },
  {
    id: 'c2',
    name: 'Machine Learning',
    code: 'CS450',
    credits: 3,
    grade: 92,
    instructor: 'Dr. Priya Sharma',
    color: '#8B65F5',
    targetGrade: 95,
  },
  {
    id: 'c3',
    name: 'Database Management Systems',
    code: 'CS320',
    credits: 3,
    grade: 79,
    instructor: 'Prof. David Chen',
    color: '#F5B942',
    targetGrade: 85,
  },
  {
    id: 'c4',
    name: 'Software Engineering',
    code: 'CS380',
    credits: 3,
    grade: 85,
    instructor: 'Dr. Anita Williams',
    color: '#22C87A',
    targetGrade: 88,
  },
];

// Generate realistic assignment due dates relative to today
const td = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

const DEFAULT_ASSIGNMENTS = [
  {
    id: 'a1',
    courseId: 'c2',
    title: 'ML Project Phase 1 — Data Preprocessing',
    description: 'Clean the dataset, handle missing values, and implement feature engineering pipeline.',
    dueDate: td(2),
    priority: 'high',
    status: 'in-progress',
    estimatedHours: 4,
    createdAt: new Date().toISOString(),
    completedAt: null,
  },
  {
    id: 'a2',
    courseId: 'c3',
    title: 'ER Diagram for Hospital Management System',
    description: 'Design complete ER diagram with all entities, relationships, and constraints.',
    dueDate: td(1),
    priority: 'high',
    status: 'pending',
    estimatedHours: 3,
    createdAt: new Date().toISOString(),
    completedAt: null,
  },
  {
    id: 'a3',
    courseId: 'c1',
    title: 'Problem Set 7 — Graph Algorithms',
    description: 'Implement BFS, DFS, Dijkstra\'s algorithm and solve 5 problems.',
    dueDate: td(5),
    priority: 'high',
    status: 'pending',
    estimatedHours: 5,
    createdAt: new Date().toISOString(),
    completedAt: null,
  },
  {
    id: 'a4',
    courseId: 'c4',
    title: 'Software Requirements Specification Document',
    description: 'Write complete SRS for the team project using IEEE template.',
    dueDate: td(7),
    priority: 'medium',
    status: 'pending',
    estimatedHours: 6,
    createdAt: new Date().toISOString(),
    completedAt: null,
  },
  {
    id: 'a5',
    courseId: 'c1',
    title: 'Problem Set 6 — Dynamic Programming',
    description: 'Complete all 8 DP problems including LCS and Knapsack variations.',
    dueDate: td(-3),
    priority: 'high',
    status: 'completed',
    estimatedHours: 4,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  },
  {
    id: 'a6',
    courseId: 'c3',
    title: 'SQL Lab Report — Queries & Optimization',
    description: 'Write and optimize 20 SQL queries on the provided Northwind database.',
    dueDate: td(0), // due today
    priority: 'high',
    status: 'pending',
    estimatedHours: 2,
    createdAt: new Date().toISOString(),
    completedAt: null,
  },
  {
    id: 'a7',
    courseId: 'c2',
    title: 'ML Reading: Neural Networks Chapter 4-6',
    description: 'Read chapters on backpropagation, CNNs, and RNNs and take notes.',
    dueDate: td(10),
    priority: 'low',
    status: 'pending',
    estimatedHours: 3,
    createdAt: new Date().toISOString(),
    completedAt: null,
  },
];

const DEFAULT_PROFILE = {
  name: '',           // Empty triggers onboarding on first launch
  major: 'Computer Science',
  year: '3',
  semester: 'Spring 2026',
  gpaGoal: 3.7,
};

/* ── APP PROVIDER COMPONENT ──────────────────────────────────── */
export const AppProvider = ({ children }) => {

  // ── PERSISTENT STATE (all synced to localStorage) ──
  const [profile,      setProfile]      = useLocalStorage('ssa_profile',     DEFAULT_PROFILE);
  const [courses,      setCourses]      = useLocalStorage('ssa_courses',     DEFAULT_COURSES);
  const [assignments,  setAssignments]  = useLocalStorage('ssa_assignments', DEFAULT_ASSIGNMENTS);
  const [notes,        setNotes]        = useLocalStorage('ssa_notes',       []);
  const [chatHistory,  setChatHistory]  = useLocalStorage('ssa_chat',        []);
  const [studyBlocks,  setStudyBlocks]  = useLocalStorage('ssa_studyblocks', []);
  const [attendance,   setAttendance]   = useLocalStorage('ssa_attendance',  []);
  const [planInsights, setPlanInsights] = useLocalStorage('ssa_insights',    '');

  // ── COMPUTED VALUES ──
  const gpa = useMemo(() => calculateGPA(courses), [courses]);

  // ── COURSE ACTIONS ──────────────────────────────────────────
  const addCourse = useCallback((data) => {
    const newCourse = { ...data, id: generateId() };
    setCourses(prev => [...prev, newCourse]);
    return newCourse;
  }, [setCourses]);

  const updateCourse = useCallback((id, updates) => {
    setCourses(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, [setCourses]);

  const deleteCourse = useCallback((id) => {
    setCourses(prev => prev.filter(c => c.id !== id));
    // Cascade-delete related assignments and attendance
    setAssignments(prev => prev.filter(a => a.courseId !== id));
    setAttendance(prev => prev.filter(a => a.courseId !== id));
  }, [setCourses, setAssignments, setAttendance]);

  // ── ASSIGNMENT ACTIONS ───────────────────────────────────────
  const addAssignment = useCallback((data) => {
    const newAssignment = {
      ...data,
      id: generateId(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    setAssignments(prev => [...prev, newAssignment]);
    return newAssignment;
  }, [setAssignments]);

  const updateAssignment = useCallback((id, updates) => {
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  }, [setAssignments]);

  const deleteAssignment = useCallback((id) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
  }, [setAssignments]);

  /** Toggle assignment between 'pending' and 'completed'. */
  const toggleAssignment = useCallback((id) => {
    setAssignments(prev => prev.map(a => {
      if (a.id !== id) return a;
      const isCompleting = a.status !== 'completed';
      return {
        ...a,
        status: isCompleting ? 'completed' : 'pending',
        completedAt: isCompleting ? new Date().toISOString() : null,
      };
    }));
  }, [setAssignments]);

  // ── NOTES ACTIONS ────────────────────────────────────────────
  const addNote = useCallback((data) => {
    const now = new Date().toISOString();
    const newNote = { ...data, id: generateId(), createdAt: now, updatedAt: now };
    setNotes(prev => [newNote, ...prev]);
    return newNote;
  }, [setNotes]);

  const updateNote = useCallback((id, updates) => {
    setNotes(prev => prev.map(n =>
      n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
    ));
  }, [setNotes]);

  const deleteNote = useCallback((id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  }, [setNotes]);

  // ── CHAT ACTIONS ─────────────────────────────────────────────
  /** Add a single message (user or assistant) to the chat history. */
  const addChatMessage = useCallback((message) => {
    setChatHistory(prev => [
      ...prev,
      { ...message, id: generateId(), timestamp: new Date().toISOString() },
    ]);
  }, [setChatHistory]);

  const clearChatHistory = useCallback(() => setChatHistory([]), [setChatHistory]);

  // ── STUDY PLAN ACTIONS ───────────────────────────────────────
  const saveStudyBlocks = useCallback((blocks, insights = '') => {
    setStudyBlocks(blocks);
    setPlanInsights(insights);
  }, [setStudyBlocks, setPlanInsights]);

  const clearStudyPlan = useCallback(() => {
    setStudyBlocks([]);
    setPlanInsights('');
  }, [setStudyBlocks, setPlanInsights]);

  // ── ATTENDANCE ACTIONS ───────────────────────────────────────
  const addAttendance = useCallback((data) => {
    const record = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    setAttendance(prev => [...prev, record]);
    return record;
  }, [setAttendance]);

  const deleteAttendance = useCallback((id) => {
    setAttendance(prev => prev.filter(a => a.id !== id));
  }, [setAttendance]);

  // ── SETTINGS ACTIONS ─────────────────────────────────────────
  /** Hard reset — clears everything back to defaults. */
  const resetAllData = useCallback(() => {
    setProfile(DEFAULT_PROFILE);
    setCourses(DEFAULT_COURSES);
    setAssignments(DEFAULT_ASSIGNMENTS);
    setNotes([]);
    setChatHistory([]);
    setStudyBlocks([]);
    setAttendance([]);
    setPlanInsights('');
  }, []);

  const clearUserData = useCallback(() => {
    setCourses([]);
    setAssignments([]);
    setNotes([]);
    setChatHistory([]);
    setStudyBlocks([]);
    setAttendance([]);
    setPlanInsights('');
  }, []);

  /* ── CONTEXT VALUE ── */
  const value = {
    // State
    profile,       setProfile,
    courses,
    assignments,
    notes,
    chatHistory,
    studyBlocks,
    attendance,
    planInsights,
    gpa,

    // Course actions
    addCourse, updateCourse, deleteCourse,

    // Assignment actions
    addAssignment, updateAssignment, deleteAssignment, toggleAssignment,

    // Notes actions
    addNote, updateNote, deleteNote,

    // Chat actions
    addChatMessage, clearChatHistory,

    // Study plan actions
    saveStudyBlocks, clearStudyPlan,

    // Attendance actions
    addAttendance, deleteAttendance,

    // Settings actions
    resetAllData, clearUserData,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

/**
 * Custom hook to access the AppContext.
 * Must be used inside an <AppProvider> or throws a descriptive error.
 */
export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within <AppProvider>');
  return ctx;
};

export default AppContext;
