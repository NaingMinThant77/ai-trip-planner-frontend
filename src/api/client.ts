import Constants from 'expo-constants';
import axios, { AxiosError, AxiosInstance } from 'axios';
import { Platform } from 'react-native';

/**
 * Generation can take ~30s (memory/01-product.md), so the default 0/none timeout is replaced
 * with one comfortably above the slowest endpoint rather than a typical REST timeout.
 */
const REQUEST_TIMEOUT_MS = 60_000;

/**
 * A phone cannot reach the dev machine's `localhost`. Expo reports the packager host it was
 * reached on, so we reuse that IP and swap in the API port.
 */
function inferDevBaseUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit) return explicit;

  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost;
  const host = hostUri?.split(':')[0];

  if (host) return `http://${host}:3000/api`;

  // Android emulator maps the host machine to 10.0.2.2; everything else can use localhost.
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api';
}

export const API_BASE_URL = inferDevBaseUrl();

/** Origin without the /api suffix — photo URLs from the server are origin-relative. */
export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, '');

/** Turns a server-relative path such as "/api/uploads/abc.jpg" into a loadable URL. */
export function toAbsoluteUrl(path: string): string {
  return path.startsWith('http') ? path : `${API_ORIGIN}${path}`;
}

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

let authToken: string | null = null;

/** Called by the auth context on sign-in, restore, and sign-out. */
export function setAuthToken(token: string | null): void {
  authToken = token;
}

/** Read by the chat socket connection, which authenticates its handshake the same way. */
export function getAuthToken(): string | null {
  return authToken;
}

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

/** Normalised error the UI can render directly. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }
}

type ErrorBody = { message?: string | string[] };

/** Nest's ValidationPipe returns `message` as an array; everything else returns a string. */
function readMessage(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) return null;
  const { message } = body as ErrorBody;
  if (Array.isArray(message)) return message.join('\n');
  if (typeof message === 'string') return message;
  return null;
}

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      throw new ApiError('Something went wrong.', null);
    }

    const axiosError = error as AxiosError;

    if (axiosError.code === 'ECONNABORTED') {
      throw new ApiError('That took too long. Please try again.', null);
    }
    if (!axiosError.response) {
      throw new ApiError(
        `Cannot reach the server at ${API_BASE_URL}. Is the backend running?`,
        null,
      );
    }

    const status = axiosError.response.status;
    throw new ApiError(
      readMessage(axiosError.response.data) ?? 'Something went wrong.',
      status,
    );
  },
);
