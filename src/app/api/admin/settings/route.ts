import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withAdmin, logAudit } from '@/lib/admin'
import { z } from 'zod'

// GET /api/admin/settings
export const GET = withAdmin(
  async (_session, _request) => {
    const settings = await prisma.systemSetting.findMany()

    // Convert to key-value object
    const settingsMap = settings.reduce<Record<string, unknown>>(
      (acc, setting) => {
        acc[setting.key] = setting.value
        return acc
      },
      {},
    )

    return NextResponse.json(settingsMap)
  },
  { permission: 'settings.read' },
)

// PATCH /api/admin/settings
const updateSettingsSchema = z.record(z.string(), z.unknown())

export async function PATCH(request: Request) {
  return withAdmin(
    async (session, req) => {
      const body = await req.json()
      const settings = updateSettingsSchema.parse(body)

      // Update each setting
      const updates = Object.entries(settings).map(([key, value]) =>
        prisma.systemSetting.upsert({
          where: { key },
          update: { value: value as object },
          create: {
            key,
            value: value as object,
          },
        }),
      )

      await Promise.all(updates)

      await logAudit('settings.updated', {
        userId: session.user.id,
        targetType: 'settings',
        metadata: { keys: Object.keys(settings), updatedBy: session.user.email },
      })

      return NextResponse.json({ success: true })
    },
    { permission: 'settings.write' },
  )(request)
}
