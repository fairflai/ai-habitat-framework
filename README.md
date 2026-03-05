# AI Chat Habitat

**A modular, hackable AI chat framework for building your own AI-powered applications.**

Developed by [Fairflai](https://fairflai.com/)

---

## What is AI Chat Habitat?

AI Chat Habitat is an open-source starter kit for building modular AI chat applications. Built with modern technologies and designed to be fully customizable, it provides everything you need to create production-ready AI assistants, chatbots, and conversational interfaces.

Whether you're building an internal tool, a customer support bot, or a specialized AI assistant, AI Chat Habitat gives you a solid foundation that you can extend and modify to fit your exact needs.

## Key Features

- **Real-time AI Chat** -- Streaming responses with OpenAI integration via Vercel AI SDK
- **Custom Agents** -- Create specialized AI personas with custom system prompts and behaviors
- **Multi-user Ready** -- Full authentication system with email/password and Google OAuth
- **Admin Dashboard** -- Complete admin panel with user management, analytics, and audit logs
- **Role-Based Access Control** -- Granular RBAC permissions system for enterprise use cases
- **Folder Organization** -- Organize conversations with a flexible folder structure
- **Auto-generated Titles** -- AI-powered chat title generation from conversation context
- **Message Voting** -- Collect feedback on AI responses (upvote/downvote)
- **Dark/Light Themes** -- Built-in theming with system preference detection
- **Fully Self-Hosted** -- Deploy anywhere, own your data

## Tech Stack

| Category      | Technology                             |
| ------------- | -------------------------------------- |
| **Framework** | Next.js 16.1 (App Router, React 19)   |
| **Database**  | PostgreSQL 15+ with Prisma ORM 7.x    |
| **Auth**      | NextAuth.js v5 (JWT strategy)         |
| **AI**        | Vercel AI SDK 6.x + OpenAI            |
| **UI**        | shadcn/ui + Radix UI + Tailwind CSS 4 |
| **State**     | Zustand + TanStack Query v5           |
| **Forms**     | React Hook Form + Zod 4               |
| **Runtime**   | Node.js 20+ / Bun                     |

## Quick Start

### Prerequisites

- Node.js 20+ or Bun
- PostgreSQL 15+
- OpenAI API key

### Installation

```bash
git clone <repository-url>
cd ai-habitat-framework
bun install        # or: npm install
```

### Configuration

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

See [`.env.example`](./.env.example) for all available variables with descriptions. At minimum you need:

- `DATABASE_URL` -- PostgreSQL connection string
- `AUTH_SECRET` -- JWT signing secret (generate with `openssl rand -base64 32`)
- `OPENAI_API_KEY` -- OpenAI API key

### Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Create your first admin user
npx tsx scripts/create-admin.ts admin@example.com "Admin" password123

# Start the development server
bun dev            # or: npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
ai-habitat-framework/
├── prisma/
│   ├── schema.prisma              # Database schema (12 models)
│   └── migrations/                # SQL migrations
├── scripts/
│   ├── create-admin.ts            # Create/promote admin users
│   └── create-user.ts             # Create regular users
├── src/
│   ├── app/
│   │   ├── (auth)/                # Login & logout pages
│   │   ├── (chat)/                # Chat interface (home + /c/[chatId])
│   │   ├── admin/                 # Admin panel (dashboard, users, agents, chats, audit, settings)
│   │   └── api/                   # REST API routes (15 endpoints)
│   ├── components/
│   │   ├── admin/                 # Admin panel components
│   │   ├── chat/                  # Chat UI components
│   │   ├── providers/             # React context providers
│   │   └── ui/                    # shadcn/ui component library
│   ├── hooks/                     # React Query hooks for data fetching
│   ├── lib/                       # Core utilities (auth, prisma, admin helpers)
│   ├── stores/                    # Zustand state stores
│   ├── types/                     # TypeScript type definitions
│   └── middleware.ts              # Auth & route protection middleware
├── next.config.ts
├── prisma.config.ts
└── tsconfig.json
```

## Documentation

For detailed development documentation, database schema, API reference, and customization guides, see **[DEVELOPMENT.md](./DEVELOPMENT.md)**.

## Extensibility

AI Chat Habitat is designed to be hacked and extended:

- **Add new AI providers** -- Swap OpenAI for Anthropic, Google, or local models via the Vercel AI SDK
- **Create custom agents** -- Define specialized AI behaviors with custom system prompts
- **Extend the database** -- Add new models with Prisma migrations
- **Build new features** -- The modular architecture makes it easy to add functionality
- **Customize the UI** -- shadcn/ui components are fully customizable and copy-pasted into your project

## Use Cases

- Internal AI assistants for teams
- Customer support chatbots
- Educational tutoring systems
- Research and prototyping tools
- White-label AI chat solutions
- Specialized domain-specific assistants

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

This means:

- You can use, modify, and distribute this software freely
- If you run a modified version as a network service (e.g., SaaS), you **must** release the source code of your modifications under AGPL-3.0
- Derivative works must retain the same license

### Commercial / Dual Licensing

If the AGPL-3.0 terms don't fit your use case (e.g., you want to embed AI Chat Habitat in a proprietary product without disclosing source code), a **commercial license** is available. Contact [Fairflai](https://fairflai.com/) for details.

See [LICENSE](./LICENSE) for the full license text.

---

Built with care by [Fairflai](https://fairflai.com/)
