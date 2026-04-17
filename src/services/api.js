const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/** Thrown when fetch fails (network, DNS, CORS, server down). */
export class NetworkError extends Error {
  constructor(message, code = 'NETWORK') {
    super(message);
    this.name = 'NetworkError';
    this.code = code;
  }
}

const NETWORK_MESSAGE =
  'No hay conexión o el servidor no responde. Comprueba tu red e inténtalo de nuevo.';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (e) {
    if (e?.name === 'AbortError') throw e;
    throw new NetworkError(NETWORK_MESSAGE, 'NETWORK');
  }

  if (!response.ok) {
    if (response.status === 401) {
      // Auto-logout logic
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth-unauthorized'));
    }
    
    // Attempt to parse standard NestJS error response (message string or array)
    let errorMessage = 'An error occurred';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
      if (Array.isArray(errorMessage)) {
        errorMessage = errorMessage.join(', ');
      }
    } catch {
      // Fallback if not JSON
    }
    
    throw new ApiError(errorMessage, response.status);
  }

  // Handle empty responses (204 No Content, or any success with no body)
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export const api = {
  get: (endpoint, options = {}) => request(endpoint, options),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  patch: (endpoint, body) => request(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};
