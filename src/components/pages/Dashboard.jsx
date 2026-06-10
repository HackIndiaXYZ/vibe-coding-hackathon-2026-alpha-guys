import React, { useState, useCallback } from 'react';
import {
  Star, BookOpen, CheckSquare, Clock, Sparkles, TrendingUp,
  ChevronRight, AlertTriangle, Calendar, Target, Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useClaudeAPI } from '../../hooks/useClaudeAPI';
import { StatCard } from '../ui/Card';
import { EmptyState } from '../ui/Card';
import Button from '../ui/Button';
import Badge, { PriorityBadge, StatusBadge } from '../ui/Badge';
import {
  getGreeting, getDaysUntil, getRelativeDate,
  formatShortDate, getGradeColor, calculateLetterGrade,
  getUpcomingAssignments, getTodaysAssignments, getAssignmentStats,
  isToday, isOverdue,
} from '../../utils/helpers';
import { buildAssistantSystemPrompt } from '../../utils/claudeApi';

/* ================================================================
   Smart Semester AI — Dashboard Page
   ================================================================ */
const Dashboard = ({ onNavigate }) => {
  const {
    profile, courses, assignments, gpa,
    toggleAssignment,
  } = useApp();

  const { sendMessage, loading: aiLoading } = useClaudeAPI();
  const [aiInsight, setAiInsight] = useState('');
  const [insightGenerated, setInsightGenerated] = useState(false);

  // ── DERIVED DATA ──
  const stats = getAssignmentStats(assignments);
  const todayAssignments = getTodaysAssignments(assignments);
  const upcoming7 = getUpcomingAssignments(assignments, 7);
  const overdue = assignments.filter(
    a => a.status !== 'completed' && getDaysUntil(a.dueDate) < 0
  );
  const recentCompleted = assignments
    .filter(a => a.status === 'completed' && a.completedAt)
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .slice(0, 4);

  // Weakest course (lowest grade, non-zero)
  const weakestCourse = courses.length > 0
    ? [...courses].sort((a, b) => a.grade - b.grade)[0]
    : null;

  // ── GENERATE AI INSIGHT ──
  const generateInsight = useCallback(async () => {
    if (insightGenerated) return;
    const systemPrompt = buildAssistantSystemPrompt(profile, courses, assignments);
    const pendingCount = assignments.filter(a => a.status !== 'completed').length;
    const dueThisWeek = getUpcomingAssignments(assignments, 7).length;
    const userMessage = `My current GPA is ${gpa.toFixed(2)} (goal: ${profile.gpaGoal}). I have ${pendingCount} pending assignments, ${dueThisWeek} due this week${weakestCourse ? `, and my weakest course is ${weakestCourse.name} at ${weakestCourse.grade}%` : ''}. Give me a personalized, motivating daily study tip in 2–3 sentences. Be specific and practical.`;

    try {
      const resp = await sendMessage(
        [{ role: 'user', content: userMessage }],
        systemPrompt,
        400,
      );
      setAiInsight(resp);
      setInsightGenerated(true);
    } catch (_) {
      // sendClaudeMessage never throws for missing keys — this only fires
      // on unexpected JS errors. The insight stays empty; UI shows the button again.
    }
  }, [profile, courses, assignments, gpa, weakestCourse, insightGenerated, sendMessage]);

  return (
    <div className="page-enter" style={{ maxWidth: 1280, margin: '0 auto' }}>

      {/* ── GREETING BANNER ── */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '24px',
          fontWeight: 700,
          color: 'var(--text-primary)',
        }}>
          {getGreeting()}, {profile.name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          {profile.major} · Year {profile.year} · {profile.semester}
          {overdue.length > 0 && (
            <span style={{ color: 'var(--red)', marginLeft: 12, fontWeight: 500 }}>
              ⚠ {overdue.length} overdue
            </span>
          )}
        </p>
      </div>

      {/* ── KPI STAT CARDS ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <StatCard
          title="Current GPA"
          value={gpa.toFixed(2)}
          icon={Star}
          color="gold"
          subtitle={`Goal: ${profile.gpaGoal}`}
          trend={gpa >= profile.gpaGoal ? '✓ On Track' : null}
        />
        <StatCard
          title="Active Courses"
          value={courses.length}
          icon={BookOpen}
          color="primary"
          subtitle={`${courses.reduce((s, c) => s + c.credits, 0)} total credits`}
        />
        <StatCard
          title="Pending Tasks"
          value={stats.pending}
          icon={CheckSquare}
          color={stats.pending > 5 ? 'red' : 'purple'}
          subtitle={`${stats.completionRate}% done`}
          trend={stats.completed > 0 ? `${stats.completed} done` : null}
        />
        <StatCard
          title="Due This Week"
          value={upcoming7.length}
          icon={Clock}
          color={upcoming7.length > 3 ? 'orange' : 'cyan'}
          subtitle={todayAssignments.length > 0 ? `${todayAssignments.length} due today!` : 'None today'}
        />
      </div>

      {/* ── MAIN GRID ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 360px',
        gap: '20px',
        marginBottom: '20px',
      }}>

        {/* LEFT: Today's Agenda */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '18px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 600 }}>
                Today's Focus
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 2 }}>
                Tasks due today + overdue
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              icon={ChevronRight}
              onClick={() => onNavigate('assignments')}
            >
              All Tasks
            </Button>
          </div>

          <div style={{ padding: '8px' }}>
            {/* Overdue items */}
            {overdue.map(a => (
              <AssignmentRow
                key={a.id}
                assignment={a}
                courses={courses}
                onToggle={toggleAssignment}
                isOverdue
              />
            ))}

            {/* Today's items */}
            {todayAssignments.map(a => (
              <AssignmentRow
                key={a.id}
                assignment={a}
                courses={courses}
                onToggle={toggleAssignment}
                isToday
              />
            ))}

            {/* No urgent tasks */}
            {todayAssignments.length === 0 && overdue.length === 0 && (
              <EmptyState
                icon={CheckSquare}
                title="All clear for today!"
                description="No tasks due today. Great time to get ahead on upcoming work."
              />
            )}
          </div>
        </div>

        {/* RIGHT: AI Insight Card */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* AI Insight header */}
          <div style={{
            padding: '18px 20px 14px',
            borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--primary), var(--purple))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Sparkles size={14} style={{ color: '#fff' }} />
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 600 }}>
                AI Daily Insight
              </span>
            </div>
          </div>

          <div style={{ padding: '16px 20px', flex: 1 }}>
            {aiInsight ? (
              <p style={{
                fontSize: '14px',
                color: 'var(--text-primary)',
                lineHeight: 1.75,
                fontStyle: 'italic',
              }}>
                "{aiInsight}"
              </p>
            ) : (
              <>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.6 }}>
                  Get a personalized study tip based on your courses, GPA, and upcoming deadlines.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  icon={Sparkles}
                  loading={aiLoading}
                  onClick={generateInsight}
                >
                  {aiLoading ? 'Generating…' : 'Generate Insight'}
                </Button>
              </>
            )}
          </div>

          {/* GPA vs Goal progress */}
          <div style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px',
              marginBottom: '8px',
            }}>
              <span style={{ color: 'var(--text-secondary)' }}>GPA Progress</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                {gpa.toFixed(2)} / {profile.gpaGoal}
              </span>
            </div>
            <div style={{
              height: 6,
              background: 'var(--bg-primary)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${Math.min((gpa / 4.0) * 100, 100)}%`,
                background: gpa >= profile.gpaGoal
                  ? 'var(--green)'
                  : 'linear-gradient(90deg, var(--primary), var(--purple))',
                borderRadius: 'var(--radius-full)',
                transition: 'width 1s ease',
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM GRID: Upcoming + Course Snapshot ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Upcoming Deadlines */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 600 }}>
              Upcoming (7 days)
            </h2>
            <Badge variant="primary" size="sm">{upcoming7.length} tasks</Badge>
          </div>
          <div style={{ padding: '8px', maxHeight: 280, overflow: 'auto' }}>
            {upcoming7.length === 0 ? (
              <EmptyState icon={Calendar} title="Nothing due this week" description="Great — use the time to get ahead!" />
            ) : (
              upcoming7.map(a => {
                const course = courses.find(c => c.id === a.courseId);
                const days = getDaysUntil(a.dueDate);
                return (
                  <div key={a.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Course color dot */}
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: course?.color || 'var(--primary)',
                      flexShrink: 0,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {a.title}
                      </p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {course?.code || '—'}
                      </p>
                    </div>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: days === 0 ? 'var(--red)' : days <= 2 ? 'var(--gold)' : 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                    }}>
                      {getRelativeDate(a.dueDate)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Course Snapshot */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 600 }}>
              Course Snapshot
            </h2>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('courses')}>
              Manage
            </Button>
          </div>
          <div style={{ padding: '8px', maxHeight: 280, overflow: 'auto' }}>
            {courses.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No courses added"
                description="Add your courses to start tracking grades and assignments."
                action={
                  <Button variant="primary" size="sm" onClick={() => onNavigate('courses')}>
                    Add Courses
                  </Button>
                }
              />
            ) : (
              courses.map(course => {
                const letter = calculateLetterGrade(course.grade);
                const gradeColor = getGradeColor(course.grade);
                return (
                  <div key={course.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Color stripe */}
                    <div style={{
                      width: 4,
                      height: 36,
                      borderRadius: 'var(--radius-full)',
                      background: course.color,
                      flexShrink: 0,
                    }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {course.name}
                      </p>
                      {/* Grade bar */}
                      <div style={{
                        marginTop: 4,
                        height: 4,
                        background: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-full)',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${course.grade}%`,
                          height: '100%',
                          background: gradeColor,
                          borderRadius: 'var(--radius-full)',
                          transition: 'width 0.8s ease',
                        }} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        color: gradeColor,
                        fontFamily: 'var(--font-mono)',
                      }}>
                        {letter}
                      </span>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {course.grade}%
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── ASSIGNMENT ROW SUB-COMPONENT ── */
const AssignmentRow = ({ assignment: a, courses, onToggle, isOverdue: overdue, isToday: today }) => {
  const course = courses.find(c => c.id === a.courseId);
  const completed = a.status === 'completed';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 12px',
      borderRadius: 'var(--radius-md)',
      background: overdue ? 'var(--red-subtle)' : today ? 'var(--gold-subtle)' : 'transparent',
      border: overdue
        ? '1px solid rgba(255,95,107,0.2)'
        : today ? '1px solid rgba(245,185,66,0.2)' : '1px solid transparent',
      marginBottom: '4px',
      transition: 'background 0.15s',
    }}>
      {/* Checkbox */}
      <button
        onClick={() => onToggle(a.id)}
        style={{
          width: 18,
          height: 18,
          borderRadius: '4px',
          border: `2px solid ${completed ? 'var(--green)' : overdue ? 'var(--red)' : 'var(--border-strong)'}`,
          background: completed ? 'var(--green)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'all 0.18s',
        }}
      >
        {completed && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5l2.5 2.5L8 3" stroke="#060A18" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: '13px',
          fontWeight: 500,
          color: completed ? 'var(--text-muted)' : 'var(--text-primary)',
          textDecoration: completed ? 'line-through' : 'none',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {a.title}
        </p>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {course?.code} · {overdue ? 'Overdue!' : today ? 'Due today' : getRelativeDate(a.dueDate)}
        </p>
      </div>

      <PriorityBadge priority={a.priority} size="xs" />
    </div>
  );
};

export default Dashboard;
