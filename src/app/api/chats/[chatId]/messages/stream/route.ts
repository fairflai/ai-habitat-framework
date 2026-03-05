import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { streamText } from 'ai'
import { getChatModel } from '@/lib/ai'

export async function POST(req: Request, { params }: { params: Promise<{ chatId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { chatId } = await params
  const { messages } = await req.json()

  // Verify chat ownership and fetch agent instructions
  const chat = await prisma.chat.findUnique({
    where: { id: chatId, userId: session.user.id },
    include: { agent: true },
  })

  if (!chat) {
    return new Response('Chat not found', { status: 404 })
  }

  // Save the latest user message
  const lastMessage = messages[messages.length - 1]
  if (lastMessage.role.toLowerCase() === 'user') {
    await prisma.message.create({
      data: {
        chatId,
        role: 'USER',
        content: lastMessage.content,
      },
    })
  }

  try {
    // Load AI config from database
    const aiConfig = await getChatModel()

    // Map messages to CoreMessage format
    const coreMessages: { role: 'user' | 'assistant' | 'system'; content: string }[] = messages.map(
      (m: { role: string; content: string }) => ({
        role: m.role.toLowerCase() as 'user' | 'assistant',
        content: m.content,
      }),
    )

    // Prepend global system prompt if configured
    if (aiConfig.systemPrompt) {
      coreMessages.unshift({
        role: 'system',
        content: aiConfig.systemPrompt,
      })
    }

    // Prepend agent-specific instructions (after global system prompt)
    if (chat.agent?.instructions) {
      const insertIdx = aiConfig.systemPrompt ? 1 : 0
      coreMessages.splice(insertIdx, 0, {
        role: 'system',
        content: chat.agent.instructions,
      })
    }

    const result = streamText({
      model: aiConfig.model,
      messages: coreMessages,
      maxOutputTokens: aiConfig.maxOutputTokens,
      temperature: aiConfig.temperature,
      onFinish: async (completion) => {
        await prisma.message.create({
          data: {
            chatId,
            role: 'ASSISTANT',
            content: completion.text,
          },
        })
      },
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('[stream] Error:', error)
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
