/* ================================================================
   Smart Semester AI — Utility Helper Functions
   Pure functions with no side effects for maximum reusability
   ================================================================ */

// ── 1. ID GENERATION ──────────────────────────────────────────
/**
 * Generates a unique ID string combining timestamp and random chars.
 * @returns {string} Unique identifier like "abc12def34"
 */
export const generateId = () =>
  Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

// ── 2. DATE UTILITIES ─────────────────────────────────────────
/**
 * Format a date string to a readable format.
 * @param {string} dateString - ISO date string
 * @param {object} opts - Intl.DateTimeFormat options override
 * @returns {string} Formatted date, e.g. "Jun 15, 2025"
 */
export const formatDate = (dateString, opts = {}) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const defaults = { month: 'short', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString('en-US', { ...defaults, ...opts });
};

/**
 * Format to short date, e.g. "Jun 15"
 */
export const formatShortDate = (dateString) =>
  formatDate(dateString, { month: 'short', day: 'numeric', year: undefined });

/**
 * Format time like "2:30 PM"
 */
export const formatTime = (timeString) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  return `${h}:${minutes.toString().padStart(2, '0')} ${period}`;
};

/**
 * Get number of days until a date (negative = overdue).
 * @param {string} dateString - ISO date string
 * @returns {number} Days until date
 */
export const getDaysUntil = (dateString) => {
  if (!dateString) return Infinity;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateString);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
};

/**
 * Check if a date is today.
 */
export const isToday = (dateString) => getDaysUntil(dateString) === 0;

/**
 * Check if a date is past (overdue).
 */
export const isOverdue = (dateString) => {
  if (!dateString) return false;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return new Date(dateString) < today && getDaysUntil(dateString) < 0;
};

/**
 * Get a human-friendly relative date label.
 * @param {string} dateString
 * @returns {string} e.g. "Today", "Tomorrow", "In 3 days", "2 days ago"
 */
export const getRelativeDate = (dateString) => {
  const days = getDaysUntil(dateString);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days > 1 && days <= 7) return `In ${days} days`;
  if (days > 7) return formatShortDate(dateString);
  if (days < -1) return `${Math.abs(days)} days ago`;
  return formatShortDate(dateString);
};

/**
 * Get current time greeting based on hour.
 * @returns {string} "Good morning" | "Good afternoon" | "Good evening"
 */
export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

/**
 * Get the full current date string, e.g. "Monday, June 9, 2025"
 */
export const getCurrentDate = () =>
  new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

/**
 * Get day names for the current week (Mon–Sun).
 * @returns {Array<{day: string, date: string, isToday: boolean}>}
 */
export const getCurrentWeekDays = () => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
  const monday = new Date(today);
  // Adjust to Monday
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));

  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return {
      day,
      fullDay: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][i],
      date: date.toISOString().split('T')[0],
      dateNum: date.getDate(),
      isToday: date.toDateString() === today.toDateString(),
    };
  });
};

// ── 3. GRADE UTILITIES ────────────────────────────────────────
/**
 * Convert a percentage grade to a letter grade.
 * @param {number} percentage - Grade 0-100
 * @returns {string} Letter grade "A+", "A", "B+", etc.
 */
export const calculateLetterGrade = (percentage) => {
  if (percentage >= 97) return 'A+';
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 67) return 'D+';
  if (percentage >= 63) return 'D';
  if (percentage >= 60) return 'D-';
  return 'F';
};

/**
 * Convert letter grade to GPA points (4.0 scale).
 * @param {string} letter - e.g. "A+", "B-"
 * @returns {number} GPA points
 */
export const letterToGPA = (letter) => {
  const map = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'D-': 0.7,
    'F': 0.0,
  };
  return map[letter] ?? 0.0;
};

/**
 * Calculate weighted GPA from an array of courses.
 * @param {Array<{grade: number, credits: number}>} courses
 * @returns {number} Weighted GPA on 4.0 scale
 */
export const calculateGPA = (courses) => {
  if (!courses || courses.length === 0) return 0;
  const validCourses = courses.filter(c => c.grade > 0 && c.credits > 0);
  if (validCourses.length === 0) return 0;

  const totalCredits = validCourses.reduce((sum, c) => sum + c.credits, 0);
  const weightedPoints = validCourses.reduce((sum, c) => {
    const letter = calculateLetterGrade(c.grade);
    return sum + (letterToGPA(letter) * c.credits);
  }, 0);

  return Math.round((weightedPoints / totalCredits) * 100) / 100;
};

