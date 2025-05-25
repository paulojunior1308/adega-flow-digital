import * as Sentry from '@sentry/node';
import { env } from './env';

export const initializeSentry = () => {
  if (env.nodeEnv === 'production') {
    Sentry.init({
      // dsn: env.sentryDsn, // Removido pois não existe no env
      environment: env.nodeEnv,
      tracesSampleRate: 1.0,
    });
  }
}; 