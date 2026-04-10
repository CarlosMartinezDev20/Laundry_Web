import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { Drop, CheckCircle } from '@phosphor-icons/react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      
      {/* Left Panel - Login Form */}
      <div className="login-left">
        <div className="login-form-wrapper animate-fade-in">
          
          <div className="flex flex-col mb-8" style={{ alignItems: 'flex-start' }}>
            <div className="flex items-center justify-center mb-6" style={{ 
              width: '52px', height: '52px', 
              borderRadius: '14px', 
              backgroundColor: 'var(--color-brand)',
              color: 'white',
              boxShadow: '0 8px 16px -4px rgba(79, 70, 229, 0.3)'
            }}>
              <Drop size={28} weight="fill" />
            </div>
            <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
              Welcome back
            </h1>
            <p className="text-muted text-sm">Please enter your credentials to access your dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input 
              label="Email Address" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="admin@example.com"
              required 
            />
            <Input 
              label="Password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
              required 
            />
            
            {error && (
              <div className="text-danger text-sm p-3 border" style={{ backgroundColor: 'transparent', borderColor: 'var(--color-danger)', borderRadius: '0.5rem', marginTop: '0.5rem' }}>
                {error}
              </div>
            )}
            
            <Button type="submit" variant="primary" disabled={isSubmitting} className="w-full mt-4" style={{ padding: '0.75rem', fontSize: '1rem' }}>
              {isSubmitting ? 'Verifying...' : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted" style={{ marginTop: '2rem' }}>
            Need help? Contact your system administrator.
          </p>
        </div>
      </div>

      {/* Right Panel - Branding/Showcase */}
      <div className="login-right">
        
        {/* Abstract CSS Decorative Shapes */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: '400px', height: '400px', backgroundColor: 'white', opacity: 0.05, borderRadius: '50%', transform: 'translate(30%, -30%)' }}></div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '300px', height: '300px', backgroundColor: 'var(--color-action)', opacity: 0.2, borderRadius: '50%', transform: 'translate(-20%, 20%)', filter: 'blur(40px)' }}></div>

        <div className="animate-fade-in" style={{ position: 'relative', zIndex: 10, maxWidth: '440px' }}>
          <Drop size={40} color="white" weight="duotone" style={{ opacity: 0.9, marginBottom: '2rem' }} />
          <h2 style={{ fontSize: '2.5rem', lineHeight: '1.2', marginBottom: '1.5rem', color: 'white' }}>
            Digitize your laundry workflows.
          </h2>
          <p style={{ color: 'var(--color-brand-light)', fontSize: '1.1rem', opacity: 0.9, lineHeight: 1.6, marginBottom: '3rem' }}>
            Experience the new standard in linen management. Zero paper, total tracking, and real-time approval chains in one minimal dashboard.
          </p>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle size={20} color="white" weight="fill" />
              <span className="text-sm" style={{ color: 'white', fontWeight: 500 }}>Paperless processing</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={20} color="white" weight="fill" />
              <span className="text-sm" style={{ color: 'white', fontWeight: 500 }}>Multi-role authentication</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={20} color="white" weight="fill" />
              <span className="text-sm" style={{ color: 'white', fontWeight: 500 }}>Automated statistical tracking</span>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};
