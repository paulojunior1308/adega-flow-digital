import mercadopago from 'mercadopago';
import { env } from './env';

(mercadopago as any).config.access_token = env.MP_ACCESS_TOKEN;

export default mercadopago; 