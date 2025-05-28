import mercadopago from 'mercadopago';
import { env } from './env';

if ((mercadopago as any).config) {
  (mercadopago as any).config.access_token = env.MP_ACCESS_TOKEN;
} else {
  (mercadopago as any).access_token = env.MP_ACCESS_TOKEN;
}

export default mercadopago;