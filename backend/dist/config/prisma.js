"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("./logger"));
const prisma = new client_1.PrismaClient({
    log: [
        {
            emit: 'event',
            level: 'query',
        },
        {
            emit: 'event',
            level: 'error',
        },
        {
            emit: 'event',
            level: 'info',
        },
        {
            emit: 'event',
            level: 'warn',
        },
    ],
});
prisma.$on('query', (e) => {
    logger_1.default.debug('Query:', e.query);
});
prisma.$on('error', (e) => {
    logger_1.default.error('Erro no Prisma:', e.message);
});
prisma.$on('info', (e) => {
    logger_1.default.info('Info do Prisma:', e.message);
});
prisma.$on('warn', (e) => {
    logger_1.default.warn('Aviso do Prisma:', e.message);
});
exports.default = prisma;
