import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { fetchAgentCard } from '@/lib/a2a-client'

export async function PATCH(req: Request, { params }: { params: Promise<{ agentId: string }> }) {
  const session = await auth()
  const { agentId } = await params

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, description, instructions, isA2A, a2aUrl, a2aBearerToken } = body

    // Verify ownership
    const agent = await prisma.agent.findUnique({
      where: {
        id: agentId,
        userId: session.user.id,
      },
    })

    if (!agent) {
      return new NextResponse('Not Found', { status: 404 })
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (instructions !== undefined) updateData.instructions = instructions

    // Handle A2A remote tool fields
    if (isA2A && a2aUrl) {
      // Connecting or updating an A2A remote tool
      updateData.isA2A = true
      updateData.a2aUrl = a2aUrl
      updateData.a2aBearerToken = a2aBearerToken || null

      // Re-fetch agent card if URL changed
      if (a2aUrl !== agent.a2aUrl) {
        const token = a2aBearerToken !== undefined ? a2aBearerToken : agent.a2aBearerToken
        try {
          const agentCard = await fetchAgentCard(a2aUrl, token || undefined)
          updateData.a2aAgentCard = JSON.parse(JSON.stringify(agentCard))
        } catch (error) {
          return NextResponse.json(
            { error: `Failed to fetch Agent Card: ${error instanceof Error ? error.message : String(error)}` },
            { status: 422 },
          )
        }
      }
    } else if (isA2A === false) {
      // Disconnecting the A2A remote tool
      updateData.isA2A = false
      updateData.a2aUrl = null
      updateData.a2aAgentCard = null
      updateData.a2aBearerToken = null
    }

    const updatedAgent = await prisma.agent.update({
      where: { id: agentId },
      data: updateData,
    })

    return NextResponse.json(updatedAgent)
  } catch (error) {
    console.error('[AGENT_PATCH]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ agentId: string }> }) {
  const session = await auth()
  const { agentId } = await params

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    // Verify ownership
    const agent = await prisma.agent.findUnique({
      where: {
        id: agentId,
        userId: session.user.id,
      },
    })

    if (!agent) {
      return new NextResponse('Not Found', { status: 404 })
    }

    await prisma.agent.delete({
      where: {
        id: agentId,
      },
    })

    return NextResponse.json(null, { status: 204 })
  } catch (error) {
    console.error('[AGENT_DELETE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
