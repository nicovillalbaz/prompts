// ARCHIVO: app/actions/auth.ts
'use server'
 
import { signIn, signOut } from '@/auth' // Importa desde la raíz
import { AuthError } from 'next-auth'
 
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