import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL, {
  transports: ['websocket'],
  autoConnect: true,
  withCredentials: true,
});

export default socket; 