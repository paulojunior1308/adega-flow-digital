"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
const env_1 = require("./env");
const logger_1 = __importDefault(require("./logger"));
class AppError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
    }
}
exports.AppError = AppError;
const errorHandler = (error, req, res, next) => {
    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            status: 'error',
            message: error.message,
            error: error.message
        });
    }
    logger_1.default.error(error);
    return res.status(500).json({
        status: 'error',
        message: env_1.env.nodeEnv === 'production' ? 'Erro interno do servidor' : error.message,
        error: env_1.env.nodeEnv === 'production' ? 'Erro interno do servidor' : error.message
    });
};
exports.errorHandler = errorHandler;
