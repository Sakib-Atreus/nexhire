import axios from 'axios';
import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

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
    if (err.response?.status !== 401 || orig?._retry) return Promise.reject(err);
    const refreshToken = Cookies.get('refreshToken');
    if (!refreshToken) {
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      if (typeof window !== 'undefined') window.location.href = '/login';
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
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      if (typeof window !== 'undefined') window.location.href = '/login';
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
