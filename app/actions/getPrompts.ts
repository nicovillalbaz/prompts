'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { auth } from "@/auth"

const prisma = new PrismaClient()

export async function getPrompts() {
  try {
    const session = await auth()
    if (!session?.user?.email) return { success: false, prompts: [] }

    // Buscamos el ID del usuario
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return { success: false, prompts: [] }

    // TRAEMOS SOLO LOS PROMPTS QUE ESTE USUARIO TIENE PERMISO DE VER
    // (Por ahora: Solo los que él creó. Luego ampliaremos a permisos de dpto)
    const prompts = await prisma.prompt.findMany({
      where: {
        createdById: user.id, // <--- FILTRO CLAVE
        deletedAt: null       // No mostrar los borrados
      },
      orderBy: { createdAt: 'desc' },
      include: { createdBy: true }
    })

    const formattedPrompts = prompts.map(p => ({
      id: p.id,
      title: p.title,
      type: p.currentObjective,
      content: "...",
      sections: p.currentContent,
      date: p.createdAt.toLocaleDateString('es-ES'),
      author: p.createdBy.fullName // Añadimos el autor para mostrarlo
    }))

    return { success: true, prompts: formattedPrompts }

  } catch (error) {
    console.error("Error leyendo prompts:", error)
    return { success: false, prompts: [] }
  }
}

export async function deletePrompt(id: string) {
    // Aquí también deberíamos verificar si el usuario es dueño o admin
    // pero para este MVP lo dejamos simple
    try {
        await prisma.prompt.update({
            where: { id },
            data: { deletedAt: new Date() } // Soft delete
        })
        revalidatePath('/')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Error al borrar' }
    }
}