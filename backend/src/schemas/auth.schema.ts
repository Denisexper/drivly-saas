import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
  slug: z.string().optional(),
});

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  tenantId: z.string().min(1, "tenantId is required"),
});

export const companyRegisterSchema = z.object({
  companyName: z.string().min(2, "El nombre de la empresa debe tener al menos 2 caracteres"),
  ownerName: z.string().min(2, "Tu nombre debe tener al menos 2 caracteres"),
  ownerEmail: z.string().email("Email inválido"),
  ownerPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});
