import { Sparkles, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WelcomeHeroProps {
  onStartChat: () => void
}

export function WelcomeHero({ onStartChat }: WelcomeHeroProps) {
  return (
    <div className="space-y-8">
      {/* Icona e Titolo */}
      <div className="space-y-4">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center shadow-2xl shadow-purple-500/25 animate-pulse">
          <Sparkles className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground via-foreground/80 to-foreground/60 bg-clip-text text-transparent">
          Welcome to AI Habitat Chat
        </h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Your AI assistant for conversations, coding, analysis, and creative tasks.
        </p>
      </div>

      {/* Pulsante Principale */}
      <Button
        onClick={onStartChat}
        size="lg"
        className="rounded-full px-8 py-6 text-lg font-medium bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
      >
        <MessageSquare className="mr-2 h-5 w-5" />
        Start New Chat
      </Button>
    </div>
  )
}
