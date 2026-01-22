import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Chat } from '@/types'

async function sendMessage({ chatId, messages }: { chatId: string; messages: any[] }): Promise<ReadableStreamDefaultReader<Uint8Array>> {
  const response = await fetch(`/api/chats/${chatId}/messages/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to send message: ${response.status} ${errorText}`)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('No reader')
  
  return reader
}

export function useSendMessage() {
  return useMutation({
    mutationFn: sendMessage,
  })
}

async function generateTitle(chatId: string): Promise<{ title: string }> {
  const res = await fetch(`/api/chats/${chatId}/generate-title`, {
    method: 'POST',
  })
  
  if (!res.ok) {
    throw new Error('Failed to generate title')
  }
  
  return res.json()
}

export function useGenerateTitle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: generateTitle,
    onSuccess: (data, chatId) => {
      queryClient.setQueryData(['chats'], (old: Chat[] | undefined) => {
        if (!old) return old
        return old.map((chat) => (chat.id === chatId ? { ...chat, title: data.title } : chat))
      })
    },
  })
}