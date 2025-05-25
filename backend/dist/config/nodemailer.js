"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("./env");
const logger_1 = __importDefault(require("./logger"));
const transporter = nodemailer_1.default.createTransport({
    host: env_1.env.smtpHost,
    port: Number(env_1.env.smtpPort),
    secure: Number(env_1.env.smtpPort) === 465,
    auth: {
        user: env_1.env.smtpUser,
        pass: env_1.env.smtpPass,
    },
});
const sendMail = async (to, subject, html) => {
    try {
        const info = await transporter.sendMail({
            from: `"Adega Flow" <${env_1.env.smtpUser}>`,
            to,
            subject,
            html,
        });
        logger_1.default.info('Email enviado:', info.messageId);
        return info;
    }
    catch (error) {
        logger_1.default.error('Erro ao enviar email:', error);
        throw error;
    }
};
exports.sendMail = sendMail;
