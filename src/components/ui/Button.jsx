import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Button component with multiple visual variants and sizes.
 *
 * @param {'primary'|'secondary'|'ghost'|'danger'|'gold'|'outline'} variant
 * @param {'sm'|'md'|'lg'} size
 * @param {boolean} loading   - Shows a spinner and disables the button
 * @param {boolean} fullWidth - Stretches to 100% container width
 * @param {React.ReactNode} icon - Optional icon rendered before children
 * @param {React.ReactNode} iconRight - Optional icon rendered after children
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon: Icon,
  iconRight: IconRight,
  disabled,
  style,
  ...rest
}) => {

  // ── VARIANT STYLES ──
  const variants = {
    primary: {
      background: 'var(--primary)',
      color: '#060A18',
      border: 'none',
      fontWeight: 600,
    },
    secondary: {
      background: 'var(--bg-elevated)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-strong)',
      fontWeight: 500,
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid transparent',
      fontWeight: 500,
    },
    danger: {
      background: 'var(--red-subtle)',
      color: 'var(--red)',
      border: '1px solid rgba(255, 95, 107, 0.3)',
      fontWeight: 500,
    },
    gold: {
      background: 'var(--gold)',
      color: '#060A18',
      border: 'none',
      fontWeight: 600,
    },
    outline: {
      background: 'transparent',
      color: 'var(--primary)',
      border: '1px solid var(--primary)',
      fontWeight: 500,
    },
    success: {
      background: 'var(--green-subtle)',
      color: 'var(--green)',
      border: '1px solid rgba(34, 200, 122, 0.3)',
      fontWeight: 500,
    },
    purple: {
      background: 'var(--purple-subtle)',
      color: 'var(--purple)',
      border: '1px solid rgba(139, 101, 245, 0.3)',
      fontWeight: 500,
    },
  };

  // ── SIZE STYLES ──
  const sizes = {
    xs: { padding: '4px 10px',  fontSize: '12px', height: '28px', gap: '5px',  iconSize: 13 },
    sm: { padding: '6px 12px',  fontSize: '13px', height: '32px', gap: '6px',  iconSize: 14 },
    md: { padding: '9px 16px',  fontSize: '14px', height: '38px', gap: '8px',  iconSize: 15 },
    lg: { padding: '11px 22px', fontSize: '15px', height: '44px', gap: '9px',  iconSize: 16 },
  };

  const v = variants[variant] || variants.primary;
  const s = sizes[size] || sizes.md;
  const isDisabled = disabled || loading;

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.gap,
    padding: s.padding,
    height: s.height,
    fontSize: s.fontSize,
    borderRadius: 'var(--radius-md)',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    fontFamily: 'var(--font-body)',
    lineHeight: 1,
    transition: 'all 0.18s ease',
    whiteSpace: 'nowrap',
    width: fullWidth ? '100%' : undefined,
    opacity: isDisabled ? 0.55 : 1,
    userSelect: 'none',
    ...v,
    ...style,
  };

  return (
    <button
      disabled={isDisabled}
      style={baseStyle}
      onMouseEnter={e => {
        if (!isDisabled) {
          e.currentTarget.style.filter = 'brightness(1.12)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.filter = '';
        e.currentTarget.style.transform = '';
      }}
      onMouseDown={e => {
        if (!isDisabled) e.currentTarget.style.transform = 'translateY(0px) scale(0.97)';
      }}
      onMouseUp={e => {
        if (!isDisabled) e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      {...rest}
    >
      {/* Loading spinner replaces left icon */}
      {loading
        ? <Loader2 size={s.iconSize} className="animate-spin" />
        : Icon && <Icon size={s.iconSize} strokeWidth={2} />
      }

      {/* Button label */}
      {children}

      {/* Right-side icon */}
      {!loading && IconRight && <IconRight size={s.iconSize} strokeWidth={2} />}
    </button>
  );
};

export default Button;
