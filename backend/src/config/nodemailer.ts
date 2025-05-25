import nodemailer from 'nodemailer';
import { env } from './env';
import logger from './logger';

const transporter = nodemailer.createTransport({
  host: env.smtpHost,
  port: Number(env.smtpPort),
  secure: Number(env.smtpPort) === 465,
  auth: {
    user: env.smtpUser,
    pass: env.smtpPass,
  },
});

export const sendMail = async (to: string, subject: string, html: string) => {
  try {
    const info = await transporter.sendMail({
      from: `"Adega Flow" <${env.smtpUser}>`,
      to,
      subject,
      html,
    });

    logger.info('Email enviado:', info.messageId);
    return info;
  } catch (error) {
    logger.error('Erro ao enviar email:', error);
    throw error;
  }
}; 