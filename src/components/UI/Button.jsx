import React from 'react';

export const Button = ({ 
  children, 
  variant = 'default', 
  type = 'button', 
  className = '', 
  disabled = false,
  ...props 
}) => {
  let variantClass = '';
  switch (variant) {
    case 'primary':
      variantClass = 'btn-primary';
      break;
    case 'danger':
      variantClass = 'btn-danger';
      break;
    case 'success':
      variantClass = 'btn-success';
      break;
    case 'action':
      variantClass = 'btn-action';
      break;
    default:
      variantClass = ''; 
  }

  return (
    <button
      type={type}
      className={`btn ${variantClass} ${className}`.trim()}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
