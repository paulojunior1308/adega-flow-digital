"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const envSchema = zod_1.z.object({
    nodeEnv: zod_1.z.enum(['development', 'test', 'production']).default('development'),
    port: zod_1.z.coerce.number().default(3333),
    host: zod_1.z.string().default('localhost'),
    frontendUrl: zod_1.z.string().default('https://adega-element.netlify.app'),
    databaseUrl: zod_1.z.string(),
    jwtSecret: zod_1.z.string(),
    jwtExpiresIn: zod_1.z.string().default('1d'),
    redisHost: zod_1.z.string().default('localhost'),
    redisPort: zod_1.z.coerce.number().default(6379),
    redisPassword: zod_1.z.string().optional(),
    smtpHost: zod_1.z.string().optional(),
    smtpPort: zod_1.z.coerce.number().optional(),
    smtpUser: zod_1.z.string().optional(),
    smtpPass: zod_1.z.string().optional(),
    googleClientId: zod_1.z.string().optional(),
    googleClientSecret: zod_1.z.string().optional(),
    uploadDir: zod_1.z.string().default('uploads'),
    maxFileSize: zod_1.z.coerce.number().default(5 * 1024 * 1024),
    MP_ACCESS_TOKEN: zod_1.z.string(),
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
exports.env = _env.data;
