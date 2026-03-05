# Implementation Plan: Admin Panel with Separated Auth

**Branch:** `feat/admin-panel-separated-auth`
**Status:** Complete

---

## Overview

Refactor the admin panel to use a **completely separate authentication system** from regular users. Admin users are stored in a dedicated `AdminUser` table with their own JWT-based auth (via `jose`), independent cookies, and zero shared auth surface with the NextAuth-based user auth.

Additionally, create a **centralized AI configuration module** that reads settings from the database, making the admin Settings page the real control center for AI behavior.

---

## Architecture

```
User Auth (NextAuth)              Admin Auth (Custom JWT)
┌─────────────────────┐           ┌─────────────────────┐
│ Table: User         │           │ Table: AdminUser    │
│ Provider: NextAuth  │           │ Provider: jose JWT  │
│ Cookie: authjs.*    │           │ Cookie: admin-token │
│ Secret: AUTH_SECRET │           │ Secret: ADMIN_JWT_  │
│ Routes: /login      │           │         SECRET      │
│         /api/auth/* │           │ Routes: /admin/login│
│         /(chat)/*   │           │     /api/admin/auth │
│         /api/chats  │           │     /admin/*        │
│         /api/agents │           │     /api/admin/*    │
│         /api/folders│           │                     │
└─────────────────────┘           └─────────────────────┘
         ▼                                  ▼
    Same Prisma DB              Same Prisma DB
    (User, Chat, Message,       (AdminUser, AuditLog,
     Agent, Folder, Vote)        SystemSetting)
```

---

## Phases

### Phase 1: Database Schema Changes
- [x] Add `AdminUser` model (id, email, password, name, isActive, timestamps)
- [x] Add `adminUserId` field to `AuditLog` → `AdminUser`
- [x] Remove `roleId` from `User`
- [x] Drop `Role` model
- [x] Drop `Permission` model
- [x] Create and apply migration

### Phase 2: Admin Auth Layer
- [x] Create `src/lib/admin-auth.ts` (signIn, verify, require, signOut using jose + bcrypt)
- [x] Create `POST /api/admin/auth/login` route
- [x] Create `POST /api/admin/auth/logout` route
- [x] Add `ADMIN_JWT_SECRET` to `.env` and `.env.example`

### Phase 3: Middleware Update
- [x] `/admin/login` → public (no auth required)
- [x] `/admin/*` → verify `admin-token` cookie with jose, redirect to `/admin/login` if invalid
- [x] `/api/admin/auth/*` → public
- [x] `/api/admin/*` → verify cookie, return 401 if invalid
- [x] Remove old `role === 'admin'` check
- [x] Keep NextAuth logic for user routes unchanged

### Phase 4: Cleanup User Auth
- [x] `src/lib/auth.ts` → remove role/permissions from JWT callbacks
- [x] `src/types/next-auth.ts` → remove role/permissions augmentation
- [x] `src/lib/admin.ts` → rewrite with new `withAdminApi()` wrapper using `verifyAdminSession()`

### Phase 5: Centralized AI Module
- [x] Create `src/lib/ai.ts` with `getAIConfig()` and `getChatModel()`
- [x] Update `messages/stream/route.ts` to use dynamic config from SystemSetting
- [x] Update `generate-title/route.ts` to use dynamic config from SystemSetting
- [x] Wire: system_prompt (global) + agent.instructions (per-agent)

### Phase 6: Rewrite create-admin.ts Script
- [x] Create `AdminUser` records (not User + Role)
- [x] Remove all RBAC/Permission logic
- [x] Simplified ~40 lines

### Phase 7: Admin Login Page
- [x] New page at `/admin/login`
- [x] Distinct design from user login
- [x] Form → POST /api/admin/auth/login → redirect /admin
- [x] Error display on failure

### Phase 8: Admin Layout & Shared Components
- [x] Update `admin/layout.tsx` with admin session verification
- [x] Update `AdminSidebar` with admin info + logout
- [x] Update `AdminHeader` (English labels)
- [x] Create `DataTable` component (pagination, search)
- [x] Create `ConfirmDialog` component
- [x] Create `StatusBadge` component

### Phase 9: Dashboard (`/admin`)
- [x] Stats cards (users, chats, messages, agents) with real data
- [x] Recent users list (last 5)
- [x] Recent activity (last 10 audit logs)

### Phase 10: Users Management (`/admin/users`)
- [x] List with pagination, search
- [x] Create user (dialog + form)
- [x] Edit user (dialog + form)
- [x] Toggle active/inactive status
- [x] Delete with confirmation
- [x] Full API routes wired

### Phase 11: Agents Management (`/admin/agents`)
- [x] List with owner info, chat count
- [x] View agent instructions (dialog)
- [x] Delete with confirmation

### Phase 12: Chats Moderation (`/admin/chats`)
- [x] List with user, agent, message count, status
- [x] View conversation messages
- [x] Archive/Restore toggle
- [x] Delete with confirmation

### Phase 13: Audit Log Viewer (`/admin/audit`)
- [x] Table with timestamp, action badge, actor, target, IP
- [x] Filters: action type, date range
- [x] Server-side pagination

### Phase 14: Settings (`/admin/settings`)
- [x] **AI Configuration**: model, title model, system prompt, max tokens, temperature
- [x] **Rate Limits**: max chats/user, max agents/user, max messages/chat
- [x] **Feature Flags**: registration, auto-title, web search, deep reasoning
- [x] Form with React Hook Form + Zod validation
- [x] Save button → PATCH /api/admin/settings
- [x] Toast confirmation
- [x] Audit log on save
- [x] Settings actually consumed by AI routes via src/lib/ai.ts

### Phase 15: Config & Docs
- [x] Update `.env` with `ADMIN_JWT_SECRET`
- [x] Update `.env.example` with `ADMIN_JWT_SECRET`
- [x] Update `README.md`
- [x] Update `DEVELOPMENT.md`
- [x] Update seed script

---

## Files Changed Summary

| Category | New | Rewritten | Modified | Removed |
|----------|-----|-----------|----------|---------|
| Database | migration | schema.prisma | seed.ts | Role, Permission models |
| Auth | admin-auth.ts, 2 API routes | admin.ts, middleware.ts | auth.ts, next-auth.ts | -- |
| AI | ai.ts | stream/route.ts, generate-title/route.ts | -- | -- |
| Admin UI | login/page, DataTable, ConfirmDialog, StatusBadge | all 6 admin pages, sidebar, header, layout | -- | stats-card.tsx (merged) |
| Script | -- | create-admin.ts | -- | -- |
| Config | -- | -- | .env, .env.example, README, DEVELOPMENT | -- |

**Total: ~35 files**
