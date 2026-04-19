import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  Buildings, 
  Users, 
  FileText, 
  ChartBar, 
  SignOut,
  X,
  Moon,
  Sun,
  ShieldCheck,
  DeviceMobile
} from '@phosphor-icons/react';
import { hasPermission } from '../../utils/permissionUtils';

export const Sidebar = ({ isOpen, closeSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const userInitials = (user?.name || 'AD').substring(0, 2).toUpperCase();
  const userEmail = user?.email || 'admin@laundry.app'; 
  const displayRole = (user?.role?.name || 'User').toUpperCase();

  return (
    <aside className={`sidebar flex flex-col ${isOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-header flex items-center justify-between" style={{ padding: 'var(--spacing-6)' }}>
        <div className="flex items-center gap-3">
          <div 
            className="flex items-center justify-center rounded-lg" 
            style={{ width: '40px', height: '40px', backgroundColor: 'var(--color-brand)' }}
          >
            <Buildings size={24} color="white" weight="duotone" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm" style={{ lineHeight: '1.2' }}>Laundry Admin</span>
            <span className="text-xs text-brand font-bold" style={{ lineHeight: '1.2' }}>{displayRole}</span>
          </div>
        </div>
        {isOpen && (
          <button className="icon-btn md:hidden flex-shrink-0" onClick={closeSidebar}>
            <X size={20} />
          </button>
        )}
      </div>
      
      <nav className="sidebar-nav" style={{ padding: '0 var(--spacing-4)', marginTop: 'var(--spacing-2)' }}>
        <div className="text-xs text-muted tracking-wider uppercase mb-2 font-semibold" style={{ marginLeft: '0.75rem' }}>Main</div>
        
        {hasPermission(user, 'Forms', 'View') && (
          <NavLink to="/forms" onClick={closeSidebar} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <FileText size={20} />
            Forms Management
          </NavLink>
        )}
        
        {hasPermission(user, 'Reports', 'View') && (
          <NavLink to="/reports" onClick={closeSidebar} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <ChartBar size={20} />
            Reports
          </NavLink>
        )}

        {hasPermission(user, 'Profile', 'View') && (
          <NavLink to="/profile" onClick={closeSidebar} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Users size={20} />
            My Profile
          </NavLink>
        )}
        
        {(hasPermission(user, 'Companies', 'View') || hasPermission(user, 'Users', 'View')) && (
          <>
            <div className="text-xs text-muted tracking-wider uppercase mb-2 mt-6 font-semibold" style={{ marginLeft: '0.75rem' }}>Administration</div>
            
            {hasPermission(user, 'Companies', 'View') && (
              <NavLink to="/companies" onClick={closeSidebar} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Buildings size={20} />
                Companies
              </NavLink>
            )}

            {hasPermission(user, 'Users', 'View') && (
              <NavLink to="/users" onClick={closeSidebar} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Users size={20} />
                Users
              </NavLink>
            )}

            {hasPermission(user, 'Roles', 'View') && (
              <>
                <NavLink to="/roles" onClick={closeSidebar} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <ShieldCheck size={20} />
                  Web Permissions
                </NavLink>
                <NavLink to="/app-permissions" onClick={closeSidebar} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <DeviceMobile size={20} />
                  App Permissions
                </NavLink>
              </>
            )}
          </>
        )}
      </nav>

      <div className="sidebar-footer mt-auto" style={{ borderTop: '1px solid var(--color-border)', padding: 'var(--spacing-4)' }}>
        <div className="flex flex-col gap-1 mb-4">
          <button className="nav-item w-full text-left" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }} onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            Toggle Theme
          </button>
          <button className="nav-item w-full text-left text-danger" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }} onClick={logout}>
            <SignOut size={20} />
            Logout
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div 
            className="flex items-center justify-center font-bold text-white flex-shrink-0" 
            style={{ width: '40px', height: '40px', backgroundColor: 'var(--color-brand)', borderRadius: '10px', fontSize: '1rem' }}
          >
            {userInitials}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold truncate">{user?.name || 'Admin'}</span>
            <span className="text-xs text-muted truncate border-none outline-none">{userEmail}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
