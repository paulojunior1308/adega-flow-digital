import { Server } from 'socket.io';

let io: Server | null = null;

export const setSocketInstance = (instance: Server) => {
  io = instance;
};

export const getSocketInstance = () => io; 