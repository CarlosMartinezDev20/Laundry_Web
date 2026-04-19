import React, { useState, useEffect, useCallback } from 'react';
import { api as ApiClient } from '../services/api';
import {
  ShieldCheck,
  CheckSquare,
  Square,
  FloppyDisk,
  Layout,
  Users,
  Buildings,
  IdentificationCard,
  Books,
  Graph,
  UserGear,
} from '@phosphor-icons/react';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { ErrorState } from '../components/UI/ErrorState';
import { formatApiError } from '../utils/apiErrors';

const viewIcons = {
  Forms: <Layout size={18} weight="regular" />,
  Reports: <Graph size={18} weight="regular" />,
  Users: <Users size={18} weight="regular" />,
  Companies: <Buildings size={18} weight="regular" />,
  Catalog: <Books size={18} weight="regular" />,
  Profile: <IdentificationCard size={18} weight="regular" />,
  default: <ShieldCheck size={18} weight="regular" />,
};

const permToggleStyle = (on) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--spacing-2)',
  padding: 'var(--spacing-2) var(--spacing-3)',
  borderRadius: 'var(--radius-md)',
  border: `1px solid ${on ? 'var(--color-border-strong)' : 'var(--color-border)'}`,
  background: on ? 'var(--color-brand-light)' : 'var(--color-surface)',
  color: on ? 'var(--color-brand-text)' : 'var(--color-text-muted)',
  fontSize: 'var(--font-size-xs)',
  fontWeight: on ? 600 : 500,
  cursor: 'pointer',
  width: '100%',
  textAlign: 'left',
  transition: 'border-color var(--motion-sm) var(--ease-in-out), background var(--motion-sm) var(--ease-in-out)',
});

