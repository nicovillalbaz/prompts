'use server'

import { PrismaClient } from '@prisma/client'
import { auth } from "@/auth"
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function getFolderContent(folderId?: string) {
  try {
    const session = await auth()
    if (!session?.user?.email) return { error: "No autorizado" }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    })
    if (!user) return { error: "Usuario no encontrado" }

    let targetFolderId = folderId;

    // --- LÓGICA DE ENRUTAMIENTO SIMPLIFICADA ---
    
    // CASO 1: Carpeta Personal (Por defecto)
    if (!targetFolderId || targetFolderId === 'PERSONAL_ROOT') {
        if (!user.personalFolderId) {
             // Auto-fix: Crear carpeta personal si falta
             const newPersonal = await prisma.folder.create({
                data: {
                    name: `Area Personal de ${user.fullName}`,
                    type: 'PERSONAL',
                    createdById: user.id
                }
             })
             await prisma.user.update({
                where: { id: user.id },
                data: { personalFolderId: newPersonal.id }
             })
             targetFolderId = newPersonal.id
        } else {
             targetFolderId = user.personalFolderId
        }
    } 
    // CASO 2: Carpeta de Departamento
    else if (targetFolderId === 'DEPARTMENT_ROOT') {
        let deptFolder = await prisma.folder.findFirst({
            where: { 
                type: 'DEPARTMENT',
                allowedDept: user.department 
            }
        })

        // Auto-fix: Si no existe, la creamos
        if (!deptFolder) {
            deptFolder = await prisma.folder.create({
                data: {
                    name: `Departamento ${user.department}`,
                    type: 'DEPARTMENT',
                    allowedDept: user.department,
                    description: `Carpeta raíz para ${user.department}`
                }
            })
        }
        targetFolderId = deptFolder.id
    }

    // --- OBTENCIÓN DE DATOS ---
    
    const currentFolder = await prisma.folder.findUnique({
        where: { id: targetFolderId! },
        include: { parent: true }
    })

    if (!currentFolder) return { error: "Carpeta no encontrada" }

    // Validación de Permisos Básica
    const isOwner = currentFolder.createdById === user.id;
    const isDeptFolder = currentFolder.type === 'DEPARTMENT' && currentFolder.allowedDept === user.department;
    const isAdmin = user.role === 'SUPERADMIN'; 

    if (!isOwner && !isDeptFolder && !isAdmin && currentFolder.type === 'PERSONAL') {
        return { error: "Acceso denegado" }
    }

    // Subcarpetas
    const subFolders = await prisma.folder.findMany({
        where: { parentId: targetFolderId!, deletedAt: null },
        orderBy: { name: 'asc' }
    })

    // Archivos
    const files = await prisma.prompt.findMany({
        where: { folderId: targetFolderId!, deletedAt: null },
        orderBy: { title: 'asc' },
        include: { createdBy: true }
    })

    return { 
        success: true, 
        data: { currentFolder, subFolders, files }
    }

  } catch (error) {
    console.error("Error explorando carpeta:", error)
    return { error: "Error interno" }
  }
}

// Solo dejamos la creación de subcarpetas normales
export async function createSubFolder(parentId: string, name: string) {
    try {
        const session = await auth()
        if (!session?.user?.email) return { success: false }
        
        const user = await prisma.user.findUnique({ where: { email: session.user.email } })
        if (!user) return { success: false }

        await prisma.folder.create({
            data: {
                name,
                type: 'PROJECT',
                parentId,
                createdById: user.id
            }
        })
        revalidatePath('/')
        return { success: true }
    } catch (e) {
        return { success: false, error: 'Error creando carpeta' }
    }
}