import { User } from "@prisma/client"

export type LoginInput = Pick<User, 'password' | 'email'> & { slug?: string };

export type RegisterInput = Pick<User, 'name' | 'email' | 'password' | 'tenantId'>;

export interface CompanyRegisterInput {
  companyName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
}
