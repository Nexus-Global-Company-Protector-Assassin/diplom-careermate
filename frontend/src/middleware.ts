import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Публичные маршруты
        const publicPaths = ["/login", "/register", "/forgot-password"]
        if (publicPaths.some((path) => pathname.startsWith(path))) {
          return true
        }

        // API routes для auth
        if (pathname.startsWith("/api/auth")) {
          return true
        }

        // Все остальные маршруты требуют авторизации
        return !!token
      },
    },
    pages: {
      signIn: "/login",
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}
