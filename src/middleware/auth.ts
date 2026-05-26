import type { Request, Response, NextFunction } from 'express';

const HARDCODED_TOKEN = 'supersecreto';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token requerido' });
    return;
  }

  const token = header.slice(7);

  if (token !== HARDCODED_TOKEN) {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Token inválido' });
    return;
  }

  next();
}
