# AI Habitat Chat

Un'applicazione di chat AI completa costruita con Next.js 16, ispirata a ChatGPT ma completamente personalizzabile. Include sistema di autenticazione, pannello admin con RBAC (Role-Based Access Control), gestione agenti personalizzati e molto altro.

## Tech Stack

| Categoria | Tecnologia |
|-----------|------------|
| **Framework** | Next.js 16.1 (App Router, React 19) |
| **Database** | PostgreSQL + Prisma ORM 7.x |
| **Auth** | NextAuth.js v5 (JWT + OAuth) |
| **AI** | Vercel AI SDK 6.x + OpenAI |
| **UI** | shadcn/ui + Radix UI + Tailwind CSS 4 |
| **State** | Zustand + TanStack Query |
| **Forms** | React Hook Form + Zod 4 |
| **Icons** | Lucide React |

## Funzionalita

- Chat AI con streaming in tempo reale
- Supporto per web search e deep reasoning
- Agenti personalizzati con istruzioni custom
- Organizzazione chat in cartelle
- Sistema di voti sui messaggi
- Tema chiaro/scuro
- **Pannello Admin completo** con:
  - Dashboard statistiche
  - Gestione utenti (CRUD)
  - Moderazione agenti e chat
  - Audit log
  - Impostazioni sistema
  - Sistema RBAC con permessi granulari

---

## Quick Start

### Prerequisiti

- Node.js 20+
- PostgreSQL 15+ (o Docker)
- Chiave API OpenAI

### 1. Installazione

```bash
git clone <repository-url>
cd ai-habitat-chat
npm install
```

### 2. Configurazione ambiente

Crea `.env` nella root:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ai-habitat-chat?schema=public"

# NextAuth
AUTH_SECRET="genera-con-openssl-rand-base64-32"

# OpenAI
OPENAI_API_KEY="sk-..."

# (Opzionale) Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

> Per generare `AUTH_SECRET`: `openssl rand -base64 32`

### 3. Setup database

```bash
# Genera client Prisma
npx prisma generate

# Applica migrazioni
npx prisma migrate dev

# Crea primo utente admin
npx tsx scripts/create-admin.ts admin@example.com "Admin" password123
```

### 4. Avvia

```bash
npm run dev
```

Apri http://localhost:3000

---

## Struttura Progetto

```
ai-habitat-chat/
├── prisma/
│   ├── schema.prisma          # Schema database
│   └── migrations/            # Migrazioni SQL
├── scripts/
│   ├── create-user.ts         # Crea utente normale
│   └── create-admin.ts        # Crea/promuove admin
├── src/
│   ├── app/
│   │   ├── (auth)/            # Login, logout
│   │   ├── (chat)/            # Interfaccia chat principale
│   │   │   ├── c/[chatId]/    # Pagina singola chat
│   │   │   └── page.tsx       # Home/nuova chat
│   │   ├── admin/             # Pannello amministrazione
│   │   │   ├── users/         # Gestione utenti
│   │   │   ├── agents/        # Gestione agenti
│   │   │   ├── chats/         # Gestione chat
│   │   │   ├── audit/         # Log attivita
│   │   │   └── settings/      # Impostazioni sistema
│   │   └── api/
│   │       ├── admin/         # API admin protette
│   │       ├── auth/          # NextAuth endpoints
│   │       ├── chats/         # CRUD chat e messaggi
│   │       ├── agents/        # CRUD agenti
│   │       └── folders/       # CRUD cartelle
│   ├── components/
│   │   ├── admin/             # Componenti pannello admin
│   │   ├── chat/              # Componenti chat
│   │   ├── providers/         # Context providers
│   │   └── ui/                # shadcn/ui components
│   ├── hooks/                 # React Query hooks
│   ├── lib/
│   │   ├── auth.ts            # Configurazione NextAuth
│   │   ├── admin.ts           # Helper funzioni admin
│   │   ├── prisma.ts          # Client Prisma
│   │   └── utils.ts           # Utility varie
│   ├── stores/                # Zustand stores
│   └── types/                 # TypeScript types
└── .env                       # Variabili ambiente (non committare!)
```

