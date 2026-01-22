import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { ChatHeader } from '@/components/chat/ChatHeader'
// Remove local Message definition
import { Message } from '@/types'

export default async function ChatPage({ params }: { params: Promise<{ chatId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  const { chatId } = await params

  const chat = await prisma.chat.findUnique({
    where: { id: chatId, userId: session.user.id },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!chat) {
    notFound()
  }

  // Pass messages directly (Prisma types should match mostly)
  // Casting to Message[] because Prisma might return slightly stricter types
  // or nullable fields that our Message type handles.
  // We avoid the map() to lowercase logic.
  const initialMessages = chat.messages as unknown as Message[]

  return (
    <div className="flex flex-col h-full w-full">
      <ChatHeader chatId={chatId} title={chat.title} />
      <ChatInterface chatId={chatId} initialMessages={initialMessages} />
    </div>
  )
}
