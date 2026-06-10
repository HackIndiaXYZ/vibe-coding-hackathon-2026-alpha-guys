import React from 'react';

/**
 * Base Card component — the fundamental layout container used throughout the app.
 *
 * @param {'default'|'elevated'|'flat'|'glow'} variant
 * @param {boolean} hoverable   - Adds hover border/shadow effect
 * @param {string}  className
 */
export const Card = ({
  children,
  variant = 'default',
  hoverable = false,
  className = '',
  style = {},
  ...rest
}) => {
  const base = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-card)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  };

  const variants = {
    default:  {},
    elevated: { background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-md)' },
    flat:     { background: 'var(--bg-secondary)', border: 'none' },
    glow:     { boxShadow: 'var(--shadow-primary)', borderColor: 'var(--border-strong)' },
  };

  const hoverStyle = hoverable ? { cursor: 'pointer' } : {};

  return (
    <div
      className={className}
      style={{ ...base, ...variants[variant], ...hoverStyle, ...style }}
      onMouseEnter={hoverable ? (e) => {
        e.currentTarget.style.borderColor = 'var(--border-strong)';
        e.currentTarget.style.boxShadow = 'var(--shadow-primary)';
      } : undefined}
      onMouseLeave={hoverable ? (e) => {
        e.currentTarget.style.borderColor = 'var(--border-card)';
        e.currentTarget.style.boxShadow = '';
      } : undefined}
      {...rest}
    >
      {children}
    </div>
  );
};

/**
 * StatCard — KPI / metric display card used on the Dashboard.
 *
 * @param {string} title     - Metric label
 * @param {string|number} value   - Main displayed value
 * @param {React.ComponentType} icon  - Lucide icon component
 * @param {'primary'|'gold'|'purple'|'green'|'red'|'cyan'} color
 * @param {string} subtitle  - Optional secondary text below value
 * @param {string} trend     - Optional trend text like "+2 this week"
 */
export const StatCard = ({
  title,
  value,
  icon: Icon,
  color = 'primary',
  subtitle,
  trend,
  style = {},
}) => {
  // Map color names to CSS variable names
  const colorMap = {
    primary: { var: 'var(--primary)',  bg: 'var(--primary-subtle)' },
    gold:    { var: 'var(--gold)',     bg: 'var(--gold-subtle)' },
    purple:  { var: 'var(--purple)',   bg: 'var(--purple-subtle)' },
    green:   { var: 'var(--green)',    bg: 'var(--green-subtle)' },
    red:     { var: 'var(--red)',      bg: 'var(--red-subtle)' },
    cyan:    { var: 'var(--cyan)',     bg: 'var(--cyan-subtle)' },
    orange:  { var: 'var(--orange)',   bg: 'var(--orange-subtle)' },
  };

  const c = colorMap[color] || colorMap.primary;

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        ...style,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = c.var;
        e.currentTarget.style.boxShadow = `0 4px 20px ${c.bg}`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border-card)';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {/* Icon */}
      {Icon && (
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 'var(--radius-md)',
          background: c.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Icon size={18} style={{ color: c.var }} strokeWidth={2} />
        </div>
      )}

      {/* Value */}
      <div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '26px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          lineHeight: 1,
        }}>
          {value}
        </div>
        {subtitle && (
          <div style={{ fontSize: '12px', color: c.var, marginTop: '4px', fontWeight: 500 }}>
            {subtitle}
          </div>
        )}
      </div>

      {/* Label + trend */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{title}</span>
        {trend && (
          <span style={{
            fontSize: '11px',
            color: 'var(--green)',
            background: 'var(--green-subtle)',
            padding: '2px 7px',
            borderRadius: 'var(--radius-full)',
            fontWeight: 500,
          }}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * SectionHeader — Consistent page section title with optional action button.
 *
 * @param {string} title
 * @param {string} subtitle
 * @param {React.ReactNode} action - Right-aligned action element
 */
export const SectionHeader = ({ title, subtitle, action, style = {} }) => (
  <div style={{
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '16px',
    ...style,
  }}>
    <div>
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '16px',
        fontWeight: 600,
        color: 'var(--text-primary)',
        margin: 0,
      }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>
          {subtitle}
        </p>
      )}
    </div>
    {action && <div>{action}</div>}
  </div>
);

/**
 * EmptyState — Displayed when a list has no items.
 */
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 20px',
    textAlign: 'center',
    gap: '12px',
  }}>
    {Icon && (
      <div style={{
        width: 56,
        height: 56,
        borderRadius: 'var(--radius-xl)',
        background: 'var(--bg-elevated)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '4px',
      }}>
        <Icon size={24} style={{ color: 'var(--text-muted)' }} strokeWidth={1.5} />
      </div>
    )}
    <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>{title}</div>
    {description && (
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: 280 }}>
        {description}
      </div>
    )}
    {action && <div style={{ marginTop: '8px' }}>{action}</div>}
  </div>
);

export default Card;