---

## Script Gestione Utenti

### Creare un utente normale

```bash
npx tsx scripts/create-user.ts <email> <nome> <password>

# Esempio:
npx tsx scripts/create-user.ts mario@example.com "Mario Rossi" mypassword123
```

### Creare un admin

```bash
# Crea nuovo utente come admin
npx tsx scripts/create-admin.ts <email> <nome> <password>

# Esempio:
npx tsx scripts/create-admin.ts admin@example.com "Super Admin" adminpass123
```

### Promuovere utente esistente ad admin

```bash
# Solo email - promuove utente esistente
npx tsx scripts/create-admin.ts <email>

# Esempio:
npx tsx scripts/create-admin.ts mario@example.com
```

Lo script `create-admin.ts`:
1. Crea automaticamente il ruolo `admin` con tutti i permessi
2. Crea i permessi se non esistono
3. Assegna il ruolo all'utente
4. Registra l'azione nell'audit log

---

## Prisma & Database Cheatsheet

### Comandi essenziali

```bash
# Genera il client Prisma (dopo modifiche a schema.prisma)
npx prisma generate

# Applica migrazioni in sviluppo
npx prisma migrate dev

# Applica migrazioni con nome specifico
npx prisma migrate dev --name <nome_migrazione>

# Reset completo database (CANCELLA TUTTI I DATI!)
npx prisma migrate reset

# Applica migrazioni in produzione
npx prisma migrate deploy

# Push schema senza creare migrazione (sviluppo rapido)
npx prisma db push

# Apri GUI per esplorare il database
npx prisma studio

# Controlla stato migrazioni
npx prisma migrate status

# Valida schema
npx prisma validate

# Formatta schema
npx prisma format
```

### Query utili con Prisma Studio

Avvia con `npx prisma studio` e poi:

- **Tutti gli utenti**: Tabella `User`
- **Utenti admin**: Filtra `User` dove `role.name = "admin"`
- **Chat recenti**: Ordina `Chat` per `updatedAt DESC`
- **Audit log**: Tabella `AuditLog` ordinata per `createdAt DESC`

### Query SQL dirette (via psql o altro client)

```sql
-- Conta utenti
SELECT COUNT(*) FROM "User";

-- Utenti con ruolo
SELECT u.email, u.name, r.name as role
FROM "User" u
LEFT JOIN "Role" r ON u."roleId" = r.id;

-- Chat per utente
SELECT u.email, COUNT(c.id) as chat_count
FROM "User" u
LEFT JOIN "Chat" c ON u.id = c."userId"
GROUP BY u.id;

-- Messaggi ultimi 7 giorni
SELECT DATE(m."createdAt"), COUNT(*)
FROM "Message" m
WHERE m."createdAt" > NOW() - INTERVAL '7 days'
GROUP BY DATE(m."createdAt")
ORDER BY 1;

-- Audit log recenti
SELECT al.action, al."createdAt", u.email
FROM "AuditLog" al
LEFT JOIN "User" u ON al."userId" = u.id
ORDER BY al."createdAt" DESC
LIMIT 50;
```

### Backup e restore

```bash
# Backup
pg_dump -h localhost -U user -d ai-habitat-chat > backup.sql

# Restore
psql -h localhost -U user -d ai-habitat-chat < backup.sql
```

---

## Modelli Database

### Core Models

| Modello | Descrizione |
|---------|-------------|
| `User` | Utenti con email, password hash, ruolo |
| `Chat` | Conversazioni con titolo, visibilita, archivio |
| `Message` | Messaggi (USER/ASSISTANT/SYSTEM) con tools config |
| `Agent` | Agenti personalizzati con istruzioni custom |
| `Folder` | Cartelle per organizzare le chat |
| `Vote` | Voti up/down sui messaggi |

### Auth Models (NextAuth)

| Modello | Descrizione |
|---------|-------------|
| `Account` | Provider OAuth collegati |
| `Session` | Sessioni attive |

### Admin/RBAC Models

