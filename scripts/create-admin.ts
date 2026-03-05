/**
 * Script to create an AdminUser (separate from regular users).
 *
 * Usage:
 *   npx tsx scripts/create-admin.ts <email> <name> <password>
 *
 * Example:
 *   npx tsx scripts/create-admin.ts admin@example.com "Admin" s3cr3t!
 */

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

async function main() {
  const args = process.argv.slice(2)

  if (args.length < 3) {
    console.error('Usage:')
    console.error('  npx tsx scripts/create-admin.ts <email> <name> <password>')
    console.error('')
    console.error('Example:')
    console.error('  npx tsx scripts/create-admin.ts admin@example.com "Admin" s3cr3t!')
    process.exit(1)
  }

  const [email, name, password] = args

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL is not set')
    process.exit(1)
  }

  const adapter = new PrismaPg({ connectionString })
  const prisma = new PrismaClient({ adapter })

  try {
    // Check if admin already exists
    const existing = await prisma.adminUser.findUnique({
      where: { email },
    })

    if (existing) {
      console.log(`Admin user ${email} already exists.`)
      console.log('')
      console.log('Admin Details:')
      console.log(`  ID:     ${existing.id}`)
      console.log(`  Email:  ${existing.email}`)
      console.log(`  Name:   ${existing.name}`)
      console.log(`  Active: ${existing.isActive ? 'Yes' : 'No'}`)
      process.exit(0)
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const admin = await prisma.adminUser.create({
      data: {
        email,
        name,
        password: hashedPassword,
        isActive: true,
      },
    })

    // Log the creation
    await prisma.auditLog.create({
      data: {
        action: 'admin.created',
        adminUserId: admin.id,
        target: admin.id,
        targetType: 'admin_user',
        metadata: { email, createdBy: 'script' },
      },
    })

    console.log('Admin user created successfully!')
    console.log('')
    console.log('Admin Details:')
    console.log(`  ID:     ${admin.id}`)
    console.log(`  Email:  ${admin.email}`)
    console.log(`  Name:   ${admin.name}`)
    console.log(`  Active: ${admin.isActive ? 'Yes' : 'No'}`)
    console.log('')
    console.log('You can now log in at /admin/login')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
