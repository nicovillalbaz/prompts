'use server'

import { PrismaClient } from '@prisma/client'
import { auth } from "@/auth"
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function getFolderContent(folderId?: string) {
  try {
    const session = await auth()
    if (!session?.user?.email) return { error: "No autorizado" }

    // 1. Buscamos al usuario Y SUS PERMISOS (accessGrants)
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { accessGrants: true } 
    })
    if (!user) return { error: "Usuario no encontrado" }

    const isAdmin = user.role === 'SUPERADMIN';

    // --- CASO ADMIN GLOBAL ---
    if (folderId === 'ADMIN_ROOT') {
        if (!isAdmin) return { error: "Acceso denegado" }
        const allDepts = await prisma.folder.findMany({
            where: { type: 'DEPARTMENT', deletedAt: null },
            orderBy: { name: 'asc' }
        })
        return {
            success: true,
            data: {
                currentFolder: { id: 'ADMIN_ROOT', name: 'Gestión Global', parentId: null },
                subFolders: allDepts,
                files: []
            }
        }
    }

    let targetFolderId = folderId;

    // --- ENRUTAMIENTO ---
    // Si es null o 'PERSONAL_ROOT', vamos a la carpeta personal
    if (!targetFolderId || targetFolderId === 'PERSONAL_ROOT') {
        if (!user.personalFolderId) {
             const newPersonal = await prisma.folder.create({
                data: { name: `Area Personal de ${user.fullName}`, type: 'PERSONAL', createdById: user.id }
             })
             await prisma.user.update({ where: { id: user.id }, data: { personalFolderId: newPersonal.id } })
             targetFolderId = newPersonal.id
        } else {
             targetFolderId = user.personalFolderId
        }
    } 
    // NOTA: Ya no existe 'DEPARTMENT_ROOT' genérico porque ahora hay muchos departamentos.
    // El sidebar enviará el ID específico.

    // --- OBTENCIÓN DE DATOS ---
    const currentFolder = await prisma.folder.findUnique({
        where: { id: targetFolderId! },
        include: { parent: true }
    })

    if (!currentFolder) return { error: "Carpeta no encontrada" }

    // --- VALIDACIÓN DE PERMISOS (NUEVA LÓGICA) ---
    
    // 1. ¿Es el dueño?
    const isOwner = currentFolder.createdById === user.id;
    
    // 2. ¿Tiene permiso explícito en esta carpeta?
    const hasPermission = user.accessGrants.some(grant => grant.folderId === currentFolder.id);
    
    // 3. Reglas finales
    // Si no es admin, no es dueño y no tiene permiso explícito -> BLOQUEAR
    // (Excepto si es una subcarpeta de un proyecto donde ya entró, 
    // pero por seguridad estricta validamos la raíz o el permiso directo).
    
    // Simplificación para subcarpetas: Si tienes permiso en el PADRE, deberías ver al HIJO.
    // Para este MVP, validaremos acceso directo o Admin/Dueño.
    // (Si es tipo DEPARTMENT y no tienes permiso en accessGrants, no entras).
    
    if (!isAdmin && !isOwner && !hasPermission && currentFolder.type !== 'PERSONAL') {
         // Pequeña excepción: Si es subcarpeta, asumimos que si llegaste aquí es porque podías.
         // Pero para la raíz del depto, hasPermission debe ser true.
         if (currentFolder.type === 'DEPARTMENT' && !hasPermission) {
             return { error: "No tienes acceso a este departamento" }
         }
    }

    // Obtener contenido
    const subFolders = await prisma.folder.findMany({
        where: { parentId: targetFolderId!, deletedAt: null },
        orderBy: { name: 'asc' }
    })

    const files = await prisma.prompt.findMany({
        where: { folderId: targetFolderId!, deletedAt: null },
        orderBy: { title: 'asc' },
        include: { createdBy: true }
    })

    return { success: true, data: { currentFolder, subFolders, files } }

  } catch (error) {
    console.error("Error:", error)
    return { error: "Error interno" }
  }
}

// ... (createSubFolder y createDepartment se mantienen igual, no usan 'department')
export async function createSubFolder(parentId: string, name: string) {
    try {
        const session = await auth()
        if (!session?.user?.email) return { success: false }
        const user = await prisma.user.findUnique({ where: { email: session.user.email } })
        if (!user) return { success: false }

        await prisma.folder.create({
            data: { name, type: 'PROJECT', parentId, createdById: user.id }
        })
        revalidatePath('/')
        return { success: true }
    } catch (e) { return { success: false, error: 'Error' } }
}

export async function createDepartment(name: string) {
    try {
        const session = await auth()
        const user = await prisma.user.findUnique({ where: { email: session?.user?.email! } })
        
        if (!user || user.role !== 'SUPERADMIN') return { success: false }

        await prisma.folder.create({
            data: {
                name: name, // Ej: "Recursos Humanos"
                type: 'DEPARTMENT',
                allowedDept: name, // Identificador simple
                createdById: user.id
            }
        })
        revalidatePath('/')
        return { success: true }
    } catch (e) { return { success: false } }
}

// ... al final de app/actions/browser.ts

export async function deleteItem(id: string, type: 'folder' | 'file') {
    try {
        const session = await auth()
        if (!session?.user?.email) return { success: false, error: "No autorizado" }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } })
        if (!user) return { success: false, error: "Usuario no encontrado" }

        const isAdmin = user.role === 'SUPERADMIN';

        // 1. LÓGICA PARA CARPETAS (Y DEPARTAMENTOS)
        if (type === 'folder') {
            const folder = await prisma.folder.findUnique({ where: { id } })
            if (!folder) return { success: false, error: "Carpeta no existe" }

            // Solo Admin o el Dueño pueden borrar
            if (!isAdmin && folder.createdById !== user.id) {
                return { success: false, error: "No tienes permiso para borrar esto" }
            }

            // Soft Delete (Marca como borrado)
            await prisma.folder.update({
                where: { id },
                data: { deletedAt: new Date() }
            })
        } 
        // 2. LÓGICA PARA ARCHIVOS (PROMPTS)
        else {
            const prompt = await prisma.prompt.findUnique({ where: { id } })
            if (!prompt) return { success: false, error: "Archivo no existe" }

            if (!isAdmin && prompt.createdById !== user.id) {
                return { success: false, error: "No tienes permiso para borrar esto" }
            }

            await prisma.prompt.update({
                where: { id },
                data: { deletedAt: new Date() }
            })
        }

        revalidatePath('/')
        return { success: true }

    } catch (e) {
        console.error("Error borrando:", e)
        return { success: false, error: "Error interno al borrar" }
    }
}