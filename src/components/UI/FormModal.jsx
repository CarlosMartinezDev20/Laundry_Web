import React from 'react';
import { createPortal } from 'react-dom';
import { X } from '@phosphor-icons/react';
import { Button } from './Button';
import { useModalFrame } from '../../hooks/useModalFrame';

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
  const { mounted, closing, finishClosing } = useModalFrame(isOpen, {
    onClose,
    closeDisabled: isSubmitting,
  });

  if (!mounted) return null;

  const handleBoxAnimationEnd = (e) => {
    if (e.target !== e.currentTarget) return;
    if (closing) finishClosing();
  };

  return createPortal(
    <div
      className="modal-backdrop"
      data-phase={closing ? 'closing' : 'open'}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="modal-box"
        data-phase={closing ? 'closing' : 'open'}
        onClick={(e) => e.stopPropagation()}
        onAnimationEnd={handleBoxAnimationEnd}
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-modal-title"
        style={{ maxWidth: width, maxHeight: '90dvh', padding: 0, gap: 0 }}
      >
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
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close"
            className="icon-btn"
            style={{ border: 'none', background: 'none', flexShrink: 0, marginTop: '2px' }}
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
        >
          <div className="modal-body-scroll" style={{
            padding: 'var(--spacing-6)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-4)',
            overflowY: 'auto',
            flex: 1,
          }}>
            {children}
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 'var(--spacing-2)',
            padding: 'var(--spacing-4) var(--spacing-6)',
            borderTop: '1px solid var(--color-border)',
            flexShrink: 0,
          }}>
            <Button type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
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
