import React, { useId } from 'react';

export const Select = ({
  label,
  error,
  className = '',
  id,
  style,
  children,
  ...props
}) => {
  const generatedId = useId();
  const selectId = id || generatedId;

  return (
    <div className={`input-group ${className}`.trim()} style={style}>
      {label && (
        <label htmlFor={selectId} className="input-label">
          {label}
        </label>
      )}
      <select id={selectId} className="input-field" {...props}>
        {children}
      </select>
      {error && (
        <span className="text-danger text-xs" style={{ marginTop: '4px' }}>
          {error}
        </span>
      )}
    </div>
  );
};
