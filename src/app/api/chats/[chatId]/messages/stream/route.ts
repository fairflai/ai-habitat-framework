import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { streamText } from 'ai'
import { getChatModel } from '@/lib/ai'
import {
  streamMessage,
  sendMessage,
  extractTaskResponse,
  supportsStreaming,
  type A2AAgentCard,
} from '@/lib/a2a-client'

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
    // ── A2A Remote Agent ─────────────────────────────────────────────────
    if (chat.agent?.isA2A && chat.agent.a2aUrl && chat.agent.a2aAgentCard) {
      const agentCard = chat.agent.a2aAgentCard as unknown as A2AAgentCard
      const userMessage = lastMessage.content
      const bearerToken = chat.agent.a2aBearerToken || undefined

      if (supportsStreaming(agentCard)) {
        // Stream response from remote A2A agent
        const a2aStream = streamMessage(agentCard, userMessage, {
          contextId: chatId, // Use chatId as context for conversation continuity
          bearerToken,
        })

        // We need to capture the full text for saving to DB.
        // Tee the stream: one for the response, one for capturing.
        const [responseStream, captureStream] = a2aStream.tee()

        // Capture full text in background
        captureA2AStreamText(captureStream).then(async (fullText) => {
          if (fullText) {
            await prisma.message.create({
              data: {
                chatId,
                role: 'ASSISTANT',
                content: fullText,
              },
            })
          }
        })

        return new Response(responseStream, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
          },
        })
      } else {
        // Non-streaming: use message/send
        const task = await sendMessage(agentCard, userMessage, {
          contextId: chatId,
          bearerToken,
        })

        const responseText = extractTaskResponse(task)

        await prisma.message.create({
          data: {
            chatId,
            role: 'ASSISTANT',
            content: responseText,
          },
        })

        // Return as a streaming response for consistent client handling
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(responseText))
            controller.close()
          },
        })

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
          },
        })
      }
    }

    // ── Local Agent (OpenAI via AI SDK) ──────────────────────────────────
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

/**
 * Read all chunks from a captured A2A stream and return the full text.
 */
async function captureA2AStreamText(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let fullText = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      fullText += decoder.decode(value, { stream: true })
    }
  } catch (error) {
    console.error('[stream] Error capturing A2A response:', error)
  }

  return fullText
}
