'use client'

import { useEffect, useState } from 'react'
import { Save, Loader2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

interface SettingsState {
  // AI Configuration
  default_model: string
  title_model: string
  system_prompt: string
  max_tokens: number
  temperature: number
  // Rate Limits
  rate_limit_requests: number
  max_chats_per_user: number
  max_agents_per_user: number
  // Feature Flags
  allow_registration: boolean
  enable_web_search: boolean
  enable_deep_reasoning: boolean
}

const DEFAULTS: SettingsState = {
  default_model: 'gpt-4o',
  title_model: 'gpt-4o-mini',
  system_prompt: '',
  max_tokens: 4096,
  temperature: 0.7,
  rate_limit_requests: 60,
  max_chats_per_user: 100,
  max_agents_per_user: 10,
  allow_registration: true,
  enable_web_search: true,
  enable_deep_reasoning: true,
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/settings')
        if (res.ok) {
          const data = await res.json()
          setSettings({
            default_model: (data.default_model as string) ?? DEFAULTS.default_model,
            title_model: (data.title_model as string) ?? DEFAULTS.title_model,
            system_prompt: (data.system_prompt as string) ?? DEFAULTS.system_prompt,
            max_tokens: Number(data.max_tokens) || DEFAULTS.max_tokens,
            temperature: Number(data.temperature) || DEFAULTS.temperature,
            rate_limit_requests: Number(data.rate_limit_requests) || DEFAULTS.rate_limit_requests,
            max_chats_per_user: Number(data.max_chats_per_user) || DEFAULTS.max_chats_per_user,
            max_agents_per_user: Number(data.max_agents_per_user) || DEFAULTS.max_agents_per_user,
            allow_registration: data.allow_registration ?? DEFAULTS.allow_registration,
            enable_web_search: data.enable_web_search ?? DEFAULTS.enable_web_search,
            enable_deep_reasoning: data.enable_deep_reasoning ?? DEFAULTS.enable_deep_reasoning,
          })
        }
      } catch {
        toast.error('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error()
      toast.success('Settings saved successfully')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    setSettings(DEFAULTS)
  }

  function update<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Configure global system settings</p>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Configure global system settings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Settings
          </Button>
        </div>
      </div>

      {/* AI Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>AI Configuration</CardTitle>
          <CardDescription>
            Configure the AI models and parameters used for chat and title generation.
            Changes take effect immediately for new conversations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="default_model">Default Chat Model</Label>
              <Input
                id="default_model"
                value={settings.default_model}
                onChange={(e) => update('default_model', e.target.value)}
                placeholder="gpt-4o"
              />
              <p className="text-xs text-muted-foreground">
                OpenAI model used for chat completions (e.g. gpt-4o, gpt-4o-mini, o1)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title_model">Title Generation Model</Label>
              <Input
                id="title_model"
                value={settings.title_model}
                onChange={(e) => update('title_model', e.target.value)}
                placeholder="gpt-4o-mini"
              />
              <p className="text-xs text-muted-foreground">
                Model used for auto-generating chat titles (use a cheaper model)
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="max_tokens">Max Output Tokens</Label>
              <Input
                id="max_tokens"
                type="number"
                value={settings.max_tokens}
                onChange={(e) => update('max_tokens', parseInt(e.target.value) || 0)}
                placeholder="4096"
                min={1}
                max={128000}
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of tokens the model can generate per response
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature</Label>
              <div className="flex items-center gap-3">
                <input
                  id="temperature"
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(e) => update('temperature', parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="w-10 text-right text-sm font-medium">{settings.temperature}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Controls randomness: 0 = deterministic, 2 = highly creative
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="system_prompt">Global System Prompt</Label>
            <textarea
              id="system_prompt"
              className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="You are a helpful assistant..."
              value={settings.system_prompt}
              onChange={(e) => update('system_prompt', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Prepended to all conversations. Agent-specific instructions are added after this.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Rate Limiting */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Limiting</CardTitle>
          <CardDescription>Set limits to prevent abuse</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="rate_limit_requests">Requests per Minute</Label>
              <Input
                id="rate_limit_requests"
                type="number"
                value={settings.rate_limit_requests}
                onChange={(e) => update('rate_limit_requests', parseInt(e.target.value) || 0)}
                placeholder="60"
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_chats_per_user">Max Chats per User</Label>
              <Input
                id="max_chats_per_user"
                type="number"
                value={settings.max_chats_per_user}
                onChange={(e) => update('max_chats_per_user', parseInt(e.target.value) || 0)}
                placeholder="100"
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_agents_per_user">Max Agents per User</Label>
              <Input
                id="max_agents_per_user"
                type="number"
                value={settings.max_agents_per_user}
                onChange={(e) => update('max_agents_per_user', parseInt(e.target.value) || 0)}
                placeholder="10"
                min={1}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Flags */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
          <CardDescription>Enable or disable features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FeatureToggle
            label="User Registration"
            description="Allow new user sign-ups"
            checked={settings.allow_registration}
            onChange={(v) => update('allow_registration', v)}
          />
          <FeatureToggle
            label="Web Search"
            description="Enable web search in chats"
            checked={settings.enable_web_search}
            onChange={(v) => update('enable_web_search', v)}
          />
          <FeatureToggle
            label="Deep Reasoning"
            description="Enable deep reasoning mode"
            checked={settings.enable_deep_reasoning}
            onChange={(v) => update('enable_deep_reasoning', v)}
          />
        </CardContent>
      </Card>

      {/* Bottom save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Settings
        </Button>
      </div>
    </div>
  )
}

function FeatureToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
          checked ? 'bg-primary' : 'bg-input'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}
