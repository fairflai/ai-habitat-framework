import { Suspense } from 'react'
import { MoreHorizontal, MessageSquare, Trash2, Eye, Archive } from 'lucide-react'
import prisma from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

async function getChats() {
  return prisma.chat.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      agent: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          messages: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 100, // Limit to last 100 chats
  })
}

function ChatsTableSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  )
}

async function ChatsTable() {
  const chats = await getChats()

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12">
        <MessageSquare className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Nessuna chat</h3>
        <p className="text-sm text-muted-foreground">Non ci sono ancora chat nel sistema.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left text-sm font-medium">Titolo</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Utente</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Agente</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Messaggi</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Stato</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Aggiornata</th>
            <th className="px-4 py-3 text-right text-sm font-medium">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {chats.map((chat) => (
            <tr key={chat.id} className="border-b">
              <td className="px-4 py-3">
                <div className="max-w-xs truncate font-medium">{chat.title || 'Chat senza titolo'}</div>
              </td>
              <td className="px-4 py-3">
                <div className="text-sm">
                  <div>{chat.user.name || 'Senza nome'}</div>
                  <div className="text-muted-foreground">{chat.user.email}</div>
                </div>
              </td>
              <td className="px-4 py-3 text-sm">
                {chat.agent ? (
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    {chat.agent.name}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </td>
              <td className="px-4 py-3 text-sm">{chat._count.messages}</td>
              <td className="px-4 py-3 text-sm">
                {chat.isArchived ? (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Archive className="h-3 w-3" />
                    Archiviata
                  </span>
                ) : (
                  <span className="text-green-600 dark:text-green-400">Attiva</span>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {new Date(chat.updatedAt).toLocaleDateString('it-IT')}
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
                      Visualizza Messaggi
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Archive className="mr-2 h-4 w-4" />
                      {chat.isArchived ? 'Ripristina' : 'Archivia'}
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

export default function AdminChatsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Chat</h1>
        <p className="text-muted-foreground">Visualizza e modera tutte le conversazioni</p>
      </div>

      <Suspense fallback={<ChatsTableSkeleton />}>
        <ChatsTable />
      </Suspense>
    </div>
  )
}
