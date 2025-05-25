"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("./env");
const transporter = nodemailer_1.default.createTransport({
    host: env_1.env.smtpHost,
    port: Number(env_1.env.smtpPort),
    secure: Number(env_1.env.smtpPort) === 465,
    auth: {
        user: env_1.env.smtpUser,
        pass: env_1.env.smtpPass,
    },
});
const sendEmail = async (to, subject, html) => {
    await transporter.sendMail({
        from: env_1.env.smtpUser,
        to,
        subject,
        html,
    });
};
exports.sendEmail = sendEmail;
