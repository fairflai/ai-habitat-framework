'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  ScrollText,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

interface AuditLog {
  id: string
  action: string
  target: string | null
  targetType: string | null
  metadata: Record<string, unknown> | null
  ipAddress: string | null
  createdAt: string
  user: { id: string; name: string | null; email: string } | null
  adminUser: { id: string; name: string | null; email: string } | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const actionLabels: Record<string, { label: string; color: string }> = {
  'user.created': { label: 'User Created', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  'user.updated': { label: 'User Updated', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  'user.deleted': { label: 'User Deleted', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
  'chat.deleted': { label: 'Chat Deleted', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
  'chat.archived': { label: 'Chat Archived', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
  'chat.restored': { label: 'Chat Restored', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  'agent.deleted': { label: 'Agent Deleted', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
  'admin.created': { label: 'Admin Created', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  'settings.updated': { label: 'Settings Updated', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 30, total: 0, totalPages: 0 })
  const [actionFilter, setActionFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const loadLogs = useCallback(async (page = 1, action = '') => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' })
      if (action) params.set('action', action)
      const res = await fetch(`/api/admin/audit?${params}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs)
        setPagination(data.pagination)
      }
    } catch {
      toast.error('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  function handleFilter(e: React.FormEvent) {
    e.preventDefault()
    loadLogs(1, actionFilter)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground">Record of system actions</p>
        </div>
      </div>

      <form onSubmit={handleFilter} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter by action (e.g. user.created)..."
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">Filter</Button>
        {actionFilter && (
          <Button type="button" variant="ghost" onClick={() => { setActionFilter(''); loadLogs(1, '') }}>
            Clear
          </Button>
        )}
      </form>

      {loading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12">
          <ScrollText className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No logs</h3>
          <p className="text-sm text-muted-foreground">
            {actionFilter ? 'No logs match the filter.' : 'No events recorded yet.'}
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Action</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Performed By</th>
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
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${actionInfo.color}`}>
                          {actionInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {log.adminUser ? (
                          <div>
                            <div className="font-medium">{log.adminUser.name || 'Admin'}</div>
                            <div className="text-muted-foreground">{log.adminUser.email}</div>
                          </div>
                        ) : log.user ? (
                          <div>
                            <div>{log.user.name || 'Unnamed'}</div>
                            <div className="text-muted-foreground">{log.user.email}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">System</span>
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

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1}–
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => loadLogs(pagination.page - 1, actionFilter)}>
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => loadLogs(pagination.page + 1, actionFilter)}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
