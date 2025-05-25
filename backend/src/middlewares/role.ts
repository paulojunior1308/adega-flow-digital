import { Request, Response, NextFunction } from 'express';
import { AppError } from '../config/errorHandler';

export function authorizeRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const userRole = req.user?.role;
    console.log('ROLE CHECK:', { userRole, roles });

    if (!userRole) {
      throw new AppError('Usuário não autenticado', 401);
    }

    if (!roles.includes(userRole)) {
      throw new AppError('Acesso negado. Você não tem permissão para acessar este recurso.', 403);
    }

    next();
  };
} 