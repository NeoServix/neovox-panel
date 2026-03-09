import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const basicAuth = req.headers.get('authorization');

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, pwd] = atob(authValue).split(':');

    const validUser = process.env.ADMIN_USER;
    const validPwd = process.env.ADMIN_PASSWORD;

    if (user === validUser && pwd === validPwd) {
      return NextResponse.next();
    }
  }

  return new NextResponse('Autenticación requerida. Acceso restringido al búnker maestro.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="NeoVox Control Panel"',
    },
  });
}

// Protegemos todas las rutas excepto los archivos estáticos internos
export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};