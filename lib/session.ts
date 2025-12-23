import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  userId: string;
  telegramId?: number;
  role: 'admin' | 'manager' | 'partner' | 'client';
  fullName: string;
}

const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'ticrm_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(cookies(), sessionOptions);
}

export async function requireAuth() {
  const session = await getSession();
  
  if (!session.userId) {
    throw new Error('Unauthorized');
  }
  
  return session;
}

export async function requireRole(...roles: SessionData['role'][]) {
  const session = await requireAuth();
  
  if (!roles.includes(session.role)) {
    throw new Error('Forbidden');
  }
  
  return session;
}
