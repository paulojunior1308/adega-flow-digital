import nodemailer from 'nodemailer';
import { env } from './env';

const transporter = nodemailer.createTransport({
  host: env.smtpHost,
  port: Number(env.smtpPort),
  secure: Number(env.smtpPort) === 465,
  auth: {
    user: env.smtpUser,
    pass: env.smtpPass,
  },
});

export const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
  await transporter.sendMail({
    from: env.smtpUser,
    to,
    subject,
    html,
  });
}; 