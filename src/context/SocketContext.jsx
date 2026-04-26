import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const toast = useToast();
  const toastRef = useRef(toast);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setSocket(null);
      return;
    }

    const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace('/api', '');

    const newSocket = io(apiUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Connected:', newSocket.id);
    });

    let lastConnectErrToast = 0;
    newSocket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
      const now = Date.now();
      if (now - lastConnectErrToast < 12000) return;
      lastConnectErrToast = now;
      toastRef.current.error(
        'Could not connect for real-time updates. The app still works; instant notifications may not arrive until the connection recovers.',
        4800,
      );
    });

    newSocket.on('notification', (data) => {
      toastRef.current.info(`🔔 ${data.title}: ${data.message}`, 5000);
    });

    newSocket.on('reload_permissions', () => {
      console.log('[Socket] Reload permissions event received');
      if (window.auth_refresh_profile) {
        window.auth_refresh_profile();
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
