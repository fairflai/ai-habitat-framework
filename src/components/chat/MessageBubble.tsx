'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { Message } from '@/types'

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  // Use generic string check or import enum if possible.
  // Prisma uses 'USER' and 'ASSISTANT'.
  // We check for both to be safe during migration or strict 'USER'.
  const isUser = message.role === 'USER'
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn('group flex flex-col py-4 w-full', isUser ? 'items-end' : 'items-start')}>
      <div className={cn('flex flex-col gap-2 min-w-0', isUser ? 'max-w-[85%]' : 'w-full')}>
        <div
          className={cn(
            'relative leading-relaxed transition-all',
            isUser
              ? 'text-sm bg-primary text-primary-foreground px-4 py-3 rounded-2xl rounded-tr-sm shadow-sm'
              : 'text-base text-foreground px-0 py-0',
          )}
        >
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        </div>
        <div
          className={cn(
            'flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity',
            isUser ? 'flex-row-reverse' : 'flex-row',
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleCopy}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
