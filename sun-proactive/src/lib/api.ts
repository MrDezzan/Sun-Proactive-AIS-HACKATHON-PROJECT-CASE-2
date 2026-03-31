const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// ─── УПРАВЛЕНИЕ ТОКЕНАМИ (Token Management) ────────────────────
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

export function setToken(token: string): void {
  localStorage.setItem('auth_token', token);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth_changed'));
  }
}

export function removeToken(): void {
  localStorage.removeItem('auth_token');
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth_changed'));
  }
}

export function getUser(): { id: string; role: string; isApproved: boolean } | null {
  const token = getToken();
  if (!token) return null;
  try {
    // Декодирование JWT (из base64url в base64)
    let payload = token.split('.')[1];
    if (!payload) return null;
    
    // Исправление символов base64url
    payload = payload.replace(/-/g, '+').replace(/_/g, '/');
    
    // Декодирование с корректной обработкой URI компонентов
    const jsonPayload = decodeURIComponent(
      atob(payload)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to parse JWT', e);
    return null;
  }
}

// ─── ОБЕРТКА ДЛЯ API ЗАПРОСОВ (API Fetch Wrapper) ──────────────
export async function api(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Устанавливать Content-Type только если есть тело запроса и заголовок не задан вручную
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  return fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers,
  });
}
