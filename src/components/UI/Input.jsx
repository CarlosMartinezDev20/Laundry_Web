import React, { useState, useId } from 'react';
import { Eye, EyeSlash } from '@phosphor-icons/react';

export const Input = ({
  label,
  error,
  className = '',
  id,
  type = 'text',
  style,
  ...props
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === 'password';
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`input-group ${className}`.trim()} style={style}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          id={inputId}
          type={resolvedType}
          className="input-field"
          style={{ paddingRight: isPassword ? '2.5rem' : undefined, width: '100%' }}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
            style={{
              position: 'absolute',
              right: '0.625rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px',
              borderRadius: 'var(--radius-sm)',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-main)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-subtle)')}
          >
            {showPassword ? <EyeSlash size={17} /> : <Eye size={17} />}
          </button>
        )}
      </div>
      {error && (
        <span className="text-danger text-xs" style={{ marginTop: '4px' }}>
          {error}
        </span>
      )}
    </div>
  );
};
