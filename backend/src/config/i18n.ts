import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import { env } from './env';

i18next
  .use(Backend)
  .init({
    lng: 'pt-BR',
    fallbackLng: 'pt-BR',
    debug: env.nodeEnv === 'development',
    backend: {
      loadPath: './locales/{{lng}}/{{ns}}.json',
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18next; 