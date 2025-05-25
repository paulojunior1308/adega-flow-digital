"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeExpress = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const errorHandler_1 = require("./errorHandler");
const sanitizer_1 = require("./sanitizer");
const swagger_1 = require("./swagger");
const logger_1 = __importDefault(require("./logger"));
const routes_1 = __importDefault(require("../routes"));
const initializeExpress = (app) => {
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use((0, cors_1.default)({
        origin: [
            'http://172.17.77.169:8080',
            'http://172.17.77.169:3000',
            'http://172.17.77.169:5173',
            'http://localhost:8080',
            'http://localhost:3000',
            'http://localhost:5173',
        ],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    }));
    app.use((0, helmet_1.default)({
        crossOriginResourcePolicy: { policy: 'cross-origin' }
    }));
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: 'Muitas requisições deste IP, tente novamente mais tarde.'
    });
    app.use(limiter);
    app.use((0, compression_1.default)());
    app.use((0, morgan_1.default)('combined', {
        stream: {
            write: (message) => logger_1.default.info(message.trim()),
        },
    }));
    app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
    app.use(sanitizer_1.sanitizeRequest);
    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
        next();
    });
    app.get('/', (req, res) => {
        res.json({ message: 'API do Sistema PDV - Adega Flow' });
    });
    app.use('/api', routes_1.default);
    app.use('/uploads', express_1.default.static('uploads'));
    app.use(errorHandler_1.errorHandler);
};
exports.initializeExpress = initializeExpress;
