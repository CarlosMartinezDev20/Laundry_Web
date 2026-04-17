import React from 'react';

export const GlobalLoader = () => (
  <div className="global-loader animate-fade-in" role="status" aria-live="polite" aria-label="Cargando">
    <div className="loader-spinner" />
  </div>
);
