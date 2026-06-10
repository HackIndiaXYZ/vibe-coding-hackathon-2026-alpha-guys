import React, { useState } from 'react';
import {
  LayoutDashboard, BookOpen, CheckSquare, MessageSquare,
  Calendar, FileText, BarChart3, Settings, GraduationCap,
  ChevronLeft, ChevronRight, Users, Sparkles, Brain,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calculateGPA } from '../../utils/helpers';

/* ================================================================
   Smart Semester AI — Sidebar Navigation
   Collapsible sidebar with icon-only mode.
   ================================================================ */

// Full nav item list — order matters (top to bottom in sidebar)
const NAV_ITEMS = [
  { id: 'dashboard',   label: 'Dashboard',      icon: LayoutDashboard, group: 'main' },
  { id: 'courses',     label: 'Courses',         icon: BookOpen,        group: 'main' },
  { id: 'assignments', label: 'Assignments',     icon: CheckSquare,     group: 'main' },
  { id: 'attendance',  label: 'Attendance',      icon: Users,           group: 'main' },
  { id: 'assistant',   label: 'AI Assistant',    icon: Brain,           group: 'ai' },
  { id: 'planner',     label: 'Study Planner',   icon: Calendar,        group: 'ai' },
  { id: 'notes',       label: 'Notes & Quiz',    icon: FileText,        group: 'ai' },
  { id: 'analytics',   label: 'Analytics',       icon: BarChart3,       group: 'insights' },
  { id: 'settings',    label: 'Settings',        icon: Settings,        group: 'settings' },
];

const GROUP_LABELS = {
  main:     'Academic',
  ai:       'AI Tools',
  insights: 'Insights',
  settings: null, // no label for settings
};

const Sidebar = ({ currentPage, onNavigate }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { profile, courses, gpa } = useApp();

  const width = collapsed ? 68 : 240;

  // Group items by their group key
  const groups = NAV_ITEMS.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  // Separate the settings item (always at the bottom)
  const mainGroups = ['main', 'ai', 'insights'];

  return (
    <aside
      style={{
        width,
        minWidth: width,
        height: '100vh',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 100,
      }}
    >
      {/* ── LOGO HEADER ── */}
      <div style={{
        height: 'var(--topbar-height)',
        display: 'flex',
        alignItems: 'center',
        padding: collapsed ? '0 16px' : '0 18px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        gap: 10,
        overflow: 'hidden',
      }}>
        {/* Logo icon */}
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, var(--primary), var(--purple))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: 'var(--shadow-primary)',
        }}>
          <GraduationCap size={17} style={{ color: '#fff' }} strokeWidth={2.2} />
        </div>

        {/* Logo text — hidden when collapsed */}
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              lineHeight: 1.2,
            }}>
              Smart Semester
            </div>
            <div style={{
              fontSize: '10px',
              color: 'var(--primary)',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              <Sparkles size={9} />
              AI-Powered
            </div>
          </div>
        )}
      </div>

      {/* ── NAVIGATION GROUPS ── */}
      <nav style={{
        flex: 1,
        overflow: 'auto',
        padding: '12px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }}>
        {mainGroups.map(groupKey => {
          const items = groups[groupKey];
          if (!items) return null;
          const groupLabel = GROUP_LABELS[groupKey];

          return (
            <div key={groupKey} style={{ marginBottom: '8px' }}>
              {/* Group label — hidden when collapsed */}
              {groupLabel && !collapsed && (
                <div style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-muted)',
                  padding: '8px 10px 4px',
                }}>
                  {groupLabel}
                </div>
              )}
              {collapsed && groupLabel && (
                <div style={{
                  height: 1,
                  background: 'var(--border)',
                  margin: '6px 4px',
                }} />
              )}

              {items.map(item => (
                <NavItem
                  key={item.id}
                  item={item}
                  isActive={currentPage === item.id}
                  collapsed={collapsed}
                  onClick={() => onNavigate(item.id)}
                />
              ))}
            </div>
          );
        })}

        {/* Settings at the very bottom of the scroll area */}
        <div style={{ marginTop: 'auto' }}>
          {(groups.settings || []).map(item => (
            <NavItem
              key={item.id}
              item={item}
              isActive={currentPage === item.id}
              collapsed={collapsed}
              onClick={() => onNavigate(item.id)}
            />
          ))}
        </div>
      </nav>

      {/* ── USER PROFILE CHIP ── */}
      {!collapsed && (
        <div style={{
          padding: '12px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexShrink: 0,
        }}>
          {/* Avatar */}
          <div style={{
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
            flexShrink: 0,
          }}>
            {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
          </div>

          {/* Name + GPA */}
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {profile.name || 'Set your name'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              GPA: <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                {gpa.toFixed(2)}
              </span>
              &nbsp;/ {profile.gpaGoal}
            </div>
          </div>
        </div>
      )}

      {/* ── COLLAPSE TOGGLE BUTTON ── */}
      <button
        onClick={() => setCollapsed(c => !c)}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          position: 'absolute',
          top: '18px',
          right: collapsed ? '-14px' : '-14px',
          width: 26,
          height: 26,
          borderRadius: 'var(--radius-full)',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-strong)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          zIndex: 101,
          transition: 'all 0.2s ease',
          boxShadow: 'var(--shadow-sm)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'var(--primary)';
          e.currentTarget.style.color = '#fff';
          e.currentTarget.style.borderColor = 'var(--primary)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'var(--bg-elevated)';
          e.currentTarget.style.color = 'var(--text-secondary)';
          e.currentTarget.style.borderColor = 'var(--border-strong)';
        }}
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>
    </aside>
  );
};

/* ── NAV ITEM SUB-COMPONENT ── */
const NavItem = ({ item, isActive, collapsed, onClick }) => {
  const { icon: Icon, label } = item;

  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: collapsed ? '9px 0' : '9px 12px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderRadius: 'var(--radius-md)',
        background: isActive ? 'var(--primary-subtle)' : 'transparent',
        color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
        border: isActive ? '1px solid var(--border-strong)' : '1px solid transparent',
        cursor: 'pointer',
        fontFamily: 'var(--font-body)',
        fontSize: '13.5px',
        fontWeight: isActive ? 600 : 400,
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        if (!isActive) {
          e.currentTarget.style.background = 'var(--bg-hover)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }
      }}
    >
      <Icon
        size={17}
        strokeWidth={isActive ? 2.2 : 1.8}
        style={{ flexShrink: 0 }}
      />
      {!collapsed && (
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {label}
        </span>
      )}

      {/* Active indicator dot */}
      {isActive && collapsed && (
        <div style={{
          position: 'absolute',
          right: 0,
          width: 3,
          height: 18,
          background: 'var(--primary)',
          borderRadius: 'var(--radius-full) 0 0 var(--radius-full)',
        }} />
      )}
    </button>
  );
};

export default Sidebar;
