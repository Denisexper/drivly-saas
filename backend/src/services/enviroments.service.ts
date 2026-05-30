import logger from "../utils/logger";
import { config } from "dotenv";

config();

const requiredEnvVars = [
  "PORT",
  "DATABASE_URL",
  "JWT_SECRET",
  "JWT_EXPIRES_IN",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "FRONTEND_URL"
];

requiredEnvVars.forEach((env) => {
  if (!process.env[env]) {
    logger.error(`❌ ERROR: ${env} no está definida en el archivo .env`);
    process.exit(1);
  }
});

export const PORT = process.env.PORT;
export const DATABASE_URL = process.env.DATABASE_URL;
export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;
export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
export const RESEND_API_KEY = process.env.RESEND_API_KEY!;
export const EMAIL_FROM = process.env.EMAIL_FROM!;
export const FRONTEND_URL = process.env.FRONTEND_URL!;