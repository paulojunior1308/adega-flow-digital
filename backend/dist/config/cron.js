"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeCron = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const bull_1 = require("./bull");
const logger_1 = __importDefault(require("./logger"));
const initializeCron = () => {
    node_cron_1.default.schedule('0 * * * *', () => {
        logger_1.default.info('Limpando cache...');
    });
    node_cron_1.default.schedule('0 */6 * * *', () => {
        logger_1.default.info('Verificando estoque...');
    });
    node_cron_1.default.schedule('0 0 * * *', () => {
        logger_1.default.info('Gerando relatórios diários...');
        bull_1.reportsQueue.add('daily', {
            type: 'daily',
            date: new Date(),
        });
    });
};
exports.initializeCron = initializeCron;
