import { Bot } from 'lucide-react'

export function ChatEmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
          <Bot className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Start a conversation</h2>
        <p className="text-muted-foreground text-sm">
          Ask me anything! I'm here to help with questions, creative tasks, analysis, and more.
        </p>
      </div>
    </div>
  )
}
