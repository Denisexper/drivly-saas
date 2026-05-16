import jwt from "jsonwebtoken";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../services/enviroments.service";


//informacion que ira en el token
interface TokenPayload {
  id: string;
  tenantId: string;
  role: string;
  email: string;
  isImpersonating?: boolean;
}

//funicon para generar el token
export const generateToken = (payload: TokenPayload,) => {

    const token = jwt.sign(payload, JWT_SECRET!, {
        expiresIn: JWT_EXPIRES_IN as any,
    })

    return token;
}