import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { env } from './env';
import logger from './logger';
import { setSocketInstance } from './socketInstance';

export const initializeSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: env.frontendUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  setSocketInstance(io);

  io.on('connection', (socket: Socket) => {
    logger.info(`Cliente conectado: ${socket.id}`);

    // Receber o userId do cliente e adicioná-lo à sala
    socket.on('join', (userId: string) => {
      if (userId) {
        socket.join(userId);
        logger.info(`Socket ${socket.id} entrou na sala do usuário ${userId}`);
      }
    });

    // Evento de localização do motoboy
    socket.on('motoboy-location', (data) => {
      logger.info('Localização recebida do motoboy:', data);
      // Repassar para todos os clientes (ou para uma sala específica se desejar)
      io.emit('motoboy-location', data);
    });

    socket.on('disconnect', () => {
      logger.info(`Cliente desconectado: ${socket.id}`);
    });
  });

  return io;
}; 