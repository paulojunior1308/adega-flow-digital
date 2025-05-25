import cron from 'node-cron';
import { reportsQueue } from './bull';
import logger from './logger';

export const initializeCron = () => {
  // Limpar cache a cada 1 hora
  cron.schedule('0 * * * *', () => {
    logger.info('Limpando cache...');
    // Implementar limpeza de cache
  });

  // Verificar estoque a cada 6 horas
  cron.schedule('0 */6 * * *', () => {
    logger.info('Verificando estoque...');
    // Implementar verificação de estoque
  });

  // Gerar relatórios diários à meia-noite
  cron.schedule('0 0 * * *', () => {
    logger.info('Gerando relatórios diários...');
    reportsQueue.add('daily', {
      type: 'daily',
      date: new Date(),
    });
  });
}; 