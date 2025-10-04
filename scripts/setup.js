const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Setting up database...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@legalai.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@legalai.com',
      password: hashedPassword,
      role: 'ADMIN',
      department: 'Administration',
      isActive: true,
    },
  })

  console.log('Admin user created:', admin)

  // Create sample users
  const users = [
    {
      name: 'John Smith',
      email: 'john@legalai.com',
      password: await bcrypt.hash('password123', 12),
      role: 'LAWYER',
      department: 'Litigation',
      phone: '+1-555-0123',
    },
    {
      name: 'Sarah Johnson',
      email: 'sarah@legalai.com',
      password: await bcrypt.hash('password123', 12),
      role: 'PARALEGAL',
      department: 'Corporate',
      phone: '+1-555-0124',
    },
    {
      name: 'Mike Chen',
      email: 'mike@legalai.com',
      password: await bcrypt.hash('password123', 12),
      role: 'USER',
      department: 'Criminal',
      phone: '+1-555-0125',
    },
  ]

  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    })
    console.log('User created:', user.name)
  }

  console.log('Database setup completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
