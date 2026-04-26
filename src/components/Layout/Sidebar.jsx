import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Drop,
  Users,
  FileText,
  ChartBar,
  SignOut,
  X,
  Moon,
  Sun,
  Buildings,
  ShieldCheck,
  DeviceMobile,
} from '@phosphor-icons/react';
import { hasPermission } from '../../utils/permissionUtils';

export const Sidebar = ({ isOpen, closeSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const roleName    = (user?.role?.name || '').toUpperCase();
  const isAdmin     = roleName === 'ADMIN';
  const isManager   = roleName === 'MANAGER' || isAdmin;
  const userInitials = (user?.name || 'US').substring(0, 2).toUpperCase();
  const userName    = user?.name || 'User';
  const userEmail   = user?.email || '';
  const displayRole = (user?.role?.name || 'Employee').toLowerCase();

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>

      {/* ── Brand / Logo ── */}
      <div className="sidebar-logo-wrap">
        <div className="sidebar-logo-icon">
          <Drop size={18} color="white" weight="fill" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="sidebar-logo-title">Laundry</div>
          <div className="sidebar-logo-sub">Management System</div>
        </div>
        {isOpen && (
          <button
            className="icon-btn"
            onClick={closeSidebar}
            style={{ border: 'none', background: 'none' }}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="sidebar-nav">

        <div className="nav-group">
          <div className="sidebar-section-label" style={{ marginBottom: '6px' }}>Main</div>

          {hasPermission(user, 'Forms', 'View') && (
            <NavLink
              to="/forms"
              onClick={closeSidebar}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-item-icon"><FileText size={18} /></span>
              Forms
            </NavLink>
          )}

          {hasPermission(user, 'Reports', 'View') && (
            <NavLink
              to="/reports"
              onClick={closeSidebar}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-item-icon"><ChartBar size={18} /></span>
              Reports
            </NavLink>
          )}

          <NavLink
            to="/profile"
            onClick={closeSidebar}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-item-icon"><Users size={18} /></span>
            My Profile
          </NavLink>
        </div>

        {(hasPermission(user, 'Companies', 'View') || 
          hasPermission(user, 'Users', 'View') || 
          hasPermission(user, 'Roles', 'View')) && (
          <div className="nav-group">
            <div className="sidebar-section-label" style={{ marginBottom: '6px' }}>Administration</div>

            {hasPermission(user, 'Companies', 'View') && (
              <NavLink
                to="/companies"
                onClick={closeSidebar}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-item-icon"><Buildings size={18} /></span>
                Companies
              </NavLink>
            )}

            {hasPermission(user, 'Users', 'View') && (
              <NavLink
                to="/users"
                onClick={closeSidebar}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-item-icon"><Users size={18} /></span>
                Users
              </NavLink>
            )}

            {hasPermission(user, 'Roles', 'View') && (
              <>
                <NavLink
                  to="/roles"
                  onClick={closeSidebar}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="nav-item-icon"><ShieldCheck size={18} /></span>
                  Web Permissions
                </NavLink>

                <NavLink
                  to="/app-permissions"
                  onClick={closeSidebar}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="nav-item-icon"><DeviceMobile size={18} /></span>
                  App Permissions
                </NavLink>
              </>
            )}
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Preferences */}
        <div className="nav-group" style={{ marginBottom: 0 }}>
          <button className="nav-item" onClick={toggleTheme}>
            <span className="nav-item-icon">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </span>
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </nav>

      {/* ── User Footer ── */}
      <div className="sidebar-footer">
        <div className="sidebar-user-card">
          <div className="sidebar-avatar">{userInitials}</div>
          <div className="sidebar-user-info" style={{ flex: 1, minWidth: 0 }}>
            <span className="text-sm font-semibold truncate">{userName}</span>
            <span className="text-xs text-muted truncate">{userEmail}</span>
            <span className="sidebar-role-badge" style={{ marginTop: '3px' }}>{displayRole}</span>
          </div>
          <button
            className="icon-btn danger"
            onClick={logout}
            title="Sign out"
            style={{ border: 'none', flexShrink: 0 }}
          >
            <SignOut size={16} />
          </button>
        </div>
      </div>

    </aside>
  );
};
