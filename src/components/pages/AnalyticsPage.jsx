import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
  AreaChart, Area,
} from 'recharts';
import { TrendingUp, Award, Target, BookOpen, CheckSquare, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card, SectionHeader, StatCard, EmptyState } from '../ui/Card';
import Badge from '../ui/Badge';
import {
  calculateLetterGrade, getGradeColorHex, calculateGPA,
  getAssignmentStats, getDaysUntil,
} from '../../utils/helpers';

/* ================================================================
   Smart Semester AI — Analytics Page
   Visual data dashboard: GPA, grades, completion rates, insights.
   ================================================================ */

// Custom Recharts tooltip styled with CSS variables
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-strong)',
      borderRadius: 'var(--radius-md)',
      padding: '10px 14px',
      boxShadow: 'var(--shadow-md)',
      fontSize: '13px',
    }}>
      {label && <p style={{ color: 'var(--text-muted)', marginBottom: '4px', fontSize: '12px' }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.fill || p.color || 'var(--primary)', fontWeight: 600 }}>
          {p.name}: {p.value}{typeof p.value === 'number' && p.name?.includes('%') ? '' : ''}
        </p>
      ))}
    </div>
  );
};

const AnalyticsPage = () => {
  const { courses, assignments, gpa, profile, attendance } = useApp();

  // ── DERIVED ANALYTICS DATA ──
  const stats = useMemo(() => getAssignmentStats(assignments), [assignments]);

  // Course grade bar chart data
  const gradeData = useMemo(() => courses.map(c => ({
    name: c.code,
    grade: c.grade,
    target: c.targetGrade,
    color: c.color,
  })), [courses]);

  // Assignment completion pie data
  const completionData = useMemo(() => {
    const completed = assignments.filter(a => a.status === 'completed').length;
    const overdue   = assignments.filter(a => a.status !== 'completed' && getDaysUntil(a.dueDate) < 0).length;
    const pending   = assignments.length - completed - overdue;
    return [
      { name: 'Completed', value: completed, color: '#22C87A' },
      { name: 'Pending',   value: pending,   color: '#5B9FFF' },
      { name: 'Overdue',   value: overdue,   color: '#FF5F6B' },
    ].filter(d => d.value > 0);
  }, [assignments]);

  // GPA trend mock data (historical + current)
  const gpaTrendData = useMemo(() => {
    const currentGpa = calculateGPA(courses);
    const baseGpa = Math.max(currentGpa - 0.3, 0.5);
    return [
      { semester: 'S1',  gpa: +(baseGpa - 0.2 + Math.random() * 0.3).toFixed(2) },
      { semester: 'S2',  gpa: +(baseGpa - 0.1 + Math.random() * 0.25).toFixed(2) },
      { semester: 'S3',  gpa: +(baseGpa + Math.random() * 0.2).toFixed(2) },
      { semester: 'S4',  gpa: +(baseGpa + 0.1 + Math.random() * 0.2).toFixed(2) },
      { semester: 'Now', gpa: +currentGpa.toFixed(2) },
    ];
  }, [courses]);

  // Credits distribution pie
  const creditsData = useMemo(() => courses.map(c => ({
    name: c.code,
    value: c.credits,
    color: c.color,
  })), [courses]);

  // Priority distribution of assignments
  const priorityData = useMemo(() => [
    { name: 'High',   value: assignments.filter(a => a.priority === 'high').length,   fill: '#FF5F6B' },
    { name: 'Medium', value: assignments.filter(a => a.priority === 'medium').length, fill: '#F5B942' },
    { name: 'Low',    value: assignments.filter(a => a.priority === 'low').length,    fill: '#22C87A' },
  ], [assignments]);

  // Attendance stats per course
  const attendanceStats = useMemo(() => courses.map(c => {
    const records = attendance.filter(a => a.courseId === c.id);
    const total   = records.length;
    const present = records.filter(a => a.status === 'present').length;
    const late    = records.filter(a => a.status === 'late').length;
    const pct     = total > 0 ? Math.round(((present + late) / total) * 100) : null;
    return { code: c.code, name: c.name, color: c.color, total, present, late, pct };
  }), [courses, attendance]);

  // Performance insights
  const insights = useMemo(() => {
    const msgs = [];
    if (gpa >= profile.gpaGoal) {
      msgs.push({ type: 'success', text: `You're meeting your GPA goal of ${profile.gpaGoal}. Keep it up!` });
    } else {
      const gap = (profile.gpaGoal - gpa).toFixed(2);
      msgs.push({ type: 'warning', text: `Your GPA is ${gap} points below your goal of ${profile.gpaGoal}.` });
    }
    const weakest = courses.length > 0 ? [...courses].sort((a, b) => a.grade - b.grade)[0] : null;
    if (weakest && weakest.grade < 75) {
      msgs.push({ type: 'danger', text: `Focus on ${weakest.name} — it's your lowest grade at ${weakest.grade}%.` });
    }
    if (stats.overdue > 0) {
      msgs.push({ type: 'danger', text: `You have ${stats.overdue} overdue assignment${stats.overdue > 1 ? 's' : ''}. Address these first.` });
    }
    if (stats.completionRate >= 80) {
      msgs.push({ type: 'success', text: `Great work — ${stats.completionRate}% of your assignments are completed.` });
    }
    return msgs;
  }, [gpa, profile.gpaGoal, courses, stats]);

  const chartGridProps = {
    stroke: 'rgba(91,159,255,0.08)',
    strokeDasharray: '4 4',
  };

  const axisProps = {
    tick: { fill: '#4A6287', fontSize: 11, fontFamily: 'var(--font-body)' },
    axisLine: { stroke: 'rgba(91,159,255,0.08)' },
    tickLine: false,
  };

  if (courses.length === 0) {
    return (
      <div className="page-enter" style={{ maxWidth: 900, margin: '0 auto' }}>
        <EmptyState
          icon={TrendingUp}
          title="No data to analyse yet"
          description="Add your courses and start tracking assignments to see analytics and insights."
        />
      </div>
    );
  }

  return (
    <div className="page-enter" style={{ maxWidth: 1200, margin: '0 auto' }}>

      {/* ── HEADER STATS ROW ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <StatCard
          title="Current GPA"
          value={gpa.toFixed(2)}
          icon={Award}
          color="gold"
          subtitle={`Goal: ${profile.gpaGoal}`}
        />
        <StatCard
          title="Completion Rate"
          value={`${stats.completionRate}%`}
          icon={CheckSquare}
          color="green"
          subtitle={`${stats.completed} / ${stats.total} tasks`}
        />
        <StatCard
          title="Total Credits"
          value={courses.reduce((s, c) => s + c.credits, 0)}
          icon={BookOpen}
          color="primary"
          subtitle={`${courses.length} courses`}
        />
        <StatCard
          title="Overdue Tasks"
          value={stats.overdue}
          icon={AlertTriangle}
          color={stats.overdue > 0 ? 'red' : 'green'}
          subtitle={stats.overdue > 0 ? 'Needs attention' : 'All on time!'}
        />
      </div>

      {/* ── INSIGHTS BANNER ── */}
      {insights.length > 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginBottom: '24px',
        }}>
          {insights.map((msg, i) => (
            <div key={i} style={{
              padding: '10px 16px',
              background: msg.type === 'success' ? 'var(--green-subtle)' : msg.type === 'danger' ? 'var(--red-subtle)' : 'var(--gold-subtle)',
              border: `1px solid ${msg.type === 'success' ? 'rgba(34,200,122,0.3)' : msg.type === 'danger' ? 'rgba(255,95,107,0.3)' : 'rgba(245,185,66,0.3)'}`,
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              color: msg.type === 'success' ? 'var(--green)' : msg.type === 'danger' ? 'var(--red)' : 'var(--gold)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              {msg.type === 'success' ? '✓' : msg.type === 'danger' ? '⚠' : '→'}
              {msg.text}
            </div>
          ))}
        </div>
      )}

      {/* ── CHART GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

        {/* Course Grades Bar Chart */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
        }}>
          <SectionHeader
            title="Grade by Course"
            subtitle="Current vs target grade"
            style={{ marginBottom: '20px' }}
          />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={gradeData} barGap={4}>
              <CartesianGrid {...chartGridProps} vertical={false} />
              <XAxis dataKey="name" {...axisProps} />
              <YAxis {...axisProps} domain={[0, 100]} tickFormatter={v => `${v}%`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="grade" name="Grade %" radius={[4,4,0,0]}>
                {gradeData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
              <Bar dataKey="target" name="Target %" fill="rgba(91,159,255,0.2)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* GPA Trend Line Chart */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
        }}>
          <SectionHeader
            title="GPA Trend"
            subtitle="Historical performance this degree"
            style={{ marginBottom: '20px' }}
          />
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={gpaTrendData}>
              <defs>
                <linearGradient id="gpaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#5B9FFF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#5B9FFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...chartGridProps} vertical={false} />
              <XAxis dataKey="semester" {...axisProps} />
              <YAxis {...axisProps} domain={[0, 4]} tickFormatter={v => v.toFixed(1)} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="gpa"
                name="GPA"
                stroke="#5B9FFF"
                strokeWidth={2.5}
                fill="url(#gpaGradient)"
                dot={{ fill: '#5B9FFF', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#5B9FFF' }}
              />
              {/* Goal line */}
              <Line
                type="monotone"
                dataKey={() => profile.gpaGoal}
                stroke="#F5B942"
                strokeWidth={1.5}
                strokeDasharray="5 4"
                dot={false}
                name="Goal"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Assignment Completion Pie */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
        }}>
          <SectionHeader
            title="Assignment Status"
            subtitle={`${stats.total} total assignments`}
            style={{ marginBottom: '20px' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie
                  data={completionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {completionData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {completionData.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{d.name}</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginLeft: 'auto' }}>
                    {d.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Credits Distribution */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
        }}>
          <SectionHeader
            title="Credit Load"
            subtitle={`${courses.reduce((s,c) => s+c.credits, 0)} total credits this semester`}
            style={{ marginBottom: '20px' }}
          />
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={courses.map(c => ({
              name: c.code,
              credits: c.credits,
              color: c.color,
            }))}>
              <CartesianGrid {...chartGridProps} vertical={false} />
              <XAxis dataKey="name" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="credits" name="Credits" radius={[4,4,0,0]}>
                {courses.map((c, i) => <Cell key={i} fill={c.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── COURSE PERFORMANCE TABLE ── */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        marginBottom: '20px',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 600 }}>
            Course Performance Summary
          </h2>
        </div>
        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Course','Code','Credits','Grade','Letter','GPA Pts','vs Target','Attendance'].map(h => (
                <th key={h} style={{
                  padding: '10px 16px', textAlign: 'left', fontSize: '11px',
                  fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
                  color: 'var(--text-muted)', borderBottom: '1px solid var(--border)',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {courses.map((c, i) => {
              const letter    = calculateLetterGrade(c.grade);
              const gradeColor = getGradeColorHex(c.grade);
              const diff       = c.grade - c.targetGrade;
              const attStat    = attendanceStats.find(a => a.code === c.code);
              return (
                <tr key={c.id} style={{ borderBottom: i < courses.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: c.color, flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>{c.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: c.color, fontWeight: 600 }}>{c.code}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{c.credits}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: gradeColor, fontFamily: 'var(--font-mono)' }}>{c.grade}%</td>
                  <td style={{ padding: '12px 16px' }}>
                    <Badge style={{ background: gradeColor + '22', color: gradeColor, borderColor: gradeColor + '44' }} size="sm">
                      {letter}
                    </Badge>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {({ 'A+': 4.0, 'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7, 'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'D-': 0.7, 'F': 0.0 })[letter]?.toFixed(1)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <Badge variant={diff >= 0 ? 'success' : 'danger'} size="sm">
                      {diff >= 0 ? '+' : ''}{diff.toFixed(0)}%
                    </Badge>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {attStat?.pct != null
                      ? <Badge variant={attStat.pct >= 75 ? 'success' : 'danger'} size="sm">{attStat.pct}%</Badge>
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnalyticsPage;
