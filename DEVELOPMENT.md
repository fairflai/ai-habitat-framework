# Development Guide

Complete technical reference for AI Chat Habitat. This document covers architecture, database schema, API endpoints, authentication, admin panel, and customization.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Authentication & Authorization](#authentication--authorization)
- [API Reference](#api-reference)
- [Frontend Architecture](#frontend-architecture)
- [Admin Panel](#admin-panel)
- [RBAC Permissions](#rbac-permissions)
- [User Management Scripts](#user-management-scripts)
- [Prisma & Database Cheatsheet](#prisma--database-cheatsheet)
- [Customization Guide](#customization-guide)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

AI Chat Habitat follows a layered architecture built on Next.js 16 App Router:

```
┌─────────────────────────────────────────────────────┐
│                     Client                          │
│  React 19 + Zustand (local state) + TanStack Query │
│  shadcn/ui + Radix UI + Tailwind CSS 4             │
├─────────────────────────────────────────────────────┤
│                   Middleware                        │
│  Auth guard + Admin route protection                │
├─────────────────────────────────────────────────────┤
│                  API Routes                         │
│  /api/chats, /api/agents, /api/folders, /api/admin  │
├─────────────────────────────────────────────────────┤
│                   Services                          │
│  NextAuth v5 (JWT) + Vercel AI SDK (streaming)      │
├─────────────────────────────────────────────────────┤
│                   Database                          │
│  PostgreSQL + Prisma ORM 7.x (PrismaPg adapter)    │
└─────────────────────────────────────────────────────┘
```

### Key Design Decisions

- **JWT sessions** (`strategy: 'jwt'`) -- Role and permissions are embedded in the token and refreshed on `trigger === 'update'` or when `token.role` is missing. This avoids a DB lookup on every request while keeping RBAC data accessible in the middleware.
- **PrismaPg adapter** -- The project uses `@prisma/adapter-pg` with a raw `pg` connection string instead of Prisma's default driver. This provides better compatibility with edge/serverless environments.
- **Singleton Prisma client** -- In development, the client is cached on `globalThis` to survive hot reloads without exhausting database connections (`src/lib/prisma.ts`).
- **Dual state management** -- Zustand stores provide instant, optimistic UI updates for chats/messages/folders/agents. TanStack Query handles server synchronization, caching, and background refetching.
- **Server Components for admin** -- Admin pages (`/admin/*`) are React Server Components that fetch data directly with Prisma, avoiding API round-trips. The chat interface uses Client Components for real-time interactivity.

---

## Getting Started

### Prerequisites

| Requirement    | Version |
| -------------- | ------- |
| Node.js or Bun | 20+     |
| PostgreSQL     | 15+     |
| OpenAI API key | --      |

### Installation

```bash
git clone <repository-url>
cd ai-habitat-framework
bun install        # or: npm install
```

### Environment Setup

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

See [`.env.example`](./.env.example) for all available variables with descriptions.

> Generate `AUTH_SECRET` with: `openssl rand -base64 32`

### Database Setup

```bash
npx prisma generate          # Generate the Prisma client
npx prisma migrate dev       # Apply migrations
npx tsx scripts/create-admin.ts admin@example.com "Admin" password123
```

### Start Development

```bash
bun dev           # or: npm run dev
```

Open http://localhost:3000

---

## Project Structure

```
ai-habitat-framework/
├── prisma/
│   ├── schema.prisma              # Database schema definition
│   └── migrations/                # Auto-generated SQL migrations
├── scripts/
│   ├── create-admin.ts            # Create or promote admin users
│   └── create-user.ts             # Create regular users
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout (providers: Session, Theme, ReactQuery)
│   │   ├── globals.css            # Tailwind config, CSS variables, custom utilities
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx     # Login page (credentials + Google OAuth)
│   │   │   └── logout/page.tsx    # Logout handler (auto sign-out + redirect)
│   │   ├── (chat)/
│   │   │   ├── layout.tsx         # Chat layout (sidebar + content area)
│   │   │   ├── page.tsx           # Home: welcome hero + suggestion cards
│   │   │   └── c/[chatId]/
│   │   │       └── page.tsx       # Individual chat page (SSR message loading)
│   │   ├── admin/
│   │   │   ├── layout.tsx         # Admin layout (sidebar + header + breadcrumbs)
│   │   │   ├── page.tsx           # Dashboard with stats cards
│   │   │   ├── users/page.tsx     # User management table
│   │   │   ├── agents/page.tsx    # Agent moderation table
│   │   │   ├── chats/page.tsx     # Chat moderation table
│   │   │   ├── audit/page.tsx     # Audit log viewer
│   │   │   └── settings/page.tsx  # System settings (AI config, rate limits, feature flags)
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts    # NextAuth handler
│   │       ├── chats/route.ts                 # GET (list), POST (create)
│   │       ├── chats/[chatId]/route.ts        # PATCH (update), DELETE
│   │       ├── chats/[chatId]/generate-title/route.ts  # POST (AI title generation)
│   │       ├── chats/[chatId]/messages/route.ts        # GET (list messages)
│   │       ├── chats/[chatId]/messages/stream/route.ts # POST (AI streaming)
│   │       ├── folders/route.ts               # GET (list), POST (create)
│   │       ├── folders/[folderId]/route.ts    # PATCH (rename), DELETE
│   │       ├── agents/route.ts                # GET (list), POST (create)
│   │       ├── agents/[agentId]/route.ts      # PATCH (update), DELETE
│   │       ├── admin/stats/route.ts           # GET (dashboard statistics)
│   │       ├── admin/users/route.ts           # GET (list), POST (create)
│   │       ├── admin/users/[userId]/route.ts  # GET, PATCH, DELETE
│   │       ├── admin/audit/route.ts           # GET (paginated audit logs)
│   │       └── admin/settings/route.ts        # GET (read), PATCH (upsert)
│   ├── components/
│   │   ├── admin/
│   │   │   ├── admin-sidebar.tsx      # Admin navigation sidebar
│   │   │   ├── admin-header.tsx       # Admin header with breadcrumbs
│   │   │   └── stats-card.tsx         # Reusable stats card with trend display
│   │   ├── chat/
│   │   │   ├── ChatInterface.tsx      # Main chat container (messages + input)
│   │   │   ├── ChatHeader.tsx         # Chat top bar (title + sidebar toggle)
│   │   │   ├── ChatBody.tsx           # Message list with auto-scroll
│   │   │   ├── ChatEmptyState.tsx     # Empty chat placeholder
│   │   │   ├── MessageBubble.tsx      # Individual message rendering + copy button
│   │   │   ├── MessagesInput.tsx      # Input bar (textarea + toolbar + send/stop)
│   │   │   ├── ThinkingIndicator.tsx  # Animated loading dots
│   │   │   ├── RenameDialog.tsx       # Rename chat/folder dialog
│   │   │   ├── DeleteConfirmDialog.tsx # Delete confirmation dialog
│   │   │   ├── AgentDialog.tsx        # Create/edit agent dialog (form)
│   │   │   ├── welcome/
│   │   │   │   ├── WelcomeHero.tsx    # Landing hero with CTA
│   │   │   │   └── WelcomeSuggestions.tsx  # Prompt suggestion cards
│   │   │   └── sidebar/
│   │   │       ├── index.tsx          # Chat sidebar (chats, folders, agents)
│   │   │       ├── SidebarItem.tsx    # Single chat item with context menu
│   │   │       └── useChatSidebarLogic.ts  # Sidebar business logic hook
│   │   ├── providers/
│   │   │   ├── ReactQueryProvider.tsx # TanStack Query client setup
│   │   │   └── ThemeProvider.tsx      # next-themes wrapper
│   │   └── ui/                        # 19 shadcn/ui components
│   ├── hooks/
│   │   ├── useChats.ts            # CRUD hooks for chats (query + mutations)
│   │   ├── useChatMessages.ts     # Message sending + title generation hooks
│   │   ├── useChatStream.ts       # Streaming chat logic (send, receive, auto-title)
│   │   ├── useAgents.ts           # CRUD hooks for agents
│   │   ├── useFolders.ts          # CRUD hooks for folders
│   │   └── use-mobile.ts          # Responsive breakpoint detection
│   ├── lib/
│   │   ├── auth.ts                # NextAuth configuration (providers, callbacks, JWT)
│   │   ├── prisma.ts              # Prisma client singleton (PrismaPg adapter)
│   │   ├── admin.ts               # Admin utilities (requireAdmin, permissions, audit, error handling)
│   │   └── utils.ts               # Tailwind `cn()` utility
│   ├── stores/
│   │   ├── chatStore.ts           # Zustand: chats, folders, agents (CRUD actions)
│   │   ├── messageStore.ts        # Zustand: messages (set, add, update)
│   │   └── uiStore.ts             # Zustand: sidebar open/close
│   ├── types/
│   │   ├── index.ts               # App-level types extending Prisma models
│   │   └── next-auth.ts           # NextAuth type augmentation (role, permissions)
│   └── middleware.ts              # Route protection (auth + admin guard)
├── prisma.config.ts               # Prisma configuration (schema path, datasource)
├── next.config.ts                 # Next.js configuration
├── tsconfig.json                  # TypeScript configuration
├── components.json                # shadcn/ui configuration
└── package.json                   # Dependencies and scripts
```

---

## Database Schema

The database consists of 12 models organized in three groups.

### Entity-Relationship Overview

```
User ─┬── Chat ──── Message
      │     │          │
      │     ├── Vote ──┘
      │     ├── Folder
      │     └── Agent
      │
      ├── Account (OAuth)
      ├── Session
      ├── Role ──── Permission (many-to-many)
      └── AuditLog

SystemSetting (standalone key-value store)
```

### Core Models

| Model    | Purpose                                              | Key Fields                                                  |
| -------- | ---------------------------------------------------- | ----------------------------------------------------------- |
| `User`   | Application users with auth credentials and RBAC     | `email` (unique), `password?`, `isActive`, `roleId?`        |
| `Chat`   | Conversations belonging to a user                    | `title`, `visibility` (PUBLIC/PRIVATE), `isArchived`, `agentId?`, `folderId?` |
| `Message` | Individual messages within a chat                   | `role` (USER/ASSISTANT/SYSTEM), `content`, `webSearch`, `deepReasoning`, `attachments` (JSON) |
| `Agent`  | Custom AI personas with system prompts               | `name`, `description?`, `instructions` (system prompt)      |
| `Folder` | Organizational containers for chats                  | `name`, `userId`                                            |
| `Vote`   | User feedback on messages (upvote/downvote)           | `isUpvoted`, unique constraint on `[messageId, userId]`     |

### Auth Models (NextAuth)

| Model     | Purpose                      |
| --------- | ---------------------------- |
| `Account` | OAuth provider connections   |
| `Session` | Active user sessions         |

### Admin/RBAC Models

| Model           | Purpose                                        | Key Fields                                    |
| --------------- | ---------------------------------------------- | --------------------------------------------- |
| `Role`          | Named role with associated permissions         | `name` (unique: "admin", "moderator", etc.)   |
| `Permission`    | Granular permission (many-to-many with Role)   | `name` (unique: "users.read", "chats.delete") |
| `AuditLog`      | Immutable log of admin actions                 | `action`, `target`, `targetType`, `metadata` (JSON), indexed on `[action, userId, createdAt]` |
| `SystemSetting` | Key-value configuration store                  | `key` (unique), `value` (JSON)                |

### Cascade Behavior

| Parent   | Child    | On Delete    |
| -------- | -------- | ------------ |
| User     | Chat     | Cascade      |
| User     | Account  | Cascade      |
| User     | Session  | Cascade      |
| User     | Folder   | Cascade      |
| User     | Agent    | Cascade      |
| User     | AuditLog | SetNull      |
| Chat     | Message  | Cascade      |
| Chat     | Vote     | Cascade      |
| Message  | Vote     | Cascade      |
| Folder   | Chat     | SetNull      |
| Agent    | Chat     | SetNull      |
| Role     | User     | SetNull      |

---

## Authentication & Authorization

### Authentication Flow

Authentication is handled by NextAuth.js v5 with JWT strategy, configured in `src/lib/auth.ts`.

**Providers:**
1. **Credentials** -- Email/password login with bcrypt hashing and Zod validation
2. **Google OAuth** -- Optional, requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

**JWT Callbacks:**

- On sign-in: user `id`, `role`, and `permissions` are written into the JWT token
- On session access: token data is exposed to `session.user`
- On `trigger === 'update'` or missing role: permissions are refreshed from the database

**Type Augmentation:**

The `src/types/next-auth.ts` file extends NextAuth's default types to include `role` and `permissions` on both `Session.user` and `JWT`.

### Middleware (Route Protection)

`src/middleware.ts` runs on every request (except static files) and enforces:

1. **Authentication** -- Unauthenticated users on protected routes are redirected to `/login?callbackUrl=...`
2. **Login redirect** -- Authenticated users on `/login` are redirected to `/`
3. **Admin guard** -- Routes under `/admin` and `/api/admin` require `role === 'admin'`:
   - Page requests return a redirect to `/?error=forbidden`
   - API requests return `403 JSON` response

**Public routes** (no auth required): `/login`, `/logout`, `/api/auth/*`

### Admin Authorization

API-level admin authorization is handled by utilities in `src/lib/admin.ts`:

```typescript
// Simple: require admin role
const session = await requireAdmin()

// Granular: require specific permission
const session = await requirePermission('users.write')

// Check without throwing
const canWrite = hasPermission(session, 'users.write')

// Wrapper for API route handlers (auto auth + error handling)
export const GET = withAdmin(async (session, request) => {
  // handler body
}, { permission: 'users.read' })
```

---

## API Reference

All API routes require authentication unless noted otherwise. Ownership is verified for user-scoped resources (chats, folders, agents).

### Chat Endpoints

| Method | Endpoint                                      | Description                           | Auth          |
| ------ | --------------------------------------------- | ------------------------------------- | ------------- |
| GET    | `/api/chats`                                  | List user's non-archived chats (sorted by `updatedAt` desc) | User |
| POST   | `/api/chats`                                  | Create a new chat                     | User          |
| PATCH  | `/api/chats/[chatId]`                         | Update chat title or folder           | Owner         |
| DELETE | `/api/chats/[chatId]`                         | Hard-delete chat (cascades to messages/votes) | Owner  |
| GET    | `/api/chats/[chatId]/messages`                | List messages in a chat (sorted by `createdAt` asc) | Owner |
| POST   | `/api/chats/[chatId]/messages/stream`         | Send message and stream AI response   | Owner         |
| POST   | `/api/chats/[chatId]/generate-title`          | Generate AI title from first 5 messages | Owner       |

**POST `/api/chats`** request body:
```json
{ "title": "string (optional)", "agentId": "string (optional)" }
```

**POST `/api/chats/[chatId]/messages/stream`** request body:
```json
{ "messages": [{ "role": "user|assistant", "content": "string" }] }
```

The stream endpoint:
1. Saves the latest user message to the database
2. Prepends agent system instructions if the chat has an associated agent
3. Streams the AI response using `streamText()` from the Vercel AI SDK
4. Saves the completed assistant message to the database via `onFinish`

### Folder Endpoints

| Method | Endpoint                    | Description                               | Auth  |
| ------ | --------------------------- | ----------------------------------------- | ----- |
| GET    | `/api/folders`              | List user's folders with nested chats     | User  |
| POST   | `/api/folders`              | Create a folder                           | User  |
| PATCH  | `/api/folders/[folderId]`   | Rename a folder                           | Owner |
| DELETE | `/api/folders/[folderId]`   | Delete folder (chats are unassigned, not deleted) | Owner |

### Agent Endpoints

| Method | Endpoint                    | Description            | Auth  |
| ------ | --------------------------- | ---------------------- | ----- |
| GET    | `/api/agents`               | List user's agents     | User  |
| POST   | `/api/agents`               | Create an agent        | User  |
| PATCH  | `/api/agents/[agentId]`     | Update agent           | Owner |
| DELETE | `/api/agents/[agentId]`     | Delete agent           | Owner |

**POST/PATCH `/api/agents`** request body:
```json
{ "name": "string", "description": "string", "instructions": "string (system prompt)" }
```

### Admin Endpoints

All admin endpoints require `role === 'admin'` plus the specific permission listed.

| Method | Endpoint                      | Description                          | Permission       |
| ------ | ----------------------------- | ------------------------------------ | ---------------- |
| GET    | `/api/admin/stats`            | Dashboard statistics (users, chats, messages, agents, trends) | `admin.access` |
| GET    | `/api/admin/users`            | Paginated user list with search      | `users.read`     |
| POST   | `/api/admin/users`            | Create user (with role assignment)   | `users.write`    |
| GET    | `/api/admin/users/[userId]`   | User detail with role & permissions  | `users.read`     |
| PATCH  | `/api/admin/users/[userId]`   | Update user (name, email, role, status) | `users.write` |
| DELETE | `/api/admin/users/[userId]`   | Delete user (self-deletion blocked)  | `users.delete`   |
| GET    | `/api/admin/audit`            | Paginated audit logs with filters    | `audit.read`     |
| GET    | `/api/admin/settings`         | Read all system settings             | `settings.read`  |
| PATCH  | `/api/admin/settings`         | Upsert system settings               | `settings.write` |

**GET `/api/admin/users`** query parameters:
- `page` (default: 1)
- `limit` (default: 50)
- `search` (filters by email or name, case-insensitive)

**GET `/api/admin/audit`** query parameters:
- `page` (default: 1)
- `limit` (default: 50)
- `action` (filter by action type)
- `userId` (filter by user)

---

## Frontend Architecture

### Provider Hierarchy

The root layout (`src/app/layout.tsx`) wraps the entire application:

```
ReactQueryProvider (TanStack Query client, staleTime: 60s)
  └── ThemeProvider (next-themes, system preference)
        └── SessionProvider (NextAuth client session)
              └── {children}
```

### State Management

**Zustand Stores** (client-side, synchronous):

| Store            | File                    | Purpose                                           |
| ---------------- | ----------------------- | ------------------------------------------------- |
| `useChatStore`   | `stores/chatStore.ts`   | Chats, folders, agents arrays + active chat ID + CRUD actions |
| `useMessageStore`| `stores/messageStore.ts`| Messages array + set/add/update actions           |
| `useUIStore`     | `stores/uiStore.ts`     | Sidebar open/close state                          |

**TanStack Query Hooks** (server synchronization):

| Hook                  | File                    | Query Key    | Purpose                           |
| --------------------- | ----------------------- | ------------ | --------------------------------- |
| `useChats`            | `hooks/useChats.ts`     | `['chats']`  | Fetch + cache chat list           |
| `useCreateChat`       | `hooks/useChats.ts`     | --           | Create chat + invalidate          |
| `useUpdateChat`       | `hooks/useChats.ts`     | --           | Update chat + optimistic update   |
| `useDeleteChat`       | `hooks/useChats.ts`     | --           | Delete chat + invalidate          |
| `useUpdateChatFolder` | `hooks/useChats.ts`     | --           | Move chat to folder               |
| `useFolders`          | `hooks/useFolders.ts`   | `['folders']`| Fetch folders with nested chats   |
| `useCreateFolder`     | `hooks/useFolders.ts`   | --           | Create folder + invalidate        |
| `useUpdateFolder`     | `hooks/useFolders.ts`   | --           | Rename folder + optimistic update |
| `useDeleteFolder`     | `hooks/useFolders.ts`   | --           | Delete folder + invalidate chats  |
| `useAgents`           | `hooks/useAgents.ts`    | `['agents']` | Fetch agent list                  |
| `useCreateAgent`      | `hooks/useAgents.ts`    | --           | Create agent + invalidate         |
| `useUpdateAgent`      | `hooks/useAgents.ts`    | --           | Update agent + optimistic update  |
| `useDeleteAgent`      | `hooks/useAgents.ts`    | --           | Delete agent + invalidate         |
| `useSendMessage`      | `hooks/useChatMessages.ts` | --        | POST to streaming endpoint        |
| `useGenerateTitle`    | `hooks/useChatMessages.ts` | --        | AI title generation + cache update|

### Chat Streaming Flow

The `useChatStream` hook (`hooks/useChatStream.ts`) orchestrates the real-time chat experience:

1. User submits a message via `handleSubmit`
2. An optimistic user message is appended to local state
3. `useSendMessage` POSTs to `/api/chats/[chatId]/messages/stream`
4. The response `ReadableStream` is consumed chunk by chunk via `reader.read()`
5. Each chunk is decoded and appended to the assistant message in state (real-time rendering)
6. On completion, if it's the first message, `useGenerateTitle` is triggered
7. A `stop()` function allows cancelling the stream via `reader.cancel()`

**Auto-send from URL:** If the URL contains a `?prompt=...` query parameter, the hook automatically sends that prompt on mount (used when creating a chat from the welcome page suggestions).

### Chat Page (Server Component)

The individual chat page (`src/app/(chat)/c/[chatId]/page.tsx`) is a **Server Component** that:
1. Authenticates the user via `auth()`
2. Fetches the chat and its messages directly from Prisma
3. Verifies ownership (user can only access their own chats)
4. Passes `initialMessages` to the `ChatInterface` client component

This pattern provides fast initial page loads with SSR while the client takes over for real-time streaming.

---

## Admin Panel

Accessible at `/admin`, protected by middleware (requires `admin` role).

### Pages

| Page         | Route              | Rendering   | Description                                        |
| ------------ | ------------------ | ----------- | -------------------------------------------------- |
| Dashboard    | `/admin`           | RSC (async) | Stats cards: total users, chats, messages, agents + 7-day trends |
| Users        | `/admin/users`     | RSC (async) | User table with role badges, activity status, counts |
| Agents       | `/admin/agents`    | RSC (async) | Agent table with owner info and chat usage         |
| Chats        | `/admin/chats`     | RSC (async) | Chat table with user, agent, message count, archive status |
| Audit Log    | `/admin/audit`     | RSC (async) | Timestamped action log with user and target info   |
| Settings     | `/admin/settings`  | RSC (async) | AI config, rate limits, feature flags              |

All admin pages use React `Suspense` with skeleton fallbacks for streaming SSR.

### Admin Components

- **`AdminSidebar`** -- Fixed left sidebar with nav items (Dashboard, Users, Agents, Chat, Audit, Settings) + "Back to Chat" link
- **`AdminHeader`** -- Top bar with dynamic breadcrumbs based on URL path + theme toggle
- **`StatsCard`** -- Reusable card showing a metric with optional icon, description, and trend percentage

---

## RBAC Permissions

### Available Permissions

| Permission        | Description                      |
| ----------------- | -------------------------------- |
| `users.read`      | View user list and details       |
| `users.write`     | Create and modify users          |
| `users.delete`    | Delete users                     |
| `users.roles`     | Manage user roles                |
| `chats.read`      | View all chats                   |
| `chats.write`     | Modify any chat                  |
| `chats.delete`    | Delete any chat                  |
| `agents.read`     | View all agents                  |
| `agents.write`    | Modify any agent                 |
| `agents.delete`   | Delete any agent                 |
| `audit.read`      | View audit logs                  |
| `settings.read`   | View system settings             |
| `settings.write`  | Modify system settings           |
| `admin.access`    | Access the admin panel           |

### How Permissions Work

1. Permissions are stored in the `Permission` table
2. Roles have a many-to-many relationship with permissions
3. Users are assigned a single role via `roleId`
4. On login, the user's permissions are loaded and embedded in the JWT token
5. The `withAdmin` wrapper and `requirePermission` function check permissions on each admin API call
6. Audit actions are logged via `logAudit()` for traceability

### Adding a New Permission

1. Add the permission to the `ADMIN_PERMISSIONS` array in `scripts/create-admin.ts`
2. Re-run the script to sync permissions: `npx tsx scripts/create-admin.ts admin@existing.com`
3. Use `requirePermission('your.permission')` in the relevant API route

---

## User Management Scripts

### Create a Regular User

```bash
npx tsx scripts/create-user.ts <email> <name> <password>

# Example:
npx tsx scripts/create-user.ts mario@example.com "Mario Rossi" mypassword123
```

### Create an Admin User

```bash
# Create a new user as admin
npx tsx scripts/create-admin.ts <email> <name> <password>

# Example:
npx tsx scripts/create-admin.ts admin@example.com "Super Admin" adminpass123
```

### Promote an Existing User to Admin

```bash
# Pass only the email to promote an existing user
npx tsx scripts/create-admin.ts <email>

# Example:
npx tsx scripts/create-admin.ts mario@example.com
```

The `create-admin.ts` script performs these steps:
1. Creates all permissions defined in `ADMIN_PERMISSIONS` (idempotent upserts)
2. Creates or updates the `admin` role with all permissions
3. Creates the user or promotes an existing one
4. Logs the action in the audit log

---

## Prisma & Database Cheatsheet

### Essential Commands

```bash
# Generate client (after modifying schema.prisma)
npx prisma generate

# Create and apply a migration
npx prisma migrate dev --name <migration_name>

# Apply migrations (no prompt, for CI/production)
npx prisma migrate deploy

# Push schema without creating migration (rapid prototyping)
npx prisma db push

# Reset database (DELETES ALL DATA)
npx prisma migrate reset

# Open GUI to browse database
npx prisma studio

# Check migration status
npx prisma migrate status

# Validate schema syntax
npx prisma validate

# Format schema file
npx prisma format
```

### Useful SQL Queries

```sql
-- User count
SELECT COUNT(*) FROM "User";

-- Users with roles
SELECT u.email, u.name, r.name as role
FROM "User" u
LEFT JOIN "Role" r ON u."roleId" = r.id;

-- Chats per user
SELECT u.email, COUNT(c.id) as chat_count
FROM "User" u
LEFT JOIN "Chat" c ON u.id = c."userId"
GROUP BY u.id;

-- Messages per day (last 7 days)
SELECT DATE(m."createdAt"), COUNT(*)
FROM "Message" m
WHERE m."createdAt" > NOW() - INTERVAL '7 days'
GROUP BY DATE(m."createdAt")
ORDER BY 1;

-- Recent audit log entries
SELECT al.action, al."createdAt", u.email
FROM "AuditLog" al
LEFT JOIN "User" u ON al."userId" = u.id
ORDER BY al."createdAt" DESC
LIMIT 50;
```

### Backup & Restore

```bash
# Backup
pg_dump -h localhost -U user -d ai-habitat-chat > backup.sql

# Restore
psql -h localhost -U user -d ai-habitat-chat < backup.sql
```

---

## Customization Guide

### Changing the AI Model

The AI model is configured in `src/app/api/chats/[chatId]/messages/stream/route.ts`:

```typescript
const result = streamText({
  model: openai('gpt-5-mini'),  // Change this
  messages: coreMessages,
})
```

To use a different provider (e.g., Anthropic):
1. Install the provider: `bun add @ai-sdk/anthropic`
2. Import and use it: `import { anthropic } from '@ai-sdk/anthropic'`
3. Replace the model: `model: anthropic('claude-sonnet-4-20250514')`

### Adding a New shadcn/ui Component

```bash
npx shadcn@latest add <component>
# Example: npx shadcn@latest add table
```

Components are installed into `src/components/ui/` and can be customized freely.

### Modifying the Database Schema

1. Edit `prisma/schema.prisma`
2. Create a migration: `npx prisma migrate dev --name description`
3. The Prisma client is regenerated automatically
4. Update TypeScript types in `src/types/index.ts` if needed

### Adding a New API Route

1. Create the route file under `src/app/api/your-route/route.ts`
2. Use the auth pattern from existing routes:
```typescript
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  // Your logic here
}
```

### Adding a New Admin API Route

Use the `withAdmin` wrapper for automatic auth + permission checking + error handling:

```typescript
import { withAdmin, logAudit } from '@/lib/admin'

export const GET = withAdmin(async (session, request) => {
  // session.user is guaranteed to be an admin with the required permission
  return NextResponse.json({ data: 'example' })
}, { permission: 'your.permission' })
```

---

## Environment Variables

A fully commented template is available at [`.env.example`](./.env.example). Copy it to get started:

```bash
cp .env.example .env
```

| Variable              | Required | Description                                  | Default |
| --------------------- | -------- | -------------------------------------------- | ------- |
| `DATABASE_URL`        | Yes      | PostgreSQL connection string                 | --      |
| `AUTH_SECRET`         | Yes      | Secret for JWT signing (min 32 chars)        | --      |
| `OPENAI_API_KEY`      | Yes      | OpenAI API key                               | --      |
| `GOOGLE_CLIENT_ID`    | No       | Google OAuth client ID                       | --      |
| `GOOGLE_CLIENT_SECRET`| No       | Google OAuth client secret                   | --      |
| `ENABLE_AUTO_TITLE`   | No       | Enable AI-powered chat title generation      | `true`  |

---

## Troubleshooting

### "DATABASE_URL is not set"

Verify that `.env` exists in the project root and contains `DATABASE_URL`.

### "relation does not exist"

Migrations haven't been applied:
```bash
npx prisma migrate dev
```

### "Failed to load external module @prisma/client" / "Cannot find module '.prisma/client/default'"

The Prisma client hasn't been generated:
```bash
npx prisma generate
```

### "Cannot access /admin" (403 Forbidden)

The user doesn't have the admin role. Promote them:
```bash
npx tsx scripts/create-admin.ts email@user.com
```

### Migration Conflicts

If migrations are out of sync (common after branch switching):
```bash
# WARNING: This deletes ALL data
npx prisma migrate reset
```

### TypeScript / LSP Cache Issues

After modifying `schema.prisma`, regenerate the client and restart your editor's TS server:
```bash
npx prisma generate
# Then restart TS server in your editor (e.g., Cmd+Shift+P > "TypeScript: Restart TS Server" in VS Code)
```

### "The middleware file convention is deprecated"

This is a Next.js 16.1 deprecation warning. The project still uses the `middleware.ts` convention, which continues to work but may need migration to the `proxy` convention in a future version.

---

## NPM Scripts

| Command         | Description                        |
| --------------- | ---------------------------------- |
| `bun dev`       | Start dev server with hot reload   |
| `bun run build` | Production build                   |
| `bun start`     | Start production server            |
| `bun run lint`  | Run ESLint                         |

---

## License

AGPL-3.0 -- See [LICENSE](./LICENSE) for full text. A commercial dual license is available; contact [Fairflai](https://fairflai.com/) for details.
