/**
 * Script per creare/promuovere un utente admin
 *
 * Usage:
 *   npx tsx scripts/create-admin.ts email@example.com
 *   npx tsx scripts/create-admin.ts email@example.com "Nome Admin" password123
 *
 * Se l'utente esiste: viene promosso ad admin
 * Se l'utente non esiste: viene creato come admin (richiede nome e password)
 */

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Permessi di default per il ruolo admin
const ADMIN_PERMISSIONS = [
  { name: 'users.read', description: 'Visualizzare la lista utenti' },
  { name: 'users.write', description: 'Creare e modificare utenti' },
  { name: 'users.delete', description: 'Eliminare utenti' },
  { name: 'users.roles', description: 'Gestire i ruoli degli utenti' },
  { name: 'chats.read', description: 'Visualizzare tutte le chat' },
  { name: 'chats.write', description: 'Modificare tutte le chat' },
  { name: 'chats.delete', description: 'Eliminare qualsiasi chat' },
  { name: 'agents.read', description: 'Visualizzare tutti gli agenti' },
  { name: 'agents.write', description: 'Modificare tutti gli agenti' },
  { name: 'agents.delete', description: 'Eliminare qualsiasi agente' },
  { name: 'audit.read', description: 'Visualizzare audit log' },
  { name: 'settings.read', description: 'Visualizzare impostazioni sistema' },
  { name: 'settings.write', description: 'Modificare impostazioni sistema' },
  { name: 'admin.access', description: 'Accedere al pannello admin' },
]

async function main() {
  const args = process.argv.slice(2)

  if (args.length < 1) {
    console.error('Usage:')
    console.error('  npx tsx scripts/create-admin.ts <email>')
    console.error('  npx tsx scripts/create-admin.ts <email> <name> <password>')
    console.error('')
    console.error('Se l\'utente esiste già, verrà promosso ad admin.')
    console.error('Se l\'utente non esiste, verranno richiesti nome e password.')
    process.exit(1)
  }

  const [email, name, password] = args

  // Inizializza Prisma
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL is not set')
    process.exit(1)
  }

  const adapter = new PrismaPg({ connectionString })
  const prisma = new PrismaClient({ adapter })

  try {
    // 1. Crea i permessi se non esistono
    console.log('Verifico permessi...')
    for (const perm of ADMIN_PERMISSIONS) {
      await prisma.permission.upsert({
        where: { name: perm.name },
        update: {},
        create: perm,
      })
    }
    console.log(`  ${ADMIN_PERMISSIONS.length} permessi verificati/creati`)

    // 2. Crea o recupera il ruolo admin
    console.log('Verifico ruolo admin...')
    let adminRole = await prisma.role.findUnique({
      where: { name: 'admin' },
    })

    if (!adminRole) {
      adminRole = await prisma.role.create({
        data: {
          name: 'admin',
          description: 'Amministratore con accesso completo al sistema',
          permissions: {
            connect: ADMIN_PERMISSIONS.map((p) => ({ name: p.name })),
          },
        },
      })
      console.log('  Ruolo admin creato')
    } else {
      // Aggiorna i permessi del ruolo admin esistente
      await prisma.role.update({
        where: { name: 'admin' },
        data: {
          permissions: {
            set: ADMIN_PERMISSIONS.map((p) => ({ name: p.name })),
          },
        },
      })
      console.log('  Ruolo admin aggiornato')
    }

    // 3. Trova o crea l'utente
    console.log(`Cerco utente ${email}...`)
    let user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    })

    if (user) {
      // Utente esistente - promuovilo ad admin
      if (user.role?.name === 'admin') {
        console.log(`L'utente ${email} è già un admin.`)
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: { roleId: adminRole.id },
        })
        console.log(`Utente ${email} promosso ad admin!`)
      }
    } else {
      // Nuovo utente - verifica che abbiamo nome e password
      if (!name || !password) {
        console.error('')
        console.error(`L'utente ${email} non esiste.`)
        console.error('Per crearlo, specifica nome e password:')
        console.error(`  npx tsx scripts/create-admin.ts ${email} "Nome Admin" password123`)
        process.exit(1)
      }

      const hashedPassword = await bcrypt.hash(password, 10)

      user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          isActive: true,
          roleId: adminRole.id,
        },
        include: { role: true },
      })

      console.log('Utente admin creato con successo!')
    }

    // 4. Log audit
    await prisma.auditLog.create({
      data: {
        action: 'admin.created',
        target: user.id,
        targetType: 'user',
        metadata: { email, promotedBy: 'script' },
      },
    })

    console.log('')
    console.log('Dettagli Admin:')
    console.log(`   ID:       ${user.id}`)
    console.log(`   Email:    ${user.email}`)
    console.log(`   Nome:     ${user.name}`)
    console.log(`   Ruolo:    ${user.role?.name}`)
    console.log(`   Attivo:   ${user.isActive ? 'Sì' : 'No'}`)
    console.log('')
    console.log('Ora puoi accedere al pannello admin su /admin')
  } catch (error) {
    console.error('Errore:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
