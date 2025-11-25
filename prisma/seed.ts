import { PrismaClient, Role, FolderType, AccessType} from '@prisma/client'
// Nota: Ya no importamos 'Department' porque ahora es solo texto

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // 1. Crear el Super Admin
  const adminEmail = 'admin@empresa.com'
  const passwordHash = 'admin123' 

const superAdmin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'SUPERADMIN' },
    create: {
      email: adminEmail,
      fullName: 'Super Administrador',
      passwordHash: 'admin123',
      role: 'SUPERADMIN',
      permissionLevel: 'FULL'
    },
  })

  console.log(`👤 Admin listo: ${superAdmin.email}`)

  // 2. Crear Carpetas de Departamentos Base (Raíz)
  // Ahora usamos strings directos
  const departments = ['IT', 'VENTAS', 'MARKETING']

  for (const deptName of departments) {
    // Crear o buscar la carpeta del departamento
    let folder = await prisma.folder.findFirst({
        where: { type: 'DEPARTMENT', name: deptName }
    })

    if (!folder) {
        folder = await prisma.folder.create({
            data: {
                name: deptName, // Ej: "IT"
                type: 'DEPARTMENT',
                allowedDept: deptName, // Identificador
                createdById: superAdmin.id
            }
        })
        console.log(`🏢 Departamento creado: ${deptName}`)
    }

    // DAR PERMISO AL ADMIN (Para que lo vea en su sidebar)
    // Nota: El admin por ser admin ve todo, pero esto sirve de ejemplo
    const existingPerm = await prisma.folderPermission.findUnique({
        where: { userId_folderId: { userId: superAdmin.id, folderId: folder.id } }
    })

    if (!existingPerm) {
        await prisma.folderPermission.create({
            data: {
                userId: superAdmin.id,
                folderId: folder.id,
                accessType: 'WRITE'
            }
        })
    }
  }
  
  console.log('✅ Seed completado.')
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })