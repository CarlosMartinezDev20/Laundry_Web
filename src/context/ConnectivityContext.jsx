import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from './ToastContext';

const ConnectivityContext = createContext({ isOnline: true });

export const ConnectivityProvider = ({ children }) => {
  const toast = useToast();
  const toastRef = useRef(toast);
  const [isOnline, setIsOnline] = useState(
    () => typeof navigator !== 'undefined' && navigator.onLine,
  );
  const offlineToastShown = useRef(false);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  useEffect(() => {
    const sync = () => {
      const next = navigator.onLine;
      setIsOnline(next);
    };

    const onOnline = () => {
      sync();
      if (offlineToastShown.current) {
        offlineToastShown.current = false;
        toastRef.current.info('Conexion restablecida', 3200);
      }
    };

    const onOffline = () => {
      sync();
      if (!offlineToastShown.current) {
        offlineToastShown.current = true;
        toastRef.current.warning(
          'Sin conexion a internet. Algunas acciones no estaran disponibles.',
          5200,
        );
      }
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const value = useMemo(() => ({ isOnline }), [isOnline]);

  return (
    <ConnectivityContext.Provider value={value}>
      {children}
    </ConnectivityContext.Provider>
  );
};

export const useConnectivity = () => useContext(ConnectivityContext);
