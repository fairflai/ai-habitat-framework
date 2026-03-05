import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withAdminApi, logAudit } from '@/lib/admin'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

// GET /api/admin/users - List all users
export const GET = withAdminApi(async (_session, request) => {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const search = searchParams.get('search') || ''

  const where = search
    ? {
        OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { name: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        _count: {
          select: {
            chats: true,
            messages: true,
            agents: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ])

  return NextResponse.json({
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
})

// POST /api/admin/users - Create user
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(6),
  isActive: z.boolean().optional(),
})

export const POST = withAdminApi(async (session, request) => {
  const body = await request.json()
  const data = createUserSchema.parse(body)

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  })

  if (existingUser) {
    return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(data.password, 10)

  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      password: hashedPassword,
      isActive: data.isActive ?? true,
    },
  })

  await logAudit('user.created', {
    adminUserId: session.adminId,
    target: user.id,
    targetType: 'user',
    metadata: { email: user.email, createdBy: session.email },
  })

  return NextResponse.json(user, { status: 201 })
})
