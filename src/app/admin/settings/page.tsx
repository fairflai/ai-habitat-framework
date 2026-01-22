import { Suspense } from 'react'
import { Settings, Save } from 'lucide-react'
import prisma from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

async function getSettings() {
  const settings = await prisma.systemSetting.findMany()
  return settings.reduce(
    (acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    },
    {} as Record<string, unknown>,
  )
}

function SettingsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  )
}

async function SettingsForm() {
  const settings = await getSettings()

  return (
    <div className="space-y-6">
      {/* AI Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Configurazione AI</CardTitle>
          <CardDescription>Impostazioni per i modelli AI</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="default_model">Modello Default</Label>
              <Input
                id="default_model"
                placeholder="gpt-4"
                defaultValue={(settings.default_model as string) || 'gpt-4'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_tokens">Max Tokens</Label>
              <Input
                id="max_tokens"
                type="number"
                placeholder="4096"
                defaultValue={(settings.max_tokens as number) || 4096}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="system_prompt">System Prompt Default</Label>
            <textarea
              id="system_prompt"
              className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="You are a helpful assistant..."
              defaultValue={(settings.system_prompt as string) || ''}
            />
          </div>
        </CardContent>
      </Card>

      {/* Rate Limiting */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Limiting</CardTitle>
          <CardDescription>Limiti per prevenire abusi</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="rate_limit_requests">Richieste/minuto</Label>
              <Input
                id="rate_limit_requests"
                type="number"
                placeholder="60"
                defaultValue={(settings.rate_limit_requests as number) || 60}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_chats_per_user">Max Chat/utente</Label>
              <Input
                id="max_chats_per_user"
                type="number"
                placeholder="100"
                defaultValue={(settings.max_chats_per_user as number) || 100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_agents_per_user">Max Agenti/utente</Label>
              <Input
                id="max_agents_per_user"
                type="number"
                placeholder="10"
                defaultValue={(settings.max_agents_per_user as number) || 10}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Flags */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
          <CardDescription>Abilita o disabilita funzionalita</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <div className="font-medium">Registrazione Utenti</div>
              <div className="text-sm text-muted-foreground">
                Permetti nuove registrazioni
              </div>
            </div>
            <input
              type="checkbox"
              defaultChecked={(settings.allow_registration as boolean) ?? true}
              className="h-4 w-4"
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <div className="font-medium">Web Search</div>
              <div className="text-sm text-muted-foreground">
                Abilita la ricerca web nelle chat
              </div>
            </div>
            <input
              type="checkbox"
              defaultChecked={(settings.enable_web_search as boolean) ?? true}
              className="h-4 w-4"
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <div className="font-medium">Deep Reasoning</div>
              <div className="text-sm text-muted-foreground">
                Abilita il ragionamento approfondito
              </div>
            </div>
            <input
              type="checkbox"
              defaultChecked={(settings.enable_deep_reasoning as boolean) ?? true}
              className="h-4 w-4"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button>
          <Save className="mr-2 h-4 w-4" />
          Salva Impostazioni
        </Button>
      </div>
    </div>
  )
}

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Impostazioni</h1>
        <p className="text-muted-foreground">Configura le impostazioni globali del sistema</p>
      </div>

      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsForm />
      </Suspense>
    </div>
  )
}
