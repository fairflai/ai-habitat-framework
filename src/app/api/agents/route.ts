import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { fetchAgentCard } from '@/lib/a2a-client'

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const agents = await prisma.agent.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return NextResponse.json(agents)
  } catch (error) {
    console.error('[AGENTS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, description, instructions, isA2A, a2aUrl, a2aBearerToken } = body

    // For A2A agents: require URL, fetch agent card
    if (isA2A) {
      if (!a2aUrl) {
        return NextResponse.json({ error: 'A2A URL is required for remote agents' }, { status: 400 })
      }

      if (!name) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 })
      }

      let agentCard
      try {
        agentCard = await fetchAgentCard(a2aUrl, a2aBearerToken || undefined)
      } catch (error) {
        return NextResponse.json(
          { error: `Failed to fetch Agent Card: ${error instanceof Error ? error.message : String(error)}` },
          { status: 422 },
        )
      }

      const agent = await prisma.agent.create({
        data: {
          userId: session.user.id,
          name,
          description: description || agentCard.description || '',
          instructions: instructions || '', // A2A agents may have empty instructions
          isA2A: true,
          a2aUrl,
          a2aAgentCard: JSON.parse(JSON.stringify(agentCard)),
          a2aBearerToken: a2aBearerToken || null,
        },
      })

      return NextResponse.json(agent)
    }

    // Local agent: require name + instructions
    if (!name || !instructions) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const agent = await prisma.agent.create({
      data: {
        userId: session.user.id,
        name,
        description,
        instructions,
      },
    })

    return NextResponse.json(agent)
  } catch (error) {
    console.error('[AGENTS_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
