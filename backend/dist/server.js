"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const env_1 = require("./config/env");
const express_2 = require("./config/express");
const socket_1 = require("./config/socket");
const cron_1 = require("./config/cron");
const sentry_1 = require("./config/sentry");
const logger_1 = __importDefault(require("./config/logger"));
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
(0, sentry_1.initializeSentry)();
(0, express_2.initializeExpress)(app);
const io = (0, socket_1.initializeSocket)(httpServer);
(0, cron_1.initializeCron)();
httpServer.listen(env_1.env.port, '0.0.0.0', () => {
    logger_1.default.info(`Servidor rodando na porta ${env_1.env.port}`);
});
process.on('unhandledRejection', (error) => {
    logger_1.default.error('Erro não tratado:', error);
});
process.on('uncaughtException', (error) => {
    logger_1.default.error('Exceção não capturada:', error);
    process.exit(1);
});
