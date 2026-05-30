import { Request, Response, NextFunction } from "express";
import multer from "multer";
export const ErrorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  //log de error desconocido (desarrollador)
  //nombre del error y el mensaje para rapido debug
  console.error(`[Error Handler] ${err.name || "Error"}: ${err.message}`);

  // errores de multer (upload de fotos)
  if (err instanceof multer.MulterError) {
    const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    const message = err.code === "LIMIT_FILE_SIZE"
      ? "El archivo supera el tamaño máximo permitido de 10MB"
      : "Error al procesar el archivo";
    return res.status(status).json({ ok: false, message: message });
  }

  if (err.message === "Solo se permiten imágenes JPG, PNG o WEBP") {
    return res.status(415).json({ ok: false, message: err.message });
  }

  //valores por defecto en caso de desconocer el error
  let status = err.status || 500;
  let message = err.message || "Internal Server Error";

  //errores de prisma
  //P2025: Registro no encontrado(para: update, delete, get)
  if (err.code === "P2025") {
    status = 404;
    message = "Register not found";
  }

  //errores de prisma
  //intento de duplicidad de campo unico
  if (err.code === "P2002") {
    status = 400;
    message = "Resource already exist";
  }

  //errores de jwt
  if (err.name === "JsonWebTokenError") {
    status = 401;
    message = "Invalid Token or Invalid Format";
  }

  if (err.name === "TokenExpiredError") {
    status = 401;
    message = "Tu sesión ha expirado, por favor inicia sesión nuevamente";
  }

  // Ejemplo: throw { status: 403, message: "No tienes permiso" }
  if (err.status) {
    status = err.status;
    message = err.message;
  }

  // respuesta Final al Cliente
  res.status(status).json({
    ok: false,
    message: message,
    // Solo enviamos el stack (la línea exacta del error) si NO estamos en producción
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};
