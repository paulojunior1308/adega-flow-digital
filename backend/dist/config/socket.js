"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSocket = void 0;
const socket_io_1 = require("socket.io");
const env_1 = require("./env");
const logger_1 = __importDefault(require("./logger"));
const socketInstance_1 = require("./socketInstance");
const initializeSocket = (httpServer) => {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: env_1.env.frontendUrl,
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });
    (0, socketInstance_1.setSocketInstance)(io);
    io.on('connection', (socket) => {
        logger_1.default.info(`Cliente conectado: ${socket.id}`);
        socket.on('join', (userId) => {
            if (userId) {
                socket.join(userId);
                logger_1.default.info(`Socket ${socket.id} entrou na sala do usuário ${userId}`);
            }
        });
        socket.on('motoboy-location', (data) => {
            logger_1.default.info('Localização recebida do motoboy:', data);
            io.emit('motoboy-location', data);
        });
        socket.on('disconnect', () => {
            logger_1.default.info(`Cliente desconectado: ${socket.id}`);
        });
    });
    return io;
};
exports.initializeSocket = initializeSocket;
