import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api as ApiClient } from '../services/api';
import { 
  ShieldCheck, 
  CheckSquare, 
  Square, 
  FloppyDisk, 
  CaretRight,
  Layout,
  Users,
  Buildings,
  IdentificationCard,
  Books,
  Graph,
  UserGear
} from '@phosphor-icons/react';
import { useToast } from '../context/ToastContext';

export const RolePermissions = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [roles, setRoles] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Map view keys to specific icons for a premium look
  const viewIcons = {
    'Forms': <Layout size={24} weight="duotone" />,
    'Reports': <Graph size={24} weight="duotone" />,
    'Users': <Users size={24} weight="duotone" />,
    'Companies': <Buildings size={24} weight="duotone" />,
    'Catalog': <Books size={24} weight="duotone" />,
    'Profile': <IdentificationCard size={24} weight="duotone" />,
    'default': <ShieldCheck size={24} weight="duotone" />
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [rolesRes, permissionsRes] = await Promise.all([
        ApiClient.get('/roles'),
        ApiClient.get('/roles/available-permissions')
      ]);
      
      const rolesData = Array.isArray(rolesRes) ? rolesRes : (rolesRes.data || []);
      const permissionsData = permissionsRes.view_actions || (permissionsRes.data?.view_actions || []);

      setRoles(rolesData);
      setAvailablePermissions(permissionsData);
      
      if (rolesData.length > 0) {
        setSelectedRole(rolesData[0]);
      }
    } catch (error) {
      toast.error('Error loading permissions data');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermission = (view, action) => {
    if (!selectedRole) return;

    const currentPermissions = [...(selectedRole.permissions || [])];
    const viewEntry = currentPermissions.find(p => p.view === view);

    if (viewEntry) {
      const actions = [...viewEntry.actions];
      if (actions.includes(action)) {
        viewEntry.actions = actions.filter(a => a !== action);
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
      toast.success('Permissions updated successfully');
      
      setRoles(roles.map(r => r.id === selectedRole.id ? selectedRole : r));
    } catch (error) {
      toast.error('Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 animate-pulse">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand mb-4"></div>
      <p className="text-muted font-medium">Syncing security protocols...</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full animate-fade-in" style={{ backgroundColor: 'transparent' }}>
      
      {/* Premium Header */}
      <header className="flex items-center justify-between p-6 bg-white border-bottom border-border" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center bg-brand text-white rounded-xl shadow-lg shadow-brand/20" style={{ width: '48px', height: '48px' }}>
            <UserGear size={28} weight="fill" />
          </div>
          <div>
            <h1 className="text-xl font-bold mb-0">Security & RBAC</h1>
            <p className="text-muted text-xs font-medium uppercase tracking-widest">Enterprise Role Management</p>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl shadow-lg hover:translate-y-[-1px] transition-all"
        >
          <FloppyDisk size={20} weight="fill" />
          <span>{saving ? 'Syncing...' : 'Apply Security Changes'}</span>
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Side Selection Panel */}
        <aside className="w-72 bg-white border-r border-border p-6 flex flex-col gap-8">
          <div>
            <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-4">Organizational Roles</h3>
            <div className="flex flex-col gap-2">
              {roles.map(role => {
                const isActive = selectedRole?.id === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role)}
                    className={`flex items-center justify-between p-3.5 px-4 rounded-xl transition-all duration-300 ${
                      isActive 
                        ? 'bg-brand text-white shadow-xl shadow-brand/15' 
                        : 'hover:bg-brand-light/20 text-text-main'
                    }`}
                  >
                    <span className="font-bold flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : 'bg-brand'}`}></div>
                      {role.name}
                    </span>
                    {isActive && <CaretRight size={16} weight="bold" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-auto p-4 bg-background rounded-2xl border border-border">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={20} weight="fill" className="text-brand" />
              <span className="text-xs font-bold uppercase">System Info</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Permissions are applied in real-time. Admin accounts cannot be locked out of security views.
            </p>
          </div>
        </aside>

        {/* Permissions Canvas */}
        <main className="flex-1 overflow-y-auto p-8" style={{ backgroundColor: '#f8fafc' }}>
          {selectedRole ? (
            <div className="max-w-4xl mx-auto space-y-8">
              
              <div className="flex items-end justify-between mb-2">
                <div>
                  <h2 className="text-3xl font-black text-text-main tracking-tight">
                    {selectedRole.name} <span className="text-brand font-medium">Permissions</span>
                  </h2>
                  <p className="text-muted mt-1">Select the views and actions this role is authorized to perform.</p>
                </div>
                <div className="flex items-center gap-2 p-2 px-4 bg-brand/5 border border-brand/10 rounded-full">
                  <span className="text-xs font-bold text-brand">{selectedRole.permissions?.length || 0} Modules Enabled</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availablePermissions.map(viewGroup => {
                  const viewPerm = selectedRole.permissions?.find(p => p.view === viewGroup.view);
                  const icon = viewIcons[viewGroup.view] || viewIcons['default'];
                  
                  return (
                    <div 
                      key={viewGroup.view} 
                      className="group bg-white rounded-3xl p-6 border border-border/60 shadow-sm hover:shadow-xl hover:border-brand/20 transition-all duration-400 overflow-hidden relative"
                    >
                      {/* Decorative Background Element */}
                      <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-125 transition-transform duration-700 text-brand">
                        {icon}
                      </div>

                      <div className="flex items-center gap-4 mb-6 relative">
                        <div className="flex items-center justify-center p-3.5 bg-brand-light/30 text-brand rounded-2xl shadow-inner">
                          {icon}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-lg text-text-main">{viewGroup.label}</h4>
                          <span className="text-[10px] font-bold text-brand uppercase tracking-tighter opacity-60">Route: {viewGroup.view}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 relative">
                        {viewGroup.actions.map(action => {
                          const isChecked = viewPerm?.actions.includes(action);
                          return (
                            <button
                              key={action}
                              onClick={() => handleTogglePermission(viewGroup.view, action)}
                              className={`flex items-center gap-2.5 p-2.5 px-4 rounded-xl border-2 transition-all duration-200 ${
                                isChecked 
                                  ? 'bg-brand/5 border-brand/40 text-brand font-bold shadow-sm' 
                                  : 'border-transparent bg-background/50 text-text-muted hover:bg-muted'
                              }`}
                            >
                              <div className={`transition-transform duration-300 ${isChecked ? 'scale-110' : 'scale-100 opacity-40'}`}>
                                {isChecked ? (
                                  <CheckSquare size={20} weight="fill" />
                                ) : (
                                  <Square size={20} />
                                )}
                              </div>
                              <span className="text-xs">{action}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="pt-10 pb-20 text-center">
                <p className="text-muted text-sm italic">End of security policy configuration.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted space-y-4 animate-pulse">
              <ShieldCheck size={80} weight="duotone" className="opacity-10" />
              <p className="text-lg font-medium">Select a role to analyze security context</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
