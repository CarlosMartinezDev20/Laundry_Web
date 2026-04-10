import React from 'react';

export const GlobalLoader = () => {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background" style={{ zIndex: 9999 }}>
      <div 
        style={{ 
          width: '40px', 
          height: '40px', 
          border: '3px solid var(--color-border)', 
          borderTopColor: 'var(--color-action)', 
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}
      />
    </div>
  );
};
