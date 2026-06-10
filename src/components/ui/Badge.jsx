import React from 'react';

/**
 * Badge / Pill component for status labels, priority indicators, and category tags.
 *
 * @param {'primary'|'success'|'warning'|'danger'|'info'|'purple'|'cyan'|'muted'|'gold'} variant
 * @param {'sm'|'md'} size
 * @param {boolean} dot  - Show a small colored dot before the label
 * @param {React.ComponentType} icon - Optional Lucide icon
 */
const Badge = ({
  children,
  variant = 'primary',
  size = 'md',
  dot = false,
  icon: Icon,
  style = {},
  ...rest
}) => {

  // Color system for each variant
  const variants = {
    primary:  { color: 'var(--primary)',  bg: 'var(--primary-subtle)',  border: 'rgba(91,159,255,0.25)' },
    success:  { color: 'var(--green)',    bg: 'var(--green-subtle)',    border: 'rgba(34,200,122,0.25)' },
    warning:  { color: 'var(--gold)',     bg: 'var(--gold-subtle)',     border: 'rgba(245,185,66,0.25)' },
    danger:   { color: 'var(--red)',      bg: 'var(--red-subtle)',      border: 'rgba(255,95,107,0.25)' },
    purple:   { color: 'var(--purple)',   bg: 'var(--purple-subtle)',   border: 'rgba(139,101,245,0.25)' },
    cyan:     { color: 'var(--cyan)',     bg: 'var(--cyan-subtle)',     border: 'rgba(34,211,238,0.25)' },
    orange:   { color: 'var(--orange)',   bg: 'var(--orange-subtle)',   border: 'rgba(255,140,66,0.25)' },
    gold:     { color: 'var(--gold)',     bg: 'var(--gold-subtle)',     border: 'rgba(245,185,66,0.25)' },
    muted:    { color: 'var(--text-muted)', bg: 'var(--bg-elevated)',  border: 'var(--border)' },
    info:     { color: 'var(--primary)',  bg: 'var(--primary-subtle)',  border: 'rgba(91,159,255,0.25)' },
  };

  const sizes = {
    xs: { fontSize: '10px', padding: '2px 7px',  gap: '4px', iconSize: 10, dotSize: 5 },
    sm: { fontSize: '11px', padding: '3px 8px',  gap: '4px', iconSize: 11, dotSize: 5 },
    md: { fontSize: '12px', padding: '4px 10px', gap: '5px', iconSize: 12, dotSize: 6 },
    lg: { fontSize: '13px', padding: '5px 12px', gap: '6px', iconSize: 13, dotSize: 6 },
  };

  const v = variants[variant] || variants.primary;
  const s = sizes[size] || sizes.md;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: s.gap,
        padding: s.padding,
        fontSize: s.fontSize,
        fontWeight: 500,
        lineHeight: 1,
        borderRadius: 'var(--radius-full)',
        color: v.color,
        background: v.bg,
        border: `1px solid ${v.border}`,
        whiteSpace: 'nowrap',
        fontFamily: 'var(--font-body)',
        ...style,
      }}
      {...rest}
    >
      {/* Dot indicator */}
      {dot && (
        <span style={{
          width: s.dotSize,
          height: s.dotSize,
          borderRadius: '50%',
          background: v.color,
          flexShrink: 0,
        }} />
      )}

      {/* Optional icon */}
      {Icon && <Icon size={s.iconSize} strokeWidth={2} />}

      {children}
    </span>
  );
};

/**
 * PriorityBadge — Convenience component for assignment priority display.
 */
export const PriorityBadge = ({ priority, size = 'sm' }) => {
  const map = {
    high:   { variant: 'danger',  label: 'High' },
    medium: { variant: 'warning', label: 'Medium' },
    low:    { variant: 'success', label: 'Low' },
  };
  const config = map[priority] || map.medium;
  return (
    <Badge variant={config.variant} size={size} dot>
      {config.label}
    </Badge>
  );
};

/**
 * StatusBadge — Convenience component for assignment/task status.
 */
export const StatusBadge = ({ status, size = 'sm' }) => {
  const map = {
    completed:   { variant: 'success', label: 'Done' },
    'in-progress': { variant: 'primary', label: 'In Progress' },
    pending:     { variant: 'warning', label: 'Pending' },
    overdue:     { variant: 'danger',  label: 'Overdue' },
  };
  const config = map[status] || map.pending;
  return (
    <Badge variant={config.variant} size={size} dot>
      {config.label}
    </Badge>
  );
};

export default Badge;
