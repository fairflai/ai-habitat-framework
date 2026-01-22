# AI Chat Habitat

**A modular, hackable AI chat framework for building your own AI-powered applications.**

Developed by [Fairflai](https://fairflai.com/)

---

## What is AI Chat Habitat?

AI Chat Habitat is an open-source starter kit for building modular AI chat applications. Built with modern technologies and designed to be fully customizable, it provides everything you need to create production-ready AI assistants, chatbots, and conversational interfaces.

Whether you're building an internal tool, a customer support bot, or a specialized AI assistant, AI Chat Habitat gives you a solid foundation that you can extend and modify to fit your exact needs.

## Key Features

- **Real-time AI Chat** - Streaming responses with OpenAI integration via Vercel AI SDK
- **Custom Agents** - Create specialized AI personas with custom instructions and behaviors
- **Multi-user Ready** - Full authentication system with email/password and OAuth support
- **Admin Dashboard** - Complete admin panel with user management, analytics, and audit logs
- **Role-Based Access Control** - Granular permissions system for enterprise use cases
- **Folder Organization** - Organize conversations with a flexible folder structure
- **Message Voting** - Collect feedback on AI responses
- **Dark/Light Themes** - Built-in theming support
- **Fully Self-Hosted** - Deploy anywhere, own your data

## Tech Stack

| Category      | Technology                            |
| ------------- | ------------------------------------- |
| **Framework** | Next.js 16 (App Router, React 19)     |
| **Database**  | PostgreSQL + Prisma ORM               |
| **Auth**      | NextAuth.js v5                        |
| **AI**        | Vercel AI SDK + OpenAI                |
| **UI**        | shadcn/ui + Radix UI + Tailwind CSS 4 |
| **State**     | Zustand + TanStack Query              |

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- OpenAI API key

### Installation

```bash
git clone <repository-url>
cd ai-habitat-chat
npm install
```

### Configuration

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/ai-habitat-chat?schema=public"
AUTH_SECRET="your-secret-key"
OPENAI_API_KEY="sk-..."
```

### Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Create your first admin user
npx tsx scripts/create-admin.ts admin@example.com "Admin" password123

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Documentation

For detailed development documentation, database schema, API reference, and customization guides, see [DEVELOPMENT.md](./DEVELOPMENT.md).

## Extensibility

AI Chat Habitat is designed to be hacked and extended:

- **Add new AI providers** - Swap OpenAI for Anthropic, Google, or local models
- **Create custom agents** - Define specialized AI behaviors with custom system prompts
- **Extend the database** - Add new models with Prisma migrations
- **Build new features** - The modular architecture makes it easy to add functionality
- **Customize the UI** - shadcn/ui components are fully customizable

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

This project is licensed under the **GNU Lesser General Public License v3.0 (LGPL-3.0)**.

This means you can:

- Use this software in your own projects (including commercial ones)
- Modify and distribute the source code
- Link to this library from proprietary software

If you modify AI Chat Habitat itself, you must release those modifications under LGPL-3.0.

See [LICENSE](./LICENSE) for the full license text.

---

Built with care by [Fairflai](https://fairflai.com/)
