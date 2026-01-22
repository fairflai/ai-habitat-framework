import {
  type Message as PrismaMessage,
  type Chat as PrismaChat,
  type User as PrismaUser,
  type Vote as PrismaVote,
  type Folder as PrismaFolder,
  type Agent as PrismaAgent,
  Visibility,
  MessageRole,
} from '@prisma/client'

export type { Visibility, MessageRole }

export interface User extends PrismaUser {
  agents?: Agent[]
}

export interface Agent extends PrismaAgent {
  // any frontend-specific extensions?
}

export interface Folder extends PrismaFolder {
  chats?: Chat[]
}

export interface Chat extends PrismaChat {
  messages?: Message[]
  votes?: Vote[]
  folder?: Folder | null
  agent?: Agent | null
}

export interface Message extends PrismaMessage {
  votes?: Vote[]
  // Optimistic UI fields
  pending?: boolean
}

export interface Vote extends PrismaVote {}

export type Tools = {
  webSearch: boolean
  deepReasoning: boolean
}
