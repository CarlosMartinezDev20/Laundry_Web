import React from 'react';

export const Input = ({
  label,
  error,
  className = '',
  id,
  type = 'text',
  ...props
}) => {
  const inputId = id || Math.random().toString(36).substring(7);

  return (
    <div className={`input-group ${className}`.trim()}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        className="input-field"
        {...props}
      />
      {error && (
        <span className="text-danger text-sm" style={{ marginTop: '4px' }}>
          {error}
        </span>
      )}
    </div>
  );
};
