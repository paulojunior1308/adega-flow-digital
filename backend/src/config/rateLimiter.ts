import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por IP
  message: 'Muitas requisições deste IP, por favor tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // limite de 5 tentativas de login por IP
  message: 'Muitas tentativas de login, por favor tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
}); 