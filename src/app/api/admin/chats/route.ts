import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withAdminApi } from '@/lib/admin'

// GET /api/admin/chats - List all chats
export const GET = withAdminApi(async (_session, request) => {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const search = searchParams.get('search') || ''
  const archived = searchParams.get('archived')

  const where = {
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { user: { email: { contains: search, mode: 'insensitive' as const } } },
      ],
    }),
    ...(archived !== null && archived !== undefined && archived !== '' && {
      isArchived: archived === 'true',
    }),
  }

  const [chats, total] = await Promise.all([
    prisma.chat.findMany({
      where,
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
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.chat.count({ where }),
  ])

  return NextResponse.json({
    chats,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
})
