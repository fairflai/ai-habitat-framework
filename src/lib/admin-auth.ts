import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

const ADMIN_COOKIE_NAME = 'admin-token'
const ADMIN_TOKEN_MAX_AGE = 8 * 60 * 60 // 8 hours in seconds

function getAdminSecret() {
  const secret = process.env.ADMIN_JWT_SECRET
  if (!secret) {
    throw new Error('ADMIN_JWT_SECRET environment variable is not set')
  }
  return new TextEncoder().encode(secret)
}

export interface AdminSession {
  adminId: string
  email: string
  name: string | null
}

/**
 * Authenticate an admin user with email/password.
 * On success, sets the admin-token cookie and returns the admin session.
 */
export async function signInAdmin(
  email: string,
  password: string,
): Promise<AdminSession> {
  const admin = await prisma.adminUser.findUnique({
    where: { email },
  })

  if (!admin || !admin.isActive) {
    throw new Error('Invalid credentials')
  }

  const passwordMatch = await bcrypt.compare(password, admin.password)
  if (!passwordMatch) {
    throw new Error('Invalid credentials')
  }

  const payload: AdminSession = {
    adminId: admin.id,
    email: admin.email,
    name: admin.name,
  }

  const token = await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_TOKEN_MAX_AGE}s`)
    .sign(getAdminSecret())

  const cookieStore = await cookies()
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_TOKEN_MAX_AGE,
  })

  return payload
}

/**
 * Verify the admin token from cookies.
 * Returns the admin session or null if invalid/missing.
 */
export async function verifyAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value

    if (!token) return null

    const { payload } = await jwtVerify(token, getAdminSecret())

    return {
      adminId: payload.adminId as string,
      email: payload.email as string,
      name: (payload.name as string | null) ?? null,
    }
  } catch {
    return null
  }
}

/**
 * Verify the admin token from a raw cookie header string.
 * Used in middleware where next/headers cookies() is not available.
 */
export async function verifyAdminTokenFromCookie(
  cookieHeader: string | null,
): Promise<AdminSession | null> {
  if (!cookieHeader) return null

  try {
    const tokenMatch = cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${ADMIN_COOKIE_NAME}=`))

    if (!tokenMatch) return null

    const token = tokenMatch.split('=').slice(1).join('=')
    if (!token) return null

    const { payload } = await jwtVerify(token, getAdminSecret())

    return {
      adminId: payload.adminId as string,
      email: payload.email as string,
      name: (payload.name as string | null) ?? null,
    }
  } catch {
    return null
  }
}

/**
 * Require a valid admin session. Throws if not authenticated.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await verifyAdminSession()
  if (!session) {
    throw new Error('Admin authentication required')
  }
  return session
}

/**
 * Sign out the admin by clearing the cookie.
 */
export async function signOutAdmin(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}
