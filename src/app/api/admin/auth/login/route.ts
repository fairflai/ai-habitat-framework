import { signInAdmin } from '@/lib/admin-auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid email or password format' },
        { status: 400 },
      )
    }

    const session = await signInAdmin(parsed.data.email, parsed.data.password)

    return NextResponse.json({
      success: true,
      admin: {
        id: session.adminId,
        email: session.email,
        name: session.name,
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 },
    )
  }
}
