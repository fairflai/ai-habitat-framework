import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PATCH(req: Request, { params }: { params: Promise<{ agentId: string }> }) {
  const session = await auth()
  const { agentId } = await params

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, description, instructions } = body

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

    const updatedAgent = await prisma.agent.update({
      where: {
        id: agentId,
      },
      data: {
        name,
        description,
        instructions,
      },
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
