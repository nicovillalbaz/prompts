'use server'
 
import { signIn, signOut, auth } from '@/auth' 
import { AuthError } from 'next-auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
 
export async function authenticate(formData: FormData) {
  try {
    await signIn('credentials', formData)
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Credenciales inválidas.' }
        default:
          return { error: 'Algo salió mal.' }
      }
    }
    throw error
  }
}

export async function logout() {
    await signOut({ redirectTo: '/login' });
}

// 👇 ESTA ES LA FUNCIÓN CLAVE QUE EL SIDEBAR NECESITA
export async function getUserInfo() {
    try {
        const session = await auth();
        if (!session?.user?.email) return null;
        
        const user = await prisma.user.findUnique({ 
            where: { email: session.user.email },
            select: { 
                //department: false, // Ya no existe
                role: true,        // Vital para saber si eres Admin
                fullName: true,
                accessGrants: true // Vital para listar tus departamentos
            }
        });
        return user;
    } catch (error) {
        console.error("Error obteniendo usuario:", error);
        return null;
    }
}