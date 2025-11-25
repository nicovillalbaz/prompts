'use server'

import { PrismaClient } from '@prisma/client'
import { auth } from "@/auth"
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

// 1. Obtener lista de usuarios con sus departamentos
export async function getAllUsers() {
    const session = await auth();
    if (!session?.user?.email) return { authorized: false, users: [] };

    const currentUser = await prisma.user.findUnique({ where: { email: session.user.email } });
    
    if (currentUser?.role !== 'SUPERADMIN') return { authorized: false, users: [] };

    const users = await prisma.user.findMany({
        where: { deletedAt: null }, // Ahora sí funcionará porque agregamos el campo
        orderBy: { fullName: 'asc' },
        include: {
            accessGrants: {
                where: { 
                    folder: { deletedAt: null } 
                },
                include: { folder: true }
            }
        }
    });

    const cleanUsers = users.map((u: any) => ({
        id: u.id,
        name: u.fullName,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        departments: u.accessGrants
            .filter((g: any) => g.folder.type === 'DEPARTMENT')
            .map((g: any) => ({ id: g.folder.id, name: g.folder.name }))
    }));

    return { authorized: true, users: cleanUsers };
}

// 2. Obtener departamentos disponibles
export async function getAllDepartments() {
    return await prisma.folder.findMany({
        where: { type: 'DEPARTMENT', deletedAt: null },
        orderBy: { name: 'asc' },
        select: { id: true, name: true }
    });
}

// 3. Crear Usuario
export async function createUser(data: any) {
    try {
        const session = await auth();
        if (!session?.user?.email) return { success: false, error: "No autorizado" };

        const admin = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (admin?.role !== 'SUPERADMIN') return { success: false, error: "No autorizado" };

        const newUser = await prisma.user.create({
            data: {
                fullName: data.fullName,
                email: data.email,
                passwordHash: data.password, 
                role: data.role,
                // deletedAt se crea como null por defecto
            }
        });

        const personalFolder = await prisma.folder.create({
            data: { name: `Area Personal de ${newUser.fullName}`, type: 'PERSONAL', createdById: newUser.id }
        });
        
        await prisma.user.update({ where: { id: newUser.id }, data: { personalFolderId: personalFolder.id } });

        if (data.departmentIds && data.departmentIds.length > 0) {
            const permissions = data.departmentIds.map((folderId: string) => ({
                userId: newUser.id, folderId: folderId, accessType: 'WRITE'
            }));
            // @ts-ignore - Ignoramos error de tipado estricto en accessType temporalmente
            await prisma.folderPermission.createMany({ data: permissions });
        }

        revalidatePath('/');
        return { success: true };

    } catch (e) {
        console.error(e);
        return { success: false, error: "Error al crear usuario" };
    }
}

// 4. Actualizar Usuario
export async function updateUser(userId: string, data: any) {
    try {
        const session = await auth();
        if (!session?.user?.email) return { success: false };

        const admin = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (admin?.role !== 'SUPERADMIN') return { success: false };

        await prisma.user.update({
            where: { id: userId },
            data: { role: data.role }
        });

        // Actualizar permisos
        const userPermissions = await prisma.folderPermission.findMany({
            where: { userId: userId },
            include: { folder: true }
        });
        
        const deptPermsToDelete = userPermissions
            .filter(p => p.folder.type === 'DEPARTMENT')
            .map(p => p.id);

        await prisma.folderPermission.deleteMany({
            where: { id: { in: deptPermsToDelete } }
        });

        if (data.departmentIds && data.departmentIds.length > 0) {
            const newPerms = data.departmentIds.map((folderId: string) => ({
                userId: userId,
                folderId: folderId,
                accessType: 'WRITE'
            }));
            // @ts-ignore
            await prisma.folderPermission.createMany({ data: newPerms });
        }

        revalidatePath('/');
        return { success: true };

    } catch (e) {
        return { success: false, error: "Error al actualizar" };
    }
}

// 5. Cambiar Estado (Activo/Inactivo)
export async function toggleUserStatus(userId: string, currentStatus: boolean) {
    try {
        const session = await auth();
        if (!session?.user?.email) return { success: false };

        const admin = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (admin?.role !== 'SUPERADMIN') return { success: false };

        if (userId === admin.id) return { success: false, error: "No puedes desactivarte a ti mismo" };

        await prisma.user.update({
            where: { id: userId },
            data: { isActive: !currentStatus }
        });
        revalidatePath('/');
        return { success: true };
    } catch (e) { return { success: false, error: "Error" }; }
}

// 6. Eliminar Usuario (Soft Delete)
export async function deleteUser(userId: string) {
    try {
        const session = await auth();
        if (!session?.user?.email) return { success: false };

        const admin = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (admin?.role !== 'SUPERADMIN') return { success: false };

        if (userId === admin.id) return { success: false, error: "No puedes borrarte a ti mismo" };

        // Soft Delete REAL gracias al nuevo campo en schema
        await prisma.user.update({
            where: { id: userId },
            data: { 
                deletedAt: new Date(),
                isActive: false, // También lo desactivamos por si acaso
                email: `deleted_${userId}_${Date.now()}` // Liberamos el email para poder reusarlo
            }
        });
        
        revalidatePath('/');
        return { success: true };
    } catch (e) { return { success: false, error: "Error al borrar" }; }
}