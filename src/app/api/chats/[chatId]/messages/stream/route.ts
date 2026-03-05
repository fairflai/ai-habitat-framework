import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { streamText, tool, stepCountIs, type ToolSet } from 'ai'
import { z } from 'zod'
import { getChatModel } from '@/lib/ai'
import {
  sendMessage as a2aSendMessage,
  streamMessage as a2aStreamMessage,
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

    // ── Build tools ────────────────────────────────────────────────────────
    // If the chat is linked to an A2A remote agent, expose it as a tool
    // that the LLM can invoke. The LLM orchestrates the conversation and
    // decides when to delegate to the remote agent.
    const tools: ToolSet = {}

    if (chat.agent?.isA2A && chat.agent.a2aUrl && chat.agent.a2aAgentCard) {
      const agentCard = chat.agent.a2aAgentCard as unknown as A2AAgentCard
      const bearerToken = chat.agent.a2aBearerToken || undefined
      const agentName = chat.agent.name
      const agentDescription =
        chat.agent.description || agentCard.description || 'Remote A2A agent'

      tools.queryA2AAgent = tool({
        description: `Query the remote agent "${agentName}": ${agentDescription}. Use this tool to delegate tasks or questions to this specialized agent.`,
        inputSchema: z.object({
          query: z.string().describe('The message or question to send to the remote agent'),
        }),
        execute: async ({ query }: { query: string }) => {
          return await callA2AAgent(agentCard, query, chatId, bearerToken)
        },
      })

      // If no explicit instructions were set for this agent, inject a default
      // system message so the LLM knows it should use the tool.
      if (!chat.agent.instructions) {
        const insertIdx = aiConfig.systemPrompt ? 1 : 0
        coreMessages.splice(insertIdx, 0, {
          role: 'system',
          content:
            `You have access to a specialized remote agent called "${agentName}". ` +
            `${agentDescription}. ` +
            `Use the queryA2AAgent tool to delegate the user's requests to this agent. ` +
            `Always relay the agent's response to the user in a clear and helpful way.`,
        })
      }
    }

    const hasTools = Object.keys(tools).length > 0

    const result = streamText({
      model: aiConfig.model,
      messages: coreMessages,
      maxOutputTokens: aiConfig.maxOutputTokens,
      temperature: aiConfig.temperature,
      ...(hasTools ? { tools, stopWhen: stepCountIs(3) } : {}),
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

// ── A2A Tool Helpers ───────────────────────────────────────────────────────

/**
 * Call an A2A remote agent and return the full text response.
 * Handles both streaming and non-streaming agents transparently.
 */
async function callA2AAgent(
  agentCard: A2AAgentCard,
  query: string,
  contextId: string,
  bearerToken?: string,
): Promise<string> {
  if (supportsStreaming(agentCard)) {
    const stream = a2aStreamMessage(agentCard, query, {
      contextId,
      bearerToken,
    })
    return await collectStreamText(stream)
  } else {
    const task = await a2aSendMessage(agentCard, query, {
      contextId,
      bearerToken,
    })
    return extractTaskResponse(task)
  }
}

/**
 * Read all chunks from an A2A stream and return the full text.
 */
async function collectStreamText(stream: ReadableStream<Uint8Array>): Promise<string> {
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
    console.error('[stream] Error collecting A2A response:', error)
  }

  return fullText
}
