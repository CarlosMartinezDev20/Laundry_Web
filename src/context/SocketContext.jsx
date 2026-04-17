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

    const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace('/api', '');

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
        'No se pudo conectar en tiempo real. La app sigue funcionando; los avisos al instante pueden fallar.',
        4800,
      );
    });

    newSocket.on('notification', (data) => {
      toastRef.current.info(`🔔 ${data.title}: ${data.message}`, 5000);
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
