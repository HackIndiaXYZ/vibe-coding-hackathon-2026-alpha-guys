import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { COURSE_COLORS } from '../../utils/helpers';

/* ================================================================
   Smart Semester AI — Form Input Components
   All form elements styled consistently with the dark theme.
   ================================================================ */

/**
 * FormField — wraps any input with a label, helper text, and error message.
 */
export const FormField = ({ label, htmlFor, error, hint, required, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
    {label && (
      <label
        htmlFor={htmlFor}
        style={{
          fontSize: '13px',
          fontWeight: 500,
          color: error ? 'var(--red)' : 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        {label}
        {required && <span style={{ color: 'var(--red)', fontSize: '12px' }}>*</span>}
      </label>
    )}

    {children}

    {/* Error message */}
    {error && (
      <span style={{
        fontSize: '12px',
        color: 'var(--red)',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      }}>
        <AlertCircle size={12} />
        {error}
      </span>
    )}

    {/* Hint text */}
    {hint && !error && (
      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{hint}</span>
    )}
  </div>
);

/**
 * Input — styled text input supporting all HTML input types.
 *
 * @param {React.ComponentType} icon - Optional left icon
 * @param {string} error             - Error message; turns border red
 */
export const Input = ({
  icon: Icon,
  error,
  style = {},
  type = 'text',
  ...rest
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Left icon */}
      {Icon && (
        <div style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          pointerEvents: 'none',
          zIndex: 1,
        }}>
          <Icon size={15} strokeWidth={1.8} />
        </div>
      )}

      <input
        type={inputType}
        style={{
          width: '100%',
          background: 'var(--bg-secondary)',
          border: `1px solid ${error ? 'var(--red)' : 'var(--border-strong)'}`,
          borderRadius: 'var(--radius-md)',
          padding: Icon ? '10px 14px 10px 38px' : '10px 14px',
          paddingRight: isPassword ? '40px' : '14px',
          fontSize: '14px',
          color: 'var(--text-primary)',
          outline: 'none',
          transition: 'border-color 0.18s, box-shadow 0.18s',
          fontFamily: 'var(--font-body)',
          boxSizing: 'border-box',
          ...style,
        }}
        onFocus={e => {
          e.target.style.borderColor = error ? 'var(--red)' : 'var(--primary)';
          e.target.style.boxShadow = error
            ? '0 0 0 3px rgba(255,95,107,0.15)'
            : '0 0 0 3px var(--primary-glow)';
        }}
        onBlur={e => {
          e.target.style.borderColor = error ? 'var(--red)' : 'var(--border-strong)';
          e.target.style.boxShadow = 'none';
        }}
        {...rest}
      />

      {/* Show/hide password toggle */}
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(p => !p)}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: 0,
          }}
        >
          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      )}
    </div>
  );
};

/**
 * Textarea — multi-line text input with auto-resizing option.
 */
export const Textarea = ({
  error,
  rows = 4,
  style = {},
  ...rest
}) => (
  <textarea
    rows={rows}
    style={{
      width: '100%',
      background: 'var(--bg-secondary)',
      border: `1px solid ${error ? 'var(--red)' : 'var(--border-strong)'}`,
      borderRadius: 'var(--radius-md)',
      padding: '10px 14px',
      fontSize: '14px',
      color: 'var(--text-primary)',
      outline: 'none',
      resize: 'vertical',
      transition: 'border-color 0.18s, box-shadow 0.18s',
      fontFamily: 'var(--font-body)',
      lineHeight: 1.6,
      boxSizing: 'border-box',
      ...style,
    }}
    onFocus={e => {
      e.target.style.borderColor = 'var(--primary)';
      e.target.style.boxShadow = '0 0 0 3px var(--primary-glow)';
    }}
    onBlur={e => {
      e.target.style.borderColor = error ? 'var(--red)' : 'var(--border-strong)';
      e.target.style.boxShadow = 'none';
    }}
    {...rest}
  />
);

/**
 * Select — styled dropdown select input.
 */
export const Select = ({ error, children, style = {}, ...rest }) => (
  <select
    style={{
      width: '100%',
      background: 'var(--bg-secondary)',
      border: `1px solid ${error ? 'var(--red)' : 'var(--border-strong)'}`,
      borderRadius: 'var(--radius-md)',
      padding: '10px 14px',
      fontSize: '14px',
      color: 'var(--text-primary)',
      outline: 'none',
      cursor: 'pointer',
      transition: 'border-color 0.18s, box-shadow 0.18s',
      fontFamily: 'var(--font-body)',
      appearance: 'none',
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237A95BE' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 12px center',
      paddingRight: '36px',
      boxSizing: 'border-box',
      ...style,
    }}
    onFocus={e => {
      e.target.style.borderColor = 'var(--primary)';
      e.target.style.boxShadow = '0 0 0 3px var(--primary-glow)';
    }}
    onBlur={e => {
      e.target.style.borderColor = error ? 'var(--red)' : 'var(--border-strong)';
      e.target.style.boxShadow = 'none';
    }}
    {...rest}
  >
    {children}
  </select>
);

/**
 * ColorPicker — visual color swatch selector for course color assignment.
 *
 * @param {string}   value    - Currently selected hex color
 * @param {Function} onChange - Called with the new hex color string
 */
export const ColorPicker = ({ value, onChange }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
    {COURSE_COLORS.map((color) => (
      <button
        key={color}
        type="button"
        onClick={() => onChange(color)}
        title={color}
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: color,
          border: value === color
            ? `2px solid var(--text-primary)`
            : '2px solid transparent',
          cursor: 'pointer',
          transition: 'transform 0.15s, border-color 0.15s',
          outline: value === color ? `2px solid ${color}` : 'none',
          outlineOffset: '2px',
          transform: value === color ? 'scale(1.15)' : 'scale(1)',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.2)'; }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = value === color ? 'scale(1.15)' : 'scale(1)';
        }}
      />
    ))}
  </div>
);

/**
 * RangeInput — styled number slider (e.g., for GPA goal, estimated hours).
 */
export const RangeInput = ({ min, max, step = 0.1, value, onChange, label, style = {} }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      {label && <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{label}</span>}
      <span style={{
        fontSize: '13px',
        fontWeight: 600,
        color: 'var(--primary)',
        fontFamily: 'var(--font-mono)',
      }}>
        {value}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={onChange}
      style={{
        width: '100%',
        accentColor: 'var(--primary)',
        cursor: 'pointer',
        ...style,
      }}
    />
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{min}</span>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{max}</span>
    </div>
  </div>
);

export default Input;
