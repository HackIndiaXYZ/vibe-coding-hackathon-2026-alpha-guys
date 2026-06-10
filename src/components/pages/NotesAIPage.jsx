import React, { useState, useCallback } from 'react';
import {
  FileText, Plus, Trash2, Save, Sparkles, BookOpen,
  List, CreditCard, HelpCircle, ChevronRight, Search,
  CheckCircle, XCircle, RotateCcw, Edit2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useClaudeAPI } from '../../hooks/useClaudeAPI';
import {
  buildSummaryPrompt, buildKeyPointsPrompt,
  buildFlashcardsPrompt, buildQuizPrompt,
} from '../../utils/claudeApi';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import { FormField, Input, Textarea, Select } from '../ui/Input';
import { EmptyState } from '../ui/Card';
import { formatDate, truncate } from '../../utils/helpers';

/* ================================================================
   Smart Semester AI — Notes & Quiz Page
   Write notes → AI summarizes, extracts key points,
   generates flashcards, and builds a multiple-choice quiz.
   ================================================================ */

const NotesAIPage = () => {
  const { notes, courses, addNote, updateNote, deleteNote } = useApp();
  const { sendMessage, loading } = useClaudeAPI();

  // ── STATE ──
  const [activeNoteId,  setActiveNoteId]  = useState(notes[0]?.id || null);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [editTitle,     setEditTitle]     = useState('');
  const [editContent,   setEditContent]   = useState('');
  const [isDirty,       setIsDirty]       = useState(false);
  const [newNoteModal,  setNewNoteModal]  = useState(false);
  const [newForm,       setNewForm]       = useState({ title: '', courseId: '', content: '' });

  // AI results
  const [aiTab,         setAiTab]         = useState('summary'); // 'summary' | 'keypoints' | 'flashcards' | 'quiz'
  const [summary,       setSummary]       = useState('');
  const [keyPoints,     setKeyPoints]     = useState([]);
  const [flashcards,    setFlashcards]    = useState([]);
  const [quiz,          setQuiz]          = useState([]);
  const [aiError,       setAiError]       = useState('');

  // Quiz state
  const [quizAnswers,   setQuizAnswers]   = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [flippedCards,  setFlippedCards]  = useState({});

  // Active note
  const activeNote = notes.find(n => n.id === activeNoteId);

  // Load note into editor when switching
  const selectNote = (note) => {
    if (isDirty && activeNote) handleSave(); // auto-save on switch
    setActiveNoteId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
    setIsDirty(false);
    // Reset AI results for new note
    setSummary(''); setKeyPoints([]); setFlashcards([]); setQuiz([]);
    setAiError(''); setQuizAnswers({}); setQuizSubmitted(false);
  };

  // Save current note
  const handleSave = useCallback(() => {
    if (!activeNoteId) return;
    updateNote(activeNoteId, { title: editTitle, content: editContent });
    setIsDirty(false);
  }, [activeNoteId, editTitle, editContent, updateNote]);

  // Add new note
  const handleAddNote = () => {
    if (!newForm.title.trim()) return;
    const n = addNote({
      title:    newForm.title.trim(),
      content:  newForm.content || '',
      courseId: newForm.courseId || null,
      summary: '', keyPoints: [], flashcards: [], quiz: [],
    });
    setActiveNoteId(n.id);
    setEditTitle(n.title);
    setEditContent(n.content || '');
    setNewNoteModal(false);
    setNewForm({ title: '', courseId: '', content: '' });
    setIsDirty(false);
    setSummary(''); setKeyPoints([]); setFlashcards([]); setQuiz([]);
  };

  // Delete note
  const handleDeleteNote = (id) => {
    deleteNote(id);
    const remaining = notes.filter(n => n.id !== id);
    if (remaining.length > 0) {
      selectNote(remaining[0]);
    } else {
      setActiveNoteId(null);
      setEditTitle(''); setEditContent('');
    }
  };

  // ── AI ACTIONS ──
  const runAI = async (action) => {
    if (!editContent.trim()) { setAiError('Add some content to your note first.'); return; }
    setAiError('');
    setAiTab(action);

    const promptMap = {
      summary:    buildSummaryPrompt(editContent),
      keypoints:  buildKeyPointsPrompt(editContent),
      flashcards: buildFlashcardsPrompt(editContent),
      quiz:       buildQuizPrompt(editContent),
    };

    // Helper: strip markdown fences and parse JSON safely
    const parseJSON = (raw) => {
      const cleaned = raw.replace(/```json|```/gi, '').trim();
      // Find the first '[' or '{' and last ']' or '}' to handle any trailing text
      const start = cleaned.search(/[\[{]/);
      const end   = Math.max(cleaned.lastIndexOf(']'), cleaned.lastIndexOf('}'));
      if (start === -1 || end === -1) throw new Error('No JSON found in response');
      return JSON.parse(cleaned.slice(start, end + 1));
    };

    try {
      const raw = await sendMessage(
        [{ role: 'user', content: promptMap[action] }],
        'You are an expert academic study assistant. Follow the requested format precisely.',
        1500,
      );

      if (action === 'summary') {
        setSummary(raw);
        updateNote(activeNoteId, { summary: raw });

      } else if (action === 'keypoints') {
        const lines = raw.split('\n')
          .map(l => l.replace(/^\d+\.\s*/, '').replace(/^[-•]\s*/, '').trim())
          .filter(l => l.length > 10);
        setKeyPoints(lines.length > 0 ? lines : [raw]);
        updateNote(activeNoteId, { keyPoints: lines });

      } else if (action === 'flashcards') {
        try {
          const parsed = parseJSON(raw);
          setFlashcards(Array.isArray(parsed) ? parsed : []);
          setFlippedCards({});
          updateNote(activeNoteId, { flashcards: parsed });
        } catch (_) {
          // Fallback: treat raw as a single card
          setFlashcards([{ question: 'Review these notes', answer: raw.slice(0, 200) }]);
        }

      } else if (action === 'quiz') {
        try {
          const parsed = parseJSON(raw);
          setQuiz(Array.isArray(parsed) ? parsed : []);
          setQuizAnswers({}); setQuizSubmitted(false);
          updateNote(activeNoteId, { quiz: parsed });
        } catch (_) {
          setAiError('Could not parse quiz — try adding more detailed notes and regenerate.');
        }
      }
    } catch (err) {
      setAiError(err.message || 'AI request failed. Please try again.');
    }
  };

  // Filtered notes list
  const filteredNotes = notes.filter(n =>
    !searchQuery || n.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Quiz score
  const quizScore = quiz.reduce((s, q, i) => {
    return quizAnswers[i] === q.correct ? s + 1 : s;
  }, 0);

  return (
    <div className="page-enter" style={{
      maxWidth: 1200,
      margin: '0 auto',
      height: 'calc(100vh - var(--topbar-height) - 48px)',
      display: 'flex',
      gap: '16px',
    }}>

      {/* ── LEFT: NOTES LIST ── */}
      <div style={{
        width: 240,
        flexShrink: 0,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '14px 12px 10px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 600 }}>Notes</span>
            <button
              onClick={() => setNewNoteModal(true)}
              style={{
                width: 26, height: 26,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--primary-subtle)',
                border: '1px solid var(--border-strong)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--primary)',
              }}
            >
              <Plus size={14} />
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search notes…"
              style={{
                width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: '6px 8px 6px 26px', fontSize: '12px',
                color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box',
                fontFamily: 'var(--font-body)',
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
          {filteredNotes.length === 0 ? (
            <div style={{ padding: '20px 12px', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {notes.length === 0 ? 'No notes yet. Create one!' : 'No results.'}
              </p>
            </div>
          ) : (
            filteredNotes.map(note => {
              const course = courses.find(c => c.id === note.courseId);
              const isActive = note.id === activeNoteId;
              return (
                <div
                  key={note.id}
                  onClick={() => selectNote(note)}
                  style={{
                    padding: '10px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: isActive ? 'var(--primary-subtle)' : 'transparent',
                    border: isActive ? '1px solid var(--border-strong)' : '1px solid transparent',
                    cursor: 'pointer',
                    marginBottom: '4px',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                    <p style={{
                      fontSize: '13px', fontWeight: isActive ? 600 : 400,
                      color: isActive ? 'var(--primary)' : 'var(--text-primary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      flex: 1,
                    }}>
                      {note.title}
                    </p>
                    <button
                      onClick={e => { e.stopPropagation(); handleDeleteNote(note.id); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0, padding: 2 }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  {course && (
                    <div style={{
                      fontSize: '11px', color: course.color, marginTop: '3px',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: course.color }} />
                      {course.code}
                    </div>
                  )}
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {formatDate(note.updatedAt)}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── RIGHT: EDITOR + AI PANEL ── */}
      {!activeNote ? (
        <div style={{
          flex: 1,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <EmptyState
            icon={FileText}
            title="Select a note or create one"
            description="Your AI-powered study notes with summaries, flashcards, and quizzes."
            action={<Button variant="primary" icon={Plus} onClick={() => setNewNoteModal(true)}>New Note</Button>}
          />
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', gap: '16px', minWidth: 0, overflow: 'hidden' }}>

          {/* Editor panel */}
          <div style={{
            flex: 1,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Editor header */}
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <input
                value={editTitle}
                onChange={e => { setEditTitle(e.target.value); setIsDirty(true); }}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)',
                  fontFamily: 'var(--font-display)',
                }}
                placeholder="Note title…"
              />
              {isDirty && (
                <Button variant="primary" size="sm" icon={Save} onClick={handleSave}>Save</Button>
              )}
            </div>

            {/* Textarea */}
            <textarea
              value={editContent}
              onChange={e => { setEditContent(e.target.value); setIsDirty(true); }}
              placeholder="Start writing your notes here…&#10;&#10;Tips: Include key concepts, formulas, definitions, and examples. The more detailed your notes, the better the AI analysis."
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                padding: '16px',
                fontSize: '14px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                lineHeight: 1.75,
                resize: 'none',
                overflow: 'auto',
              }}
            />

            {/* Word count */}
            <div style={{
              padding: '8px 16px',
              borderTop: '1px solid var(--border)',
              fontSize: '11px',
              color: 'var(--text-muted)',
              display: 'flex', justifyContent: 'space-between',
            }}>
              <span>{editContent.split(/\s+/).filter(Boolean).length} words</span>
              {isDirty && <span style={{ color: 'var(--gold)' }}>● Unsaved changes</span>}
            </div>
          </div>

          {/* AI Panel */}
          <div style={{
            width: 320,
            flexShrink: 0,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* AI Action Tabs */}
            <div style={{ padding: '12px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Sparkles size={14} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>AI Analysis</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {[
                  { id: 'summary',    label: 'Summarize',  icon: FileText },
                  { id: 'keypoints',  label: 'Key Points', icon: List },
                  { id: 'flashcards', label: 'Flashcards', icon: CreditCard },
                  { id: 'quiz',       label: 'Quiz',       icon: HelpCircle },
                ].map(({ id, label, icon: Icon }) => (
                  <Button
                    key={id}
                    variant={aiTab === id ? 'primary' : 'secondary'}
                    size="sm"
                    icon={Icon}
                    loading={loading && aiTab === id}
                    onClick={() => runAI(id)}
                    style={{ fontSize: '12px' }}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Error */}
            {aiError && (
              <div style={{ margin: '10px', padding: '10px', background: 'var(--red-subtle)', border: '1px solid rgba(255,95,107,0.3)', borderRadius: 'var(--radius-md)', fontSize: '12px', color: 'var(--red)' }}>
                ⚠ {aiError}
              </div>
            )}

            {/* AI Results */}
            <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>

              {/* SUMMARY */}
              {aiTab === 'summary' && summary && (
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)', marginBottom: '8px' }}>Summary</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{summary}</p>
                </div>
              )}

              {/* KEY POINTS */}
              {aiTab === 'keypoints' && keyPoints.length > 0 && (
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)', marginBottom: '10px' }}>Key Points</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {keyPoints.map((pt, i) => (
                      <div key={i} style={{
                        display: 'flex', gap: '8px', alignItems: 'flex-start',
                        padding: '8px 10px',
                        background: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                      }}>
                        <span style={{
                          minWidth: 20, height: 20, borderRadius: '50%',
                          background: 'var(--primary-subtle)',
                          color: 'var(--primary)',
                          fontSize: '11px', fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          {i + 1}
                        </span>
                        <p style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>{pt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FLASHCARDS */}
              {aiTab === 'flashcards' && flashcards.length > 0 && (
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)', marginBottom: '10px' }}>
                    Flashcards — click to flip
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {flashcards.map((card, i) => {
                      const flipped = !!flippedCards[i];
                      return (
                        <div
                          key={i}
                          onClick={() => setFlippedCards(p => ({ ...p, [i]: !p[i] }))}
                          style={{
                            height: 90,
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            background: flipped ? 'var(--primary-subtle)' : 'var(--bg-elevated)',
                            border: `1px solid ${flipped ? 'var(--border-strong)' : 'var(--border)'}`,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '10px',
                            transition: 'all 0.25s ease',
                            textAlign: 'center',
                          }}
                        >
                          <p style={{ fontSize: '10px', color: flipped ? 'var(--primary)' : 'var(--text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {flipped ? 'Answer' : 'Question'}
                          </p>
                          <p style={{ fontSize: '12px', color: flipped ? 'var(--primary-light)' : 'var(--text-primary)', lineHeight: 1.5 }}>
                            {flipped ? card.answer : card.question}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* QUIZ */}
              {aiTab === 'quiz' && quiz.length > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)' }}>
                      Quiz — {quiz.length} questions
                    </p>
                    {quizSubmitted && (
                      <button
                        onClick={() => { setQuizAnswers({}); setQuizSubmitted(false); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontSize: '11px' }}
                      >
                        <RotateCcw size={11} /> Retry
                      </button>
                    )}
                  </div>

                  {quizSubmitted && (
                    <div style={{
                      padding: '10px',
                      background: quizScore === quiz.length ? 'var(--green-subtle)' : 'var(--primary-subtle)',
                      border: `1px solid ${quizScore === quiz.length ? 'rgba(34,200,122,0.3)' : 'var(--border-strong)'}`,
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'center',
                      marginBottom: '12px',
                    }}>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: quizScore === quiz.length ? 'var(--green)' : 'var(--primary)' }}>
                        {quizScore}/{quiz.length}
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {quizScore === quiz.length ? '🎉 Perfect score!' : `${Math.round(quizScore / quiz.length * 100)}% correct`}
                      </p>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {quiz.map((q, qi) => (
                      <div key={qi} style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '10px',
                      }}>
                        <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.5 }}>
                          {qi + 1}. {q.question}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          {q.options.map((opt, oi) => {
                            const isSelected  = quizAnswers[qi] === oi;
                            const isCorrect   = oi === q.correct;
                            const showResult  = quizSubmitted;
                            let bg = 'transparent', borderColor = 'var(--border)', textColor = 'var(--text-secondary)';

                            if (showResult) {
                              if (isCorrect) { bg = 'var(--green-subtle)'; borderColor = 'var(--green)'; textColor = 'var(--green)'; }
                              else if (isSelected) { bg = 'var(--red-subtle)'; borderColor = 'var(--red)'; textColor = 'var(--red)'; }
                            } else if (isSelected) {
                              bg = 'var(--primary-subtle)'; borderColor = 'var(--primary)'; textColor = 'var(--primary)';
                            }

                            return (
                              <button
                                key={oi}
                                disabled={quizSubmitted}
                                onClick={() => setQuizAnswers(p => ({ ...p, [qi]: oi }))}
                                style={{
                                  padding: '7px 10px',
                                  borderRadius: 'var(--radius-sm)',
                                  background: bg,
                                  border: `1px solid ${borderColor}`,
                                  cursor: quizSubmitted ? 'default' : 'pointer',
                                  fontSize: '12px',
                                  color: textColor,
                                  textAlign: 'left',
                                  fontFamily: 'var(--font-body)',
                                  transition: 'all 0.15s',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                }}
                              >
                                <span style={{
                                  width: 16, height: 16, borderRadius: '50%',
                                  border: `1px solid ${borderColor}`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '10px', fontWeight: 700, flexShrink: 0,
                                }}>
                                  {showResult && isCorrect ? '✓' : showResult && isSelected ? '✗' : String.fromCharCode(65 + oi)}
                                </span>
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                        {quizSubmitted && q.explanation && (
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.5, borderTop: '1px solid var(--border)', paddingTop: '6px' }}>
                            💡 {q.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {!quizSubmitted && Object.keys(quizAnswers).length === quiz.length && (
                    <Button
                      variant="primary"
                      fullWidth
                      size="sm"
                      onClick={() => setQuizSubmitted(true)}
                      style={{ marginTop: '12px' }}
                    >
                      Submit Quiz
                    </Button>
                  )}
                </div>
              )}

              {/* Empty state for AI panel */}
              {!loading && !aiError &&
                ((aiTab === 'summary' && !summary) ||
                 (aiTab === 'keypoints' && keyPoints.length === 0) ||
                 (aiTab === 'flashcards' && flashcards.length === 0) ||
                 (aiTab === 'quiz' && quiz.length === 0)) && (
                  <div style={{ textAlign: 'center', padding: '30px 16px' }}>
                    <Sparkles size={28} style={{ color: 'var(--text-muted)', marginBottom: 10 }} />
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      Click a button above to let AI analyse your notes.
                    </p>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* ── NEW NOTE MODAL ── */}
      <Modal
        isOpen={newNoteModal}
        onClose={() => setNewNoteModal(false)}
        title="Create New Note"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setNewNoteModal(false)}>Cancel</Button>
            <Button variant="primary" icon={Plus} onClick={handleAddNote} disabled={!newForm.title.trim()}>
              Create Note
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <FormField label="Note Title" required>
            <Input
              value={newForm.title}
              onChange={e => setNewForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g., Chapter 5 — Graph Theory"
              autoFocus
            />
          </FormField>
          <FormField label="Link to Course (optional)">
            <Select value={newForm.courseId} onChange={e => setNewForm(p => ({ ...p, courseId: e.target.value }))}>
              <option value="">No course</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </Select>
          </FormField>
        </div>
      </Modal>
    </div>
  );
};

export default NotesAIPage;
