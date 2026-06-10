import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Trash2, Sparkles, Brain, RefreshCw, Lightbulb, BookOpen, Target,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useClaudeAPI } from '../../hooks/useClaudeAPI';
import { buildAssistantSystemPrompt } from '../../utils/claudeApi';
import Button from '../ui/Button';

/* ================================================================
   Smart Semester AI — AI Study Assistant Page
   Full context-aware chat interface powered by Claude API.
   Conversation history persisted to localStorage.
   ================================================================ */

// Suggested quick prompts to help users get started
const QUICK_PROMPTS = [
  { icon: Target,    text: 'How can I improve my weakest course grade?' },
  { icon: BookOpen,  text: 'Explain dynamic programming with examples.' },
  { icon: Lightbulb, text: 'What study technique works best before an exam?' },
  { icon: Sparkles,  text: 'Create a study plan for my pending assignments.' },
];

const AIAssistantPage = () => {
  const { profile, courses, assignments, chatHistory, addChatMessage, clearChatHistory } = useApp();
  const { sendMessage, loading, error, clearError } = useClaudeAPI();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const textareaRef   = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading]);

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 140) + 'px';
    }
  }, [input]);

  // Build system prompt with full student context
  const systemPrompt = buildAssistantSystemPrompt(profile, courses, assignments);

  // ── SEND MESSAGE ──
  const handleSend = useCallback(async (messageText) => {
    const text = (messageText || input).trim();
    if (!text || loading) return;

    setInput('');

    // Add user message
    addChatMessage({ role: 'user', content: text });

    // Build messages array for API: convert stored history + new message
    const apiMessages = [
      ...chatHistory.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: text },
    ];

    try {
      const response = await sendMessage(apiMessages, systemPrompt, 1200);
      addChatMessage({ role: 'assistant', content: response });
    } catch (_) {
      // Error is shown via the error state from useClaudeAPI
      addChatMessage({
        role: 'assistant',
        content: '⚠️ I couldn\'t connect to the API. Please check your VITE_ANTHROPIC_API_KEY in your .env file and reload the page.',
      });
    }
  }, [input, loading, chatHistory, addChatMessage, sendMessage, systemPrompt]);

  // Send on Enter (Shift+Enter for newline)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="page-enter"
      style={{
        maxWidth: 860,
        margin: '0 auto',
        height: 'calc(100vh - var(--topbar-height) - 48px)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── HEADER ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--primary), var(--purple))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Brain size={18} style={{ color: '#fff' }} />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700 }}>
              AI Study Assistant
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Knows your {courses.length} courses & {assignments.filter(a => a.status !== 'completed').length} pending tasks
            </p>
          </div>
        </div>

        {chatHistory.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            onClick={clearChatHistory}
          >
            Clear chat
          </Button>
        )}
      </div>

      {/* ── MESSAGES AREA ── */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        marginBottom: '12px',
      }}>

        {/* Empty state + quick prompts */}
        {chatHistory.length === 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: '24px',
          }}>
            {/* AI avatar */}
            <div>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: 'var(--radius-xl)',
                background: 'linear-gradient(135deg, var(--primary), var(--purple))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                boxShadow: 'var(--shadow-primary)',
              }}>
                <Sparkles size={28} style={{ color: '#fff' }} />
              </div>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '18px',
                fontWeight: 600,
                textAlign: 'center',
                color: 'var(--text-primary)',
              }}>
                Hi {profile.name?.split(' ')[0] || 'there'}! How can I help?
              </h2>
              <p style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                textAlign: 'center',
                marginTop: '6px',
                maxWidth: 380,
              }}>
                I know your courses, grades, and assignments — ask me anything academic.
              </p>
            </div>

            {/* Quick prompt buttons */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px',
              width: '100%',
              maxWidth: 520,
            }}>
              {QUICK_PROMPTS.map(({ icon: Icon, text }) => (
                <button
                  key={text}
                  onClick={() => handleSend(text)}
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    textAlign: 'left',
                    transition: 'all 0.18s',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    fontFamily: 'var(--font-body)',
                    lineHeight: 1.4,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.background = 'var(--primary-subtle)';
                    e.currentTarget.style.color = 'var(--primary-light)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-strong)';
                    e.currentTarget.style.background = 'var(--bg-elevated)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  <Icon size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                  {text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat messages */}
        {chatHistory.map((msg, idx) => (
          <ChatMessage
            key={msg.id || idx}
            message={msg}
            profileName={profile.name}
            isLast={idx === chatHistory.length - 1}
          />
        ))}

        {/* Typing indicator (AI is responding) */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '16px' }}>
            <AIAvatar />
            <div style={{
              padding: '12px 16px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-lg)',
              borderBottomLeftRadius: 4,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div style={{
            padding: '10px 14px',
            background: 'var(--red-subtle)',
            border: '1px solid rgba(255,95,107,0.3)',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            color: 'var(--red)',
            marginTop: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
          }}>
            <span>⚠ {error}</span>
            <button
              onClick={clearError}
              style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '16px' }}
            >
              ×
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── INPUT AREA ── */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-lg)',
        padding: '12px',
        display: 'flex',
        gap: '10px',
        alignItems: 'flex-end',
        flexShrink: 0,
      }}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about any topic, concept, assignment… (Enter to send)"
          rows={1}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontSize: '14px',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
            lineHeight: 1.6,
            padding: '2px 4px',
            maxHeight: '140px',
            overflow: 'auto',
          }}
        />
        <Button
          variant="primary"
          size="sm"
          icon={Send}
          loading={loading}
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          style={{ flexShrink: 0, alignSelf: 'flex-end' }}
        >
          Send
        </Button>
      </div>

      <p style={{
        fontSize: '11px',
        color: 'var(--text-muted)',
        textAlign: 'center',
        marginTop: '8px',
        flexShrink: 0,
      }}>
        Powered by Claude Sonnet · Context-aware · Shift+Enter for new line
      </p>
    </div>
  );
};

/* ── CHAT MESSAGE COMPONENT ── */
const ChatMessage = ({ message, profileName, isLast }) => {
  const isUser = message.role === 'user';

  return (
    <div style={{
      display: 'flex',
      flexDirection: isUser ? 'row-reverse' : 'row',
      alignItems: 'flex-start',
      gap: '10px',
      marginTop: '16px',
      animation: isLast ? 'fadeIn 0.3s ease forwards' : 'none',
    }}>
      {/* Avatar */}
      {isUser ? <UserAvatar name={profileName} /> : <AIAvatar />}

      {/* Bubble */}
      <div
        className={`message-bubble ${isUser ? 'user' : 'assistant'}`}
        style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
      >
        {message.content}
      </div>
    </div>
  );
};

const AIAvatar = () => (
  <div style={{
    width: 30,
    height: 30,
    borderRadius: 'var(--radius-md)',
    background: 'linear-gradient(135deg, var(--primary), var(--purple))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }}>
    <Sparkles size={13} style={{ color: '#fff' }} />
  </div>
);

const UserAvatar = ({ name }) => (
  <div style={{
    width: 30,
    height: 30,
    borderRadius: 'var(--radius-full)',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-strong)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 700,
    color: 'var(--primary)',
    flexShrink: 0,
  }}>
    {name ? name.charAt(0).toUpperCase() : 'U'}
  </div>
);

export default AIAssistantPage;
