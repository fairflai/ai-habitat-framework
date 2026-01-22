'use client'

import { useRef } from 'react'
import { Send, Square, Paperclip, Bot, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ChatRequestOptions } from 'ai'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface MessagesInputProps {
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement> | React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>, chatRequestOptions?: ChatRequestOptions) => void
  isLoading: boolean
  stop: () => void
}

export function MessagesInput({ input, handleInputChange, handleSubmit, isLoading, stop }: MessagesInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const form = e.currentTarget.closest('form')
      if (form) form.requestSubmit()
    }
  }

  return (
    <div className="p-4 bg-gradient-to-t from-background via-background to-transparent pt-8">
      <div className="max-w-5xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className={cn(
            'relative flex flex-col gap-3 rounded-2xl border bg-background/80 p-4 shadow-lg backdrop-blur-xl transition-all duration-200',
            'ring-1 ring-border/50 focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/50',
            'dark:bg-background/60 dark:shadow-2xl dark:shadow-primary/5',
          )}
        >
          <Textarea
            ref={textareaRef}
            placeholder="Message AI Habitat Chat..."
            className={cn(
              'min-h-[60px] max-h-[200px] w-full resize-none p-0',
              '!bg-transparent !border-0 !shadow-none !outline-none !ring-0 !ring-offset-0',
              'focus-visible:!ring-0 focus-visible:!ring-offset-0 focus-visible:!outline-none focus-visible:!shadow-none',
              'placeholder:text-muted-foreground/60',
              'text-base leading-relaxed',
            )}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Attach file</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                    >
                      <Globe className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Web Search</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                    >
                      <Bot className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Deep Reasoning</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-2">
              {isLoading ? (
                <Button
                  type="button"
                  size="icon"
                  onClick={stop}
                  className="h-10 w-10 rounded-xl bg-destructive hover:bg-destructive/90 transition-all duration-200 shadow-md"
                >
                  <Square className="h-4 w-4 fill-current" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim()}
                  className={cn(
                    'h-10 w-10 rounded-xl transition-all duration-200 shadow-md',
                    'bg-primary hover:bg-primary/90',
                    'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
                    input.trim() && 'hover:scale-105 hover:shadow-lg',
                  )}
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </form>
        <p className="text-center text-xs text-muted-foreground/60 mt-3">
          AI Habitat Chat can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  )
}
