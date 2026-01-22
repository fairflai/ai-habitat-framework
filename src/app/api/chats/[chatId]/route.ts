import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request, { params }: { params: Promise<{ chatId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { chatId } = await params
  const body = await req.json().catch(() => ({}))
  const { title, folderId } = body

  // Verify ownership
  const chat = await prisma.chat.findUnique({
    where: { id: chatId, userId: session.user.id },
  })

  if (!chat) {
    return new NextResponse('Not found', { status: 404 })
  }

  const updated = await prisma.chat.update({
    where: { id: chatId },
    data: {
      ...(title !== undefined && { title }),
      ...(folderId !== undefined && { folderId: folderId || null }),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ chatId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { chatId } = await params

  // Verify ownership
  const chat = await prisma.chat.findUnique({
    where: { id: chatId, userId: session.user.id },
  })

  if (!chat) {
    return new NextResponse('Not found', { status: 404 })
  }

  // Hard delete the chat and all related messages/votes (cascade)
  await prisma.chat.delete({
    where: { id: chatId },
  })

  return new NextResponse(null, { status: 204 })
}
