import { Suspense } from 'react'
import { MoreHorizontal, Bot, Trash2, Eye } from 'lucide-react'
import prisma from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

async function getAgents() {
  return prisma.agent.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          chats: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

function AgentsTableSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  )
}

async function AgentsTable() {
  const agents = await getAgents()

  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12">
        <Bot className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Nessun agente</h3>
        <p className="text-sm text-muted-foreground">
          Non ci sono ancora agenti creati dagli utenti.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left text-sm font-medium">Agente</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Proprietario</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Chat</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Creato</th>
            <th className="px-4 py-3 text-right text-sm font-medium">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {agents.map((agent) => (
            <tr key={agent.id} className="border-b">
              <td className="px-4 py-3">
                <div>
                  <div className="font-medium">{agent.name}</div>
                  <div className="text-sm text-muted-foreground line-clamp-1">
                    {agent.description || 'Nessuna descrizione'}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="text-sm">
                  <div>{agent.user.name || 'Senza nome'}</div>
                  <div className="text-muted-foreground">{agent.user.email}</div>
                </div>
              </td>
              <td className="px-4 py-3 text-sm">{agent._count.chats}</td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {new Date(agent.createdAt).toLocaleDateString('it-IT')}
              </td>
              <td className="px-4 py-3 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" />
                      Visualizza
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600 dark:text-red-400">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Elimina
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function AdminAgentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Agenti</h1>
        <p className="text-muted-foreground">
          Visualizza e gestisci tutti gli agenti creati dagli utenti
        </p>
      </div>

      <Suspense fallback={<AgentsTableSkeleton />}>
        <AgentsTable />
      </Suspense>
    </div>
  )
}
