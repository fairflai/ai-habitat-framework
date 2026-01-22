import { MessageSquare, Lightbulb, Code, FileText } from 'lucide-react'

// Definizione dei suggerimenti statici
const suggestions = [
  {
    icon: Lightbulb,
    title: 'Explain a concept',
    prompt: 'Explain quantum computing in simple terms',
  },
  {
    icon: Code,
    title: 'Help with code',
    prompt: 'Write a Python function to parse JSON',
  },
  {
    icon: FileText,
    title: 'Summarize text',
    prompt: 'Summarize the key points of...',
  },
  {
    icon: MessageSquare,
    title: 'Creative writing',
    prompt: 'Write a short story about...',
  },
]

interface WelcomeSuggestionsProps {
  onSelectSuggestion: (prompt: string) => void
}

export function WelcomeSuggestions({ onSelectSuggestion }: WelcomeSuggestionsProps) {
  return (
    <div className="pt-8">
      <p className="text-sm text-muted-foreground mb-4">Or try one of these:</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {suggestions.map((suggestion, i) => (
          <button
            key={i}
            onClick={() => onSelectSuggestion(suggestion.prompt)}
            className="group flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-card hover:border-border hover:shadow-md transition-all duration-200 text-left"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <suggestion.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{suggestion.title}</p>
              <p className="text-xs text-muted-foreground truncate">{suggestion.prompt}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
