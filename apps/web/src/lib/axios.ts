import axios from 'axios';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/store/authStore';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  // The free API host sleeps when idle and needs up to a minute to wake; give up only after that.
  timeout: 70_000,
});

/** Network failures, timeouts and gateway errors (e.g. while the API host is waking up) are worth retrying. */
export function isTransientError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  if (!error.response) return true; // network error / timeout / CORS during a restart
  return [408, 425, 429, 500, 502, 503, 504].includes(error.response.status);
}

let isRefreshing = false;
let pendingQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function flushQueue(err: unknown, token: string | null) {
  pendingQueue.forEach(p => (err ? p.reject(err) : p.resolve(token!)));
  pendingQueue = [];
}

api.interceptors.request.use(config => {
  const token = Cookies.get('accessToken');
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});

api.interceptors.response.use(
  res => res,
  async err => {
    const orig = err.config;
    // Auth endpoints (login, register, refresh…) report their own 401s; don't treat them as an expired session.
    const isAuthCall = typeof orig?.url === 'string' && orig.url.startsWith('/auth/');
    if (err.response?.status !== 401 || orig?._retry || isAuthCall) return Promise.reject(err);
    const refreshToken = Cookies.get('refreshToken');
    if (!refreshToken) {
      useAuthStore.getState().clearAuth();
      if (typeof window !== 'undefined') window.location.href = '/login?expired=1';
      return Promise.reject(err);
    }
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then(token => {
        orig.headers.Authorization = 'Bearer ' + token;
        return api(orig);
      });
    }
    orig._retry = true;
    isRefreshing = true;
    try {
      const { data } = await axios.post<{ accessToken: string }>(BASE_URL + '/auth/refresh', { refreshToken });
      Cookies.set('accessToken', data.accessToken, { expires: 1 });
      api.defaults.headers.common.Authorization = 'Bearer ' + data.accessToken;
      flushQueue(null, data.accessToken);
      orig.headers.Authorization = 'Bearer ' + data.accessToken;
      return api(orig);
    } catch (refreshErr) {
      flushQueue(refreshErr, null);
      useAuthStore.getState().clearAuth();
      if (typeof window !== 'undefined') window.location.href = '/login?expired=1';
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
