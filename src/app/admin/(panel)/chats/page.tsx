'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  MessageSquare,
  MoreHorizontal,
  Eye,
  Trash2,
  Archive,
  ArchiveRestore,
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

interface Chat {
  id: string
  title: string
  isArchived: boolean
  createdAt: string
  updatedAt: string
  user: { id: string; name: string | null; email: string }
  agent: { id: string; name: string } | null
  _count: { messages: number }
}

interface ChatMessage {
  id: string
  role: string
  content: string
  createdAt: string
}

interface ChatDetail extends Chat {
  messages: ChatMessage[]
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AdminChatsPage() {
  const [chats, setChats] = useState<Chat[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [viewChat, setViewChat] = useState<ChatDetail | null>(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [deleteChat, setDeleteChat] = useState<Chat | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadChats = useCallback(async (page = 1, searchQuery = '') => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (searchQuery) params.set('search', searchQuery)
      const res = await fetch(`/api/admin/chats?${params}`)
      if (res.ok) {
        const data = await res.json()
        setChats(data.chats)
        setPagination(data.pagination)
      }
    } catch {
      toast.error('Failed to load chats')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadChats()
  }, [loadChats])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    loadChats(1, search)
  }

  async function handleViewMessages(chat: Chat) {
    setViewLoading(true)
    setViewChat(null)
    try {
      const res = await fetch(`/api/admin/chats/${chat.id}`)
      if (res.ok) {
        setViewChat(await res.json())
      }
    } catch {
      toast.error('Failed to load messages')
    } finally {
      setViewLoading(false)
    }
  }

  async function handleArchiveToggle(chat: Chat) {
    try {
      const res = await fetch(`/api/admin/chats/${chat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: !chat.isArchived }),
      })
      if (!res.ok) throw new Error()
      toast.success(chat.isArchived ? 'Chat restored' : 'Chat archived')
      loadChats(pagination.page, search)
    } catch {
      toast.error('Failed to update chat')
    }
  }

  async function handleDelete() {
    if (!deleteChat) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/chats/${deleteChat.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Chat deleted')
      setDeleteChat(null)
      loadChats(pagination.page, search)
    } catch {
      toast.error('Failed to delete chat')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Chats</h1>
        <p className="text-muted-foreground">View and moderate all conversations</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title or user email..."
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
      ) : chats.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12">
          <MessageSquare className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No chats</h3>
          <p className="text-sm text-muted-foreground">
            {search ? 'No chats match your search.' : 'No chats in the system yet.'}
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium">Title</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">User</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Agent</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Messages</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Updated</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {chats.map((chat) => (
                  <tr key={chat.id} className="border-b">
                    <td className="px-4 py-3">
                      <div className="max-w-xs truncate font-medium">{chat.title || 'Untitled'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div>{chat.user.name || 'Unnamed'}</div>
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
                          Archived
                        </span>
                      ) : (
                        <span className="text-green-600 dark:text-green-400">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(chat.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewMessages(chat)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Messages
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleArchiveToggle(chat)}>
                            {chat.isArchived ? (
                              <>
                                <ArchiveRestore className="mr-2 h-4 w-4" />
                                Restore
                              </>
                            ) : (
                              <>
                                <Archive className="mr-2 h-4 w-4" />
                                Archive
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 dark:text-red-400"
                            onClick={() => setDeleteChat(chat)}
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
                <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => loadChats(pagination.page - 1, search)}>
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => loadChats(pagination.page + 1, search)}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* View Messages Dialog */}
      <Dialog open={!!viewChat || viewLoading} onOpenChange={(open) => { if (!open) { setViewChat(null) } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewChat?.title || 'Loading...'}</DialogTitle>
            {viewChat && (
              <DialogDescription>
                {viewChat.user.name || viewChat.user.email} &middot; {viewChat._count.messages} messages
              </DialogDescription>
            )}
          </DialogHeader>
          {viewLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : viewChat ? (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 pr-4">
                {viewChat.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`rounded-lg p-3 ${
                      msg.role === 'USER'
                        ? 'ml-8 bg-primary/10'
                        : msg.role === 'SYSTEM'
                          ? 'bg-yellow-50 dark:bg-yellow-900/20'
                          : 'mr-8 bg-muted'
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-medium uppercase text-muted-foreground">
                        {msg.role}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewChat(null)}>
              <X className="mr-2 h-4 w-4" />
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteChat} onOpenChange={(open) => !open && setDeleteChat(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chat</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deleteChat?.title || 'Untitled'}&rdquo;?
              All messages will be permanently deleted. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteChat(null)}>Cancel</Button>
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
