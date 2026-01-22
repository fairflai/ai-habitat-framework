import { Suspense } from 'react'
import { Users, MessageSquare, Bot, Activity } from 'lucide-react'
import { StatsCard } from '@/components/admin/stats-card'
import prisma from '@/lib/prisma'

async function getStats() {
  const [usersCount, chatsCount, messagesCount, agentsCount, recentUsers, recentChats] =
    await Promise.all([
      prisma.user.count(),
      prisma.chat.count(),
      prisma.message.count(),
      prisma.agent.count(),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
      prisma.chat.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ])

  return {
    usersCount,
    chatsCount,
    messagesCount,
    agentsCount,
    recentUsers,
    recentChats,
  }
}

function StatsCardSkeleton() {
  return (
    <div className="h-32 animate-pulse rounded-lg border bg-card" />
  )
}

async function DashboardStats() {
  const stats = await getStats()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Utenti Totali"
        value={stats.usersCount}
        description={`+${stats.recentUsers} ultimi 7 giorni`}
        icon={Users}
      />
      <StatsCard
        title="Chat Totali"
        value={stats.chatsCount}
        description={`+${stats.recentChats} ultimi 7 giorni`}
        icon={MessageSquare}
      />
      <StatsCard
        title="Messaggi Totali"
        value={stats.messagesCount.toLocaleString()}
        icon={Activity}
      />
      <StatsCard
        title="Agenti Creati"
        value={stats.agentsCount}
        icon={Bot}
      />
    </div>
  )
}

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Panoramica generale del sistema
        </p>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </div>
        }
      >
        <DashboardStats />
      </Suspense>

      {/* Recent Activity Section - Placeholder */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">Ultimi Utenti Registrati</h3>
          <p className="text-sm text-muted-foreground">
            Lista degli ultimi utenti registrati...
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">Attivita Recente</h3>
          <p className="text-sm text-muted-foreground">
            Ultime azioni nel sistema...
          </p>
        </div>
      </div>
    </div>
  )
}
