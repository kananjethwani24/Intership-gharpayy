import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'gharpayy_secure_secret_2024';

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'owner' | 'user';
  name?: string;
  username?: string;
}

export async function setAuthCookie(user: AuthUser) {
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
  const cookieStore = await cookies();
  
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
  
  return token;
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function isAdmin() {
  const user = await getAuthUser();
  return user?.role === 'admin';
}

export async function isOwner() {
  const user = await getAuthUser();
  return user?.role === 'owner';
}
