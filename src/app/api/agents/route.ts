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

    // Name and instructions are always required
    if (!name || !instructions) {
      return NextResponse.json(
        { error: 'Name and instructions are required' },
        { status: 400 },
      )
    }

    // Optionally fetch A2A agent card if connecting a remote tool
    let a2aFields = {}
    if (isA2A && a2aUrl) {
      let agentCard
      try {
        agentCard = await fetchAgentCard(a2aUrl, a2aBearerToken || undefined)
      } catch (error) {
        return NextResponse.json(
          { error: `Failed to fetch Agent Card: ${error instanceof Error ? error.message : String(error)}` },
          { status: 422 },
        )
      }

      a2aFields = {
        isA2A: true,
        a2aUrl,
        a2aAgentCard: JSON.parse(JSON.stringify(agentCard)),
        a2aBearerToken: a2aBearerToken || null,
      }
    }

    const agent = await prisma.agent.create({
      data: {
        userId: session.user.id,
        name,
        description: description || '',
        instructions,
        ...a2aFields,
      },
    })

    return NextResponse.json(agent)
  } catch (error) {
    console.error('[AGENTS_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
