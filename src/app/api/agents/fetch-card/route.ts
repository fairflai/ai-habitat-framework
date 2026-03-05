import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { fetchAgentCard } from '@/lib/a2a-client'

/**
 * POST /api/agents/fetch-card
 *
 * Fetch and return an A2A Agent Card from a remote URL.
 * Used by the UI to validate/preview a remote agent before creating it.
 */
export async function POST(req: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { url, bearerToken } = await req.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    const card = await fetchAgentCard(url, bearerToken || undefined)
    return NextResponse.json(card)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch Agent Card' },
      { status: 422 },
    )
  }
}
