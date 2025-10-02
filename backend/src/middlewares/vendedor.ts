import { Request, Response, NextFunction } from 'express';
import { AppError } from '../config/errorHandler';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const vendedorMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'VENDEDOR') {
    return res.status(403).json({ error: 'Acesso negado. Apenas vendedores podem acessar este recurso.' });
  }

  return next();
};

export const vendedorOrAdminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'VENDEDOR' && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acesso negado. Apenas vendedores ou administradores podem acessar este recurso.' });
  }

  return next();
};