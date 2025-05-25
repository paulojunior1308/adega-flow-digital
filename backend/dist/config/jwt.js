"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("./env");
const errorHandler_1 = require("./errorHandler");
const generateToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, env_1.env.jwtSecret, {
        expiresIn: env_1.env.jwtExpiresIn,
    });
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, env_1.env.jwtSecret);
    }
    catch (error) {
        throw new errorHandler_1.AppError('Token inválido', 401);
    }
};
exports.verifyToken = verifyToken;
