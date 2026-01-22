import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withAdmin, logAudit, AdminError } from '@/lib/admin'
import { z } from 'zod'

type RouteContext = {
  params: Promise<{ userId: string }>
}

// GET /api/admin/users/[userId]
export const GET = withAdmin(async (session, request) => {
  const url = new URL(request.url)
  const userId = url.pathname.split('/').pop()!

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: { permissions: true },
      },
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
}, { permission: 'users.read' })

// PATCH /api/admin/users/[userId]
const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  roleId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(request: Request, context: RouteContext) {
  const { userId } = await context.params
  
  return withAdmin(async (session) => {
    const body = await request.json()
    const data = updateUserSchema.parse(body)

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if email is being changed to an existing email
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
        roleId: data.roleId,
        isActive: data.isActive,
      },
      include: { role: true },
    })

    await logAudit('user.updated', {
      userId: session.user.id,
      target: user.id,
      targetType: 'user',
      metadata: { changes: data, updatedBy: session.user.email },
    })

    return NextResponse.json(user)
  }, { permission: 'users.write' })(request)
}

// DELETE /api/admin/users/[userId]
export async function DELETE(request: Request, context: RouteContext) {
  const { userId } = await context.params

  return withAdmin(async (session) => {
    // Prevent self-deletion
    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
    }

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
      userId: session.user.id,
      target: userId,
      targetType: 'user',
      metadata: { email: user.email, deletedBy: session.user.email },
    })

    return NextResponse.json({ success: true })
  }, { permission: 'users.delete' })(request)
}
