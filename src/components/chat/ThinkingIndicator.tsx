export function ThinkingIndicator() {
  return (
    <div className="flex items-start gap-4 py-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 h-6 px-1">
          <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
