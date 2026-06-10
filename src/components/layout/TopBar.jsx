import React from 'react';
import { Menu, Bell, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getCurrentDate, getDaysUntil } from '../../utils/helpers';

/* ================================================================
   Smart Semester AI — Top Navigation Bar
   Fixed at the top of the content area. Shows page context,
   urgent notifications, and user avatar.
   ================================================================ */

const TopBar = ({ title, onMenuToggle }) => {
  const { profile, assignments } = useApp();

  // Count overdue assignments for notification badge
  const overdueCount = assignments.filter(
    a => a.status !== 'completed' && getDaysUntil(a.dueDate) < 0
  ).length;

  // Count due-today assignments
  const todayCount = assignments.filter(
    a => a.status !== 'completed' && getDaysUntil(a.dueDate) === 0
  ).length;

  const urgentCount = overdueCount + todayCount;

  // User initials for avatar
  const initials = profile.name
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <header
      style={{
        height: 'var(--topbar-height)',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: '16px',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Mobile hamburger (visible on small screens) */}
      <button
        onClick={onMenuToggle}
        style={{
          display: 'none',  /* shown via media query in CSS */
          alignItems: 'center',
          justifyContent: 'center',
          width: 34,
          height: 34,
          borderRadius: 'var(--radius-md)',
          background: 'transparent',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
        }}
      >
        <Menu size={18} />
      </button>

      {/* ── PAGE TITLE ── */}
      <div style={{ flex: 1 }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '16px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          margin: 0,
          lineHeight: 1.2,
        }}>
          {title}
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
          {getCurrentDate()}
        </p>
      </div>

      {/* ── RIGHT SIDE CONTROLS ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

        {/* Semester chip */}
        {profile.semester && (
          <div style={{
            padding: '4px 12px',
            background: 'var(--primary-subtle)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-full)',
            fontSize: '12px',
            fontWeight: 500,
            color: 'var(--primary)',
            whiteSpace: 'nowrap',
          }}>
            {profile.semester}
          </div>
        )}

        {/* Notification bell */}
        <div style={{ position: 'relative' }}>
          <button
            title={
              urgentCount > 0
                ? `${urgentCount} urgent item${urgentCount > 1 ? 's' : ''}`
                : 'No urgent items'
            }
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-md)',
              background: urgentCount > 0 ? 'var(--red-subtle)' : 'transparent',
              border: `1px solid ${urgentCount > 0 ? 'rgba(255,95,107,0.3)' : 'transparent'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: urgentCount > 0 ? 'var(--red)' : 'var(--text-secondary)',
              transition: 'all 0.18s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--bg-hover)';
              e.currentTarget.style.borderColor = 'var(--border-strong)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = urgentCount > 0 ? 'var(--red-subtle)' : 'transparent';
              e.currentTarget.style.borderColor = urgentCount > 0 ? 'rgba(255,95,107,0.3)' : 'transparent';
            }}
          >
            <Bell size={16} strokeWidth={1.8} />
          </button>

          {/* Red badge for urgent count */}
          {urgentCount > 0 && (
            <div style={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: 'var(--red)',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--bg-secondary)',
            }}>
              {urgentCount > 9 ? '9+' : urgentCount}
            </div>
          )}
        </div>

        {/* User avatar */}
        <div
          title={profile.name || 'Profile'}
          style={{
            width: 34,
            height: 34,
            borderRadius: 'var(--radius-full)',
            background: 'linear-gradient(135deg, var(--primary), var(--purple))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: 700,
            color: '#fff',
            cursor: 'default',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(91,159,255,0.30)',
            userSelect: 'none',
          }}
        >
          {initials}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