export const RolePermissions = () => {
  const toast = useToast();
  const [roles, setRoles] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchInitialData = useCallback(async () => {
    setFetchError(null);
    try {
      setLoading(true);
      const [rolesRes, permissionsRes] = await Promise.all([
        ApiClient.get('/roles'),
        ApiClient.get('/roles/available-permissions'),
      ]);

      const rolesData = Array.isArray(rolesRes) ? rolesRes : rolesRes.data || [];
      const permissionsData =
        permissionsRes.view_actions || permissionsRes.data?.view_actions || [];

      setRoles(rolesData);
      setAvailablePermissions(permissionsData);

      if (rolesData.length > 0) {
        setSelectedRole(rolesData[0]);
      } else {
        setSelectedRole(null);
      }
    } catch (err) {
      const msg = formatApiError(err);
      setFetchError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleTogglePermission = (view, action) => {
    if (!selectedRole) return;

    const currentPermissions = [...(selectedRole.permissions || [])];
    const viewEntry = currentPermissions.find((p) => p.view === view);

    if (viewEntry) {
      const actions = [...viewEntry.actions];
      if (actions.includes(action)) {
        viewEntry.actions = actions.filter((a) => a !== action);
      } else {
        viewEntry.actions = [...actions, action];
      }
    } else {
      currentPermissions.push({ view, actions: [action] });
    }

    setSelectedRole({ ...selectedRole, permissions: currentPermissions });
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    try {
      setSaving(true);
      await ApiClient.patch(`/roles/${selectedRole.id}/permissions`, selectedRole.permissions);
      toast.success('Permissions updated');
      setRoles(roles.map((r) => (r.id === selectedRole.id ? selectedRole : r)));
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const activeModules =
    selectedRole?.permissions?.filter((p) => (p.actions || []).length > 0).length ?? 0;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Web permissions</h1>
          <p className="page-subtitle">Dashboard access by role</p>
        </div>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={saving || !selectedRole || !!fetchError}
          className="w-full sm:w-fit"
        >
          <FloppyDisk size={16} weight="regular" />
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>

      {!loading && fetchError ? (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <ErrorState
            title="Could not load permissions"
            message={fetchError}
            onRetry={fetchInitialData}
            className="error-state--fill"
          />
        </Card>
      ) : loading ? (
        <Card style={{ padding: 'var(--spacing-6)' }}>
          <div className="flex flex-col sm:flex-row gap-6" style={{ minHeight: 280 }}>
            <div
              className="skeleton"
              style={{
                width: '100%',
                maxWidth: 220,
                height: 200,
                borderRadius: 'var(--radius-lg)',
                flexShrink: 0,
              }}
            />
            <div className="flex-1 flex flex-col gap-4" style={{ minWidth: 0 }}>
              <div className="skeleton" style={{ height: 24, width: '36%', borderRadius: 'var(--radius-sm)' }} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="skeleton"
                    style={{ height: 112, borderRadius: 'var(--radius-lg)' }}
                  />
                ))}
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div className="permissions-shell">
            <aside className="permissions-sidebar flex flex-col">
              <div
                className="flex flex-col flex-1"
                style={{ padding: 'var(--spacing-4) var(--spacing-3)' }}
              >
                <div className="nav-group-heading">Roles</div>
                <div className="sidebar-nav" style={{ paddingTop: 'var(--spacing-2)' }}>
                  {roles.map((role) => {
                    const isActive = selectedRole?.id === role.id;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setSelectedRole(role)}
                        className={`nav-item${isActive ? ' active' : ''}`}
                      >
                        {role.name}
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop: 'auto', paddingTop: 'var(--spacing-4)' }}>
                  <p className="text-xs text-subtle" style={{ lineHeight: 1.55 }}>
                    These permissions control the web dashboard. Use{' '}
                    <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>App permissions</span>{' '}
                    for the mobile app only.
                  </p>
                </div>
              </div>
            </aside>

            <div className="permissions-main">
              {selectedRole ? (
                <>
                  <div
                    className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
                    style={{ marginBottom: 'var(--spacing-5)' }}
                  >
                    <div>
                      <h2
                        style={{
                          fontSize: 'var(--font-size-lg)',
                          fontWeight: 700,
                          color: 'var(--color-text-main)',
                          letterSpacing: '-0.02em',
                          marginBottom: 4,
                        }}
                      >
                        {selectedRole.name}
                      </h2>
                      <p className="page-subtitle" style={{ marginTop: 0 }}>
                        Choose which views and actions this role can use in the dashboard.
                      </p>
                    </div>
                    <span className="sidebar-role-badge">{activeModules} modules with access</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availablePermissions.map((viewGroup) => {
                      const viewPerm = selectedRole.permissions?.find((p) => p.view === viewGroup.view);
                      const icon = viewIcons[viewGroup.view] || viewIcons.default;

                      return (
                        <div
                          key={viewGroup.view}
                          style={{
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-lg)',
                            padding: 'var(--spacing-5)',
                            boxShadow: 'var(--shadow-xs)',
                          }}
                        >
                          <div
                            className="flex items-start gap-3"
                            style={{ marginBottom: 'var(--spacing-4)' }}
                          >
                            <div
                              className="flex items-center justify-center flex-shrink-0"
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--color-brand-light)',
                                color: 'var(--color-brand-text)',
                              }}
                            >
                              {icon}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <h3
                                style={{
                                  fontSize: 'var(--font-size-base)',
                                  fontWeight: 600,
                                  color: 'var(--color-text-main)',
                                  marginBottom: 2,
                                }}
                              >
                                {viewGroup.label}
                              </h3>
                              <p className="text-xs text-subtle" style={{ fontWeight: 500 }}>
                                {viewGroup.view}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {viewGroup.actions.map((action) => {
                              const isChecked = (viewPerm?.actions || []).includes(action);
                              return (
                                <button
                                  key={action}
                                  type="button"
                                  onClick={() => handleTogglePermission(viewGroup.view, action)}
                                  style={permToggleStyle(isChecked)}
                                >
                                  {isChecked ? (
                                    <CheckSquare size={18} weight="fill" />
                                  ) : (
                                    <Square size={18} weight="regular" />
                                  )}
                                  <span>{action}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="empty-state" style={{ padding: 'var(--spacing-10) var(--spacing-6)' }}>
                  <UserGear size={48} weight="thin" />
                  <div>
                    <div className="empty-state-title">No roles yet</div>
                    <div className="empty-state-desc">Create a role first to configure permissions.</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
