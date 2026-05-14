import { io } from 'socket.io-client';

const URL =
  import.meta.env.VITE_SERVER_URL ||
  (import.meta.env.DEV ? 'http://localhost:3001' : window.location.origin);
export const socket = io(URL, { autoConnect: false });

export function emit(event, payload) {
  return new Promise((resolve, reject) => {
    socket.emit(event, payload, (resp) => {
      if (!resp) return resolve(null);
      if (resp.ok) resolve(resp.result);
      else reject(new Error(resp.error));
    });
  });
}
