import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { List, Moon, Sun } from '@phosphor-icons/react';
import { useTheme } from '../../context/ThemeContext';
import { useConnectivity } from '../../context/ConnectivityContext';
import { OfflineBanner } from '../UI/OfflineBanner';

export const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();
  const { isOnline } = useConnectivity();

  return (
    <div className="flex w-full h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />

      <div className="main-content">
        {!isOnline && <OfflineBanner />}
        {/* Mobile header */}
        <header className="mobile-header">
          <button
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <List size={22} />
          </button>
          <span style={{ flex: 1, fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>
            Laundry Admin
          </span>
          <button
            className="mobile-menu-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        <main className="content-area">
          <div key={pathname} className="route-outlet">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
