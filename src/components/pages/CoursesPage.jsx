import React, { useState } from 'react';
import { Plus, Edit2, Trash2, BookOpen, Award, Target, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { FormField, Input, Select, ColorPicker, RangeInput } from '../ui/Input';
import { EmptyState } from '../ui/Card';
import Badge from '../ui/Badge';
import {
  calculateLetterGrade, getGradeColor, COURSE_COLORS,
  calculateGPA, letterToGPA,
} from '../../utils/helpers';

/* ================================================================
   Smart Semester AI — Courses Page
   Full CRUD: Add, view, edit, and delete courses with grade tracking.
   ================================================================ */

const BLANK_FORM = {
  name: '', code: '', credits: 3, grade: 0,
  instructor: '', color: COURSE_COLORS[0], targetGrade: 85,
};

const CoursesPage = () => {
  const { courses, addCourse, updateCourse, deleteCourse, assignments } = useApp();

  const [modalOpen,  setModalOpen]  = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = add mode
  const [form,       setForm]       = useState(BLANK_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [errors,     setErrors]     = useState({});

  const update = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: '' }));
  };

  // ── OPEN MODAL ──
  const openAdd = () => {
    setEditTarget(null);
    setForm(BLANK_FORM);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (course) => {
    setEditTarget(course.id);
    setForm({ ...course });
    setErrors({});
    setModalOpen(true);
  };

  // ── VALIDATE ──
  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = 'Course name is required';
    if (!form.code.trim())  e.code  = 'Course code is required';
    if (form.credits < 1 || form.credits > 10) e.credits = '1–10 credits';
    if (form.grade < 0 || form.grade > 100) e.grade = '0–100%';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── SAVE ──
  const handleSave = () => {
    if (!validate()) return;
    const data = {
      ...form,
      credits: Number(form.credits),
      grade: Number(form.grade),
      targetGrade: Number(form.targetGrade),
    };
    if (editTarget) {
      updateCourse(editTarget, data);
    } else {
      addCourse(data);
    }
    setModalOpen(false);
  };

  // ── DELETE ──
  const handleDelete = (id) => {
    deleteCourse(id);
    setDeleteConfirm(null);
  };

  // Count assignments per course
  const assignmentCount = (courseId) =>
    assignments.filter(a => a.courseId === courseId).length;

  const pendingCount = (courseId) =>
    assignments.filter(a => a.courseId === courseId && a.status !== 'completed').length;

  return (
    <div className="page-enter" style={{ maxWidth: 1200, margin: '0 auto' }}>

      {/* ── PAGE HEADER ── */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '22px', fontWeight: 700,
            color: 'var(--text-primary)',
          }}>
            My Courses
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {courses.length} course{courses.length !== 1 ? 's' : ''} enrolled
            {courses.length > 0 && ` · ${courses.reduce((s, c) => s + c.credits, 0)} total credits`}
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={openAdd}>
          Add Course
        </Button>
      </div>

      {/* ── COURSE GRID ── */}
      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses added yet"
          description="Add your enrolled courses to start tracking grades, assignments, and GPA."
          action={<Button variant="primary" icon={Plus} onClick={openAdd}>Add Your First Course</Button>}
        />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '18px',
        }}>
          {courses.map((course, idx) => (
            <CourseCard
              key={course.id}
              course={course}
              assignmentTotal={assignmentCount(course.id)}
              pendingTasks={pendingCount(course.id)}
              onEdit={() => openEdit(course)}
              onDelete={() => setDeleteConfirm(course.id)}
              animDelay={idx * 60}
            />
          ))}
        </div>
      )}

      {/* ── ADD / EDIT MODAL ── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Course' : 'Add New Course'}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>
              {editTarget ? 'Save Changes' : 'Add Course'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField label="Course Name" required error={errors.name}>
            <Input
              value={form.name}
              onChange={e => update('name', e.target.value)}
              placeholder="e.g., Data Structures & Algorithms"
              error={errors.name}
              autoFocus
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="Course Code" required error={errors.code}>
              <Input
                value={form.code}
                onChange={e => update('code', e.target.value.toUpperCase())}
                placeholder="e.g., CS301"
                error={errors.code}
              />
            </FormField>

            <FormField label="Credits" error={errors.credits}>
              <Select
                value={form.credits}
                onChange={e => update('credits', parseInt(e.target.value))}
                error={errors.credits}
              >
                {[1,2,3,4,5,6].map(n => (
                  <option key={n} value={n}>{n} Credit{n !== 1 ? 's' : ''}</option>
                ))}
              </Select>
            </FormField>
          </div>

          <FormField label="Instructor Name">
            <Input
              value={form.instructor}
              onChange={e => update('instructor', e.target.value)}
              placeholder="e.g., Dr. Arjun Mehta"
              icon={User}
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="Current Grade (%)" error={errors.grade}>
              <Input
                type="number"
                min={0} max={100}
                value={form.grade}
                onChange={e => update('grade', e.target.value)}
                placeholder="e.g., 85"
                error={errors.grade}
              />
            </FormField>

            <FormField label="Target Grade (%)">
              <Input
                type="number"
                min={0} max={100}
                value={form.targetGrade}
                onChange={e => update('targetGrade', e.target.value)}
                placeholder="e.g., 90"
              />
            </FormField>
          </div>

          <FormField label="Course Color">
            <ColorPicker value={form.color} onChange={v => update('color', v)} />
          </FormField>
        </div>
      </Modal>

      {/* ── DELETE CONFIRM MODAL ── */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Course"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="danger" icon={Trash2} onClick={() => handleDelete(deleteConfirm)}>
              Delete Course
            </Button>
          </>
        }
      >
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Are you sure you want to delete this course? All related assignments and attendance
          records will also be removed. <strong style={{ color: 'var(--red)' }}>This cannot be undone.</strong>
        </p>
      </Modal>
    </div>
  );
};

