import { Request, Response, NextFunction } from 'express';
import { env } from './env';
import logger from './logger';

export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      status: 'error',
      message: error.message,
      error: error.message
    });
  }

  logger.error(error);

  return res.status(500).json({
    status: 'error',
    message: env.nodeEnv === 'production' ? 'Erro interno do servidor' : error.message,
    error: env.nodeEnv === 'production' ? 'Erro interno do servidor' : error.message
  });
}; 