'use client'

import { useRouter } from 'next/navigation'
import { MoreHorizontal, Pencil, Trash2, FolderIcon, MessageSquare } from 'lucide-react'
import { SidebarMenuItem, SidebarMenuButton, SidebarMenuAction } from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { Chat, Folder } from '@/types'

interface SidebarItemProps {
  chat: Chat
  isActive: boolean
  folders: Folder[]
  onRename: (chat: Chat) => void
  onDelete: (chat: Chat) => void
  onMoveToFolder: (chatId: string, folderId: string | null) => void
}

export function SidebarItem({ chat, isActive, folders, onRename, onDelete, onMoveToFolder }: SidebarItemProps) {
  const router = useRouter()

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <SidebarMenuItem>
          <SidebarMenuButton
            isActive={isActive}
            onClick={() => router.push(`/c/${chat.id}`)}
            className="group/item pr-8"
          >
            <MessageSquare className="h-4 w-4 shrink-0" />
            <span className="truncate">{chat.title}</span>
          </SidebarMenuButton>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuAction className="opacity-0 group-hover/item:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </SidebarMenuAction>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start">
              <DropdownMenuItem onClick={() => onRename(chat)}>
                <Pencil className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {folders.length > 0 && (
                <>
                  <DropdownMenuItem className="text-muted-foreground text-xs" disabled>
                    Move to folder
                  </DropdownMenuItem>
                  {folders.map((folder) => (
                    <DropdownMenuItem key={folder.id} onClick={() => onMoveToFolder(chat.id, folder.id)}>
                      <FolderIcon className="mr-2 h-4 w-4" />
                      {folder.name}
                    </DropdownMenuItem>
                  ))}
                  {chat.folderId && (
                    <DropdownMenuItem onClick={() => onMoveToFolder(chat.id, null)}>
                      <FolderIcon className="mr-2 h-4 w-4" />
                      Remove from folder
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={() => onDelete(chat)} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onRename(chat)}>
          <Pencil className="mr-2 h-4 w-4" />
          Rename
        </ContextMenuItem>
        {folders.length > 0 && (
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <FolderIcon className="mr-2 h-4 w-4" />
              Move to folder
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              {folders.map((folder) => (
                <ContextMenuItem key={folder.id} onClick={() => onMoveToFolder(chat.id, folder.id)}>
                  {folder.name}
                </ContextMenuItem>
              ))}
              {chat.folderId && (
                <>
                  <ContextMenuSeparator />
                  <ContextMenuItem onClick={() => onMoveToFolder(chat.id, null)}>Remove from folder</ContextMenuItem>
                </>
              )}
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => onDelete(chat)} className="text-destructive focus:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
