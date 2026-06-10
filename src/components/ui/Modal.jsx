import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Modal component with animated backdrop and keyboard accessibility.
 *
 * @param {boolean} isOpen          - Controls visibility
 * @param {Function} onClose        - Called when backdrop or X is clicked
 * @param {string} title            - Modal header title
 * @param {React.ReactNode} children
 * @param {React.ReactNode} footer  - Optional footer area (buttons, etc.)
 * @param {'sm'|'md'|'lg'|'xl'} size
 * @param {boolean} closeOnBackdrop - Whether clicking backdrop closes modal (default true)
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
}) => {

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  // ── SIZE VARIANTS ──
  const sizeMap = {
    sm:  480,
    md:  580,
    lg:  700,
    xl:  860,
    '2xl': 1000,
  };
  const maxWidth = sizeMap[size] || 580;

  return (
    <div
      className="modal-backdrop"
      onClick={closeOnBackdrop ? (e) => {
        // Only close if clicking the backdrop itself
        if (e.target === e.currentTarget) onClose?.();
      } : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="modal-content"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          width: '100%',
          maxWidth: `${maxWidth}px`,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          margin: '0 16px',
        }}
      >
        {/* ── HEADER ── */}
        {title && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}>
            <h3
              id="modal-title"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              {title}
            </h3>

            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Close modal"
              style={{
                width: 30,
                height: 30,
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                border: 'none',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--red-subtle)';
                e.currentTarget.style.color = 'var(--red)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ── BODY ── */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px',
        }}>
          {children}
        </div>

        {/* ── FOOTER ── */}
        {footer && (
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
            flexShrink: 0,
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
