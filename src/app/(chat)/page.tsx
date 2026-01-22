'use client'

import { useRouter } from 'next/navigation'
import { useChatStore } from '@/stores/chatStore'
import { WelcomeHero } from '@/components/chat/welcome/WelcomeHero'
import { WelcomeSuggestions } from '@/components/chat/welcome/WelcomeSuggestions'
import { useCreateChat } from '@/hooks/useChats'

export default function ChatPage() {
  const router = useRouter()
  const { addChat } = useChatStore()
  const createChatMutation = useCreateChat()

  const startChat = async (initialPrompt?: string) => {
    try {
      const newChat = await createChatMutation.mutateAsync({
        title: initialPrompt?.slice(0, 50) || 'New Chat',
      })
      addChat(newChat)
      const url = `/c/${newChat.id}${initialPrompt ? `?prompt=${encodeURIComponent(initialPrompt)}` : ''}`
      router.push(url)
    } catch (error) {
      console.error('Failed to create chat:', error)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-8">
      <div className="max-w-2xl w-full text-center space-y-8">
        <WelcomeHero onStartChat={() => startChat()} />
        <WelcomeSuggestions onSelectSuggestion={(prompt) => startChat(prompt)} />
      </div>
    </div>
  )
}