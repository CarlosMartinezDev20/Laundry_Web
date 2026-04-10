import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { List, Moon, Sun } from '@phosphor-icons/react';
import { useTheme } from '../../context/ThemeContext';

export const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex w-full h-screen overflow-hidden bg-background">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar with state prop */}
      <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />

      <div className="main-content">
        {/* Mobile Header for hamburger menu */}
        <div className="mobile-header">
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
            <List size={24} />
          </button>
          <span style={{flex: 1}}>Laundry Admin</span>
          <button className="mobile-menu-btn" onClick={toggleTheme} title="Toggle Theme">
            {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
          </button>
        </div>

        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
