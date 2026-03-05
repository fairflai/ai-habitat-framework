import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withAdminApi, logAudit } from '@/lib/admin'
import { z } from 'zod'

// GET /api/admin/settings
export const GET = withAdminApi(async () => {
  const settings = await prisma.systemSetting.findMany()

  const settingsMap = settings.reduce<Record<string, unknown>>(
    (acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    },
    {},
  )

  return NextResponse.json(settingsMap)
})

// PATCH /api/admin/settings
const updateSettingsSchema = z.record(z.string(), z.unknown())

export const PATCH = withAdminApi(async (session, request) => {
  const body = await request.json()
  const settings = updateSettingsSchema.parse(body)

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
    adminUserId: session.adminId,
    targetType: 'settings',
    metadata: { keys: Object.keys(settings), updatedBy: session.email },
  })

  return NextResponse.json({ success: true })
})
