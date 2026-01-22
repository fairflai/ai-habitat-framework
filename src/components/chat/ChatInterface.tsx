'use client'

import { ChatBody } from './ChatBody'
import { MessagesInput } from './MessagesInput'
import { useChatStream } from '@/hooks/useChatStream'
import { Message } from '@/types'

interface ChatInterfaceProps {
  chatId: string
  initialMessages: Message[]
}

export function ChatInterface({ chatId, initialMessages }: ChatInterfaceProps) {
  // Tutta la logica di stato e streaming è delegata all'hook
  const { messages, input, isLoading, handleInputChange, handleSubmit, stop } = useChatStream({
    chatId,
    initialMessages,
  })

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
      {/* Area visualizzazione messaggi */}
      <ChatBody messages={messages} isLoading={isLoading} />

      {/* Area input messaggi */}
      <MessagesInput
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        stop={stop}
      />
    </div>
  )
}
