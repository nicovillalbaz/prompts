'use server'
import { PrismaClient } from '@prisma/client'
import { auth } from "@/auth"
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function getTrashItems() {
    const session = await auth();
    const user = await prisma.user.findUnique({ where: { email: session?.user?.email! } });
    if (user?.role !== 'SUPERADMIN') return { items: [] };

    // Buscar carpetas borradas
    const folders = await prisma.folder.findMany({
        where: { NOT: { deletedAt: null } },
        orderBy: { deletedAt: 'desc' }
    });

    // Buscar prompts borrados
    const prompts = await prisma.prompt.findMany({
        where: { NOT: { deletedAt: null } },
        orderBy: { deletedAt: 'desc' }
    });

    // Unificar lista
    const items = [
        ...folders.map(f => ({ ...f, kind: 'folder' })),
        ...prompts.map(p => ({ ...p, kind: 'file', name: p.title }))
    ].sort((a, b) => new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime());

    return { items };
}

export async function restoreItem(id: string, type: 'folder' | 'file') {
    try {
        if (type === 'folder') {
            await prisma.folder.update({ where: { id }, data: { deletedAt: null } });
        } else {
            await prisma.prompt.update({ where: { id }, data: { deletedAt: null } });
        }
        revalidatePath('/');
        return { success: true };
    } catch (e) { return { success: false }; }
}

export async function purgeItem(id: string, type: 'folder' | 'file') {
    try {
        if (type === 'folder') {
            // Borrado recursivo (primero los hijos) - Ojo con Prisma
            // Para simplificar, borramos solo la carpeta, los hijos quedarían huérfanos o borrados en cascada según config
            // Usaremos delete directo
            await prisma.folder.delete({ where: { id } });
        } else {
            await prisma.prompt.delete({ where: { id } });
        }
        revalidatePath('/');
        return { success: true };
    } catch (e) { return { success: false }; }
}