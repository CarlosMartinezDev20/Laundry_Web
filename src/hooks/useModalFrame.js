import { useState, useEffect, useCallback } from 'react';

/**
 * Modal lifecycle: keep mounted for exit animation, body scroll lock, Escape to close.
 * Animations use compositor-friendly properties only (opacity, transform).
 */
export function useModalFrame(isOpen, { onClose, closeDisabled = false } = {}) {
  const [state, setState] = useState(() => ({
    mounted: Boolean(isOpen),
    closing: false,
  }));

  useEffect(() => {
    if (isOpen) {
      setState({ mounted: true, closing: false });
    } else {
      setState((s) => (s.mounted ? { mounted: true, closing: true } : s));
    }
  }, [isOpen]);

  const finishClosing = useCallback(() => {
    setState((s) => (s.closing ? { mounted: false, closing: false } : s));
  }, []);

  const { mounted, closing } = state;

  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted || closeDisabled) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mounted, closeDisabled, onClose]);

  return { mounted, closing, finishClosing };
}
