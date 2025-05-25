import mcache from 'memory-cache';
import { Request, Response, NextFunction } from 'express';

interface CacheResponse extends Response {
  sendResponse?: Response['send'];
}

const cache = (duration: number) => {
  return (req: Request, res: CacheResponse, next: NextFunction) => {
    const key = '__express__' + req.originalUrl || req.url;
    const cachedBody = mcache.get(key);

    if (cachedBody) {
      res.send(cachedBody);
      return;
    }

    res.sendResponse = res.send;
    res.send = (body: any): Response => {
      mcache.put(key, body, duration * 1000);
      return res.sendResponse!(body);
    };

    next();
  };
};

export default cache; 