'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { auth } from "@/auth" // <--- Importamos la autenticación

const prisma = new PrismaClient()

export async function savePrompt(data: any) {
  try {
    // 1. OBTENER USUARIO REAL DE LA SESIÓN
    const session = await auth()
    
    if (!session || !session.user || !session.user.email) {
        return { success: false, error: 'Debes iniciar sesión para guardar' }
    }

    // Buscamos al usuario en la BD usando el email de la sesión
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { personalFolder: true } // Traemos su carpeta
    })

    if (!user) throw new Error("Usuario no encontrado en base de datos")

    // 2. GESTIÓN DE CARPETAS (Lógica Inteligente)
    let targetFolderId = user.personalFolderId

    // Si el usuario no tiene carpeta personal, se la creamos ahora mismo (Auto-fix)
    if (!targetFolderId) {
        const newFolder = await prisma.folder.create({
            data: {
                name: `Area Personal de ${user.fullName}`,
                type: 'PERSONAL',
                createdById: user.id
            }
        })
        // Vinculamos la carpeta al usuario
        await prisma.user.update({
            where: { id: user.id },
            data: { personalFolderId: newFolder.id }
        })
        targetFolderId = newFolder.id
    }

    // 3. GUARDAR EL PROMPT
    const newPrompt = await prisma.prompt.create({
      data: {
        title: data.title,
        currentObjective: data.type,
        currentContent: data.sections,
        folderId: targetFolderId!, // Guardamos en su carpeta personal
        createdById: user.id,      // Firmado por el usuario real
      },
    })

    // 4. Crear Historial
    await prisma.promptVersion.create({
        data: {
            promptId: newPrompt.id,
            contentJson: data.sections,
            createdByUserId: user.id,
            changeNote: 'Creación inicial'
        }
    })

    console.log(`Prompt guardado por ${user.email}`)
    revalidatePath('/')
    return { success: true, prompt: newPrompt }

  } catch (error) {
    console.error("Error guardando prompt:", error)
    return { success: false, error: 'Error interno al guardar' }
  }
}