import { signOutAdmin } from '@/lib/admin-auth'
import { NextResponse } from 'next/server'

export async function POST() {
  await signOutAdmin()
  return NextResponse.json({ success: true })
}
