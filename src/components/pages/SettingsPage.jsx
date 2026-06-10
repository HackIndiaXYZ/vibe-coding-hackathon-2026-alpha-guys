import React, { useState } from 'react';
import {
  User, Key, Trash2, RotateCcw, Info,
  Save, AlertTriangle, Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { FormField, Input, Select, RangeInput } from '../ui/Input';
import Badge from '../ui/Badge';

/* ================================================================
   Smart Semester AI — Settings Page
   Profile configuration, API key management, and data controls.
   ================================================================ */

const SettingsPage = () => {
  const { profile, setProfile, resetAllData, clearUserData } = useApp();

  // Profile form state (local until saved)
  const [form, setForm] = useState({ ...profile });
  const [saved, setSaved] = useState(false);

  // API key
  const [apiKey,       setApiKey]       = useState(import.meta.env.VITE_ANTHROPIC_API_KEY || '');
  const [showKey,      setShowKey]      = useState(false);

  // Modals
  const [resetModal,   setResetModal]   = useState(false);
  const [clearModal,   setClearModal]   = useState(false);

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Save profile
  const handleSave = () => {
    setProfile({ ...form });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const isDirty = JSON.stringify(form) !== JSON.stringify(profile);

  return (
    <div className="page-enter" style={{ maxWidth: 720, margin: '0 auto' }}>

      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)',
        marginBottom: '24px',
      }}>
        Settings
      </h1>

      {/* ── SECTION: PROFILE ── */}
      <SettingsSection
        icon={User}
        title="Academic Profile"
        description="Your name, major, and semester details used throughout the app."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField label="Full Name" required>
            <Input
              value={form.name}
              onChange={e => update('name', e.target.value)}
              placeholder="Your full name"
            />
          </FormField>

          <FormField label="Major / Field of Study">
            <Input
              value={form.major}
              onChange={e => update('major', e.target.value)}
              placeholder="e.g., Computer Science"
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <FormField label="Academic Year">
              <Select value={form.year} onChange={e => update('year', e.target.value)}>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
                <option value="5">Graduate</option>
              </Select>
            </FormField>
            <FormField label="Current Semester">
              <Input
                value={form.semester}
                onChange={e => update('semester', e.target.value)}
                placeholder="e.g., Spring 2026"
              />
            </FormField>
          </div>

          <FormField label="GPA Goal">
            <RangeInput
              min={2.0} max={4.0} step={0.1}
              value={form.gpaGoal}
              onChange={e => update('gpaGoal', parseFloat(e.target.value))}
              label="Target GPA"
            />
          </FormField>

          <Button
            variant={saved ? 'success' : 'primary'}
            icon={saved ? Check : Save}
            onClick={handleSave}
            disabled={!isDirty && !saved}
          >
            {saved ? 'Saved!' : 'Save Profile'}
          </Button>
        </div>
      </SettingsSection>

      {/* ── SECTION: API KEY ── */}
      <SettingsSection
        icon={Key}
        title="Claude API Key"
        description="Required for AI features: Assistant, Study Planner, Notes AI, and Dashboard Insights."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Status banner */}
          <div style={{
            padding: '10px 14px',
            background: apiKey && apiKey !== 'sk-ant-your-api-key-here'
              ? 'var(--green-subtle)' : 'var(--gold-subtle)',
            border: `1px solid ${apiKey && apiKey !== 'sk-ant-your-api-key-here'
              ? 'rgba(34,200,122,0.3)' : 'rgba(245,185,66,0.3)'}`,
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            color: apiKey && apiKey !== 'sk-ant-your-api-key-here'
              ? 'var(--green)' : 'var(--gold)',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            {apiKey && apiKey !== 'sk-ant-your-api-key-here'
              ? <><Check size={14} /> API key configured — AI features active</>
              : <><AlertTriangle size={14} /> No API key — AI features disabled</>}
          </div>

          <div style={{
            padding: '14px 16px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
          }}>
            <p style={{ marginBottom: '6px' }}>
              <strong style={{ color: 'var(--text-primary)' }}>How to set your API key:</strong>
            </p>
            <ol style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>Get a free key at <a href="https://console.anthropic.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>console.anthropic.com</a></li>
              <li>Copy the file <code style={{ background: 'var(--bg-card)', padding: '1px 5px', borderRadius: 4, fontSize: '12px' }}>.env.example</code> to <code style={{ background: 'var(--bg-card)', padding: '1px 5px', borderRadius: 4, fontSize: '12px' }}>.env</code></li>
              <li>Paste your key after <code style={{ background: 'var(--bg-card)', padding: '1px 5px', borderRadius: 4, fontSize: '12px' }}>VITE_ANTHROPIC_API_KEY=</code></li>
              <li>Restart the dev server (<code style={{ background: 'var(--bg-card)', padding: '1px 5px', borderRadius: 4, fontSize: '12px' }}>npm run dev</code>)</li>
            </ol>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              readOnly
              placeholder="sk-ant-..."
              style={{
                flex: 1, background: 'var(--bg-secondary)',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-md)', padding: '9px 12px',
                fontSize: '13px', color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)', outline: 'none',
              }}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowKey(p => !p)}
            >
              {showKey ? 'Hide' : 'Show'}
            </Button>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            🔒 Your key is stored in the .env file and never sent to any third-party server — only directly to Anthropic's API.
          </p>
        </div>
      </SettingsSection>

      {/* ── SECTION: DATA MANAGEMENT ── */}
      <SettingsSection
        icon={Trash2}
        title="Data Management"
        description="Manage your locally stored academic data."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            {
              label:       'Clear All My Data',
              description: 'Deletes courses, assignments, notes, attendance, and chat history. Keeps your profile.',
              variant:     'secondary',
              icon:        Trash2,
              action:      () => setClearModal(true),
            },
            {
              label:       'Full Reset to Demo Data',
              description: 'Resets everything to the default sample data. Useful for a fresh start.',
              variant:     'danger',
              icon:        RotateCcw,
              action:      () => setResetModal(true),
            },
          ].map(item => (
            <div key={item.label} style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '14px 16px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
            }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{item.label}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 2 }}>{item.description}</p>
              </div>
              <Button variant={item.variant} size="sm" icon={item.icon} onClick={item.action}>
                {item.label.split(' ')[0]}
              </Button>
            </div>
          ))}
        </div>
      </SettingsSection>

      {/* ── SECTION: ABOUT ── */}
      <SettingsSection
        icon={Info}
        title="About Smart Semester AI"
        description="Open-source · Built for HackIndia Vibe Coding Hackathon 2026"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            ['Version',     '1.0.0'],
            ['Framework',   'React 18 + Vite'],
            ['AI Model',    'Claude Sonnet 4'],
            ['Storage',     'localStorage (offline, private)'],
            ['Charts',      'Recharts'],
            ['Icons',       'Lucide React'],
            ['License',     'MIT'],
          ].map(([key, val]) => (
            <div key={key} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: '1px solid var(--border)',
              fontSize: '13px',
            }}>
              <span style={{ color: 'var(--text-secondary)' }}>{key}</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{val}</span>
            </div>
          ))}
        </div>
      </SettingsSection>

      {/* ── CLEAR DATA MODAL ── */}
      <Modal
        isOpen={clearModal}
        onClose={() => setClearModal(false)}
        title="Clear All Data?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setClearModal(false)}>Cancel</Button>
            <Button variant="danger" icon={Trash2} onClick={() => { clearUserData(); setClearModal(false); }}>
              Yes, Clear Data
            </Button>
          </>
        }
      >
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          This will permanently delete all your <strong style={{ color: 'var(--text-primary)' }}>courses, assignments, notes, attendance records, and chat history</strong>. Your profile settings will be preserved.
        </p>
        <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--red)', fontWeight: 500 }}>
          This action cannot be undone.
        </p>
      </Modal>

      {/* ── RESET MODAL ── */}
      <Modal
        isOpen={resetModal}
        onClose={() => setResetModal(false)}
        title="Reset to Demo Data?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setResetModal(false)}>Cancel</Button>
            <Button variant="danger" icon={RotateCcw} onClick={() => { resetAllData(); setResetModal(false); }}>
              Yes, Reset Everything
            </Button>
          </>
        }
      >
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          This will replace <strong style={{ color: 'var(--text-primary)' }}>all your data</strong> with the original demo sample data, including courses, assignments, and profile settings.
        </p>
        <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--red)', fontWeight: 500 }}>
          Everything you've added will be permanently deleted.
        </p>
      </Modal>
    </div>
  );
};

/* ── SETTINGS SECTION WRAPPER ── */
const SettingsSection = ({ icon: Icon, title, description, children }) => (
  <div style={{
    background: 'var(--bg-card)',
    border: '1px solid var(--border-card)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    marginBottom: '20px',
  }}>
    {/* Section header */}
    <div style={{
      padding: '16px 20px',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', gap: '12px',
    }}>
      <div style={{
        width: 34, height: 34,
        borderRadius: 'var(--radius-md)',
        background: 'var(--primary-subtle)',
        border: '1px solid var(--border-strong)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={16} style={{ color: 'var(--primary)' }} />
      </div>
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
          {title}
        </h2>
        {description && (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 2 }}>{description}</p>
        )}
      </div>
    </div>

    {/* Section body */}
    <div style={{ padding: '20px' }}>
      {children}
    </div>
  </div>
);

export default SettingsPage;
