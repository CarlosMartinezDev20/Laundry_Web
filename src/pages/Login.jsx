import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatApiError } from '../utils/apiErrors';
import { ApiError } from '../services/api';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { Drop, CheckCircle } from '@phosphor-icons/react';

const LOGIN_FEATURES = [
  'Paperless processing',
  'Multi-role authentication',
  'Automated statistical tracking',
];

export const Login = () => {
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [error, setError]           = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      setError(null);
      try {
        await login(email, password);
        navigate('/');
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          setError(err.message || 'Invalid credentials. Check your email and password.');
        } else {
          setError(formatApiError(err));
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, login, navigate, password],
  );

  return (
    <div className="login-page">

      {/* ── Left — Form ── */}
      <div className="login-left">
        <div className="login-form-wrapper animate-fade-in">

          <div className="login-brand-icon">
            <Drop size={24} weight="fill" color="white" />
          </div>

          <h1 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: '0.375rem', letterSpacing: '-0.02em' }}>
            Welcome back
          </h1>
          <p className="text-muted text-sm" style={{ marginBottom: 'var(--spacing-8)' }}>
            Sign in to access your dashboard.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
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

            {error && <div className="login-error">{error}</div>}

            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="w-full"
              style={{ padding: '0.75rem', fontSize: 'var(--font-size-base)', marginTop: 'var(--spacing-2)' }}
            >
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-xs text-muted" style={{ marginTop: 'var(--spacing-6)' }}>
            Need help? Contact your system administrator.
          </p>
        </div>
      </div>

      {/* ── Right — Branding Panel ── */}
      <div className="login-right">
        {/* Grid pattern overlay */}
        <div className="login-right-pattern" />

        {/* Decorative circles */}
        <div className="login-right-deco" style={{ width: 400, height: 400, top: '-120px', right: '-120px' }} />
        <div className="login-right-deco" style={{ width: 280, height: 280, bottom: '-80px', left: '-80px' }} />

        <div className="login-right-content">
          <Drop size={38} color="white" weight="duotone" style={{ marginBottom: 'var(--spacing-6)', opacity: 0.9 }} />

          <h2 style={{ fontSize: '2rem', lineHeight: 1.2, color: 'white', marginBottom: 'var(--spacing-4)', letterSpacing: '-0.02em' }}>
            Digitize your<br />laundry workflows.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 'var(--font-size-sm)', lineHeight: 1.7, marginBottom: 'var(--spacing-8)' }}>
            Zero paper, total tracking, and real-time approval chains — all in one streamlined dashboard.
          </p>

          <div className="flex flex-col" style={{ gap: 0 }}>
            {LOGIN_FEATURES.map((feat) => (
              <div key={feat} className="login-feature-item">
                <CheckCircle size={18} weight="fill" color="white" style={{ opacity: 0.9, flexShrink: 0 }} />
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
