import { PrismaClient } from '@prisma/client';
import logger from './logger';

const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

prisma.$on('query', (e: { query: string }) => {
  logger.debug('Query:', e.query);
});

prisma.$on('error', (e: { message: string }) => {
  logger.error('Erro no Prisma:', e.message);
});

prisma.$on('info', (e: { message: string }) => {
  logger.info('Info do Prisma:', e.message);
});

prisma.$on('warn', (e: { message: string }) => {
  logger.warn('Aviso do Prisma:', e.message);
});

export default prisma; 