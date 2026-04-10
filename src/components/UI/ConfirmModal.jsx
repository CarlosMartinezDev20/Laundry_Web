import React from 'react';
import { Warning, X } from '@phosphor-icons/react';
import { Button } from './Button';

export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', confirmVariant = 'danger' }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div 
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          transform: 'scale(1)',
          animation: 'fadeIn 0.2s ease-out forwards'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
             <div style={{
               width: '40px',
               height: '40px',
               borderRadius: '50%',
               backgroundColor: confirmVariant === 'danger' ? 'rgba(239, 68, 68, 0.1)' : 'var(--color-brand-light)',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               color: confirmVariant === 'danger' ? 'var(--color-danger)' : 'var(--color-brand)'
             }}>
               <Warning size={24} weight="fill" />
             </div>
             <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', color: 'var(--color-text-main)' }}>{title}</h3>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              padding: '0.25rem',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
          {message}
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button onClick={onClose}>
            Cancel
          </Button>
          <Button variant={confirmVariant} onClick={() => { onConfirm(); onClose(); }}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
