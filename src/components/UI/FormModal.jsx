import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from '@phosphor-icons/react';
import { Button } from './Button';

/**
 * FormModal — modal container for edit/create forms.
 */
export const FormModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  onSubmit,
  submitText = 'Save changes',
  isSubmitting = false,
  children,
  width = '480px',
}) => {
  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;


  return createPortal(
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-modal-title"
    >
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: width, maxHeight: '90dvh', padding: 0, gap: 0 }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 'var(--spacing-4)',
          padding: 'var(--spacing-5) var(--spacing-6)',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}>
          <div>
            <h3
              id="form-modal-title"
              style={{ margin: 0, fontSize: 'var(--font-size-base)', fontWeight: 600 }}
            >
              {title}
            </h3>
            {subtitle && (
              <p style={{
                margin: '4px 0 0',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-muted)',
              }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="icon-btn"
            style={{ border: 'none', background: 'none', flexShrink: 0, marginTop: '2px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body + Form */}
        <form
          onSubmit={onSubmit}
          style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
        >
          <div style={{
            padding: 'var(--spacing-6)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-4)',
            overflowY: 'auto',
            flex: 1,
          }}>
            {children}
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 'var(--spacing-2)',
            padding: 'var(--spacing-4) var(--spacing-6)',
            borderTop: '1px solid var(--color-border)',
            flexShrink: 0,
          }}>
            <Button type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : submitText}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};