/* ── COURSE CARD ── */
const CourseCard = ({ course, assignmentTotal, pendingTasks, onEdit, onDelete, animDelay }) => {
  const letter = calculateLetterGrade(course.grade);
  const gradeColor = getGradeColor(course.grade);
  const progress = Math.min(course.grade, 100);
  const targetProgress = Math.min(course.targetGrade, 100);
  const gpaPoints = letterToGPA(letter);

  return (
    <div
      className="animate-fade-in"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        animationDelay: `${animDelay}ms`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = course.color + '55';
        e.currentTarget.style.boxShadow = `0 4px 20px ${course.color}22`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border-card)';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {/* Color accent bar */}
      <div style={{ height: 4, background: course.color }} />

      <div style={{ padding: '18px' }}>
        {/* Header: code + grade letter */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div>
            <Badge
              style={{ background: course.color + '22', color: course.color, borderColor: course.color + '44', marginBottom: '6px' }}
              size="sm"
            >
              {course.code}
            </Badge>
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              lineHeight: 1.3,
            }}>
              {course.name}
            </h3>
          </div>
          {/* Grade letter circle */}
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-md)',
            background: gradeColor + '18',
            border: `2px solid ${gradeColor}44`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '16px',
              fontWeight: 800,
              color: gradeColor,
              lineHeight: 1,
            }}>
              {letter}
            </span>
            <span style={{ fontSize: '10px', color: gradeColor, fontWeight: 500 }}>
              {gpaPoints.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Instructor */}
        {course.instructor && (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
            <User size={11} style={{ display: 'inline', marginRight: 4 }} />
            {course.instructor}
          </p>
        )}

        {/* Grade progress bar */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px',
            marginBottom: '5px',
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              Grade: <span style={{ color: gradeColor, fontWeight: 600 }}>{course.grade}%</span>
            </span>
            <span style={{ color: 'var(--text-muted)' }}>
              Target: {course.targetGrade}%
            </span>
          </div>
          <div style={{
            height: 6,
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
            position: 'relative',
          }}>
            {/* Target marker */}
            <div style={{
              position: 'absolute',
              left: `${targetProgress}%`,
              top: 0,
              width: 2,
              height: '100%',
              background: 'var(--text-muted)',
              transform: 'translateX(-50%)',
            }} />
            {/* Grade fill */}
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: gradeColor,
              borderRadius: 'var(--radius-full)',
              transition: 'width 0.8s ease',
            }} />
          </div>
        </div>

        {/* Meta row: credits + assignments */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '14px',
          flexWrap: 'wrap',
        }}>
          <Badge variant="muted" size="sm">
            {course.credits} credit{course.credits !== 1 ? 's' : ''}
          </Badge>
          {assignmentTotal > 0 && (
            <Badge variant={pendingTasks > 0 ? 'warning' : 'success'} size="sm">
              {pendingTasks > 0 ? `${pendingTasks} pending` : `${assignmentTotal} done`}
            </Badge>
          )}
          {course.grade < course.targetGrade && (
            <Badge variant="danger" size="sm">
              ↑ {(course.targetGrade - course.grade).toFixed(0)}% needed
            </Badge>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary" size="sm" icon={Edit2} fullWidth onClick={onEdit}>
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={Trash2}
            onClick={onDelete}
            style={{ width: 36, padding: 0, justifyContent: 'center' }}
          />
        </div>
      </div>
    </div>
  );
};

export default CoursesPage;
