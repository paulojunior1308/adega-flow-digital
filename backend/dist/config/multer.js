"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("./env");
const errorHandler_1 = require("./errorHandler");
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, env_1.env.uploadDir);
    },
    filename: (req, file, cb) => {
        const fileHash = crypto_1.default.randomBytes(10).toString('hex');
        const fileName = `${fileHash}-${file.originalname}`;
        cb(null, fileName);
    },
});
const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        'image/jpeg',
        'image/pjpeg',
        'image/png',
        'image/gif',
    ];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new errorHandler_1.AppError('Tipo de arquivo inválido.'));
    }
};
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: env_1.env.maxFileSize,
    },
});
