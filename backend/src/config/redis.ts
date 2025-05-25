import Redis from 'ioredis';
import { env } from './env';
import logger from './logger';

const redis = new Redis({
  host: env.redisHost,
  port: Number(env.redisPort),
  password: env.redisPassword,
});

redis.on('connect', () => {
  logger.info('Conectado ao Redis');
});

redis.on('error', (error: Error) => {
  logger.error('Erro na conexão com o Redis:', error);
});

export default redis; 