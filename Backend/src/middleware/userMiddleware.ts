import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    console.error("JWT_SECRET is missing. Check your .env file.");
    return res.status(500).send({ message: "Server configuration error" });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(' ')[1] : authHeader;

  if (!token) {
    return res.status(401).send({message: "Please Provide Auth Token"});
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) {
      return res.status(403).send({message: "Unauthorized Access"});
    }
    
    (req as any).userId = decoded.id;
    next();
  });
};
