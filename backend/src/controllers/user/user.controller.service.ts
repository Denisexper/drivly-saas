import logger from "../../utils/logger";
import { UserRepositoryInterface } from "../../interfaces/user/user.repository.interface";
import { UserWithCustomRole } from "../../interfaces/user/user.repository.interface";
import { Request, Response, NextFunction } from "express";
import { CreateUserInput, UpdateUserInput } from "../../types/user/user.types";
import bcrypt from "bcrypt";
import { logAction } from "../../utils/audit";

export class UserControllerService {
  private repository: UserRepositoryInterface;

  constructor(repository: UserRepositoryInterface) {
    this.repository = repository;
  }

  async getById(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    const { id } = req.params;
    try {
      const response = await this.repository.getById(id);

      if (!response) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      return res.status(200).json({
        message: "User retrived successfully",
        data: {
          id: response.id,
          tenantId: response.tenantId,
          name: response.name,
          email: response.email,
          role: response.role,
          active: response.active,
        },
      });
    } catch (error) {
      logger.error({ err: error }, `[UserController] Error en getById(${id})`);
      return next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    const isSuperAdmin = req.user!.role === "SuperAdmin";
    const tenantId = (isSuperAdmin && !req.user!.isImpersonating)
      ? (req.query.tenantId as string | undefined)
      : req.user!.tenantId;
    try {
      const response = await this.repository.getAll(tenantId);

      //solo para mostrar campos especificos visualmente, (de la base de datos siempre trae todo)
      const cleanData = response.map((user) => ({
        id: user.id,
        tenantId: user.tenantId,
        name: user.name,
        email: user.email,
        role: user.role,
        customRoleId: user.customRoleId,
        customRole: user.customRole ?? null,
        active: user.active,
      }));

      return res.status(200).json({
        mjs:
          cleanData.length > 0
            ? "User list retrived successfully"
            : "User list empty",
        data: cleanData,
        total: response.length,
      });
    } catch (error) {
      logger.error({ err: error }, `[UserController] Error en getAll()`);
      return next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    const data: CreateUserInput = req.body;

    try {
      const salt = await bcrypt.genSalt(10);
      const hasPassword = await bcrypt.hash(data.password, salt);

      const userData = {
        ...data,
        password: hasPassword,
      };

      const response = await this.repository.create(userData);

      logAction({ req, action: "CREATE", entity: "User", entityId: response.id, after: { id: response.id, name: response.name, email: response.email, role: response.role, active: response.active } });

      return res.status(201).json({
        message: "User created successfully",
        data: {
          id: response.id,
          tenantId: response.tenantId,
          name: response.name,
          email: response.email,
          role: response.role,
          active: response.active,
        },
      });
    } catch (error: any) {
      logger.error({ err: error }, `[UserController] Error en create()`);
      if (error.code === "P2002") {
        return res.status(400).json({ message: "Email already exists" });
      }
      return next(error);
    }
  }

  async update(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    const { id } = req.params;
    const data: UpdateUserInput = req.body;

    try {
      // Verificar si el usuario existe
      const userExist = await this.repository.getById(id);
      if (!userExist) {
        return res.status(404).json({ message: "User not found" });
      }

      // Lógica de Contraseña
      const updateData = { ...data };

      if (data.password && data.password.trim() !== "") {
        // Si mandó una contraseña nueva, la encriptamos
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(data.password, salt);
      } else {
        // Si no mandó password o mandó string vacío,
        // eliminamos la propiedad para que Prisma no intente tocarla.
        delete updateData.password;
      }

      // Ejecutar actualización
      const response = await this.repository.update(id, updateData);

      logAction({
        req,
        action: "UPDATE",
        entity: "User",
        entityId: id,
        before: { id: userExist.id, name: userExist.name, email: userExist.email, role: userExist.role, active: userExist.active },
        after:  { id: response.id,  name: response.name,  email: response.email,  role: response.role,  active: response.active },
      });

      return res.status(200).json({
        message: "User updated successfully",
        data: {
          id: response.id,
          name: response.name,
          email: response.email,
          role: response.role,
          active: response.active,
        },
      });
    } catch (error: any) {
      logger.error({ err: error }, `[UserController] Error en update(${id}):`);
      if (error.code === "P2002") {
        return res.status(400).json({ message: "Email already in use by another user" });
      }
      return next(error);
    }
  }

  async delete(req: Request<{id: string}>, res: Response, next: NextFunction) {

    const { id } = req.params;

    try {
      
      const response = await this.repository.delete(id)

      if(!response){
        return res.status(404).json({
          message: "User not found",
        })
      }

      logAction({ req, action: "DELETE", entity: "User", entityId: id, before: { id: response.id, name: response.name, email: response.email, role: response.role } });

      return res.status(200).json({
        message: "User deleted successfully",
        data: {
          id: response.id,
          name: response.name,
          email: response.email,
          role: response.role,
        }
      })
    } catch (error: any) {
      logger.error({ err: error }, `[UserController] Error en delete(${id}):`);
      if (error.code === "P2025") {
        return res.status(404).json({ message: "User not found" });
      }
      return next(error);
    }
  }
}
