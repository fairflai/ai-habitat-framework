'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Bot,
  Globe,
  Shield,
  MoreHorizontal,
  Eye,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

interface Agent {
  id: string
  name: string
  description: string | null
  instructions: string
  isA2A: boolean
  a2aUrl: string | null
  a2aBearerToken: string | null
  createdAt: string
  user: { id: string; name: string | null; email: string }
  _count: { chats: number }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [viewAgent, setViewAgent] = useState<Agent | null>(null)
  const [deleteAgent, setDeleteAgent] = useState<Agent | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadAgents = useCallback(async (page = 1, searchQuery = '') => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (searchQuery) params.set('search', searchQuery)
      const res = await fetch(`/api/admin/agents?${params}`)
      if (res.ok) {
        const data = await res.json()
        setAgents(data.agents)
        setPagination(data.pagination)
      }
    } catch {
      toast.error('Failed to load agents')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAgents()
  }, [loadAgents])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    loadAgents(1, search)
  }

  async function handleDelete() {
    if (!deleteAgent) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/agents/${deleteAgent.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Agent deleted')
      setDeleteAgent(null)
      loadAgents(pagination.page, search)
    } catch {
      toast.error('Failed to delete agent')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
        <p className="text-muted-foreground">View and manage all agents created by users</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">Search</Button>
      </form>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      ) : agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12">
          <Bot className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No agents</h3>
          <p className="text-sm text-muted-foreground">
            {search ? 'No agents match your search.' : 'No agents have been created yet.'}
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium">Agent</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Tools</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Owner</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Chats</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent.id} className="border-b">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium">{agent.name}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {agent.description || 'No description'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {agent.isA2A ? (
                          <>
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300 w-fit">
                              <Globe className="h-3 w-3" />
                              A2A Tool
                            </span>
                            {agent.a2aBearerToken && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300 w-fit">
                                <Shield className="h-3 w-3" />
                                Auth
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div>{agent.user.name || 'Unnamed'}</div>
                        <div className="text-muted-foreground">{agent.user.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{agent._count.chats}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(agent.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewAgent(agent)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Instructions
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 dark:text-red-400"
                            onClick={() => setDeleteAgent(agent)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
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
                <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => loadAgents(pagination.page - 1, search)}>
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => loadAgents(pagination.page + 1, search)}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* View Agent Details Dialog */}
      <Dialog open={!!viewAgent} onOpenChange={(open) => !open && setViewAgent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewAgent?.name}
              {viewAgent?.isA2A && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                  <Globe className="h-3 w-3" />
                  A2A Tool
                </span>
              )}
            </DialogTitle>
            <DialogDescription>{viewAgent?.description || 'No description'}</DialogDescription>
          </DialogHeader>

          {viewAgent?.isA2A && viewAgent.a2aUrl && (
            <div className="rounded-md border bg-muted/50 p-3 text-sm space-y-1">
              <div className="flex items-center gap-1 text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                <Globe className="h-3 w-3" />
                Connected A2A Remote Tool
              </div>
              <div>
                <span className="text-muted-foreground">Remote URL:</span>{' '}
                <span className="font-mono text-xs">{viewAgent.a2aUrl}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Authentication:</span>{' '}
                {viewAgent.a2aBearerToken ? (
                  <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300">
                    <Shield className="h-3 w-3" />
                    Bearer Token configured
                  </span>
                ) : (
                  <span className="text-muted-foreground">None</span>
                )}
              </div>
            </div>
          )}

          <ScrollArea className="max-h-96">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Instructions
              </h4>
              <pre className="whitespace-pre-wrap rounded-md bg-muted p-4 text-sm">
                {viewAgent?.instructions || '(none)'}
              </pre>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewAgent(null)}>
              <X className="mr-2 h-4 w-4" />
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteAgent} onOpenChange={(open) => !open && setDeleteAgent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Agent</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the agent <strong>{deleteAgent?.name}</strong>?
              Chats using this agent will lose their agent reference.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAgent(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
