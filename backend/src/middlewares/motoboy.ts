import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const motoboyMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  console.log('[MOTOBOY MIDDLEWARE] req.user:', user);

  if (!user) {
    console.log('[MOTOBOY MIDDLEWARE] Bloqueado: req.user não existe');
    return res.status(403).json({ error: 'Acesso negado. Apenas motoboys podem acessar esta rota.' });
  }
  if (String(user.role).toUpperCase() !== 'MOTOBOY') {
    console.log(`[MOTOBOY MIDDLEWARE] Bloqueado: role diferente de MOTOBOY (role recebido: ${user.role})`);
    return res.status(403).json({ error: 'Acesso negado. Apenas motoboys podem acessar esta rota.' });
  }

  console.log('[MOTOBOY MIDDLEWARE] Acesso liberado para motoboy:', user.email);
  next();
}; 