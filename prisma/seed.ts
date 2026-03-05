/**
 * Prisma Seed Script
 *
 * Popola il database con i dati iniziali:
 * - Permessi di sistema
 * - Ruoli (admin, moderator, user)
 * - Utente admin di default (se specificato via env)
 *
 * Usage:
 *   npx prisma db seed
 *
 * Per creare un admin durante il seed, imposta queste variabili d'ambiente:
 *   SEED_ADMIN_EMAIL=admin@example.com
 *   SEED_ADMIN_NAME="Admin"
 *   SEED_ADMIN_PASSWORD=password123
 */

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// ── Permessi di sistema ──────────────────────────────────────────────

const ALL_PERMISSIONS = [
  // Users
  { name: 'users.read', description: 'Visualizzare la lista utenti' },
  { name: 'users.write', description: 'Creare e modificare utenti' },
  { name: 'users.delete', description: 'Eliminare utenti' },
  { name: 'users.roles', description: 'Gestire i ruoli degli utenti' },
  // Chats
  { name: 'chats.read', description: 'Visualizzare tutte le chat' },
  { name: 'chats.write', description: 'Modificare tutte le chat' },
  { name: 'chats.delete', description: 'Eliminare qualsiasi chat' },
  // Agents
  { name: 'agents.read', description: 'Visualizzare tutti gli agenti' },
  { name: 'agents.write', description: 'Modificare tutti gli agenti' },
  { name: 'agents.delete', description: 'Eliminare qualsiasi agente' },
  // Admin
  { name: 'audit.read', description: 'Visualizzare audit log' },
  { name: 'settings.read', description: 'Visualizzare impostazioni sistema' },
  { name: 'settings.write', description: 'Modificare impostazioni sistema' },
  { name: 'admin.access', description: 'Accedere al pannello admin' },
]

// ── Ruoli e i loro permessi ──────────────────────────────────────────

const ROLES = [
  {
    name: 'admin',
    description: 'Amministratore con accesso completo al sistema',
    permissions: ALL_PERMISSIONS.map((p) => p.name),
  },
  {
    name: 'moderator',
    description: 'Moderatore con accesso limitato alla gestione contenuti',
    permissions: [
      'users.read',
      'chats.read',
      'chats.write',
      'chats.delete',
      'agents.read',
      'agents.write',
      'audit.read',
      'admin.access',
    ],
  },
  {
    name: 'user',
    description: 'Utente standard',
    permissions: [],
  },
]

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL is not set')
    process.exit(1)
  }

  const adapter = new PrismaPg({ connectionString })
  const prisma = new PrismaClient({ adapter })

  try {
    // 1. Upsert permessi
    console.log('Seeding permessi...')
    for (const perm of ALL_PERMISSIONS) {
      await prisma.permission.upsert({
        where: { name: perm.name },
        update: { description: perm.description },
        create: perm,
      })
    }
    console.log(`  ${ALL_PERMISSIONS.length} permessi ok`)

    // 2. Upsert ruoli
    console.log('Seeding ruoli...')
    for (const role of ROLES) {
      await prisma.role.upsert({
        where: { name: role.name },
        update: {
          description: role.description,
          permissions: {
            set: role.permissions.map((name) => ({ name })),
          },
        },
        create: {
          name: role.name,
          description: role.description,
          permissions: {
            connect: role.permissions.map((name) => ({ name })),
          },
        },
      })
      console.log(`  Ruolo "${role.name}" ok (${role.permissions.length} permessi)`)
    }

    // 3. Utente admin di default (opzionale)
    const adminEmail = process.env.SEED_ADMIN_EMAIL
    const adminName = process.env.SEED_ADMIN_NAME
    const adminPassword = process.env.SEED_ADMIN_PASSWORD

    if (adminEmail && adminName && adminPassword) {
      console.log('Seeding utente admin...')

      const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } })
      if (!adminRole) throw new Error('Ruolo admin non trovato')

      const existing = await prisma.user.findUnique({ where: { email: adminEmail } })

      if (existing) {
        await prisma.user.update({
          where: { email: adminEmail },
          data: { roleId: adminRole.id },
        })
        console.log(`  Utente ${adminEmail} promosso ad admin`)
      } else {
        const hashedPassword = await bcrypt.hash(adminPassword, 10)
        await prisma.user.create({
          data: {
            email: adminEmail,
            name: adminName,
            password: hashedPassword,
            isActive: true,
            roleId: adminRole.id,
          },
        })
        console.log(`  Utente admin ${adminEmail} creato`)
      }
    } else {
      console.log('Nessun admin di default (imposta SEED_ADMIN_EMAIL/NAME/PASSWORD per crearne uno)')
    }

    // 4. System settings di default
    console.log('Seeding impostazioni di sistema...')
    const defaultSettings = [
      {
        key: 'default_model',
        value: 'gpt-4o',
        description: 'Modello AI di default per le nuove chat',
      },
      {
        key: 'max_messages_per_chat',
        value: 500,
        description: 'Numero massimo di messaggi per chat',
      },
      {
        key: 'allow_registration',
        value: true,
        description: 'Abilita la registrazione di nuovi utenti',
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
    console.log(`  ${defaultSettings.length} impostazioni ok`)

    console.log('')
    console.log('Seed completato!')
  } catch (error) {
    console.error('Errore durante il seed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
