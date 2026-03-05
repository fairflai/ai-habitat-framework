import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin, type AdminSession } from '@/lib/admin-auth'
import { Prisma } from '@prisma/client'

/**
 * Log an action to the audit log.
 */
export async function logAudit(
  action: string,
  options: {
    adminUserId?: string
    userId?: string
    target?: string
    targetType?: string
    metadata?: Prisma.InputJsonValue
    ipAddress?: string
    userAgent?: string
  } = {},
) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId: options.userId,
        adminUserId: options.adminUserId,
        target: options.target,
        targetType: options.targetType,
        metadata: options.metadata ?? undefined,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
      },
    })
  } catch (error) {
    console.error('[AuditLog] Failed to log action:', action, error)
  }
}

/**
 * Wrapper for admin API route handlers.
 * Automatically verifies admin auth and handles errors.
 */
export function withAdminApi(
  handler: (session: AdminSession, request: Request) => Promise<NextResponse>,
) {
  return async (request: Request): Promise<NextResponse> => {
    try {
      const session = await requireAdmin()
      return await handler(session, request)
    } catch (error) {
      if (error instanceof Error && error.message === 'Admin authentication required') {
        return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 })
      }
      console.error('[Admin API Error]', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
