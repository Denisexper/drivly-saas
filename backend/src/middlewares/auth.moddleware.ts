import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../services/enviroments.service";


export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  //obtener el token del header 'Authorization'
  const authHeader = req.headers.authorization;

  //virificar si el token vienen en la peticon
  if (!authHeader) {
    return res.status(401).json({
      msj: "No authorization header provided",
    });
  }

  //separar el token de la palabra Bearer
  const token = authHeader.split(" ")[1];

  //verificar el formato correcto
  if (!token) {
    return res.status(401).json({
      msj: "Invalid token format. Expected: Bearer <token>",
    });
  }

  try {
    //verificar el token con la llave secreta
    //! para que TS no se queje de que no podria estar
    const decoded = jwt.verify(token, JWT_SECRET!) as any;

    // inyeccion guardamos los datos del toekn en el objeto req
    req.user = {
      id: decoded.id,
      tenantId: decoded.tenantId,
      role: decoded.role,
      email: decoded.email,
      isImpersonating: decoded.isImpersonating ?? false,
    };

    //si todo esta bien pasamos al controlador o a la ruta de la peticion
    next();
  } catch (error) {
    console.error("[AuthMiddleware] Token verification failed:", error);
    return res.status(401).json({
      msj: "Invalid or expired token",
    });
  }
};
