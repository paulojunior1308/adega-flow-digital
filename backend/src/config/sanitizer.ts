import { Request, Response, NextFunction } from 'express';
import { sanitize } from 'class-sanitizer';

export const sanitizeRequest = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    sanitize(req.body);
  }
  if (req.query) {
    sanitize(req.query);
  }
  if (req.params) {
    sanitize(req.params);
  }
  next();
}; 