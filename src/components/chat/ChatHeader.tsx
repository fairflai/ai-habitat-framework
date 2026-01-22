'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { RenameDialog } from './RenameDialog'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { useChatStore } from '@/stores/chatStore'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useUpdateChat, useDeleteChat } from '@/hooks/useChats'

interface ChatHeaderProps {
  chatId: string
  title: string
}

export function ChatHeader({ chatId, title }: ChatHeaderProps) {
  const router = useRouter()
  const { updateChat, removeChat } = useChatStore()
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [currentTitle, setCurrentTitle] = useState(title)

  const updateChatMutation = useUpdateChat()
  const deleteChatMutation = useDeleteChat()

  const handleRename = async (newTitle: string) => {
    try {
      await updateChatMutation.mutateAsync({ id: chatId, data: { title: newTitle } })
      setCurrentTitle(newTitle)
      updateChat(chatId, { title: newTitle })
      setRenameOpen(false)
    } catch (error) {
      console.error('Failed to rename chat', error)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteChatMutation.mutateAsync(chatId)
      removeChat(chatId)
      router.push('/')
    } catch (error) {
      console.error('Failed to delete chat', error)
    }
  }

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/50 px-4 bg-background/80 backdrop-blur-sm">
        <SidebarTrigger className="mr-2" />
        <h1 className="text-base font-medium truncate flex-1">{currentTitle}</h1>
        <div className="flex items-center gap-1">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setRenameOpen(true)}
                  disabled={updateChatMutation.isPending}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rename</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                  disabled={deleteChatMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </header>

      <RenameDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        currentName={currentTitle}
        onRename={handleRename}
        type="chat"
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemName={currentTitle}
        onConfirm={handleDelete}
        type="chat"
      />
    </>
  )
}
