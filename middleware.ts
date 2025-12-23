import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { SessionData } from './lib/session';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Защищаем роуты дашборда
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    try {
      const session = await getIronSession<SessionData>(
        request,
        response,
        {
          password: process.env.SESSION_SECRET!,
          cookieName: 'ticrm_session',
        }
      );

      if (!session.userId) {
        return NextResponse.redirect(new URL('/', request.url));
      }

      // Проверка роли для админских роутов
      if (request.nextUrl.pathname.startsWith('/dashboard/settings')) {
        if (session.role !== 'admin' && session.role !== 'manager') {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }
    } catch (error) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Защищаем API роуты (кроме auth и webhook)
  if (
    request.nextUrl.pathname.startsWith('/api') &&
    !request.nextUrl.pathname.startsWith('/api/auth') &&
    !request.nextUrl.pathname.startsWith('/api/telegram/webhook')
  ) {
    try {
      const session = await getIronSession<SessionData>(
        request,
        response,
        {
          password: process.env.SESSION_SECRET!,
          cookieName: 'ticrm_session',
        }
      );

      if (!session.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } catch (error) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
