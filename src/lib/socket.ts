import { io, Socket } from 'socket.io-client';
import { API_ORIGIN } from '../api/client';

/**
 * One shared connection for the whole app, mirroring how `api/client.ts` keeps one axios
 * instance rather than one per screen. Connected on sign-in/restore and disconnected on
 * sign-out by `AuthProvider` — chat screens just read `getSocket()` and add/remove listeners.
 */
let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  if (socket) {
    socket.auth = { token };
    if (!socket.connected) socket.connect();
    return socket;
  }

  socket = io(API_ORIGIN, {
    auth: { token },
    transports: ['websocket'],
  });

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function getSocket(): Socket | null {
  return socket;
}
