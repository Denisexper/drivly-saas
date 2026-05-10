import { Resend } from "resend";
import { RESEND_API_KEY, EMAIL_FROM } from "../services/enviroments.service";

export const resend = new Resend(RESEND_API_KEY);
export { EMAIL_FROM };
