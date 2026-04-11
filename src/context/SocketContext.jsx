import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Disconnect any previous socket when user changes
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace('/api', '');
    
    const newSocket = io(apiUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Connected:', newSocket.id);
    });

    newSocket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    newSocket.on('notification', (data) => {
      toast.info(`🔔 ${data.title}: ${data.message}`, 5000);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]); // Re-connect when user logs in/out

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
