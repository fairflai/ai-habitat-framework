import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withAdmin, logAudit } from '@/lib/admin'

// GET /api/admin/stats - Dashboard statistics
export const GET = withAdmin(async (session) => {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    totalUsers,
    totalChats,
    totalMessages,
    totalAgents,
    newUsersLast7Days,
    newUsersLast30Days,
    newChatsLast7Days,
    activeUsersLast7Days,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.chat.count(),
    prisma.message.count(),
    prisma.agent.count(),
    prisma.user.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.user.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.chat.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.user.count({
      where: {
        chats: {
          some: {
            updatedAt: { gte: sevenDaysAgo },
          },
        },
      },
    }),
  ])

  return NextResponse.json({
    users: {
      total: totalUsers,
      last7Days: newUsersLast7Days,
      last30Days: newUsersLast30Days,
      active7Days: activeUsersLast7Days,
    },
    chats: {
      total: totalChats,
      last7Days: newChatsLast7Days,
    },
    messages: {
      total: totalMessages,
    },
    agents: {
      total: totalAgents,
    },
  })
})
