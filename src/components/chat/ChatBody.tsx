'use client'

import { useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageBubble } from './MessageBubble'
import { ThinkingIndicator } from './ThinkingIndicator'
import { ChatEmptyState } from './ChatEmptyState'
import { Message } from '@/types'

interface ChatBodyProps {
  messages: Message[]
  isLoading: boolean
}

export function ChatBody({ messages, isLoading }: ChatBodyProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  if (messages.length === 0) {
    return <ChatEmptyState />
  }

  return (
    <ScrollArea ref={scrollRef} className="flex-1 min-h-0">
      <div className="flex flex-col max-w-5xl mx-auto px-4 pb-4">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {/* Fix condition to use uppercase 'ASSISTANT' */}
        {isLoading && messages[messages.length - 1]?.role !== 'ASSISTANT' && <ThinkingIndicator />}
      </div>
    </ScrollArea>
  )
}
