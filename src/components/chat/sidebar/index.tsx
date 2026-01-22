'use client'

import {
  Plus,
  LogOut,
  User as UserIcon,
  ChevronUp,
  ChevronRight,
  FolderIcon,
  FolderOpen,
  FolderPlus,
  Sparkles,
  Pencil,
  Trash2,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { RenameDialog } from '../RenameDialog'
import { AgentDialog } from '../AgentDialog'
import { DeleteConfirmDialog } from '../DeleteConfirmDialog'

import { useChatSidebarLogic } from './useChatSidebarLogic'
import { SidebarItem } from './SidebarItem'

export function ChatSidebar() {
  const { state, setters, actions } = useChatSidebarLogic()

  // Get chats not in any folder and not assigned to an agent
  const unorganizedChats = state.chats.filter((chat) => !chat.folderId && !chat.agentId)

  return (
    <>
      <Sidebar className="border-r border-border/50">
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Chat
            </span>
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <Button onClick={() => actions.handleNewChat()} className="w-full justify-start gap-2" variant="outline">
                <Plus className="h-4 w-4" />
                New Chat
              </Button>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="px-2">
          {/* Agents Header */}
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel className="flex items-center justify-between px-2">
              <span>Agents</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  setters.setEditingAgent(null)
                  setters.setAgentDialogOpen(true)
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </SidebarGroupLabel>
          </SidebarGroup>

          {/* Agents List */}
          {(state.agents || []).map((agent) => {
            const agentChats = state.chats.filter((c) => c.agentId === agent.id)
            const isOpen = state.openAgents.has(agent.id)

            return (
              <Collapsible key={agent.id} open={isOpen} onOpenChange={() => actions.toggleAgent(agent.id)}>
                <SidebarGroup className="py-0">
                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <CollapsibleTrigger asChild>
                        <SidebarGroupLabel className="cursor-pointer hover:bg-accent/50 rounded-md transition-colors group/folder px-2 h-9">
                          <Sparkles className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span className="flex-1 truncate">{agent.name}</span>
                          <span className="text-xs text-muted-foreground mr-2">{agentChats.length}</span>
                          <ChevronRight
                            className={`h-4 w-4 text-muted-foreground transition-transform ${
                              isOpen ? 'rotate-90' : ''
                            }`}
                          />
                        </SidebarGroupLabel>
                      </CollapsibleTrigger>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => actions.handleNewChat(agent.id)}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Chat
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem onClick={() => actions.prepareEditAgent(agent)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Agent
                      </ContextMenuItem>
                      <ContextMenuItem
                        onClick={() => actions.prepareDelete('agent', agent.id, agent.name)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Agent
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu className="pl-4">
                        {agentChats.map((chat) => (
                          <SidebarItem
                            key={chat.id}
                            chat={chat}
                            isActive={state.activeChatId === chat.id}
                            folders={state.folders}
                            onRename={(c) => actions.prepareRename('chat', c.id, c.title)}
                            onDelete={(c) => actions.prepareDelete('chat', c.id, c.title)}
                            onMoveToFolder={actions.handleMoveToFolder}
                          />
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            )
          })}

          {/* Folders */}
          {state.folders.map((folder) => {
            const folderChats = state.chats.filter((c) => c.folderId === folder.id)
            const isOpen = state.openFolders.has(folder.id)

            return (
              <Collapsible key={folder.id} open={isOpen} onOpenChange={() => actions.toggleFolder(folder.id)}>
                <SidebarGroup className="py-0">
                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <CollapsibleTrigger asChild>
                        <SidebarGroupLabel className="cursor-pointer hover:bg-accent/50 rounded-md transition-colors group/folder px-2 h-9">
                          {isOpen ? (
                            <FolderOpen className="mr-2 h-4 w-4 text-muted-foreground" />
                          ) : (
                            <FolderIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="flex-1 truncate">{folder.name}</span>
                          <span className="text-xs text-muted-foreground mr-2">{folderChats.length}</span>
                          <ChevronRight
                            className={`h-4 w-4 text-muted-foreground transition-transform ${
                              isOpen ? 'rotate-90' : ''
                            }`}
                          />
                        </SidebarGroupLabel>
                      </CollapsibleTrigger>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => actions.prepareRename('folder', folder.id, folder.name)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Rename
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem
                        onClick={() => actions.prepareDelete('folder', folder.id, folder.name)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu className="pl-4">
                        {folderChats.map((chat) => (
                          <SidebarItem
                            key={chat.id}
                            chat={chat}
                            isActive={state.activeChatId === chat.id}
                            folders={state.folders}
                            onRename={(c) => actions.prepareRename('chat', c.id, c.title)}
                            onDelete={(c) => actions.prepareDelete('chat', c.id, c.title)}
                            onMoveToFolder={actions.handleMoveToFolder}
                          />
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            )
          })}

          {/* Unorganized chats */}
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between px-2">
              <span>Chats</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setters.setNewFolderOpen(true)}>
                <FolderPlus className="h-4 w-4" />
              </Button>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {unorganizedChats.map((chat) => (
                  <SidebarItem
                    key={chat.id}
                    chat={chat}
                    isActive={state.activeChatId === chat.id}
                    folders={state.folders}
                    onRename={(c) => actions.prepareRename('chat', c.id, c.title)}
                    onDelete={(c) => actions.prepareDelete('chat', c.id, c.title)}
                    onMoveToFolder={actions.handleMoveToFolder}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-2 border-t border-border/50">
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center gap-2 px-2">
                <ThemeToggle />
                <div className="flex-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton className="h-10 flex-1">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={state.session?.user?.image || ''} />
                          <AvatarFallback>
                            <UserIcon className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start ml-2 text-xs flex-1 min-w-0">
                          <span className="font-medium truncate">{state.session?.user?.name || 'User'}</span>
                          <span className="text-muted-foreground truncate">{state.session?.user?.email}</span>
                        </div>
                        <ChevronUp className="ml-auto h-4 w-4 shrink-0" />
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width]">
                      <DropdownMenuItem onClick={() => signOut()}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Dialogs */}
      <RenameDialog
        open={state.renameOpen}
        onOpenChange={setters.setRenameOpen}
        currentName={state.selectedItem?.name || ''}
        onRename={actions.handleRenameConfirm}
        type={state.selectedItem?.type && state.selectedItem.type !== 'agent' ? state.selectedItem.type : 'chat'}
      />

      <DeleteConfirmDialog
        open={state.deleteOpen}
        onOpenChange={setters.setDeleteOpen}
        itemName={state.selectedItem?.name || ''}
        onConfirm={actions.handleDeleteConfirm}
        type={state.selectedItem?.type === 'agent' ? 'chat' : state.selectedItem?.type || 'chat'}
      />

      <RenameDialog
        open={state.newFolderOpen}
        onOpenChange={setters.setNewFolderOpen}
        currentName=""
        onRename={actions.handleNewFolder}
        type="folder"
      />

      <AgentDialog
        open={state.agentDialogOpen}
        onOpenChange={setters.setAgentDialogOpen}
        onSubmit={actions.handleAgentSubmit}
        initialData={
          state.editingAgent
            ? {
                ...state.editingAgent,
                description: state.editingAgent.description || '',
              }
            : undefined
        }
      />
    </>
  )
}
