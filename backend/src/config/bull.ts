import Bull, { Job } from 'bull';
import { env } from './env';
import logger from './logger';

const redisConfig = {
  host: env.redisHost,
  port: Number(env.redisPort),
  password: env.redisPassword,
};

// Fila para processamento de relatórios
export const reportsQueue = new Bull('reports', { redis: redisConfig });

// Fila para processamento de emails
export const emailsQueue = new Bull('emails', { redis: redisConfig });

// Fila para processamento de notificações
export const notificationsQueue = new Bull('notifications', { redis: redisConfig });

// Configurar processadores
reportsQueue.process(async (job: Job) => {
  logger.info(`Processando relatório: ${job.id}`);
  // Implementar processamento de relatórios
});

emailsQueue.process(async (job: Job) => {
  logger.info(`Processando email: ${job.id}`);
  // Implementar processamento de emails
});

notificationsQueue.process(async (job: Job) => {
  logger.info(`Processando notificação: ${job.id}`);
  // Implementar processamento de notificações
}); 