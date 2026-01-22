import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Chat } from '@/types'

async function fetchChats(): Promise<Chat[]> {
  const res = await fetch('/api/chats')
  if (!res.ok) throw new Error('Failed to fetch chats')
  return res.json()
}

async function createChat(data?: { title?: string; folderId?: string | null; agentId?: string }): Promise<Chat> {
  const res = await fetch('/api/chats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data || {}),
  })
  if (!res.ok) throw new Error('Failed to create chat')
  return res.json()
}

async function updateChat({ id, data }: { id: string; data: { title?: string; folderId?: string | null } }): Promise<Chat> {
  const res = await fetch(`/api/chats/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update chat')
  return res.json()
}

async function deleteChat(id: string): Promise<void> {
  const res = await fetch(`/api/chats/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete chat')
}

async function updateChatFolder({ chatId, folderId }: { chatId: string; folderId: string | null }): Promise<Chat> {
  const res = await fetch(`/api/chats/${chatId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folderId }),
  })
  if (!res.ok) throw new Error('Failed to update chat folder')
  return res.json()
}

export function useChats() {
  return useQuery({
    queryKey: ['chats'],
    queryFn: fetchChats,
  })
}

export function useCreateChat() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createChat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
    },
  })
}

export function useUpdateChat() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateChat,
    onSuccess: (updatedChat) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
      queryClient.setQueryData(['chats'], (old: Chat[] | undefined) => {
        if (!old) return [updatedChat]
        return old.map((chat) => (chat.id === updatedChat.id ? updatedChat : chat))
      })
    },
  })
}

export function useDeleteChat() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteChat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
    },
  })
}

export function useUpdateChatFolder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateChatFolder,
    onSuccess: (updatedChat) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
      queryClient.setQueryData(['chats'], (old: Chat[] | undefined) => {
        if (!old) return [updatedChat]
        return old.map((chat) => (chat.id === updatedChat.id ? updatedChat : chat))
      })
    },
  })
}
