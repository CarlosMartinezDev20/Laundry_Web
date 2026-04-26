import React from 'react';
import { ShieldWarning } from '@phosphor-icons/react';
import { Button } from './Button';
import { useNavigate } from 'react-router-dom';

export const AccessDenied = ({ module = 'this section' }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center animate-fade-in" style={{ minHeight: '60vh' }}>
      <div 
        className="flex items-center justify-center mb-6"
        style={{ 
          width: 80, 
          height: 80, 
          borderRadius: '50%', 
          background: 'var(--color-danger-light)',
          color: 'var(--color-danger)'
        }}
      >
        <ShieldWarning size={40} weight="duotone" />
      </div>
      
      <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: 'var(--spacing-2)' }}>
        Access Denied
      </h2>
      
      <p style={{ color: 'var(--color-text-muted)', maxWidth: 400, margin: '0 auto var(--spacing-8) auto', lineHeight: 1.6 }}>
        Your role doesn't have the necessary permissions to view <strong>{module}</strong>. 
        If you believe this is an error, please contact your administrator.
      </p>

      <div className="flex gap-3">
        {/* <Button variant="secondary" onClick={() => navigate(-1)}>
          Go back
        </Button>
        <Button variant="primary" onClick={() => navigate('/')}>
          Go to Dashboard
        </Button> */}
      </div>
    </div>
  );
};
