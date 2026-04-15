import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Input } from '../components/UI/Input';
import { Button } from '../components/UI/Button';
import { useToast } from '../context/ToastContext';
import {
  User,
  Key,
  IdentificationCard,
  FloppyDisk,
  EnvelopeSimple,
  ShieldCheck,
  CheckCircle,
  Lock,
} from '@phosphor-icons/react';

const ROLE_LABELS = {
  admin:    { label: 'Administrator', color: '#1e3a5f', bg: 'rgba(30,58,95,0.09)' },
  manager:  { label: 'Manager',       color: '#d97706', bg: 'rgba(217,119,6,0.09)' },
  employee: { label: 'Employee',      color: '#16a34a', bg: 'rgba(22,163,74,0.09)' },
};

export const Profile = () => {
  const { user } = useAuth();
  const toast    = useToast();
  const [loading, setLoading]   = useState(false);
  const [pwMatch, setPwMatch]   = useState(true);

  const [formData, setFormData] = useState({
    name:            user?.name     || '',
    email:           user?.email    || '',
    initials:        user?.initials || '',
    password:        '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!user?.id) return;
    setFormData((prev) => ({
      ...prev,
      name: user.name ?? '',
      email: user.email ?? '',
      initials: user.initials ?? '',
    }));
  }, [user?.id, user?.name, user?.email, user?.initials]);

  const password = formData.password;
  const confirmPassword = formData.confirmPassword;
  useEffect(() => {
    if (!password && !confirmPassword) {
      setPwMatch(true);
      return;
    }
    setPwMatch(!confirmPassword || password === confirmPassword);
  }, [password, confirmPassword]);

  // role may come as a plain string OR as an object { id, name, ... }
  const roleKey  = typeof user?.role === 'object' ? (user?.role?.name || '') : (user?.role || '');
  const roleInfo = useMemo(
    () => ROLE_LABELS[roleKey.toLowerCase()] || { label: roleKey || 'User', color: '#64748b', bg: 'rgba(100,116,139,0.09)' },
    [roleKey],
  );

  const displayInitials = useMemo(
    () =>
      formData.initials?.toUpperCase() ||
      formData.name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() ||
      '?',
    [formData.initials, formData.name],
  );

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (formData.password && formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
      setLoading(true);
      try {
        const payload = { name: formData.name, initials: formData.initials };
        if (formData.password) payload.password = formData.password;
        await api.patch(`/users/${user.id}`, payload);
        toast.success('Profile updated. Some changes may require a re-login.');
        setFormData((prev) => ({ ...prev, password: '', confirmPassword: '' }));
      } catch (err) {
        toast.error('Failed to update profile: ' + (err.message || 'Error'));
      } finally {
        setLoading(false);
      }
    },
    [formData.confirmPassword, formData.initials, formData.name, formData.password, toast, user?.id],
  );

  return (
    <div className="animate-fade-in">

      {/* ── Page header ── */}
      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Manage your personal information and account security</p>
      </div>

      <div className="profile-layout">

        {/* ── LEFT: Identity card ── */}
        <aside className="profile-aside">
          <div className="profile-identity-card">

            {/* Avatar */}
            <div className="profile-avatar-wrap">
              <div className="profile-avatar">
                {displayInitials}
              </div>
              <div className="profile-avatar-ring" aria-hidden="true" />
            </div>

            {/* Name & role */}
            <div style={{ textAlign: 'center' }}>
              <p className="profile-display-name">{formData.name || 'User'}</p>
              <span className="profile-role-badge" style={{ color: roleInfo.color, background: roleInfo.bg }}>
                <ShieldCheck size={12} weight="fill" />
                {roleInfo.label}
              </span>
            </div>

            {/* Divider */}
            <div className="profile-divider" />

            {/* Info rows */}
            <div className="profile-info-list">
              <div className="profile-info-row">
                <span className="profile-info-icon">
                  <EnvelopeSimple size={15} />
                </span>
                <div>
                  <p className="profile-info-label">Email</p>
                  <p className="profile-info-value">{user?.email || '—'}</p>
                </div>
              </div>
              <div className="profile-info-row">
                <span className="profile-info-icon">
                  <IdentificationCard size={15} />
                </span>
                <div>
                  <p className="profile-info-label">Initials</p>
                  <p className="profile-info-value">{formData.initials || '—'}</p>
                </div>
              </div>
              <div className="profile-info-row">
                <span className="profile-info-icon">
                  <Lock size={15} />
                </span>
                <div>
                  <p className="profile-info-label">Password</p>
                  <p className="profile-info-value">••••••••</p>
                </div>
              </div>
            </div>

            {/* Account status pill */}
            <div className="profile-status-pill">
              <CheckCircle size={14} weight="fill" style={{ color: 'var(--color-success)' }} />
              <span>Active account</span>
            </div>
          </div>
        </aside>

        {/* ── RIGHT: Edit form ── */}
        <section className="profile-form-col">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">

            {/* Personal info section */}
            <div className="profile-section">
              <div className="profile-section-header">
                <div className="profile-section-icon">
                  <User size={16} weight="duotone" />
                </div>
                <div>
                  <h2 className="profile-section-title">Personal Information</h2>
                  <p className="profile-section-desc">Update your display name and initials</p>
                </div>
              </div>

              <div className="profile-section-body">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    icon={<User size={16} />}
                    required
                    placeholder="Your full name"
                  />
                  <Input
                    label="Initials"
                    name="initials"
                    value={formData.initials}
                    onChange={handleChange}
                    icon={<IdentificationCard size={16} />}
                    maxLength={3}
                    placeholder="e.g. AD"
                  />
                </div>
                <Input
                  label="Email Address"
                  name="email"
                  value={formData.email}
                  disabled
                  icon={<EnvelopeSimple size={16} />}
                  helperText="Email address cannot be changed."
                />
              </div>
            </div>

            {/* Security section */}
            <div className="profile-section">
              <div className="profile-section-header">
                <div className="profile-section-icon profile-section-icon--security">
                  <Key size={16} weight="duotone" />
                </div>
                <div>
                  <h2 className="profile-section-title">Security</h2>
                  <p className="profile-section-desc">Leave blank to keep your current password</p>
                </div>
              </div>

              <div className="profile-section-body">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="New Password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    icon={<Key size={16} />}
                    placeholder="New password"
                  />
                  <div>
                    <Input
                      label="Confirm Password"
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      icon={<Key size={16} />}
                      placeholder="Confirm new password"
                    />
                    {!pwMatch && (
                      <p className="profile-pw-error">Passwords do not match</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="profile-form-footer">
              <p className="profile-footer-hint">
                Changes to your name or initials take effect immediately.
              </p>
              <Button
                type="submit"
                variant="primary"
                disabled={loading || !pwMatch}
                style={{ gap: '0.5rem', padding: '0.625rem 1.5rem' }}
              >
                <FloppyDisk size={17} />
                {loading ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>

          </form>
        </section>

      </div>
    </div>
  );
};
