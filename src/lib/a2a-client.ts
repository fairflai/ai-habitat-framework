/**
 * A2A (Agent2Agent) Protocol Client
 *
 * Implements the client side of the A2A protocol (JSON-RPC 2.0 over HTTP).
 * Supports fetching Agent Cards, sending messages, and streaming responses.
 *
 * Compatible with both standard A2A spec and Agno-style separate endpoints
 * (message:send / message:stream as distinct REST paths).
 *
 * @see https://google.github.io/A2A/
 */

// ─── Types ───────────────────────────────────────────────────────────────────

/** Agent Card — metadata describing a remote A2A agent */
export interface A2AAgentCard {
  name: string
  description?: string
  url: string // The agent's primary endpoint URL (Agno: points to message:stream)
  version: string
  protocolVersion?: string
  preferredTransport?: string
  capabilities?: {
    streaming?: boolean
    pushNotifications?: boolean
    stateTransitionHistory?: boolean
    extensions?: unknown
  }
  skills?: Array<{
    id: string
    name: string
    description?: string
    tags?: string[]
    examples?: string[]
    inputModes?: string[] | null
    outputModes?: string[] | null
    security?: unknown
  }>
  defaultInputModes?: string[]
  defaultOutputModes?: string[]
  securitySchemes?: Record<string, unknown> | null
  security?: Array<Record<string, string[]>> | null
  provider?: unknown
  documentationUrl?: string | null
  iconUrl?: string | null
  supportsAuthenticatedExtendedCard?: boolean
  additionalInterfaces?: unknown
  signatures?: unknown
}

/** A2A content parts — A2A spec v0.3.0 uses 'kind' field (not 'type') */
export interface A2ATextPart {
  kind: 'text'
  text: string
}

export interface A2AFilePart {
  kind: 'file'
  file: {
    name?: string
    mimeType?: string
    bytes?: string // base64
    uri?: string
  }
}

export interface A2ADataPart {
  kind: 'data'
  data: Record<string, unknown>
}

export type A2APart = A2ATextPart | A2AFilePart | A2ADataPart

/** A2A Message — messageId is required by A2A spec v0.3.0 */
export interface A2AMessage {
  messageId: string
  role: 'user' | 'agent'
  parts: A2APart[]
  metadata?: Record<string, unknown>
}

/** A2A Task states */
export type A2ATaskState =
  | 'submitted'
  | 'working'
  | 'input-required'
  | 'completed'
  | 'canceled'
  | 'failed'
  | 'rejected'

/** A2A Artifact — output produced by the agent */
export interface A2AArtifact {
  name?: string
  description?: string
  parts: A2APart[]
  metadata?: Record<string, unknown>
  index?: number
  append?: boolean
  lastChunk?: boolean
}

/** A2A Task status */
export interface A2ATaskStatus {
  state: A2ATaskState
  message?: A2AMessage
  timestamp?: string
}

/** A2A Task */
export interface A2ATask {
  id: string
  contextId?: string
  status: A2ATaskStatus
  artifacts?: A2AArtifact[]
  history?: A2AMessage[]
  metadata?: Record<string, unknown>
}

/** JSON-RPC 2.0 request */
interface JsonRpcRequest {
  jsonrpc: '2.0'
  id: string | number
  method: string
  params?: Record<string, unknown>
}

/** JSON-RPC 2.0 response */
interface JsonRpcResponse<T = unknown> {
  jsonrpc: '2.0'
  id: string | number | null
  result?: T
  error?: {
    code: number
    message: string
    data?: unknown
  }
}

/** SSE event from message/stream */
export interface A2AStreamEvent {
  id?: string
  event?: string
  data: string
}

/** Parsed streaming update */
export interface A2AStatusUpdate {
  jsonrpc: '2.0'
  id: string | number
  result: {
    id: string
    status: A2ATaskStatus
    final: boolean
    metadata?: Record<string, unknown>
  }
}

