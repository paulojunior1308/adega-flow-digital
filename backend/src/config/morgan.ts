import morgan from 'morgan';
import logger from './logger';

export const morganConfig = morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim()),
  },
}); 