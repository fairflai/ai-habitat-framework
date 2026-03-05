'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Globe, Loader2, CheckCircle, AlertCircle, Shield, Eye, EyeOff, ChevronDown, ChevronRight, Plug } from 'lucide-react'

interface A2AAgentCard {
  name: string
  description?: string
  url: string
  version: string
  capabilities?: {
    streaming?: boolean
    pushNotifications?: boolean
  }
  skills?: Array<{
    id: string
    name: string
    description?: string
  }>
}

export interface AgentDialogData {
  name: string
  description: string
  instructions: string
  isA2A?: boolean
  a2aUrl?: string
  a2aBearerToken?: string
}

interface AgentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: AgentDialogData) => Promise<void>
  initialData?: {
    name: string
    description: string
    instructions: string
    isA2A?: boolean
    a2aUrl?: string
    a2aBearerToken?: string
  } | null
}

export function AgentDialog({ open, onOpenChange, onSubmit, initialData }: AgentDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [a2aExpanded, setA2aExpanded] = useState(false)
  const [a2aUrl, setA2aUrl] = useState('')
  const [useAuth, setUseAuth] = useState(false)
  const [bearerToken, setBearerToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Agent card fetching state
  const [fetchingCard, setFetchingCard] = useState(false)
  const [agentCard, setAgentCard] = useState<A2AAgentCard | null>(null)
  const [cardError, setCardError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      if (initialData) {
        setName(initialData.name)
        setDescription(initialData.description)
        setInstructions(initialData.instructions)
        const hasA2A = !!(initialData.isA2A && initialData.a2aUrl)
        setA2aExpanded(hasA2A)
        setA2aUrl(initialData.a2aUrl || '')
        const hasToken = !!initialData.a2aBearerToken
        setUseAuth(hasToken)
        setBearerToken(initialData.a2aBearerToken || '')
      } else {
        setName('')
        setDescription('')
        setInstructions('')
        setA2aExpanded(false)
        setA2aUrl('')
        setUseAuth(false)
        setBearerToken('')
      }
      setShowToken(false)
      setAgentCard(null)
      setCardError(null)
    }
  }, [open, initialData])

  const fetchCard = useCallback(async () => {
    if (!a2aUrl) return

    setFetchingCard(true)
    setCardError(null)
    setAgentCard(null)

    try {
      const res = await fetch('/api/agents/fetch-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: a2aUrl, bearerToken: useAuth && bearerToken ? bearerToken : undefined }),
      })

      const data = await res.json()

      if (!res.ok) {
        setCardError(data.error || 'Failed to fetch Agent Card')
        return
      }

      setAgentCard(data)
    } catch {
      setCardError('Network error: Could not reach the agent URL')
    } finally {
      setFetchingCard(false)
    }
  }, [a2aUrl, useAuth, bearerToken])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !instructions) return

    setIsLoading(true)
    try {
      const hasA2A = a2aExpanded && !!a2aUrl
      await onSubmit({
        name,
        description,
        instructions,
        isA2A: hasA2A,
        a2aUrl: hasA2A ? a2aUrl : undefined,
        a2aBearerToken: hasA2A && useAuth && bearerToken ? bearerToken : undefined,
      })
      onOpenChange(false)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const isEditing = !!initialData
  const canSubmit = !!name && !!instructions

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Agent' : 'Create Agent'}</DialogTitle>
            <DialogDescription>
              Define the agent&apos;s behavior with instructions. Optionally connect an A2A remote agent as a tool.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Translator, Code Reviewer"
                required
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description of what this agent does"
              />
            </div>

            {/* Instructions — always required */}
            <div className="grid gap-2">
              <Label htmlFor="instructions">Instructions (System Prompt)</Label>
              <Textarea
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="You are a helpful assistant that..."
                className="min-h-[120px]"
                required
              />
            </div>

            {/* A2A Remote Tool — collapsible optional section */}
            <div className="rounded-md border">
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium hover:bg-accent/50 rounded-md transition-colors"
                onClick={() => setA2aExpanded(!a2aExpanded)}
              >
                {a2aExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <Plug className="h-4 w-4 text-muted-foreground" />
                <span>Connect A2A Remote Agent</span>
                {a2aExpanded && a2aUrl && (
                  <Globe className="ml-auto h-4 w-4 text-blue-500" />
                )}
              </button>

              {a2aExpanded && (
                <div className="border-t px-3 pb-3 pt-2 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Connect an A2A-compatible remote agent. The LLM will use it as a tool to delegate tasks.
                  </p>

                  {/* A2A URL input */}
                  <div className="grid gap-2">
                    <Label htmlFor="a2aUrl" className="text-xs">Agent URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="a2aUrl"
                        value={a2aUrl}
                        onChange={(e) => {
                          setA2aUrl(e.target.value)
                          setAgentCard(null)
                          setCardError(null)
                        }}
                        placeholder="https://remote-agent.example.com"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={fetchCard}
                        disabled={!a2aUrl || fetchingCard}
                      >
                        {fetchingCard ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Fetch'
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Card fetch result */}
                  {cardError && (
                    <div className="flex items-start gap-2 rounded-md bg-red-50 dark:bg-red-950/20 p-3 text-sm text-red-700 dark:text-red-400">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>{cardError}</span>
                    </div>
                  )}

                  {agentCard && (
                    <div className="rounded-md border bg-muted/50 p-3 space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        Agent Card found
                      </div>
                      <div className="text-sm space-y-1">
                        <div>
                          <span className="text-muted-foreground">Name:</span>{' '}
                          <span className="font-medium">{agentCard.name}</span>
                        </div>
                        {agentCard.description && (
                          <div>
                            <span className="text-muted-foreground">Description:</span>{' '}
                            <span>{agentCard.description}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">Version:</span>{' '}
                          <span>{agentCard.version}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Streaming:</span>{' '}
                          <span>{agentCard.capabilities?.streaming ? 'Yes' : 'No'}</span>
                        </div>
                        {agentCard.skills && agentCard.skills.length > 0 && (
                          <div>
                            <span className="text-muted-foreground">Skills:</span>{' '}
                            <span>{agentCard.skills.map((s) => s.name).join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Bearer Token Auth */}
                  <div className="grid gap-2">
                    <button
                      type="button"
                      className="flex items-center gap-2 text-sm font-medium cursor-pointer select-none"
                      onClick={() => {
                        setUseAuth(!useAuth)
                        if (useAuth) {
                          setBearerToken('')
                          setShowToken(false)
                        }
                      }}
                    >
                      <div
                        className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                          useAuth
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-muted-foreground/40'
                        }`}
                      >
                        {useAuth && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5L4 7L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      Bearer Token Authentication
                    </button>

                    {useAuth && (
                      <div className="relative">
                        <Input
                          id="bearerToken"
                          type={showToken ? 'text' : 'password'}
                          value={bearerToken}
                          onChange={(e) => setBearerToken(e.target.value)}
                          placeholder="Enter Bearer token..."
                          className="pr-10 font-mono text-sm"
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => setShowToken(!showToken)}
                          tabIndex={-1}
                        >
                          {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !canSubmit}>
              {isLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Agent'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
