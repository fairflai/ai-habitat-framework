/**
 * Script per creare un utente nel database
 *
 * Usage:
 *   npx tsx scripts/create-user.ts email@example.com "Nome Utente" password123
 */

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

async function main() {
  const args = process.argv.slice(2)

  if (args.length < 3) {
    console.error('Usage: npx tsx scripts/create-user.ts <email> <name> <password>')
    console.error('')
    console.error('Example:')
    console.error('  npx tsx scripts/create-user.ts user@example.com "Mario Rossi" mypassword123')
    console.error('')
    console.error('Note: Per creare un admin, usa scripts/create-admin.ts')
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
    // Verifica se l'utente esiste già
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      console.error(`Un utente con email "${email}" esiste già.`)
      process.exit(1)
    }

    // Hash della password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Crea l'utente
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        isActive: true,
      },
    })

    console.log('Utente creato con successo!')
    console.log('')
    console.log('Dettagli:')
    console.log(`   ID:       ${user.id}`)
    console.log(`   Email:    ${user.email}`)
    console.log(`   Nome:     ${user.name}`)
    console.log(`   Attivo:   ${user.isActive ? 'Sì' : 'No'}`)
    console.log(`   Creato:   ${user.createdAt.toISOString()}`)
  } catch (error) {
    console.error("Errore durante la creazione dell'utente:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
