import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { getTitleModel } from '@/lib/ai'

export async function POST(req: Request, { params }: { params: Promise<{ chatId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { chatId } = await params

  // Verify ownership and get messages
  const chat = await prisma.chat.findUnique({
    where: { id: chatId, userId: session.user.id },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 5,
      },
    },
  })

  if (!chat) {
    return new NextResponse('Not found', { status: 404 })
  }

  if (chat.messages.length === 0) {
    return new NextResponse('No messages to generate title from', { status: 400 })
  }

  // Check if auto-title is enabled (via SystemSetting or env fallback)
  try {
    const autoTitleSetting = await prisma.systemSetting.findUnique({
      where: { key: 'enable_auto_title' },
    })
    const isEnabled = autoTitleSetting
      ? autoTitleSetting.value === true
      : process.env.ENABLE_AUTO_TITLE !== 'false'

    if (!isEnabled) {
      return new NextResponse('Auto-title generation is disabled', { status: 403 })
    }
  } catch {
    // If check fails, allow generation (fail open)
  }

  const conversationContext = chat.messages.map((m) => `${m.role}: ${m.content.slice(0, 200)}`).join('\n')

  try {
    const titleModel = await getTitleModel()

    const { text: generatedTitle } = await generateText({
      model: titleModel,
      prompt: `Generate a short, descriptive title (max 6 words) for this conversation. Return ONLY the title, no quotes or extra text.\n\nConversation:\n${conversationContext}`,
    })

    const title = generatedTitle
      .trim()
      .replace(/^["']|["']$/g, '')
      .slice(0, 100)

    const updated = await prisma.chat.update({
      where: { id: chatId },
      data: { title },
    })

    return NextResponse.json({ title: updated.title })
  } catch (error) {
    console.error('Error generating title:', error)
    return new NextResponse('Failed to generate title', { status: 500 })
  }
}
