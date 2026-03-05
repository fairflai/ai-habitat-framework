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

    // Handle A2A fields
    if (isA2A !== undefined) updateData.isA2A = isA2A
    if (a2aBearerToken !== undefined) updateData.a2aBearerToken = a2aBearerToken || null
    if (a2aUrl !== undefined) {
      updateData.a2aUrl = a2aUrl

      // Re-fetch agent card if URL changed
      if (a2aUrl && a2aUrl !== agent.a2aUrl) {
        // Use the new token if provided, otherwise fall back to existing
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
    }

    // If switching from A2A to local, clear A2A fields
    if (isA2A === false) {
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
