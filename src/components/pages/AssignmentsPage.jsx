import React, { useState, useMemo } from 'react';
import {
  Plus, Search, Filter, Trash2, Edit2, CheckSquare,
  Clock, AlertTriangle, SortAsc, CheckCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Badge, { PriorityBadge, StatusBadge } from '../ui/Badge';
import { FormField, Input, Textarea, Select } from '../ui/Input';
import { EmptyState } from '../ui/Card';
import {
  getRelativeDate, getDaysUntil, formatDate, generateId,
  getPriorityOrder, isOverdue,
} from '../../utils/helpers';

/* ================================================================
   Smart Semester AI — Assignments Page
   ================================================================ */

const BLANK_FORM = {
  courseId: '', title: '', description: '',
  dueDate: '', priority: 'medium', estimatedHours: 2,
};

const FILTER_TABS = [
  { id: 'all',       label: 'All' },
  { id: 'today',     label: 'Today' },
  { id: 'week',      label: 'This Week' },
  { id: 'high',      label: 'High Priority' },
  { id: 'completed', label: 'Completed' },
];

const AssignmentsPage = () => {
  const {
    assignments, courses,
    addAssignment, updateAssignment, deleteAssignment, toggleAssignment,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy,        setSortBy]       = useState('dueDate');
  const [searchQuery,   setSearchQuery]  = useState('');
  const [modalOpen,     setModalOpen]    = useState(false);
  const [editTarget,    setEditTarget]   = useState(null);
  const [form,          setForm]         = useState(BLANK_FORM);
  const [errors,        setErrors]       = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const update = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: '' }));
  };

  // ── FILTER + SORT ──
  const filtered = useMemo(() => {
    let list = [...assignments];

    // Tab filter
    const now = new Date(); now.setHours(0,0,0,0);
    const weekEnd = new Date(now); weekEnd.setDate(weekEnd.getDate() + 7);

    if (activeFilter === 'today') {
      list = list.filter(a => getDaysUntil(a.dueDate) === 0 && a.status !== 'completed');
    } else if (activeFilter === 'week') {
      list = list.filter(a => {
        const d = getDaysUntil(a.dueDate);
        return d >= 0 && d <= 7 && a.status !== 'completed';
      });
    } else if (activeFilter === 'high') {
      list = list.filter(a => a.priority === 'high' && a.status !== 'completed');
    } else if (activeFilter === 'completed') {
      list = list.filter(a => a.status === 'completed');
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a => {
        const course = courses.find(c => c.id === a.courseId);
        return (
          a.title.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q) ||
          course?.name.toLowerCase().includes(q) ||
          course?.code.toLowerCase().includes(q)
        );
      });
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'dueDate')  return new Date(a.dueDate)  - new Date(b.dueDate);
      if (sortBy === 'priority') return getPriorityOrder(a.priority) - getPriorityOrder(b.priority);
      if (sortBy === 'course') {
        const ca = courses.find(c => c.id === a.courseId)?.name || '';
        const cb = courses.find(c => c.id === b.courseId)?.name || '';
        return ca.localeCompare(cb);
      }
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      return 0;
    });

    return list;
  }, [assignments, courses, activeFilter, sortBy, searchQuery]);

  // Tab counts
  const counts = useMemo(() => ({
    all:       assignments.length,
    today:     assignments.filter(a => getDaysUntil(a.dueDate) === 0 && a.status !== 'completed').length,
    week:      assignments.filter(a => { const d = getDaysUntil(a.dueDate); return d >= 0 && d <= 7 && a.status !== 'completed'; }).length,
    high:      assignments.filter(a => a.priority === 'high' && a.status !== 'completed').length,
    completed: assignments.filter(a => a.status === 'completed').length,
  }), [assignments]);

  // ── OPEN MODAL ──
  const openAdd = () => {
    setEditTarget(null);
    setForm({ ...BLANK_FORM, courseId: courses[0]?.id || '' });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (a) => {
    setEditTarget(a.id);
    setForm({
      courseId: a.courseId,
      title: a.title,
      description: a.description || '',
      dueDate: a.dueDate,
      priority: a.priority,
      estimatedHours: a.estimatedHours || 2,
    });
    setErrors({});
    setModalOpen(true);
  };

  // ── VALIDATE ──
  const validate = () => {
    const e = {};
    if (!form.title.trim())  e.title   = 'Title is required';
    if (!form.courseId)      e.courseId = 'Select a course';
    if (!form.dueDate)       e.dueDate  = 'Due date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── SAVE ──
  const handleSave = () => {
    if (!validate()) return;
    const data = { ...form, estimatedHours: Number(form.estimatedHours) };
    if (editTarget) {
      updateAssignment(editTarget, data);
    } else {
      addAssignment(data);
    }
    setModalOpen(false);
  };

  return (
    <div className="page-enter" style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* ── HEADER ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
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
            Assignments
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 4 }}>
            {assignments.filter(a => a.status !== 'completed').length} pending · {counts.completed} done
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={openAdd}>
          Add Assignment
        </Button>
      </div>

      {/* ── FILTER TABS ── */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', overflowX: 'auto', paddingBottom: 4 }}>
        {FILTER_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            style={{
              padding: '7px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '13px',
              fontWeight: activeFilter === tab.id ? 600 : 400,
              color: activeFilter === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
              background: activeFilter === tab.id ? 'var(--primary-subtle)' : 'transparent',
              border: activeFilter === tab.id ? '1px solid var(--border-strong)' : '1px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
            {counts[tab.id] > 0 && (
              <span style={{
                minWidth: 18,
                height: 18,
                borderRadius: 'var(--radius-full)',
                background: activeFilter === tab.id ? 'var(--primary)' : 'var(--bg-elevated)',
                color: activeFilter === tab.id ? '#060A18' : 'var(--text-secondary)',
                fontSize: '11px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
              }}>
                {counts[tab.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── SEARCH + SORT ── */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={15} style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)', pointerEvents: 'none',
          }} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search assignments, courses…"
            style={{
              width: '100%',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-md)',
              padding: '9px 14px 9px 36px',
              fontSize: '14px',
              color: 'var(--text-primary)',
              outline: 'none',
              fontFamily: 'var(--font-body)',
              transition: 'border-color 0.18s',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-card)'}
          />
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-md)',
            padding: '9px 32px 9px 12px',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            outline: 'none',
            fontFamily: 'var(--font-body)',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237A95BE' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 10px center',
            minWidth: 140,
          }}
        >
          <option value="dueDate">Sort: Due Date</option>
          <option value="priority">Sort: Priority</option>
          <option value="course">Sort: Course</option>
          <option value="status">Sort: Status</option>
        </select>
      </div>

      {/* ── ASSIGNMENT LIST ── */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No assignments found"
          description={searchQuery ? 'Try a different search term.' : 'No assignments match this filter.'}
          action={
            activeFilter === 'all' && !searchQuery && (
              <Button variant="primary" icon={Plus} size="sm" onClick={openAdd}>
                Add Assignment
              </Button>
            )
          }
        />
      ) : (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}>
          {filtered.map((a, idx) => (
            <AssignmentRow
              key={a.id}
              assignment={a}
              courses={courses}
              isLast={idx === filtered.length - 1}
              onToggle={toggleAssignment}
              onEdit={() => openEdit(a)}
              onDelete={() => setDeleteConfirm(a.id)}
            />
          ))}
        </div>
      )}

      {/* ── ADD / EDIT MODAL ── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Assignment' : 'Add Assignment'}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>
              {editTarget ? 'Save Changes' : 'Add Assignment'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <FormField label="Assignment Title" required error={errors.title}>
            <Input
              value={form.title}
              onChange={e => update('title', e.target.value)}
              placeholder="e.g., ML Project Phase 1"
              error={errors.title}
              autoFocus
            />
          </FormField>

          <FormField label="Course" required error={errors.courseId}>
            <Select
              value={form.courseId}
              onChange={e => update('courseId', e.target.value)}
              error={errors.courseId}
            >
              <option value="">Select a course…</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
              ))}
            </Select>
          </FormField>

          <FormField label="Description / Notes">
            <Textarea
              value={form.description}
              onChange={e => update('description', e.target.value)}
              placeholder="What needs to be done? Include any details…"
              rows={3}
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="Due Date" required error={errors.dueDate}>
              <Input
                type="date"
                value={form.dueDate}
                onChange={e => update('dueDate', e.target.value)}
                error={errors.dueDate}
              />
            </FormField>

            <FormField label="Priority">
              <Select value={form.priority} onChange={e => update('priority', e.target.value)}>
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </Select>
            </FormField>
          </div>

          <FormField label="Estimated Hours">
            <Select value={form.estimatedHours} onChange={e => update('estimatedHours', e.target.value)}>
              {[0.5,1,1.5,2,3,4,5,6,8,10,12].map(h => (
                <option key={h} value={h}>{h} hour{h !== 1 ? 's' : ''}</option>
              ))}
            </Select>
          </FormField>
        </div>
      </Modal>

      {/* ── DELETE CONFIRM ── */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Assignment"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="danger" icon={Trash2} onClick={() => { deleteAssignment(deleteConfirm); setDeleteConfirm(null); }}>
              Delete
            </Button>
          </>
        }
      >
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Are you sure you want to delete this assignment? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

/* ── ASSIGNMENT ROW ── */
const AssignmentRow = ({ assignment: a, courses, isLast, onToggle, onEdit, onDelete }) => {
  const course = courses.find(c => c.id === a.courseId);
  const days = getDaysUntil(a.dueDate);
  const overdue = a.status !== 'completed' && days < 0;
  const dueToday = a.status !== 'completed' && days === 0;
  const completed = a.status === 'completed';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '14px 18px',
      borderBottom: isLast ? 'none' : '1px solid var(--border)',
      background: overdue
        ? 'rgba(255,95,107,0.04)'
        : dueToday ? 'rgba(245,185,66,0.04)' : 'transparent',
      transition: 'background 0.15s',
    }}
    onMouseEnter={e => {
      if (!overdue && !dueToday) e.currentTarget.style.background = 'var(--bg-hover)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.background = overdue
        ? 'rgba(255,95,107,0.04)'
        : dueToday ? 'rgba(245,185,66,0.04)' : 'transparent';
    }}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(a.id)}
        style={{
          width: 20,
          height: 20,
          borderRadius: '5px',
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
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M2 5.5l2.5 2.5L9 3" stroke="#060A18" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {overdue && !completed && <AlertTriangle size={10} style={{ color: 'var(--red)' }} />}
      </button>

      {/* Course color stripe */}
      {course && (
        <div style={{
          width: 3,
          height: 36,
          borderRadius: 'var(--radius-full)',
          background: course.color,
          flexShrink: 0,
        }} />
      )}

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: '14px',
          fontWeight: 500,
          color: completed ? 'var(--text-muted)' : 'var(--text-primary)',
          textDecoration: completed ? 'line-through' : 'none',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {a.title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
          {course && (
            <span style={{
              fontSize: '12px',
              color: course.color,
              fontWeight: 500,
            }}>
              {course.code}
            </span>
          )}
          {a.description && (
            <span style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 200,
            }}>
              {a.description}
            </span>
          )}
        </div>
      </div>

      {/* Meta: due date + priority */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <span style={{
          fontSize: '12px',
          fontWeight: 500,
          color: overdue ? 'var(--red)' : dueToday ? 'var(--gold)' : 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          <Clock size={12} />
          {completed ? `Done ${formatDate(a.completedAt)}` : getRelativeDate(a.dueDate)}
        </span>
        <PriorityBadge priority={a.priority} size="xs" />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
        <button
          onClick={onEdit}
          style={{
            width: 30, height: 30,
            borderRadius: 'var(--radius-sm)',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-subtle)'; e.currentTarget.style.color = 'var(--primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <Edit2 size={13} />
        </button>
        <button
          onClick={onDelete}
          style={{
            width: 30, height: 30,
            borderRadius: 'var(--radius-sm)',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-subtle)'; e.currentTarget.style.color = 'var(--red)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
};

export default AssignmentsPage;
