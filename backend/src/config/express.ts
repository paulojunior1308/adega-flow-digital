import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import { env } from './env';
import { errorHandler } from './errorHandler';
import { sanitizeRequest } from './sanitizer';
import { swaggerSpec } from './swagger';
import logger from './logger';
import routes from '../routes';

export const initializeExpress = (app: Express) => {
  // Configurações básicas
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS
  const allowedOrigins = [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
  ];

  // Permite múltiplos domínios em FRONTEND_URL separados por vírgula
  if (env.frontendUrl) {
    env.frontendUrl.split(',').forEach((url: string) => {
      const trimmed = url.trim();
      if (trimmed && !allowedOrigins.includes(trimmed)) {
        allowedOrigins.push(trimmed);
      }
    });
  }

  app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 200 // Para compatibilidade com alguns navegadores
  }));

  // Tratamento específico para requisições OPTIONS (preflight)
  app.options('*', cors());

  // Helmet
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  }));

  // Rate Limiter
  // const limiter = rateLimit({
  //   windowMs: 15 * 60 * 1000, // 15 minutos
  //   max: 100, // limite de 100 requisições por IP
  //   message: 'Muitas requisições deste IP, tente novamente mais tarde.'
  // });
  // app.use(limiter);

  // Compression
  app.use(compression());

  // Morgan
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  }));

  // Swagger
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Sanitização
  app.use(sanitizeRequest);

  // Log de todas as requisições recebidas
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
    next();
  });

  // Rotas básicas
  app.get('/', (req, res) => {
    res.json({ message: 'API do Sistema PDV - Adega Flow' });
  });

  // Registrando as rotas
  app.use('/api', routes);

  // Servir arquivos estáticos da pasta uploads
  app.use('/uploads', express.static('uploads'));

  // Error Handler
  app.use(errorHandler);
}; 