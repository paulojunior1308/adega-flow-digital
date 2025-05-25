import cors from 'cors';
import { env } from './env';

export const corsOptions: cors.CorsOptions = {
  origin: env.frontendUrl,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400, // 24 horas
};

export const corsMiddleware = cors(corsOptions); 