/**
 * Get a CSS color variable name based on grade percentage.
 * @param {number} percentage
 * @returns {string} CSS variable reference like "var(--green)"
 */
export const getGradeColor = (percentage) => {
  if (percentage >= 90) return 'var(--green)';
  if (percentage >= 80) return 'var(--primary)';
  if (percentage >= 70) return 'var(--gold)';
  if (percentage >= 60) return 'var(--orange)';
  return 'var(--red)';
};

/**
 * Get grade color as a raw hex value (for recharts, etc.)
 */
export const getGradeColorHex = (percentage) => {
  if (percentage >= 90) return '#22C87A';
  if (percentage >= 80) return '#5B9FFF';
  if (percentage >= 70) return '#F5B942';
  if (percentage >= 60) return '#FF8C42';
  return '#FF5F6B';
};

// ── 4. PRIORITY UTILITIES ─────────────────────────────────────
/**
 * Get color for assignment priority level.
 * @param {'high'|'medium'|'low'} priority
 * @returns {string} CSS variable
 */
export const getPriorityColor = (priority) => {
  const map = { high: 'var(--red)', medium: 'var(--gold)', low: 'var(--green)' };
  return map[priority] || 'var(--text-muted)';
};

/**
 * Get background color for priority badge.
 */
export const getPriorityBg = (priority) => {
  const map = {
    high: 'var(--red-subtle)',
    medium: 'var(--gold-subtle)',
    low: 'var(--green-subtle)',
  };
  return map[priority] || 'var(--bg-elevated)';
};

/**
 * Sort assignments by priority order (high → medium → low).
 * @param {'high'|'medium'|'low'} priority
 * @returns {number} Sort weight
 */
export const getPriorityOrder = (priority) => {
  const map = { high: 0, medium: 1, low: 2 };
  return map[priority] ?? 3;
};

// ── 5. COURSE COLOR PALETTE ───────────────────────────────────
/** Predefined course colors to choose from when adding a new course. */
export const COURSE_COLORS = [
  '#5B9FFF', '#8B65F5', '#F5B942', '#22C87A',
  '#FF5F6B', '#22D3EE', '#FF8C42', '#E879F9',
  '#A3E635', '#38BDF8',
];

// ── 6. ASSIGNMENT STATUS UTILITIES ───────────────────────────
/**
 * Get display label + color for assignment status.
 */
export const getStatusInfo = (status, dueDate) => {
  if (status === 'completed') {
    return { label: 'Done', color: 'var(--green)', bg: 'var(--green-subtle)' };
  }
  if (isOverdue(dueDate) && getDaysUntil(dueDate) < 0) {
    return { label: 'Overdue', color: 'var(--red)', bg: 'var(--red-subtle)' };
  }
  if (status === 'in-progress') {
    return { label: 'In Progress', color: 'var(--primary)', bg: 'var(--primary-subtle)' };
  }
  return { label: 'Pending', color: 'var(--gold)', bg: 'var(--gold-subtle)' };
};

// ── 7. STATISTICS HELPERS ────────────────────────────────────
/**
 * Get assignment statistics for a list of assignments.
 */
export const getAssignmentStats = (assignments) => {
  const total = assignments.length;
  const completed = assignments.filter(a => a.status === 'completed').length;
  const overdue = assignments.filter(
    a => a.status !== 'completed' && getDaysUntil(a.dueDate) < 0
  ).length;
  const pending = total - completed;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, overdue, pending, completionRate };
};

/**
 * Get assignments due within N days (and not completed).
 */
export const getUpcomingAssignments = (assignments, days = 7) =>
  assignments
    .filter(a => {
      if (a.status === 'completed') return false;
      const d = getDaysUntil(a.dueDate);
      return d >= 0 && d <= days;
    })
    .sort((a, b) => getDaysUntil(a.dueDate) - getDaysUntil(b.dueDate));

/**
 * Get today's due assignments (not completed).
 */
export const getTodaysAssignments = (assignments) =>
  assignments.filter(a => a.status !== 'completed' && isToday(a.dueDate));

/**
 * Truncate long text to a given character limit.
 */
export const truncate = (text, limit = 80) =>
  text && text.length > limit ? text.slice(0, limit) + '…' : text;

/**
 * Capitalize the first letter of a string.
 */
export const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
