import { type NextRequest, NextResponse } from "next/server";

// Define las rutas públicas que no requieren autenticación
const publicRoutes = ["/login", "/signup"];

// Define las rutas protegidas que requieren autenticación
const protectedRoutes = ["/dashboard", "/profile"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verifica si es una ruta protegida
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Verifica si es una ruta pública
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Obtén el token de sesión de las cookies
  const sessionToken = request.cookies.get("better-auth.session_token");

  // Si es una ruta protegida y no hay sesión, redirige a login
  if (isProtectedRoute && !sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Si es una ruta pública (login/signup) y hay sesión, redirige a home
  if (isPublicRoute && sessionToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