export interface A2AArtifactUpdate {
  jsonrpc: '2.0'
  id: string | number
  result: {
    id: string
    artifact: A2AArtifact
    metadata?: Record<string, unknown>
  }
}

// ─── Errors ──────────────────────────────────────────────────────────────────

export class A2AError extends Error {
  constructor(
    message: string,
    public code?: number,
    public data?: unknown,
  ) {
    super(message)
    this.name = 'A2AError'
  }
}

// ─── Client ──────────────────────────────────────────────────────────────────

let rpcIdCounter = 0

function nextRpcId(): number {
  return ++rpcIdCounter
}

/**
 * Build authorization headers if a bearer token is provided.
 */
function authHeaders(bearerToken?: string): Record<string, string> {
  if (!bearerToken) return {}
  return { Authorization: `Bearer ${bearerToken}` }
}

/**
 * Derive the message:send URL from the agent card URL.
 *
 * Agno-style cards set `url` to the stream endpoint (e.g. `.../v1/message:stream`).
 * We derive the send URL by replacing `message:stream` with `message:send`.
 * For standard A2A (single JSON-RPC endpoint), the URL is used as-is.
 */
function getSendUrl(agentCard: A2AAgentCard): string {
  if (agentCard.url.endsWith('/v1/message:stream')) {
    return agentCard.url.replace(/message:stream$/, 'message:send')
  }
  return agentCard.url
}

/**
 * Derive the message:stream URL from the agent card URL.
 *
 * If the card URL already points to message:stream, use it directly.
 * If it points to message:send, replace with message:stream.
 * Otherwise use as-is (standard A2A single endpoint).
 */
function getStreamUrl(agentCard: A2AAgentCard): string {
  if (agentCard.url.endsWith('/v1/message:send')) {
    return agentCard.url.replace(/message:send$/, 'message:stream')
  }
  return agentCard.url
}

/**
 * Fetch and validate an Agent Card from a remote A2A agent URL.
 *
 * Tries multiple well-known locations in order:
 * 1. Direct URL (if it already ends with agent-card.json or agent.json)
 * 2. `<baseUrl>/.well-known/agent-card.json` (Agno-style)
 * 3. `<baseUrl>/.well-known/agent.json` (standard A2A spec)
 * 4. `<origin>/.well-known/agent-card.json` (at the host root)
 * 5. `<origin>/.well-known/agent.json` (at the host root)
 *
 * Optionally sends a Bearer token for authenticated endpoints.
 */
