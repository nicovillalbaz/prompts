// ARCHIVO: auth.ts (En la raíz del proyecto)
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaClient } from "@prisma/client"
import { z } from "zod"

const prisma = new PrismaClient()
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// ... imports ...

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        console.log("🔍 INTENTO DE LOGIN:", credentials.email); // <--- LOG 1
        
        const { email, password } = await loginSchema.parseAsync(credentials)
        const user = await prisma.user.findUnique({ where: { email } })
        
        if (!user) {
            console.log("❌ USUARIO NO ENCONTRADO EN DB"); // <--- LOG 2
            return null
        }

        console.log("✅ USUARIO ENCONTRADO:", user.email); // <--- LOG 3
        
        // Comparación directa (según tu seed actual)
        if (password !== user.passwordHash) {
            console.log("❌ CONTRASEÑA INCORRECTA. Recibida:", password, "Esperada:", user.passwordHash); // <--- LOG 4
            return null 
        }

        console.log("🔐 LOGIN EXITOSO. Autorizando..."); // <--- LOG 5
        return user
      },
    }),
  ],
  // ... resto del código igual ...
  pages: {
    signIn: '/login', // Redirigir aquí si falla la auth
  },
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    }
  }
})