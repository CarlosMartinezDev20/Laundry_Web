import React from 'react';
import { WifiSlash } from '@phosphor-icons/react';

export const OfflineBanner = () => (
  <div className="offline-banner" role="status" aria-live="polite">
    <WifiSlash size={18} weight="duotone" aria-hidden />
    <span>Sin conexion. Los datos pueden no actualizarse.</span>
  </div>
);
