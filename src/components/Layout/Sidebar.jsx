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
  Sun
} from '@phosphor-icons/react';

export const Sidebar = ({ isOpen, closeSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const roleName = user?.role?.name || '';
  const isAdmin = roleName === 'ADMIN';
  const isManager = roleName === 'MANAGER' || isAdmin;

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-header flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Buildings size={28} color="var(--color-brand)" weight="duotone" />
          <span>Laundry Admin</span>
        </div>
        {/* Mobile close button inside sidebar */}
        <button className="mobile-menu-btn md:hidden" onClick={closeSidebar} style={{ display: 'none' /* handled by generic CSS or just inline */ }} />
        {isOpen && (
          <button className="mobile-menu-btn" onClick={closeSidebar}>
            <X size={24} />
          </button>
        )}
      </div>
      
      <nav className="sidebar-nav">
        <NavLink to="/forms" onClick={closeSidebar} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <FileText size={20} />
          Forms Management
        </NavLink>
        
        {isManager && (
          <NavLink to="/reports" onClick={closeSidebar} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <ChartBar size={20} />
            Reports (Totals)
          </NavLink>
        )}
        
        {isAdmin && (
          <>
            <NavLink to="/companies" onClick={closeSidebar} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Buildings size={20} />
              Companies
            </NavLink>
            <NavLink to="/employees" onClick={closeSidebar} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Users size={20} />
              Employees
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-muted font-semibold tracking-wider uppercase">Logged in</span>
              <span className="text-sm font-bold truncate" style={{ maxWidth: '140px' }}>{user?.name || 'Admin'}</span>
            </div>
            <button className="icon-btn" onClick={toggleTheme} title="Toggle Theme">
              {theme === 'dark' ? <Sun size={20} weight="fill" /> : <Moon size={20} weight="fill" />}
            </button>
          </div>
          <button className="btn w-full flex justify-center items-center" onClick={logout}>
            <SignOut size={16} /> Logout
          </button>
        </div>
      </div>
    </aside>
  );
};
