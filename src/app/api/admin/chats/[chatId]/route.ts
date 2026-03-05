import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withAdminApi, logAudit } from '@/lib/admin'

type RouteContext = {
  params: Promise<{ chatId: string }>
}

// GET /api/admin/chats/[chatId] - Get chat with messages
export async function GET(request: Request, context: RouteContext) {
  const { chatId } = await context.params

  return withAdminApi(async () => {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        agent: {
          select: {
            id: true,
            name: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 200,
        },
      },
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    return NextResponse.json(chat)
  })(request)
}

// PATCH /api/admin/chats/[chatId] - Archive/restore
export async function PATCH(request: Request, context: RouteContext) {
  const { chatId } = await context.params

  return withAdminApi(async (session) => {
    const body = await request.json()

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    const updated = await prisma.chat.update({
      where: { id: chatId },
      data: {
        isArchived: body.isArchived,
      },
    })

    await logAudit(body.isArchived ? 'chat.archived' : 'chat.restored', {
      adminUserId: session.adminId,
      target: chatId,
      targetType: 'chat',
      metadata: { title: chat.title, updatedBy: session.email },
    })

    return NextResponse.json(updated)
  })(request)
}

// DELETE /api/admin/chats/[chatId]
export async function DELETE(request: Request, context: RouteContext) {
  const { chatId } = await context.params

  return withAdminApi(async (session) => {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    await prisma.chat.delete({
      where: { id: chatId },
    })

    await logAudit('chat.deleted', {
      adminUserId: session.adminId,
      target: chatId,
      targetType: 'chat',
      metadata: { title: chat.title, deletedBy: session.email },
    })

    return NextResponse.json({ success: true })
  })(request)
}
