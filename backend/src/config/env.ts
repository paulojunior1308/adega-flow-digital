import { z } from 'zod';
import { config } from 'dotenv';

config();

const envSchema = z.object({
  // Ambiente
  nodeEnv: z.enum(['development', 'test', 'production']).default('development'),
  
  // Servidor
  port: z.coerce.number().default(3333),
  host: z.string().default('localhost'),
  
  // Frontend
  frontendUrl: z.string().default('https://adega-element.netlify.app'),
  
  // Banco de dados
  databaseUrl: z.string(),
  
  // JWT
  jwtSecret: z.string(),
  jwtExpiresIn: z.string().default('1d'),
  
  // Redis
  redisHost: z.string().default('localhost'),
  redisPort: z.coerce.number().default(6379),
  redisPassword: z.string().optional(),
  
  // Email
  smtpHost: z.string().optional(),
  smtpPort: z.coerce.number().optional(),
  smtpUser: z.string().optional(),
  smtpPass: z.string().optional(),
  
  // Google OAuth
  googleClientId: z.string().optional(),
  googleClientSecret: z.string().optional(),
  
  // Upload
  uploadDir: z.string().default('uploads'),
  maxFileSize: z.coerce.number().default(5 * 1024 * 1024), // 5MB
  
  // Mercado Pago
  MP_ACCESS_TOKEN: z.string(),
});

const _env = envSchema.safeParse({
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT,
  host: process.env.HOST,
  frontendUrl: process.env.FRONTEND_URL,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  redisHost: process.env.REDIS_HOST,
  redisPort: process.env.REDIS_PORT,
  redisPassword: process.env.REDIS_PASSWORD,
  smtpHost: process.env.SMTP_HOST,
  smtpPort: process.env.SMTP_PORT,
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  uploadDir: process.env.UPLOAD_DIR,
  maxFileSize: process.env.MAX_FILE_SIZE,
  MP_ACCESS_TOKEN: process.env.MP_ACCESS_TOKEN,
});

if (!_env.success) {
  console.error('❌ Variáveis de ambiente inválidas:', _env.error.format());
  throw new Error('Variáveis de ambiente inválidas');
}

export const env = _env.data; 