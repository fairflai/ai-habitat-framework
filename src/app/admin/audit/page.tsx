import { Suspense } from 'react'
import { ScrollText, Filter } from 'lucide-react'
import prisma from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

async function getAuditLogs() {
  return prisma.auditLog.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
}

const actionLabels: Record<string, { label: string; color: string }> = {
  'user.created': { label: 'Utente Creato', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  'user.updated': { label: 'Utente Aggiornato', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  'user.deleted': { label: 'Utente Eliminato', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
  'chat.deleted': { label: 'Chat Eliminata', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
  'agent.deleted': { label: 'Agente Eliminato', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
  'admin.created': { label: 'Admin Creato', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  'settings.updated': { label: 'Impostazioni', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
}

function AuditLogsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  )
}

async function AuditLogsTable() {
  const logs = await getAuditLogs()

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12">
        <ScrollText className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Nessun log</h3>
        <p className="text-sm text-muted-foreground">
          Non ci sono ancora eventi registrati nel sistema.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left text-sm font-medium">Data</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Azione</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Utente</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Target</th>
            <th className="px-4 py-3 text-left text-sm font-medium">IP</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => {
            const actionInfo = actionLabels[log.action] || {
              label: log.action,
              color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
            }

            return (
              <tr key={log.id} className="border-b">
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {new Date(log.createdAt).toLocaleString('it-IT')}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${actionInfo.color}`}>
                    {actionInfo.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  {log.user ? (
                    <div>
                      <div>{log.user.name || 'Senza nome'}</div>
                      <div className="text-muted-foreground">{log.user.email}</div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Sistema</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  {log.targetType && (
                    <span className="text-muted-foreground">
                      {log.targetType}: {log.target?.slice(0, 8)}...
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {log.ipAddress || '-'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function AdminAuditPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground">Registro delle azioni nel sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <Input placeholder="Cerca..." className="w-64" />
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filtri
          </Button>
        </div>
      </div>

      <Suspense fallback={<AuditLogsSkeleton />}>
        <AuditLogsTable />
      </Suspense>
    </div>
  )
}
