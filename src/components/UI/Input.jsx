import React, { useState, useId } from 'react';
import { Eye, EyeSlash } from '@phosphor-icons/react';

export const Input = ({
  label,
  error,
  className = '',
  id,
  type = 'text',
  style,
  icon,
  helperText,
  ...props
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === 'password';
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;
  const hasIcon = Boolean(icon);

  return (
    <div className={`input-group ${className}`.trim()} style={style}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      <div className="input-field-wrap">
        {hasIcon && (
          <span className="input-icon-left" aria-hidden="true">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          type={resolvedType}
          className="input-field"
          style={{
            paddingLeft: hasIcon ? '2.5rem' : undefined,
            paddingRight: isPassword ? '2.5rem' : undefined,
            width: '100%',
          }}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            className="input-suffix-btn"
            onClick={() => setShowPassword(v => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeSlash size={17} /> : <Eye size={17} />}
          </button>
        )}
      </div>
      {helperText && (
        <p className="input-helper text-muted text-xs">{helperText}</p>
      )}
      {error && (
        <span className="text-danger text-xs" style={{ marginTop: '4px' }}>
          {error}
        </span>
      )}
    </div>
  );
};
