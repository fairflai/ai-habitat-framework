import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req: Request, { params }: { params: Promise<{ chatId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { chatId } = await params

  const messages = await prisma.message.findMany({
    where: {
      chatId,
      chat: { userId: session.user.id },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(messages)
}
