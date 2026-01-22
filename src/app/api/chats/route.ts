import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const chats = await prisma.chat.findMany({
    where: {
      userId: session.user.id,
      isArchived: false,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  })

  return NextResponse.json(chats)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const { title } = body

  const chat = await prisma.chat.create({
    data: {
      title: title || 'New Chat',
      userId: session.user.id,
      agentId: body.agentId,
    },
  })

  return NextResponse.json(chat)
}
