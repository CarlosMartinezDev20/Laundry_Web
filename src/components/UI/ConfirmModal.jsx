import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Warning, X } from '@phosphor-icons/react';
import { Button } from './Button';

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  confirmVariant = 'danger',
}) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const iconBg = confirmVariant === 'danger'
    ? 'var(--color-danger-light)'
    : 'var(--color-brand-light)';
  const iconColor = confirmVariant === 'danger'
    ? 'var(--color-danger)'
    : 'var(--color-brand-text)';

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
      onClose();
    }
  };


  return createPortal(
    <div
      className="modal-backdrop"
      onClick={isLoading ? undefined : onClose}
    >
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: iconColor,
              flexShrink: 0,
            }}>
              <Warning size={20} weight="fill" />
            </div>
            <h3 style={{ fontSize: 'var(--font-size-base)', margin: 0 }}>{title}</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              background: 'none',
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              color: 'var(--color-text-subtle)',
              display: 'flex',
              padding: '2px',
              borderRadius: 'var(--radius-sm)',
              flexShrink: 0,
              opacity: isLoading ? 0.5 : 1,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <p style={{
          color: 'var(--color-text-muted)',
          fontSize: 'var(--font-size-sm)',
          lineHeight: 1.6,
        }}>
          {message}
        </p>

        {/* Actions */}
        <div className="divider" style={{ margin: 0 }} />
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button
            variant={confirmVariant}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing…' : confirmText}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};