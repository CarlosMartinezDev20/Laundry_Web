import React from 'react';

export const Skeleton = ({ height = '20px', width = '100%', className = '', style = {} }) => {
  return (
    <div 
      className={`skeleton ${className}`.trim()} 
      style={{ height, width, ...style }} 
      aria-hidden="true"
    />
  );
};
