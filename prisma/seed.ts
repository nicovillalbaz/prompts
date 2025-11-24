import { PrismaClient, Role, FolderType } from '@prisma/client'
// Nota: Ya no importamos 'Department' porque ahora es solo texto

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // 1. Crear el Super Admin
  const adminEmail = 'admin@empresa.com'
  const passwordHash = 'admin123' 

  const superAdmin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
        // Aseguramos que si ya existe, tenga el rol y depto correctos
        role: 'SUPERADMIN',
        department: 'MANAGEMENT' 
    },
    create: {
      email: adminEmail,
      fullName: 'Super Administrador',
      passwordHash: passwordHash,
      role: Role.SUPERADMIN,
      department: 'MANAGEMENT', // Ahora es un string simple
      permissionLevel: 'FULL'
    },
  })

  console.log(`👤 Admin listo: ${superAdmin.email}`)

  // 2. Crear Carpetas de Departamentos Base (Raíz)
  // Ahora usamos strings directos
  const departments = ['IT', 'SALES', 'MARKETING']

  for (const dept of departments) {
    // Buscamos si ya existe para no duplicar
    const existing = await prisma.folder.findFirst({
        where: { type: 'DEPARTMENT', allowedDept: dept }
    })

    if (!existing) {
        await prisma.folder.create({
            data: {
                name: `Departamento ${dept}`,
                type: FolderType.DEPARTMENT,
                allowedDept: dept, // String
                description: `Carpeta raíz para el equipo de ${dept}`,
                createdById: superAdmin.id // El admin es el dueño técnico
            }
        })
        console.log(`📁 Carpeta creada: Departamento ${dept}`)
    }
  }
  
  console.log('✅ Seed completado con éxito.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })