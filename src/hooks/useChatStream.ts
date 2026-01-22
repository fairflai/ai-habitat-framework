import { useState, useCallback, useRef, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import type { Message } from '@/types'
import { useChatStore } from '@/stores/chatStore'
import { useSendMessage, useGenerateTitle } from '@/hooks/useChatMessages'

interface UseChatStreamProps {
  chatId: string
  initialMessages: Message[]
}

export function useChatStream({ chatId, initialMessages }: UseChatStreamProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  
  const hasAutoSent = useRef(false)
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null)
  const cancelledRef = useRef(false)

  const { updateChat } = useChatStore()
  const hasGeneratedTitle = useRef(initialMessages.length > 0)

  const sendMessageMutation = useSendMessage()
  const generateTitleMutation = useGenerateTitle()

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement> | React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const stop = useCallback(async () => {
    cancelledRef.current = true
    if (readerRef.current) {
      try {
        await readerRef.current.cancel()
      } catch (e) {
        // Ignore cancellation errors
      }
      readerRef.current = null
    }
    setIsLoading(false)
  }, [])

  const generateTitle = useCallback(async () => {
    if (hasGeneratedTitle.current || messages.length === 0) return
    hasGeneratedTitle.current = true

    try {
      const { title } = await generateTitleMutation.mutateAsync(chatId)
      updateChat(chatId, { title })
    } catch (error) {
      console.error('Failed to generate title:', error)
    }
  }, [chatId, messages.length, generateTitleMutation, updateChat])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading || sendMessageMutation.isPending) return

      cancelledRef.current = false

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'USER',
        content: content,
        chatId,
        createdAt: new Date(),
        userId: '',
        webSearch: false,
        deepReasoning: false,
        attachments: [],
      }

      const newMessages = [...messages, userMessage]
      
      setMessages(newMessages)
      setInput('')
      setIsLoading(true)

      try {
        const reader = await sendMessageMutation.mutateAsync({ chatId, messages: newMessages })
        readerRef.current = reader

        const decoder = new TextDecoder()
        let assistantContent = ''
        
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'ASSISTANT',
          content: '',
          chatId,
          createdAt: new Date(),
          userId: '',
          webSearch: false,
          deepReasoning: false,
          attachments: [],
        }

        setMessages(prev => [...prev, assistantMessage])

        while (!cancelledRef.current) {
          const { done, value } = await reader.read()
          if (done) break

          assistantContent += decoder.decode(value)
          setMessages((prevMessages) => {
            const updatedMessages = [...prevMessages]
            const lastMessageIndex = updatedMessages.length - 1
            if (lastMessageIndex >= 0 && updatedMessages[lastMessageIndex].role === 'ASSISTANT') {
              updatedMessages[lastMessageIndex] = {
                ...updatedMessages[lastMessageIndex],
                content: assistantContent,
              }
            }
            return updatedMessages
          })
        }

        if (messages.length === 0 && !cancelledRef.current) {
          generateTitle()
        }
      } catch (error) {
        if (!cancelledRef.current) {
          console.error('Chat error:', error)
        }
      } finally {
        readerRef.current = null
        setIsLoading(false)
      }
    },
    [chatId, isLoading, messages, sendMessageMutation, generateTitle]
  )

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      sendMessage(input)
    },
    [input, sendMessage]
  )

  useEffect(() => {
    const prompt = searchParams.get('prompt')
    if (prompt && messages.length === 0 && !hasAutoSent.current && !isLoading && !sendMessageMutation.isPending) {
      hasAutoSent.current = true
      router.replace(pathname)
      sendMessage(prompt)
    }
  }, [searchParams, messages.length, isLoading, sendMessageMutation.isPending, router, pathname, sendMessage])

  return {
    messages,
    input,
    isLoading: isLoading || sendMessageMutation.isPending,
    handleInputChange,
    handleSubmit,
    stop,
  }
}