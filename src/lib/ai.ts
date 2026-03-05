import { openai } from '@ai-sdk/openai'
import prisma from '@/lib/prisma'

export interface AIConfig {
  model: string
  titleModel: string
  systemPrompt: string
  maxTokens: number
  temperature: number
}

const DEFAULT_CONFIG: AIConfig = {
  model: 'gpt-4o',
  titleModel: 'gpt-4o-mini',
  systemPrompt: '',
  maxTokens: 4096,
  temperature: 0.7,
}

/**
 * Load AI configuration from SystemSetting table.
 * Falls back to defaults for any missing settings.
 */
export async function getAIConfig(): Promise<AIConfig> {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: ['default_model', 'title_model', 'system_prompt', 'max_tokens', 'temperature'],
        },
      },
    })

    const map = new Map(settings.map((s) => [s.key, s.value]))

    return {
      model: (map.get('default_model') as string) ?? DEFAULT_CONFIG.model,
      titleModel: (map.get('title_model') as string) ?? DEFAULT_CONFIG.titleModel,
      systemPrompt: (map.get('system_prompt') as string) ?? DEFAULT_CONFIG.systemPrompt,
      maxTokens: (map.get('max_tokens') as number) ?? DEFAULT_CONFIG.maxTokens,
      temperature: (map.get('temperature') as number) ?? DEFAULT_CONFIG.temperature,
    }
  } catch (error) {
    console.error('[AI Config] Failed to load settings, using defaults:', error)
    return DEFAULT_CONFIG
  }
}

/**
 * Get the configured chat model instance.
 */
export async function getChatModel() {
  const config = await getAIConfig()
  return {
    model: openai(config.model),
    maxOutputTokens: config.maxTokens,
    temperature: config.temperature,
    systemPrompt: config.systemPrompt,
  }
}

/**
 * Get the configured title generation model instance.
 */
export async function getTitleModel() {
  const config = await getAIConfig()
  return openai(config.titleModel)
}
