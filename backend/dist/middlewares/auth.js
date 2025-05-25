"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = exports.authMiddleware = void 0;
exports.isAdmin = isAdmin;
const jwt_1 = require("../config/jwt");
const errorHandler_1 = require("../config/errorHandler");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prismaClient = new client_1.PrismaClient();
const authMiddleware = async (req, res, next) => {
    console.log('HEADERS RECEBIDOS:', req.headers);
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            console.log('ERRO DE AUTENTICAÇÃO: Token não fornecido', req.headers);
            throw new errorHandler_1.AppError('Token não fornecido', 401);
        }
        const [, token] = authHeader.split(' ');
        if (!token) {
            console.log('ERRO DE AUTENTICAÇÃO: Token não fornecido após split', req.headers);
            throw new errorHandler_1.AppError('Token não fornecido', 401);
        }
        let decoded;
        try {
            decoded = (0, jwt_1.verifyToken)(token);
        }
        catch (e) {
            console.log('ERRO DE AUTENTICAÇÃO: Token inválido', token);
            throw new errorHandler_1.AppError('Token inválido', 401);
        }
        const user = await prismaClient.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                role: true,
            },
        });
        if (!user) {
            console.log('ERRO DE AUTENTICAÇÃO: Usuário não encontrado', decoded);
            throw new errorHandler_1.AppError('Usuário não encontrado', 401);
        }
        req.user = user;
        console.log('req.user preenchido:', req.user);
        next();
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        return res.status(401).json({ error: 'Token inválido' });
    }
};
exports.authMiddleware = authMiddleware;
const adminMiddleware = (req, res, next) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso negado' });
    }
    return next();
};
exports.adminMiddleware = adminMiddleware;
async function isAdmin(req, res, next) {
    try {
        const { authorization } = req.headers;
        if (!authorization) {
            return res.status(401).json({ error: 'Token não fornecido' });
        }
        const token = authorization.replace('Bearer', '').trim();
        const data = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'default_secret');
        if (data.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        req.userId = data.id;
        req.userRole = data.role;
        return next();
    }
    catch (_a) {
        return res.status(401).json({ error: 'Token inválido' });
    }
}
