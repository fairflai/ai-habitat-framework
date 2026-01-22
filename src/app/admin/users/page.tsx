import { Suspense } from 'react'
import Link from 'next/link'
import { Plus, MoreHorizontal, Shield, ShieldOff, UserCheck, UserX } from 'lucide-react'
import prisma from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

async function getUsers() {
  return prisma.user.findMany({
    include: {
      role: true,
      _count: {
        select: {
          chats: true,
          messages: true,
          agents: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

function UsersTableSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  )
}

async function UsersTable() {
  const users = await getUsers()

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left text-sm font-medium">Utente</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Ruolo</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Stato</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Chat</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Messaggi</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Registrato</th>
            <th className="px-4 py-3 text-right text-sm font-medium">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b">
              <td className="px-4 py-3">
                <div>
                  <div className="font-medium">{user.name || 'Senza nome'}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </div>
              </td>
              <td className="px-4 py-3">
                {user.role ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    <Shield className="h-3 w-3" />
                    {user.role.name}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">user</span>
                )}
              </td>
              <td className="px-4 py-3">
                {user.isActive ? (
                  <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                    <UserCheck className="h-4 w-4" />
                    Attivo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                    <UserX className="h-4 w-4" />
                    Disattivato
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-sm">{user._count.chats}</td>
              <td className="px-4 py-3 text-sm">{user._count.messages}</td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {new Date(user.createdAt).toLocaleDateString('it-IT')}
              </td>
              <td className="px-4 py-3 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Modifica</DropdownMenuItem>
                    <DropdownMenuItem>Cambia Ruolo</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      {user.isActive ? (
                        <>
                          <ShieldOff className="mr-2 h-4 w-4" />
                          Disattiva
                        </>
                      ) : (
                        <>
                          <Shield className="mr-2 h-4 w-4" />
                          Attiva
                        </>
                      )}
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

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Utenti</h1>
          <p className="text-muted-foreground">Gestisci gli utenti del sistema</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuovo Utente
        </Button>
      </div>

      <Suspense fallback={<UsersTableSkeleton />}>
        <UsersTable />
      </Suspense>
    </div>
  )
}
