import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, X } from '@phosphor-icons/react';

export const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay to trigger animation
    const showTimer = setTimeout(() => setIsVisible(true), 10);
    
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for transition before removing
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle size={24} weight="fill" className="text-success" />,
    error: <XCircle size={24} weight="fill" className="text-danger" />,
    info: <Info size={24} weight="fill" className="text-brand" />
  };

  const colors = {
    success: 'rgba(16, 185, 129, 0.1)',
    error: 'rgba(239, 68, 68, 0.1)',
    info: 'rgba(59, 130, 246, 0.1)'
  };
  
  const borderColors = {
    success: 'var(--color-success)',
    error: 'var(--color-danger)',
    info: 'var(--color-brand)'
  };

  return (
    <div 
      className="card"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        minWidth: '280px',
        maxWidth: '400px',
        backgroundColor: 'var(--color-surface)',
        borderLeft: `4px solid ${borderColors[type]}`,
        boxShadow: 'var(--shadow-hover)',
        transform: isVisible ? 'translateX(0) scale(1)' : 'translateX(100%) scale(0.95)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
        pointerEvents: 'auto',
      }}
    >
      <div style={{ flexShrink: 0, display: 'flex' }}>
        {icons[type]}
      </div>
      
      <div style={{ flex: 1, fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text-main)' }}>
        {message}
      </div>

      <button 
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px',
          borderRadius: 'var(--radius-sm)'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <X size={16} weight="bold" />
      </button>
    </div>
  );
};
