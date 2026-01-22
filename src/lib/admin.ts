import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

import { Prisma } from '@prisma/client'

export type AdminSession = {
  user: {
    id: string
    email: string
    name: string | null
    role: string
    permissions: string[]
  }
}

/**
 * Verifica che l'utente corrente sia un admin.
 * Da usare nelle API routes admin.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await auth()

  if (!session?.user?.id) {
    throw new AdminError('Unauthorized', 401)
  }

  if (session.user.role !== 'admin') {
    throw new AdminError('Forbidden: Admin access required', 403)
  }

  return session as AdminSession
}

/**
 * Verifica che l'utente corrente abbia uno specifico permesso.
 */
export async function requirePermission(permission: string): Promise<AdminSession> {
  const session = await requireAdmin()

  if (!session.user.permissions.includes(permission)) {
    throw new AdminError(`Forbidden: Missing permission "${permission}"`, 403)
  }

  return session
}

/**
 * Controlla se l'utente ha un permesso specifico (non lancia errore).
 */
export function hasPermission(session: AdminSession | null, permission: string): boolean {
  return session?.user?.permissions?.includes(permission) ?? false
}

/**
 * Registra un'azione nell'audit log.
 */
export async function logAudit(
  action: string,
  options: {
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
        target: options.target,
        targetType: options.targetType,
        metadata: options.metadata ?? undefined,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
      },
    })
  } catch (error) {
    // Log error but don't fail the request
    console.error('[AuditLog] Failed to log action:', action, error)
  }
}

/**
 * Custom error class per gli errori admin.
 */
export class AdminError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
  ) {
    super(message)
    this.name = 'AdminError'
  }
}

/**
 * Handler per errori nelle API admin.
 */
export function handleAdminError(error: unknown): NextResponse {
  if (error instanceof AdminError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode })
  }

  console.error('[Admin API Error]', error)
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}

/**
 * Wrapper per API routes admin.
 * Gestisce automaticamente auth e error handling.
 */
export function withAdmin(
  handler: (session: AdminSession, request: Request) => Promise<NextResponse>,
  options: { permission?: string } = {},
) {
  return async (request: Request): Promise<NextResponse> => {
    try {
      const session = options.permission
        ? await requirePermission(options.permission)
        : await requireAdmin()

      return await handler(session, request)
    } catch (error) {
      return handleAdminError(error)
    }
  }
}
