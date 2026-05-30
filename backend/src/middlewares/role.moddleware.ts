import { Request, Response, NextFunction } from "express";

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "No autenticado" });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        message: `Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(", ")}`,
      });
    }

    next();
  };
};
