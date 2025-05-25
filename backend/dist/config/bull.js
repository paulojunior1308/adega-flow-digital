"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsQueue = exports.emailsQueue = exports.reportsQueue = void 0;
const bull_1 = __importDefault(require("bull"));
const env_1 = require("./env");
const logger_1 = __importDefault(require("./logger"));
const redisConfig = {
    host: env_1.env.redisHost,
    port: Number(env_1.env.redisPort),
    password: env_1.env.redisPassword,
};
exports.reportsQueue = new bull_1.default('reports', { redis: redisConfig });
exports.emailsQueue = new bull_1.default('emails', { redis: redisConfig });
exports.notificationsQueue = new bull_1.default('notifications', { redis: redisConfig });
exports.reportsQueue.process(async (job) => {
    logger_1.default.info(`Processando relatório: ${job.id}`);
});
exports.emailsQueue.process(async (job) => {
    logger_1.default.info(`Processando email: ${job.id}`);
});
exports.notificationsQueue.process(async (job) => {
    logger_1.default.info(`Processando notificação: ${job.id}`);
});
