'use server'

import { PrismaClient } from '@prisma/client'
import { auth } from "@/auth"
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function getSidebarData() {
    const session = await auth()
    if (!session?.user?.email) return { departments: [], isAdmin: false }

    const user = await prisma.user.findUnique({ 
        where: { email: session.user.email },
        include: { accessGrants: true } // Traemos sus permisos
    })

    if (!user) return { departments: [], isAdmin: false }

    const isAdmin = user.role === 'SUPERADMIN';
    let departments = [];

    if (isAdmin) {
        // Si es Admin, ve TODOS los departamentos
        departments = await prisma.folder.findMany({
            where: { type: 'DEPARTMENT', deletedAt: null },
            orderBy: { name: 'asc' }
        })
    } else {
        // Si es usuario normal, ve solo aquellos donde tiene PERMISO
        // Buscamos las carpetas cuyo ID esté en su lista de permisos
        const allowedFolderIds = user.accessGrants.map(grant => grant.folderId);
        
        departments = await prisma.folder.findMany({
            where: { 
                id: { in: allowedFolderIds },
                type: 'DEPARTMENT', 
                deletedAt: null 
            },
            orderBy: { name: 'asc' }
        })
    }

    return { departments, isAdmin }
}

// Acción para que el Admin cree un departamento desde el Sidebar
export async function createNewDepartment(name: string) {
    try {
        const session = await auth();
        const user = await prisma.user.findUnique({ where: { email: session?.user?.email! } });
        
        if (!user || user.role !== 'SUPERADMIN') return { success: false };

        await prisma.folder.create({
            data: {
                name: name,
                type: 'DEPARTMENT',
                allowedDept: name,
                createdById: user.id
            }
        });
        revalidatePath('/');
        return { success: true };
    } catch (e) { return { success: false }; }
}