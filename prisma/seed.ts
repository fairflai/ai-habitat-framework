/**
 * Prisma Seed Script
 *
 * Populates the database with initial data:
 * - Default system settings
 * - Optional admin user (via environment variables)
 *
 * Usage:
 *   npx prisma db seed
 *
 * To create an admin during seed, set these environment variables:
 *   SEED_ADMIN_EMAIL=admin@example.com
 *   SEED_ADMIN_NAME="Admin"
 *   SEED_ADMIN_PASSWORD=password123
 */

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL is not set')
    process.exit(1)
  }

  const adapter = new PrismaPg({ connectionString })
  const prisma = new PrismaClient({ adapter })

  try {
    // 1. Default system settings
    console.log('Seeding system settings...')
    const defaultSettings = [
      {
        key: 'default_model',
        value: 'gpt-5-mini',
        description: 'Default AI model for chat completions',
      },
      {
        key: 'title_model',
        value: 'gpt-5-mini',
        description: 'Model used for auto-generating chat titles',
      },
      {
        key: 'system_prompt',
        value: '',
        description: 'Global system prompt prepended to all conversations',
      },
      {
        key: 'max_tokens',
        value: 4096,
        description: 'Maximum output tokens per response',
      },
      {
        key: 'temperature',
        value: 0.7,
        description: 'Temperature for AI responses (0-2)',
      },
      {
        key: 'rate_limit_requests',
        value: 60,
        description: 'Maximum requests per minute per user',
      },
      {
        key: 'max_chats_per_user',
        value: 100,
        description: 'Maximum number of chats per user',
      },
      {
        key: 'max_agents_per_user',
        value: 10,
        description: 'Maximum number of agents per user',
      },
      {
        key: 'allow_registration',
        value: true,
        description: 'Allow new user sign-ups',
      },
      {
        key: 'enable_web_search',
        value: true,
        description: 'Enable web search in chats',
      },
      {
        key: 'enable_deep_reasoning',
        value: true,
        description: 'Enable deep reasoning mode',
      },
    ]

    for (const setting of defaultSettings) {
      await prisma.systemSetting.upsert({
        where: { key: setting.key },
        update: {},
        create: {
          key: setting.key,
          value: setting.value,
          description: setting.description,
        },
      })
    }
    console.log(`  ${defaultSettings.length} settings ok`)

    // 2. Admin user (optional)
    const adminEmail = process.env.SEED_ADMIN_EMAIL
    const adminName = process.env.SEED_ADMIN_NAME
    const adminPassword = process.env.SEED_ADMIN_PASSWORD

    if (adminEmail && adminName && adminPassword) {
      console.log('Seeding admin user...')

      const existing = await prisma.adminUser.findUnique({
        where: { email: adminEmail },
      })

      if (existing) {
        console.log(`  Admin ${adminEmail} already exists, skipping`)
      } else {
        const hashedPassword = await bcrypt.hash(adminPassword, 10)
        await prisma.adminUser.create({
          data: {
            email: adminEmail,
            name: adminName,
            password: hashedPassword,
            isActive: true,
          },
        })
        console.log(`  Admin ${adminEmail} created`)
      }
    } else {
      console.log('No admin user configured (set SEED_ADMIN_EMAIL/NAME/PASSWORD to create one)')
    }

    console.log('')
    console.log('Seed completed!')
  } catch (error) {
    console.error('Seed error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
