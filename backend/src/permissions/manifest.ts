export const PERMISSIONS = {
  // Vehículos
  VEHICLES_READ:   { key: "vehicles:read",   module: "Vehículos",  action: "Ver",      description: "Ver listado y detalle de vehículos" },
  VEHICLES_CREATE: { key: "vehicles:create", module: "Vehículos",  action: "Crear",    description: "Crear nuevos vehículos" },
  VEHICLES_UPDATE: { key: "vehicles:update", module: "Vehículos",  action: "Editar",   description: "Editar vehículos existentes" },
  VEHICLES_DELETE: { key: "vehicles:delete", module: "Vehículos",  action: "Eliminar", description: "Eliminar vehículos" },
  // Clientes
  CLIENTS_READ:   { key: "clients:read",   module: "Clientes", action: "Ver",      description: "Ver listado y detalle de clientes" },
  CLIENTS_CREATE: { key: "clients:create", module: "Clientes", action: "Crear",    description: "Crear nuevos clientes" },
  CLIENTS_UPDATE: { key: "clients:update", module: "Clientes", action: "Editar",   description: "Editar clientes existentes" },
  CLIENTS_DELETE: { key: "clients:delete", module: "Clientes", action: "Eliminar", description: "Eliminar clientes" },
  // Alquileres
  RENTALS_READ:   { key: "rentals:read",   module: "Alquileres", action: "Ver",      description: "Ver listado y detalle de alquileres" },
  RENTALS_CREATE: { key: "rentals:create", module: "Alquileres", action: "Crear",    description: "Crear nuevos alquileres" },
  RENTALS_UPDATE: { key: "rentals:update", module: "Alquileres", action: "Editar",   description: "Editar y retornar alquileres" },
  RENTALS_DELETE: { key: "rentals:delete", module: "Alquileres", action: "Eliminar", description: "Cancelar y eliminar alquileres" },
  // Pagos
  PAYMENTS_READ:   { key: "payments:read",   module: "Pagos", action: "Ver",      description: "Ver listado de pagos" },
  PAYMENTS_CREATE: { key: "payments:create", module: "Pagos", action: "Crear",    description: "Registrar nuevos pagos" },
  PAYMENTS_DELETE: { key: "payments:delete", module: "Pagos", action: "Eliminar", description: "Eliminar pagos" },
  // Usuarios
  USERS_READ:   { key: "users:read",   module: "Usuarios", action: "Ver",      description: "Ver listado de usuarios" },
  USERS_CREATE: { key: "users:create", module: "Usuarios", action: "Crear",    description: "Crear nuevos usuarios" },
  USERS_UPDATE: { key: "users:update", module: "Usuarios", action: "Editar",   description: "Editar usuarios existentes" },
  USERS_DELETE: { key: "users:delete", module: "Usuarios", action: "Eliminar", description: "Eliminar usuarios" },
  // Roles
  ROLES_MANAGE: { key: "roles:manage", module: "Roles", action: "Gestionar", description: "Crear y gestionar roles y permisos" },
  // Reportes
  REPORTS_READ: { key: "reports:read", module: "Reportes", action: "Ver", description: "Ver reportes de cierre de caja y cuentas por cobrar" },
  // Auditoría
  AUDIT_READ: { key: "audit:read", module: "Auditoría", action: "Ver", description: "Ver logs de auditoría del sistema" },
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]["key"];

// Permisos por defecto para cada rol base al crear un tenant
export const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionKey[]> = {
  Admin: Object.values(PERMISSIONS).map((p) => p.key) as PermissionKey[],
  Operator: [
    "vehicles:read",
    "clients:read", "clients:create", "clients:update",
    "rentals:read",  "rentals:create",  "rentals:update",
    "payments:read", "payments:create",
  ],
  Auditor: [
    "vehicles:read",
    "clients:read",
    "rentals:read",
    "payments:read",
    "reports:read",
    "audit:read",
  ],
};
