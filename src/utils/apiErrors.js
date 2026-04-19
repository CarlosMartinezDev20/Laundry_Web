import { ApiError, NetworkError } from '../services/api';

/**
 * User-facing copy for API and network failures.
 * @param {unknown} err
 * @param {{ online?: boolean }} [opts]
 */
export function formatApiError(err, opts = {}) {
  const online =
    opts.online !== undefined
      ? opts.online
      : typeof navigator === 'undefined' || navigator.onLine;

  if (!online) {
    return 'You appear to be offline. Check your network and try again when you are back online.';
  }

  if (err instanceof NetworkError) {
    return err.message;
  }

  if (err?.name === 'AbortError') {
    return '';
  }

  if (err instanceof ApiError) {
    if (err.status >= 500) {
      return 'The server is unavailable right now. Please try again later.';
    }
    if (err.status === 408 || err.status === 504) {
      return 'The request took too long. Please try again.';
    }
    return err.message || 'The operation could not be completed.';
  }

  const msg = err && typeof err === 'object' && 'message' in err ? String(err.message) : '';
  return msg || 'Something went wrong. Please try again.';
}

export function isAbortError(err) {
  return err?.name === 'AbortError';
}
