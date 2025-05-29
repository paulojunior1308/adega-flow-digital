import mercadopago, { Payment } from 'mercadopago';
import { env } from './env';

if ((mercadopago as any).config) {
  (mercadopago as any).config.access_token = env.MP_ACCESS_TOKEN;
} else {
  (mercadopago as any).access_token = env.MP_ACCESS_TOKEN;
}

console.log('Access Token carregado do ambiente:', process.env.MP_ACCESS_TOKEN);

export const payment = new Payment((mercadopago as any));
export default mercadopago;