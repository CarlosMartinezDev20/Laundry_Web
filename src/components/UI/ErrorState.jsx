import React from 'react';
import { Button } from './Button';
import { ArrowsClockwise, CloudWarning } from '@phosphor-icons/react';

/**
 * Minimal inline / full-area error placeholder with optional retry.
 */
export const ErrorState = ({
  title = 'No se pudo cargar',
  message,
  onRetry,
  retryLabel = 'Reintentar',
  className = '',
}) => (
  <div className={`error-state ${className}`.trim()}>
    <div className="error-state-icon" aria-hidden>
      <CloudWarning size={28} weight="duotone" />
    </div>
    <h2 className="error-state-title">{title}</h2>
    {message ? <p className="error-state-message">{message}</p> : null}
    {onRetry ? (
      <Button type="button" variant="primary" onClick={onRetry} className="error-state-retry">
        <ArrowsClockwise size={16} />
        {retryLabel}
      </Button>
    ) : null}
  </div>
);
