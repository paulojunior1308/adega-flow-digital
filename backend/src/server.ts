import 'reflect-metadata';
import express from 'express';
import { createServer } from 'http';
import { env } from './config/env';
import { initializeExpress } from './config/express';
import { initializeSocket } from './config/socket';
import { initializeCron } from './config/cron';
import { initializeSentry } from './config/sentry';
import logger from './config/logger';

const app = express();
const httpServer = createServer(app);

// Inicializar Sentry
initializeSentry();

// Inicializar Express
initializeExpress(app);

// Inicializar Socket.IO
const io = initializeSocket(httpServer);

// Inicializar Cron Jobs
initializeCron();

// Iniciar servidor
httpServer.listen(env.port, '0.0.0.0', () => {
  logger.info(`Servidor rodando na porta ${env.port}`);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (error: Error) => {
  logger.error('Erro não tratado:', error);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Exceção não capturada:', error);
  process.exit(1);
}); 