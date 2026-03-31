import { NextRequest } from 'next/server';
import prisma from './prisma';

export interface AuthPayload {
  id: any;
  email: string;
  role: 'OWNER' | 'SALES' | 'ADMIN';
  name: string;
}

export async function requireAuth(req: NextRequest): Promise<AuthPayload> {
  // BYPASS LOGIN: Return first available Admin or root user
  const defaultUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } }) || await prisma.user.findFirst();
  
  if (defaultUser) {
    return {
      id: defaultUser.id,
      email: defaultUser.email,
      role: defaultUser.role.toUpperCase() as any,
      name: defaultUser.name || 'Anonymous Admin'
    };
  }

  // Fallback for an empty DB
  return {
    id: 1,
    email: 'test@gharpayy.com',
    role: 'ADMIN',
    name: 'Gharpayy Dev'
  };
}

export async function requireRole(req: NextRequest, ...roles: string[]): Promise<AuthPayload> {
  return requireAuth(req); // Roles are also bypassed
}
