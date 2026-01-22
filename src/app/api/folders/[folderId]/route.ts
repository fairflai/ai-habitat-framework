import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request, { params }: { params: Promise<{ folderId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { folderId } = await params
  const body = await req.json().catch(() => ({}))
  const { name } = body

  // Verify ownership
  const folder = await prisma.folder.findUnique({
    where: { id: folderId, userId: session.user.id },
  })

  if (!folder) {
    return new NextResponse('Not found', { status: 404 })
  }

  const updated = await prisma.folder.update({
    where: { id: folderId },
    data: { name: name.trim() },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ folderId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { folderId } = await params

  // Verify ownership
  const folder = await prisma.folder.findUnique({
    where: { id: folderId, userId: session.user.id },
  })

  if (!folder) {
    return new NextResponse('Not found', { status: 404 })
  }

  // Unassign chats from folder before deleting
  await prisma.chat.updateMany({
    where: { folderId },
    data: { folderId: null },
  })

  await prisma.folder.delete({
    where: { id: folderId },
  })

  return new NextResponse(null, { status: 204 })
}
