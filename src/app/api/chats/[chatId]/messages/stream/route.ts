import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

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
  // Normalize role check (handle both 'user' and 'USER')
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
    // Map messages to CoreMessage format and ensure lowercase roles for AI SDK
    const coreMessages: { role: 'user' | 'assistant' | 'system'; content: string }[] = messages.map(
      (m: { role: string; content: string }) => ({
        role: m.role.toLowerCase() as 'user' | 'assistant',
        content: m.content,
      }),
    )

    // Prepend system message if agent exists
    if (chat.agent?.instructions) {
      coreMessages.unshift({
        role: 'system',
        content: chat.agent.instructions,
      })
    }

    const result = streamText({
      model: openai('gpt-5-mini'),
      messages: coreMessages,
      onFinish: async (completion) => {
        // Save assistant message
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
