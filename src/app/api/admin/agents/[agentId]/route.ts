import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withAdminApi, logAudit } from '@/lib/admin'

type RouteContext = {
  params: Promise<{ agentId: string }>
}

// GET /api/admin/agents/[agentId]
export async function GET(request: Request, context: RouteContext) {
  const { agentId } = await context.params

  return withAdminApi(async () => {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: { chats: true },
        },
      },
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    return NextResponse.json(agent)
  })(request)
}

// DELETE /api/admin/agents/[agentId]
export async function DELETE(request: Request, context: RouteContext) {
  const { agentId } = await context.params

  return withAdminApi(async (session) => {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    await prisma.agent.delete({
      where: { id: agentId },
    })

    await logAudit('agent.deleted', {
      adminUserId: session.adminId,
      target: agentId,
      targetType: 'agent',
      metadata: { name: agent.name, deletedBy: session.email },
    })

    return NextResponse.json({ success: true })
  })(request)
}