export async function fetchAgentCard(baseUrl: string, bearerToken?: string): Promise<A2AAgentCard> {
  const normalized = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  const parsedUrl = new URL(normalized)

  const candidateUrls: string[] = []

  // If the URL itself is a direct agent card URL, try it first
  if (baseUrl.endsWith('agent-card.json') || baseUrl.endsWith('agent.json')) {
    candidateUrls.push(baseUrl)
  }

  // Agno-style: <baseUrl>/.well-known/agent-card.json
  candidateUrls.push(`${normalized}.well-known/agent-card.json`)

  // Standard A2A: <baseUrl>/.well-known/agent.json
  candidateUrls.push(`${normalized}.well-known/agent.json`)

  // Also try at origin root if baseUrl has a path
  const originCardUrl = `${parsedUrl.origin}/.well-known/agent-card.json`
  const originJsonUrl = `${parsedUrl.origin}/.well-known/agent.json`

  if (!candidateUrls.includes(originCardUrl)) {
    candidateUrls.push(originCardUrl)
  }
  if (!candidateUrls.includes(originJsonUrl)) {
    candidateUrls.push(originJsonUrl)
  }

  // Deduplicate
  const uniqueUrls = [...new Set(candidateUrls)]

  const errors: string[] = []

  for (const cardUrl of uniqueUrls) {
    try {
      const response = await fetch(cardUrl, {
        method: 'GET',
        headers: { Accept: 'application/json', ...authHeaders(bearerToken) },
        signal: AbortSignal.timeout(10_000),
      })

      if (!response.ok) {
        errors.push(`${cardUrl}: ${response.status} ${response.statusText}`)
        continue
      }

      const card: A2AAgentCard = await response.json()

      // Basic validation
      if (!card.name || !card.url) {
        errors.push(`${cardUrl}: invalid Agent Card (missing name or url)`)
        continue
      }

      return card
    } catch (error) {
      errors.push(`${cardUrl}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  throw new A2AError(
    `Failed to fetch Agent Card. Tried:\n${errors.map((e) => `  - ${e}`).join('\n')}`,
  )
}

/**
 * Send a message to a remote A2A agent (non-streaming).
 *
 * Uses JSON-RPC `message/send` at the derived send URL.
 */
export async function sendMessage(
  agentCard: A2AAgentCard,
  userMessage: string,
  options?: {
    taskId?: string
    contextId?: string
    historyLength?: number
    metadata?: Record<string, unknown>
    bearerToken?: string
  },
): Promise<A2ATask> {
  const message: A2AMessage = {
    messageId: crypto.randomUUID(),
    role: 'user',
    parts: [{ kind: 'text', text: userMessage }],
  }

  const params: Record<string, unknown> = {
    message,
  }

  if (options?.taskId) params.id = options.taskId
  if (options?.contextId) params.contextId = options.contextId
  if (options?.historyLength !== undefined) params.historyLength = options.historyLength
  if (options?.metadata) params.metadata = options.metadata

  const rpcRequest: JsonRpcRequest = {
    jsonrpc: '2.0',
    id: nextRpcId(),
    method: 'message/send',
    params,
  }

  const url = getSendUrl(agentCard)

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(options?.bearerToken) },
    body: JSON.stringify(rpcRequest),
    signal: AbortSignal.timeout(120_000),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new A2AError(
      `A2A message/send failed: ${response.status} — ${errorText}`,
      response.status,
    )
  }

  const rpcResponse: JsonRpcResponse<A2ATask> = await response.json()

  if (rpcResponse.error) {
    throw new A2AError(
      rpcResponse.error.message,
      rpcResponse.error.code,
      rpcResponse.error.data,
    )
  }

  return rpcResponse.result!
}

/**
 * Send a message to a remote A2A agent with streaming (SSE).
 *
 * Uses JSON-RPC `message/stream` at the derived stream URL.
 * Returns a ReadableStream that yields text chunks as the remote agent responds.
 *
 * The returned stream is suitable for piping directly to an HTTP response.
 */
export function streamMessage(
  agentCard: A2AAgentCard,
  userMessage: string,
  options?: {
    taskId?: string
    contextId?: string
    historyLength?: number
    metadata?: Record<string, unknown>
    bearerToken?: string
  },
): ReadableStream<Uint8Array> {
  const message: A2AMessage = {
    messageId: crypto.randomUUID(),
    role: 'user',
    parts: [{ kind: 'text', text: userMessage }],
  }

  const params: Record<string, unknown> = {
    message,
  }

  if (options?.taskId) params.id = options.taskId
  if (options?.contextId) params.contextId = options.contextId
  if (options?.historyLength !== undefined) params.historyLength = options.historyLength
  if (options?.metadata) params.metadata = options.metadata

  const rpcRequest: JsonRpcRequest = {
    jsonrpc: '2.0',
    id: nextRpcId(),
    method: 'message/stream',
    params,
  }

  const encoder = new TextEncoder()
  const url = getStreamUrl(agentCard)

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
            ...authHeaders(options?.bearerToken),
          },
          body: JSON.stringify(rpcRequest),
          signal: AbortSignal.timeout(300_000), // 5 minute timeout for streaming
        })

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error')
          controller.enqueue(encoder.encode(`Error: A2A stream failed (${response.status}): ${errorText}`))
          controller.close()
          return
        }

        const reader = response.body?.getReader()
        if (!reader) {
          controller.enqueue(encoder.encode('Error: No response body from A2A agent'))
          controller.close()
          return
        }

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          // Parse SSE events from the buffer
          const lines = buffer.split('\n')
          buffer = lines.pop() || '' // Keep incomplete line in buffer

          let eventType = ''
          let dataBuffer = ''

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim()
            } else if (line.startsWith('data: ')) {
              dataBuffer += line.slice(6)
            } else if (line === '' && dataBuffer) {
              // End of SSE event — process the data
              try {
                const parsed = JSON.parse(dataBuffer)
                const textChunk = extractTextFromStreamEvent(parsed, eventType)
                if (textChunk) {
                  // Agno sends true deltas — each Message event is a new chunk
                  controller.enqueue(encoder.encode(textChunk))
                }
              } catch {
                // Skip malformed JSON
              }
              dataBuffer = ''
              eventType = ''
            }
          }
        }

        // Process any remaining buffer
        if (buffer.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(buffer.slice(6))
            const textChunk = extractTextFromStreamEvent(parsed)
            if (textChunk) {
              controller.enqueue(encoder.encode(textChunk))
            }
          } catch {
            // Skip
          }
        }

        controller.close()
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        controller.enqueue(encoder.encode(`\n\nError: ${errorMsg}`))
        controller.close()
      }
    },
  })
}

/**
 * Extract text content from an A2A stream event.
 *
 * Handles multiple event formats:
 * - Agno-style `Message` events: result.parts directly (each event is a delta)
 * - Standard A2A status updates: result.status.message.parts
 * - Artifact updates: result.artifact.parts
 * - Task events are skipped (final summary, not deltas)
 */
function extractTextFromStreamEvent(event: Record<string, unknown>, eventType?: string): string | null {
  const result = event.result as Record<string, unknown> | undefined
  if (!result) {
    // Could be an error response
    const error = event.error as { message?: string } | undefined
    if (error?.message) return `Error: ${error.message}`
    return null
  }

  // Skip Task events (final summary with full history — not deltas)
  if (eventType === 'Task') return null

  // Skip status-only updates (working, completed, etc. without text)
  if (eventType === 'TaskStatusUpdateEvent') {
    const status = result.status as A2ATaskStatus | undefined
    if (status?.message?.parts) {
      return extractTextFromParts(status.message.parts)
    }
    return null
  }

  // Agno-style Message events: result has parts directly (delta chunks)
  if (result.kind === 'message' && result.parts) {
    return extractTextFromParts(result.parts as A2APart[])
  }

  // Standard A2A status update with nested message
  const status = result.status as A2ATaskStatus | undefined
  if (status?.message?.parts) {
    return extractTextFromParts(status.message.parts)
  }

  // Artifact update
  const artifact = result.artifact as A2AArtifact | undefined
  if (artifact?.parts) {
    return extractTextFromParts(artifact.parts)
  }

  return null
}

/**
 * Extract text from A2A parts array.
 */
function extractTextFromParts(parts: A2APart[]): string | null {
  const textParts = parts.filter((p): p is A2ATextPart => p.kind === 'text')
  if (textParts.length === 0) return null
  return textParts.map((p) => p.text).join('')
}

/**
 * Extract the final text response from a completed A2A Task.
 */
export function extractTaskResponse(task: A2ATask): string {
  // First try artifacts
  if (task.artifacts?.length) {
    const texts: string[] = []
    for (const artifact of task.artifacts) {
      const text = extractTextFromParts(artifact.parts)
      if (text) texts.push(text)
    }
    if (texts.length > 0) return texts.join('\n\n')
  }

  // Fall back to status message
  if (task.status.message?.parts) {
    const text = extractTextFromParts(task.status.message.parts)
    if (text) return text
  }

  // Fall back to history
  if (task.history?.length) {
    const lastAgentMsg = [...task.history].reverse().find((m) => m.role === 'agent')
    if (lastAgentMsg) {
      const text = extractTextFromParts(lastAgentMsg.parts)
      if (text) return text
    }
  }

  return ''
}

/**
 * Check whether an Agent Card supports streaming.
 */
export function supportsStreaming(card: A2AAgentCard): boolean {
  return card.capabilities?.streaming === true
}