| Modello | Descrizione |
|---------|-------------|
| `Role` | Ruoli (es. admin, moderator) |
| `Permission` | Permessi granulari (es. users.read) |
| `AuditLog` | Log di tutte le azioni admin |
| `SystemSetting` | Configurazioni sistema key-value |

### Permessi disponibili

```
users.read       - Visualizzare utenti
users.write      - Creare/modificare utenti
users.delete     - Eliminare utenti
users.roles      - Gestire ruoli

chats.read       - Visualizzare tutte le chat
chats.write      - Modificare chat
chats.delete     - Eliminare chat

agents.read      - Visualizzare tutti gli agenti
agents.write     - Modificare agenti
agents.delete    - Eliminare agenti

audit.read       - Visualizzare audit log

settings.read    - Visualizzare impostazioni
settings.write   - Modificare impostazioni

admin.access     - Accesso pannello admin
```

---

## Pannello Admin

Accessibile su `/admin` solo per utenti con ruolo `admin`.

### Sezioni

| Sezione | Route | Funzionalita |
|---------|-------|--------------|
| Dashboard | `/admin` | Statistiche: utenti, chat, messaggi, agenti |
| Utenti | `/admin/users` | Lista, crea, modifica, attiva/disattiva, cambia ruolo |
| Agenti | `/admin/agents` | Lista tutti gli agenti, proprietario, utilizzo |
| Chat | `/admin/chats` | Lista tutte le chat, archivia, elimina |
| Audit | `/admin/audit` | Log azioni con filtri |
| Impostazioni | `/admin/settings` | Modello AI, limiti, feature flags |

### API Admin

| Endpoint | Metodi | Permesso |
|----------|--------|----------|
| `/api/admin/stats` | GET | admin.access |
| `/api/admin/users` | GET, POST | users.read, users.write |
| `/api/admin/users/[id]` | GET, PATCH, DELETE | users.* |
| `/api/admin/audit` | GET | audit.read |
| `/api/admin/settings` | GET, PATCH | settings.* |

---

## Script NPM

| Comando | Descrizione |
|---------|-------------|
| `npm run dev` | Server sviluppo con hot reload |
| `npm run build` | Build produzione |
| `npm run start` | Avvia server produzione |
| `npm run lint` | ESLint |

---

## Variabili Ambiente

| Variabile | Obbligatoria | Descrizione |
|-----------|--------------|-------------|
| `DATABASE_URL` | Si | Connection string PostgreSQL |
| `AUTH_SECRET` | Si | Secret per JWT (min 32 char) |
| `OPENAI_API_KEY` | Si | API key OpenAI |
| `GOOGLE_CLIENT_ID` | No | OAuth Google |
| `GOOGLE_CLIENT_SECRET` | No | OAuth Google |

---

## Troubleshooting

### "DATABASE_URL is not set"
Verifica che `.env` esista e contenga `DATABASE_URL`.

### "relation does not exist"
```bash
npx prisma migrate dev
```

### "Prisma client not generated"
```bash
npx prisma generate
```

### "Cannot access /admin" (403)
L'utente non ha ruolo admin. Promuovilo:
```bash
npx tsx scripts/create-admin.ts email@utente.com
```

### Conflitto migrazioni
```bash
# ATTENZIONE: cancella tutti i dati!
npx prisma migrate reset
```

### Cache LSP/TypeScript non aggiornata
```bash
# Rigenera client dopo modifiche schema
npx prisma generate

# Riavvia il server TS del tuo editor
```

---

## Development

### Aggiungere un nuovo componente shadcn/ui

```bash
npx shadcn@latest add <component>
# Esempio: npx shadcn@latest add table
```

### Modificare lo schema database

1. Modifica `prisma/schema.prisma`
2. Crea migrazione: `npx prisma migrate dev --name descrizione`
3. Il client viene rigenerato automaticamente

### Aggiungere un nuovo permesso

1. Aggiungi in `scripts/create-admin.ts` nell'array `ADMIN_PERMISSIONS`
2. Riesegui lo script per aggiornare i permessi:
   ```bash
   npx tsx scripts/create-admin.ts admin@existing.com
   ```

---

## License

MIT
