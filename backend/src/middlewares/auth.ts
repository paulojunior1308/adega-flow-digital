import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../config/jwt';
import { AppError } from '../config/errorHandler';
import prisma from '../config/prisma';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const prismaClient = new PrismaClient();

interface TokenPayload {
  id: string;
  role: string;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  console.log('HEADERS RECEBIDOS:', req.headers);
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      console.log('ERRO DE AUTENTICAÇÃO: Token não fornecido', req.headers);
      throw new AppError('Token não fornecido', 401);
    }

    const [, token] = authHeader.split(' ');

    if (!token) {
      console.log('ERRO DE AUTENTICAÇÃO: Token não fornecido após split', req.headers);
      throw new AppError('Token não fornecido', 401);
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (e) {
      console.log('ERRO DE AUTENTICAÇÃO: Token inválido', token);
      throw new AppError('Token inválido', 401);
    }

    const user = await prismaClient.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      console.log('ERRO DE AUTENTICAÇÃO: Usuário não encontrado', decoded);
      throw new AppError('Usuário não encontrado', 401);
    }

    req.user = user;
    console.log('req.user preenchido:', req.user);
    next();
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
};

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN' && req.user?.role !== 'VENDEDOR') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  return next();
};

export async function isAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const { authorization } = req.headers;

    if (!authorization) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authorization.replace('Bearer', '').trim();
    const data = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as TokenPayload;

    if (data.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    req.userId = data.id;
    req.userRole = data.role;

    return next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
} 