"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("./env");
const logger_1 = __importDefault(require("./logger"));
const redis = new ioredis_1.default({
    host: env_1.env.redisHost,
    port: Number(env_1.env.redisPort),
    password: env_1.env.redisPassword,
});
redis.on('connect', () => {
    logger_1.default.info('Conectado ao Redis');
});
redis.on('error', (error) => {
    logger_1.default.error('Erro na conexão com o Redis:', error);
});
exports.default = redis;
