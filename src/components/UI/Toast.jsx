import React, { useEffect, useState, useRef, useCallback } from 'react';
import { CheckCircle, XCircle, Info, X } from '@phosphor-icons/react';

export const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onCloseRef.current(), 300);
  }, []);

  useEffect(() => {
    const showTimer = setTimeout(() => setIsVisible(true), 10);
    const hideTimer = setTimeout(() => handleClose(), duration);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [duration, handleClose]);

  const variants = {
    success: {
      icon: <CheckCircle size={20} weight="fill" />,
      title: 'Operacion exitosa',
      accent: 'var(--color-success)',
      toneClass: 'is-success',
    },
    error: {
      icon: <XCircle size={20} weight="fill" />,
      title: 'Ocurrio un error',
      accent: 'var(--color-danger)',
      toneClass: 'is-error',
    },
    info: {
      icon: <Info size={20} weight="fill" />,
      title: 'Informacion',
      accent: 'var(--color-brand)',
      toneClass: 'is-info',
    },
  };
  const variant = variants[type] || variants.info;

  return (
    <div
      className={`toast-card ${variant.toneClass} ${isVisible ? 'is-visible' : ''}`}
      style={{
        '--toast-accent': variant.accent,
        '--toast-duration': `${duration}ms`,
      }}
      role="status"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <div className="toast-icon-wrap" aria-hidden="true">
        {variant.icon}
      </div>

      <div className="toast-content">
        <p className="toast-title">{variant.title}</p>
        <p className="toast-message">{message}</p>
      </div>

      <button
        onClick={handleClose}
        className="toast-close-btn"
        aria-label="Cerrar notificacion"
      >
        <X size={16} weight="bold" />
      </button>

      <div className="toast-progress" aria-hidden="true" />
    </div>
  );
};