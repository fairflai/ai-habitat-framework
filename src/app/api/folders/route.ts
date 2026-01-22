import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const folders = await prisma.folder.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'asc' },
    include: {
      chats: {
        where: { isArchived: false },
        orderBy: { updatedAt: 'desc' },
      },
    },
  })

  return NextResponse.json(folders)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const { name } = body

  if (!name || typeof name !== 'string') {
    return new NextResponse('Name is required', { status: 400 })
  }

  const folder = await prisma.folder.create({
    data: {
      name: name.trim(),
      userId: session.user.id,
    },
  })

  return NextResponse.json(folder)
}
