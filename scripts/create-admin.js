// Script to create or update admin user with known password
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createOrUpdateAdmin() {
    const adminEmail = 'admin@legalai.com'
    const adminPassword = 'Admin123!' // Your admin password

    console.log('🔐 Creating/Updating Admin User...\n')

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(adminPassword, 10)

        // Check if admin user exists
        const existingUser = await prisma.user.findUnique({
            where: { email: adminEmail }
        })

        if (existingUser) {
            // Update existing admin user
            const user = await prisma.user.update({
                where: { email: adminEmail },
                data: {
                    name: 'Admin User',
                    password: hashedPassword,
                    role: 'ADMIN',
                    isActive: true
                }
            })

            console.log('✅ Admin user updated successfully!')
            console.log('\n📋 Admin Credentials:')
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            console.log('Email:    ', adminEmail)
            console.log('Password: ', adminPassword)
            console.log('Role:     ', user.role)
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            console.log('\n💡 Use these credentials to log in at http://localhost:3000/auth/signin')

        } else {
            // Create new admin user
            const user = await prisma.user.create({
                data: {
                    email: adminEmail,
                    name: 'Admin User',
                    password: hashedPassword,
                    role: 'ADMIN',
                    isActive: true,
                    emailVerified: new Date()
                }
            })

            console.log('✅ Admin user created successfully!')
            console.log('\n📋 Admin Credentials:')
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            console.log('Email:    ', adminEmail)
            console.log('Password: ', adminPassword)
            console.log('Role:     ', user.role)
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            console.log('\n💡 Use these credentials to log in at http://localhost:3000/auth/signin')
        }

        console.log('\n⚠️  IMPORTANT: Store these credentials securely!')
        console.log('    Consider changing the password after first login.\n')

    } catch (error) {
        console.error('❌ Error:', error.message)
    } finally {
        await prisma.$disconnect()
    }
}

createOrUpdateAdmin()

