import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withAdminApi, logAudit } from '@/lib/admin'
import { z } from 'zod'

type RouteContext = {
  params: Promise<{ userId: string }>
}

// GET /api/admin/users/[userId]
export const GET = withAdminApi(async (_session, request) => {
  const url = new URL(request.url)
  const userId = url.pathname.split('/').pop()!

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      _count: {
        select: {
          chats: true,
          messages: true,
          agents: true,
        },
      },
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json(user)
})

// PATCH /api/admin/users/[userId]
const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(request: Request, context: RouteContext) {
  const { userId } = await context.params

  return withAdminApi(async (session) => {
    const body = await request.json()
    const data = updateUserSchema.parse(body)

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (data.email && data.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email },
      })
      if (emailExists) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        email: data.email,
        isActive: data.isActive,
      },
    })

    await logAudit('user.updated', {
      adminUserId: session.adminId,
      target: user.id,
      targetType: 'user',
      metadata: { changes: data, updatedBy: session.email },
    })

    return NextResponse.json(user)
  })(request)
}

// DELETE /api/admin/users/[userId]
export async function DELETE(request: Request, context: RouteContext) {
  const { userId } = await context.params

  return withAdminApi(async (session) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await prisma.user.delete({
      where: { id: userId },
    })

    await logAudit('user.deleted', {
      adminUserId: session.adminId,
      target: userId,
      targetType: 'user',
      metadata: { email: user.email, deletedBy: session.email },
    })

    return NextResponse.json({ success: true })
  })(request)
}
