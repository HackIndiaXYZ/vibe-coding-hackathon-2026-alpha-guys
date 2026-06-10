import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Users, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import { FormField, Input, Select } from '../ui/Input';
import { EmptyState, StatCard } from '../ui/Card';
import { formatDate, formatShortDate, getDaysUntil } from '../../utils/helpers';

/* ================================================================
   Smart Semester AI — Attendance Tracker
   Log attendance per course, track percentages,
   and get warned when attendance falls below threshold.
   ================================================================ */

const STATUS_CONFIG = {
  present: { label: 'Present', color: 'var(--green)',  bg: 'var(--green-subtle)',  icon: CheckCircle, variant: 'success' },
  absent:  { label: 'Absent',  color: 'var(--red)',    bg: 'var(--red-subtle)',    icon: XCircle,     variant: 'danger'  },
  late:    { label: 'Late',    color: 'var(--gold)',   bg: 'var(--gold-subtle)',   icon: Clock,       variant: 'warning' },
};

const MIN_ATTENDANCE = 75; // warn below this %

const AttendancePage = () => {
  const { courses, attendance, addAttendance, deleteAttendance } = useApp();

  const [modalOpen,    setModalOpen]    = useState(false);
  const [filterCourse, setFilterCourse] = useState('all');
  const [form,         setForm]         = useState({
    courseId: '',
    date:     new Date().toISOString().split('T')[0],
    status:   'present',
    note:     '',
  });
  const [errors, setErrors] = useState({});

  const update = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: '' }));
  };

  // ── PER-COURSE STATS ──
  const courseStats = useMemo(() => courses.map(c => {
    const records = attendance.filter(a => a.courseId === c.id);
    const total   = records.length;
    const present = records.filter(a => a.status === 'present').length;
    const late    = records.filter(a => a.status === 'late').length;
    const absent  = records.filter(a => a.status === 'absent').length;
    // Count late as 0.5 attendance for the percentage
    const pct = total > 0 ? Math.round(((present + late * 0.5) / total) * 100) : null;
    return { ...c, total, present, late, absent, pct };
  }), [courses, attendance]);

  // ── FILTERED RECORDS ──
  const filteredRecords = useMemo(() => {
    const list = filterCourse === 'all'
      ? attendance
      : attendance.filter(a => a.courseId === filterCourse);
    return [...list].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [attendance, filterCourse]);

  // ── OVERALL STATS ──
  const overallStats = useMemo(() => {
    const total   = attendance.length;
    const present = attendance.filter(a => a.status === 'present').length;
    const absent  = attendance.filter(a => a.status === 'absent').length;
    const late    = attendance.filter(a => a.status === 'late').length;
    const pct = total > 0 ? Math.round(((present + late * 0.5) / total) * 100) : 0;
    return { total, present, absent, late, pct };
  }, [attendance]);

  // ── VALIDATE ──
  const validate = () => {
    const e = {};
    if (!form.courseId) e.courseId = 'Select a course';
    if (!form.date)     e.date     = 'Date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── SAVE ──
  const handleSave = () => {
    if (!validate()) return;
    addAttendance({ ...form });
    setModalOpen(false);
    setForm({
      courseId: '',
      date: new Date().toISOString().split('T')[0],
      status: 'present',
      note: '',
    });
  };

  // Quick-mark for today
  const quickMark = (courseId, status) => {
    addAttendance({
      courseId,
      date:   new Date().toISOString().split('T')[0],
      status,
      note:   '',
    });
  };

  return (
    <div className="page-enter" style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* ── HEADER ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: '24px', flexWrap: 'wrap', gap: '12px',
      }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Attendance Tracker
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 4 }}>
            {attendance.length} records across {courses.length} courses
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setModalOpen(true)}>
          Log Attendance
        </Button>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No courses added"
          description="Add courses first, then start tracking your attendance."
        />
      ) : (
        <>
          {/* ── OVERALL STATS ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
            <StatCard
              title="Overall Attendance"
              value={attendance.length > 0 ? `${overallStats.pct}%` : '—'}
              icon={Users}
              color={overallStats.pct >= MIN_ATTENDANCE || attendance.length === 0 ? 'green' : 'red'}
              subtitle={`${overallStats.total} classes logged`}
            />
            <StatCard title="Present" value={overallStats.present} icon={CheckCircle} color="green" />
            <StatCard title="Late"    value={overallStats.late}    icon={Clock}        color="gold"  />
            <StatCard title="Absent"  value={overallStats.absent}  icon={XCircle}      color="red"   />
          </div>

          {/* ── COURSE ATTENDANCE CARDS ── */}
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 600, marginBottom: '14px' }}>
              Per-Course Breakdown
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
              {courseStats.map(c => {
                const atRisk = c.pct !== null && c.pct < MIN_ATTENDANCE;
                return (
                  <div key={c.id} style={{
                    background: 'var(--bg-card)',
                    border: `1px solid ${atRisk ? 'rgba(255,95,107,0.35)' : 'var(--border-card)'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '16px',
                    transition: 'border-color 0.2s',
                  }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: c.color }} />
                          <span style={{ fontSize: '12px', fontWeight: 600, color: c.color }}>{c.code}</span>
                        </div>
                        <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginTop: 2 }}>{c.name}</p>
                      </div>
                      {c.pct !== null && (
                        <div style={{
                          width: 44, height: 44,
                          borderRadius: 'var(--radius-md)',
                          background: atRisk ? 'var(--red-subtle)' : 'var(--green-subtle)',
                          border: `2px solid ${atRisk ? 'rgba(255,95,107,0.4)' : 'rgba(34,200,122,0.4)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: atRisk ? 'var(--red)' : 'var(--green)', fontFamily: 'var(--font-mono)' }}>
                            {c.pct}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Attendance bar */}
                    {c.total > 0 ? (
                      <>
                        <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: '8px' }}>
                          <div style={{
                            width: `${c.pct}%`, height: '100%',
                            background: atRisk ? 'var(--red)' : 'var(--green)',
                            borderRadius: 'var(--radius-full)',
                            transition: 'width 0.8s ease',
                          }} />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                          {[
                            { label: `${c.present}P`, color: 'var(--green)' },
                            { label: `${c.late}L`,    color: 'var(--gold)'  },
                            { label: `${c.absent}A`,  color: 'var(--red)'   },
                          ].map(s => (
                            <span key={s.label} style={{ fontSize: '12px', color: s.color, fontWeight: 600 }}>{s.label}</span>
                          ))}
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                            {c.total} total
                          </span>
                        </div>
                        {atRisk && (
                          <div style={{
                            padding: '6px 10px',
                            background: 'var(--red-subtle)',
                            border: '1px solid rgba(255,95,107,0.3)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '11px', color: 'var(--red)',
                            display: 'flex', alignItems: 'center', gap: 6,
                            marginBottom: '10px',
                          }}>
                            <AlertTriangle size={11} />
                            Below {MIN_ATTENDANCE}% minimum attendance!
                          </div>
                        )}
                      </>
                    ) : (
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                        No records yet
                      </p>
                    )}

                    {/* Quick mark today */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {['present','late','absent'].map(status => {
                        const cfg = STATUS_CONFIG[status];
                        return (
                          <button
                            key={status}
                            onClick={() => quickMark(c.id, status)}
                            title={`Mark ${cfg.label} today`}
                            style={{
                              flex: 1,
                              padding: '5px 0',
                              borderRadius: 'var(--radius-sm)',
                              background: cfg.bg,
                              border: `1px solid ${cfg.color}44`,
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: 600,
                              color: cfg.color,
                              fontFamily: 'var(--font-body)',
                              transition: 'filter 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.15)'}
                            onMouseLeave={e => e.currentTarget.style.filter = ''}
                          >
                            {cfg.label[0]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── RECORDS LIST ── */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 600, flex: 1 }}>
                Attendance Log
              </h2>
              {/* Filter by course */}
              <select
                value={filterCourse}
                onChange={e => setFilterCourse(e.target.value)}
                style={{
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
                  borderRadius: 'var(--radius-md)', padding: '6px 12px',
                  fontSize: '13px', color: 'var(--text-secondary)',
                  outline: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}
              >
                <option value="all">All Courses</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
              </select>
            </div>

            {filteredRecords.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No attendance records"
                description="Use the quick-mark buttons on each course card, or click 'Log Attendance'."
                action={<Button variant="primary" size="sm" icon={Plus} onClick={() => setModalOpen(true)}>Log Attendance</Button>}
              />
            ) : (
              <div>
                {filteredRecords.map((record, idx) => {
                  const course = courses.find(c => c.id === record.courseId);
                  const cfg    = STATUS_CONFIG[record.status];
                  const Icon   = cfg.icon;
                  return (
                    <div key={record.id} style={{
                      display: 'flex', alignItems: 'center', gap: '14px',
                      padding: '12px 18px',
                      borderBottom: idx < filteredRecords.length - 1 ? '1px solid var(--border)' : 'none',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Status icon */}
                      <div style={{
                        width: 32, height: 32, borderRadius: 'var(--radius-md)',
                        background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Icon size={15} style={{ color: cfg.color }} />
                      </div>

                      {/* Course */}
                      {course && (
                        <div style={{
                          width: 8, height: 8, borderRadius: 2,
                          background: course.color, flexShrink: 0,
                        }} />
                      )}
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                          {course?.name || 'Unknown Course'}
                        </p>
                        {record.note && (
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{record.note}</p>
                        )}
                      </div>

                      {/* Date */}
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {formatDate(record.date)}
                      </span>

                      {/* Status badge */}
                      <Badge variant={cfg.variant} size="sm" dot>{cfg.label}</Badge>

                      {/* Delete */}
                      <button
                        onClick={() => deleteAttendance(record.id)}
                        style={{
                          width: 28, height: 28, borderRadius: 'var(--radius-sm)',
                          background: 'transparent', border: 'none',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--text-muted)', transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-subtle)'; e.currentTarget.style.color = 'var(--red)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── LOG ATTENDANCE MODAL ── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Log Attendance"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" icon={Plus} onClick={handleSave}>Log</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <FormField label="Course" required error={errors.courseId}>
            <Select value={form.courseId} onChange={e => update('courseId', e.target.value)} error={errors.courseId}>
              <option value="">Select course…</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </Select>
          </FormField>

          <FormField label="Date" required error={errors.date}>
            <Input type="date" value={form.date} onChange={e => update('date', e.target.value)} error={errors.date} />
          </FormField>

          <FormField label="Status">
            <Select value={form.status} onChange={e => update('status', e.target.value)}>
              <option value="present">✅ Present</option>
              <option value="late">⏰ Late</option>
              <option value="absent">❌ Absent</option>
            </Select>
          </FormField>

          <FormField label="Note (optional)">
            <Input
              value={form.note}
              onChange={e => update('note', e.target.value)}
              placeholder="e.g., Sick, traffic…"
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
};

export default AttendancePage;
