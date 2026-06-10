import React, { useState } from 'react';
import {
  Calendar, Sparkles, Trash2, Plus, Clock, RefreshCw, Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useClaudeAPI } from '../../hooks/useClaudeAPI';
import { buildPlannerPrompt } from '../../utils/claudeApi';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import { FormField, Input, Select } from '../ui/Input';
import { EmptyState } from '../ui/Card';
import { formatTime, getCurrentWeekDays, generateId } from '../../utils/helpers';

/* ================================================================
   Smart Semester AI — Study Planner Page
   AI generates an optimised weekly study schedule based on
   courses, grades, and pending assignment deadlines.
   ================================================================ */

const HOURS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00',
               '15:00','16:00','17:00','18:00','19:00','20:00','21:00'];

const BLANK_BLOCK = {
  day: 'Monday', startTime: '09:00', endTime: '11:00',
  courseId: '', activity: '', priority: 'medium',
};

const StudyPlannerPage = () => {
  const { courses, assignments, profile, studyBlocks, planInsights, saveStudyBlocks, clearStudyPlan } = useApp();
  const { sendMessage, loading } = useClaudeAPI();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form,         setForm]         = useState(BLANK_BLOCK);
  const [errors,       setErrors]       = useState({});
  const [genError,     setGenError]     = useState('');

  const weekDays = getCurrentWeekDays();

  const update = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: '' }));
  };

  // ── GENERATE AI PLAN ──
  const generatePlan = async () => {
    setGenError('');
    if (courses.length === 0) {
      setGenError('Add at least one course before generating a plan.');
      return;
    }

    const prompt = buildPlannerPrompt(profile, courses, assignments);

    try {
      const raw = await sendMessage(
        [{ role: 'user', content: prompt }],
        'You are a study schedule expert. Return only valid JSON, no markdown.',
        2000,
      );

      // Strip markdown fences; find JSON boundaries defensively
      const stripped = raw.replace(/```json|```/gi, '').trim();
      const start    = stripped.search(/[\[{]/);
      const end      = Math.max(stripped.lastIndexOf(']'), stripped.lastIndexOf('}'));
      const jsonStr  = (start !== -1 && end !== -1) ? stripped.slice(start, end + 1) : stripped;
      const parsed   = JSON.parse(jsonStr);

      if (!parsed.blocks || !Array.isArray(parsed.blocks)) throw new Error('Invalid format');

      // Inject stable IDs and resolve course references by id OR name
      const enriched = parsed.blocks.map(b => {
        const course = courses.find(c => c.id === b.courseId) ||
                       courses.find(c => c.name === b.courseName);
        return {
          ...b,
          id: generateId(),
          courseId:   course?.id   || b.courseId   || '',
          color:      course?.color || b.color     || '#5B9FFF',
          courseName: course?.name  || b.courseName || 'Study Block',
        };
      });

      saveStudyBlocks(enriched, parsed.insights || '');
    } catch (err) {
      setGenError(
        'Could not generate schedule. Make sure you have at least one course added, then try again.'
      );
    }
  };

  // ── ADD MANUAL BLOCK ──
  const validate = () => {
    const e = {};
    if (!form.activity.trim()) e.activity = 'Activity is required';
    if (!form.courseId)        e.courseId = 'Select a course';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAddBlock = () => {
    if (!validate()) return;
    const course = courses.find(c => c.id === form.courseId);
    const block = {
      ...form,
      id: generateId(),
      color: course?.color || '#5B9FFF',
      courseName: course?.name || '',
    };
    saveStudyBlocks([...studyBlocks, block], planInsights);
    setAddModalOpen(false);
    setForm(BLANK_BLOCK);
  };

  const deleteBlock = (id) => {
    saveStudyBlocks(studyBlocks.filter(b => b.id !== id), planInsights);
  };

  // Group blocks by day for rendering
  const blocksByDay = weekDays.reduce((acc, { fullDay }) => {
    acc[fullDay] = studyBlocks.filter(b => b.day === fullDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    return acc;
  }, {});

  const totalHours = studyBlocks.reduce((sum, b) => {
    const [sh, sm] = b.startTime.split(':').map(Number);
    const [eh, em] = b.endTime.split(':').map(Number);
    return sum + ((eh * 60 + em - sh * 60 - sm) / 60);
  }, 0);

  return (
    <div className="page-enter" style={{ maxWidth: 1200, margin: '0 auto' }}>

      {/* ── HEADER ── */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)',
          }}>
            Study Planner
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 4 }}>
            {studyBlocks.length > 0
              ? `${studyBlocks.length} study blocks · ~${totalHours.toFixed(1)} hours planned this week`
              : 'Let AI build your optimal weekly schedule'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {studyBlocks.length > 0 && (
            <>
              <Button variant="secondary" size="sm" icon={Plus} onClick={() => setAddModalOpen(true)}>
                Add Block
              </Button>
              <Button variant="ghost" size="sm" icon={Trash2} onClick={clearStudyPlan}>
                Clear Plan
              </Button>
            </>
          )}
          <Button
            variant="primary"
            size="sm"
            icon={loading ? RefreshCw : Sparkles}
            loading={loading}
            onClick={generatePlan}
          >
            {loading ? 'Generating…' : studyBlocks.length > 0 ? 'Regenerate AI Plan' : 'Generate AI Plan'}
          </Button>
        </div>
      </div>

      {/* ── AI INSIGHTS BANNER ── */}
      {planInsights && (
        <div style={{
          background: 'var(--primary-subtle)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
        }}>
          <Info size={16} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: '13px', color: 'var(--primary-light)', lineHeight: 1.6, margin: 0 }}>
            {planInsights}
          </p>
        </div>
      )}

      {/* Error */}
      {genError && (
        <div style={{
          background: 'var(--red-subtle)',
          border: '1px solid rgba(255,95,107,0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          marginBottom: '16px',
          fontSize: '13px',
          color: 'var(--red)',
        }}>
          ⚠ {genError}
        </div>
      )}

      {/* ── EMPTY STATE ── */}
      {studyBlocks.length === 0 && !loading && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}>
          <EmptyState
            icon={Calendar}
            title="No study plan yet"
            description="Click 'Generate AI Plan' to create a personalised weekly schedule based on your courses and assignment deadlines."
            action={
              <Button variant="primary" icon={Sparkles} loading={loading} onClick={generatePlan}>
                Generate AI Plan
              </Button>
            }
          />
        </div>
      )}

      {/* ── WEEKLY CALENDAR GRID ── */}
      {studyBlocks.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '10px',
        }}>
          {weekDays.map(({ day, fullDay, dateNum, isToday }) => {
            const dayBlocks = blocksByDay[fullDay] || [];
            return (
              <div key={fullDay} style={{
                background: 'var(--bg-card)',
                border: isToday
                  ? '1px solid var(--primary)'
                  : '1px solid var(--border-card)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                boxShadow: isToday ? 'var(--shadow-primary)' : 'none',
              }}>
                {/* Day header */}
                <div style={{
                  padding: '10px 12px 8px',
                  borderBottom: '1px solid var(--border)',
                  background: isToday ? 'var(--primary-subtle)' : 'transparent',
                  textAlign: 'center',
                }}>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: isToday ? 'var(--primary)' : 'var(--text-muted)',
                  }}>
                    {day}
                  </div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-display)',
                    color: isToday ? 'var(--primary)' : 'var(--text-primary)',
                    lineHeight: 1.2,
                  }}>
                    {dateNum}
                  </div>
                </div>

                {/* Study blocks */}
                <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px', minHeight: 120 }}>
                  {dayBlocks.length === 0 ? (
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '11px',
                      opacity: 0.5,
                      padding: '16px 0',
                    }}>
                      Rest day
                    </div>
                  ) : (
                    dayBlocks.map(block => (
                      <StudyBlock key={block.id} block={block} onDelete={deleteBlock} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── COURSE LEGEND ── */}
      {studyBlocks.length > 0 && courses.length > 0 && (
        <div style={{
          marginTop: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Legend:</span>
          {courses.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: c.color }} />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{c.code}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── ADD MANUAL BLOCK MODAL ── */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Study Block"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddBlock}>Add Block</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <FormField label="Day">
            <Select value={form.day} onChange={e => update('day', e.target.value)}>
              {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="Start Time">
              <Select value={form.startTime} onChange={e => update('startTime', e.target.value)}>
                {HOURS.map(h => <option key={h} value={h}>{formatTime(h)}</option>)}
              </Select>
            </FormField>
            <FormField label="End Time">
              <Select value={form.endTime} onChange={e => update('endTime', e.target.value)}>
                {HOURS.filter(h => h > form.startTime).map(h => (
                  <option key={h} value={h}>{formatTime(h)}</option>
                ))}
              </Select>
            </FormField>
          </div>

          <FormField label="Course" error={errors.courseId}>
            <Select value={form.courseId} onChange={e => update('courseId', e.target.value)} error={errors.courseId}>
              <option value="">Select course…</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.code} – {c.name}</option>)}
            </Select>
          </FormField>

          <FormField label="Activity" error={errors.activity}>
            <Input
              value={form.activity}
              onChange={e => update('activity', e.target.value)}
              placeholder="e.g., Review Chapter 5 notes"
              error={errors.activity}
              autoFocus
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
};

/* ── STUDY BLOCK CARD ── */
const StudyBlock = ({ block, onDelete }) => {
  const [showDelete, setShowDelete] = useState(false);
  const [sh, sm] = block.startTime.split(':').map(Number);
  const [eh, em] = block.endTime.split(':').map(Number);
  const duration = ((eh * 60 + em) - (sh * 60 + sm)) / 60;

  return (
    <div
      style={{
        background: block.color + '18',
        border: `1px solid ${block.color}44`,
        borderLeft: `3px solid ${block.color}`,
        borderRadius: 'var(--radius-sm)',
        padding: '6px 8px',
        position: 'relative',
        cursor: 'default',
        transition: 'background 0.15s',
      }}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <div style={{
        fontSize: '11px',
        fontWeight: 600,
        color: block.color,
        marginBottom: '3px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {block.courseName}
      </div>
      <div style={{
        fontSize: '10px',
        color: 'var(--text-secondary)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        lineHeight: 1.3,
      }}>
        {block.activity}
      </div>
      <div style={{
        fontSize: '10px',
        color: 'var(--text-muted)',
        marginTop: '3px',
        display: 'flex',
        alignItems: 'center',
        gap: '3px',
      }}>
        <Clock size={9} />
        {formatTime(block.startTime)} · {duration}h
      </div>

      {/* Delete on hover */}
      {showDelete && (
        <button
          onClick={() => onDelete(block.id)}
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 18,
            height: 18,
            borderRadius: 3,
            background: 'var(--red-subtle)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--red)',
          }}
        >
          <Trash2 size={10} />
        </button>
      )}
    </div>
  );
};

export default StudyPlannerPage;
