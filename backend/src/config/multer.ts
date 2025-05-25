import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { env } from './env';
import { AppError } from './errorHandler';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, env.uploadDir);
  },
  filename: (req, file, cb) => {
    const fileHash = crypto.randomBytes(10).toString('hex');
    const fileName = `${fileHash}-${file.originalname}`;
    cb(null, fileName);
  },
});

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg',
    'image/pjpeg',
    'image/png',
    'image/gif',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Tipo de arquivo inválido.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.maxFileSize,
  },
}); 