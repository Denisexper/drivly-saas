import { JwtPayload } from "jsonwebtoken";

// Esto "abre" el módulo de Express para agregarle cosas
declare global {
  namespace Express {
    interface Request {
      // Definimos que 'user' es opcional (?) porque no todas las 
      // rutas lo tendrán (ej. el login no tiene user antes de entrar)
      user?: {
        id: string;
        tenantId: string;
        role: string;
        email: string;
        isImpersonating?: boolean;
      };
    }
  }
}