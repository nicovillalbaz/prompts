import { auth } from "@/auth"
import { NextResponse } from "next/server"

// 🚨 CAMBIO CLAVE: Usamos 'export const proxy' explícitamente
export const proxy = auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnLoginPage = req.nextUrl.pathname.startsWith('/login')

  // Debugging: Ver en consola si se ejecuta
  console.log(`🛡️ PROXY REVISANDO: ${req.nextUrl.pathname} | Logueado: ${isLoggedIn}`)

  if (isOnLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/', req.nextUrl))
  }

  if (!isOnLoginPage && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}