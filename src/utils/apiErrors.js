import { ApiError, NetworkError } from '../services/api';

/**
 * User-facing Spanish copy for API and network failures.
 * @param {unknown} err
 * @param {{ online?: boolean }} [opts]
 */
export function formatApiError(err, opts = {}) {
  const online =
    opts.online !== undefined
      ? opts.online
      : typeof navigator === 'undefined' || navigator.onLine;

  if (!online) {
    return 'Sin conexión. Revisa tu red e inténtalo cuando vuelvas a estar en línea.';
  }

  if (err instanceof NetworkError) {
    return err.message;
  }

  if (err?.name === 'AbortError') {
    return '';
  }

  if (err instanceof ApiError) {
    if (err.status >= 500) {
      return 'El servidor no está disponible en este momento. Inténtalo más tarde.';
    }
    if (err.status === 408 || err.status === 504) {
      return 'La petición tardó demasiado. Inténtalo de nuevo.';
    }
    return err.message || 'No se pudo completar la operación.';
  }

  const msg = err && typeof err === 'object' && 'message' in err ? String(err.message) : '';
  return msg || 'Algo salió mal. Inténtalo de nuevo.';
}

export function isAbortError(err) {
  return err?.name === 'AbortError';
}
