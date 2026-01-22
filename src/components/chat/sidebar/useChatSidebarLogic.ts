'use client'

import { useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useChatStore } from '@/stores/chatStore'
import type { Agent } from '@/types'
import {
  useChats,
  useCreateChat,
  useUpdateChat,
  useDeleteChat,
  useUpdateChatFolder,
} from '@/hooks/useChats'
import { useFolders, useCreateFolder, useUpdateFolder, useDeleteFolder } from '@/hooks/useFolders'
import { useAgents, useCreateAgent, useUpdateAgent, useDeleteAgent } from '@/hooks/useAgents'

export type SidebarItemType = {
  type: 'chat' | 'folder' | 'agent'
  id: string
  name: string
}

export function useChatSidebarLogic() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()
  const activeChatId = params.chatId as string

  const {
    setChats,
    setFolders,
    setAgents,
    addChat,
    removeChat,
    updateChat,
    addFolder,
    removeFolder,
    updateFolder,
    addAgent,
    updateAgent,
    removeAgent,
  } = useChatStore()

  const { data: chats = [], isLoading: chatsLoading } = useChats()
  const { data: folders = [], isLoading: foldersLoading } = useFolders()
  const { data: agents = [], isLoading: agentsLoading } = useAgents()

  const createChatMutation = useCreateChat()
  const updateChatMutation = useUpdateChat()
  const deleteChatMutation = useDeleteChat()
  const updateChatFolderMutation = useUpdateChatFolder()

  const createFolderMutation = useCreateFolder()
  const updateFolderMutation = useUpdateFolder()
  const deleteFolderMutation = useDeleteFolder()

  const createAgentMutation = useCreateAgent()
  const updateAgentMutation = useUpdateAgent()
  const deleteAgentMutation = useDeleteAgent()

  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<SidebarItemType | null>(null)

  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set())

  const [agentDialogOpen, setAgentDialogOpen] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [openAgents, setOpenAgents] = useState<Set<string>>(new Set())

  const handleNewChat = useCallback(
    async (agentId?: string) => {
      const existingEmptyChat = chats.find(
        (c) => c.title === 'New Chat' && (agentId ? c.agentId === agentId : !c.agentId) && !c.folderId
      )

      if (existingEmptyChat) {
        router.push(`/c/${existingEmptyChat.id}`)
        return
      }

      try {
        const newChat = await createChatMutation.mutateAsync({ title: 'New Chat', agentId })
        addChat(newChat)
        router.push(`/c/${newChat.id}`)
      } catch (error) {
        console.error('Failed to create chat', error)
      }
    },
    [chats, router, addChat, createChatMutation]
  )

  const handleNewFolder = useCallback(
    async (name: string) => {
      try {
        const newFolder = await createFolderMutation.mutateAsync(name)
        addFolder(newFolder)
        setNewFolderOpen(false)
      } catch (error) {
        console.error('Failed to create folder', error)
      }
    },
    [addFolder, createFolderMutation]
  )

  const handleAgentSubmit = useCallback(
    async (data: { name: string; description: string; instructions: string }) => {
      try {
        if (editingAgent) {
          const updated = await updateAgentMutation.mutateAsync({ id: editingAgent.id, data })
          updateAgent(editingAgent.id, updated)
        } else {
          const newAgent = await createAgentMutation.mutateAsync(data)
          addAgent(newAgent)
        }
        setEditingAgent(null)
        setAgentDialogOpen(false)
      } catch (error) {
        console.error('Failed to save agent', error)
      }
    },
    [editingAgent, updateAgentMutation, createAgentMutation, updateAgent, addAgent]
  )

  const handleDeleteAgent = useCallback(
    async (agentId: string) => {
      try {
        await deleteAgentMutation.mutateAsync(agentId)
        removeAgent(agentId)
        setDeleteOpen(false)
      } catch (error) {
        console.error('Failed to delete agent', error)
      }
    },
    [removeAgent, deleteAgentMutation]
  )

  const handleRenameConfirm = useCallback(
    async (newName: string) => {
      if (!selectedItem) return

      try {
        if (selectedItem.type === 'chat') {
          await updateChatMutation.mutateAsync({ id: selectedItem.id, data: { title: newName } })
          updateChat(selectedItem.id, { title: newName })
        } else {
          await updateFolderMutation.mutateAsync({ id: selectedItem.id, name: newName })
          updateFolder(selectedItem.id, { name: newName })
        }
        setRenameOpen(false)
      } catch (error) {
        console.error('Failed to rename item', error)
      }
    },
    [selectedItem, updateChatMutation, updateFolderMutation, updateChat, updateFolder]
  )

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedItem) return

    if (selectedItem.type === 'agent') {
      await handleDeleteAgent(selectedItem.id)
      return
    }

    try {
      if (selectedItem.type === 'chat') {
        await deleteChatMutation.mutateAsync(selectedItem.id)
        removeChat(selectedItem.id)
        if (activeChatId === selectedItem.id) {
          router.push('/')
        }
      } else {
        await deleteFolderMutation.mutateAsync(selectedItem.id)
        removeFolder(selectedItem.id)
      }
      setDeleteOpen(false)
    } catch (error) {
      console.error('Failed to delete item', error)
    }
  }, [selectedItem, handleDeleteAgent, deleteChatMutation, removeChat, activeChatId, router, deleteFolderMutation, removeFolder])

  const handleMoveToFolder = useCallback(
    async (chatId: string, folderId: string | null) => {
      try {
        await updateChatFolderMutation.mutateAsync({ chatId, folderId })
        updateChat(chatId, { folderId })
      } catch (error) {
        console.error('Failed to move chat', error)
      }
    },
    [updateChatFolderMutation, updateChat]
  )

  const toggleFolder = (folderId: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) next.delete(folderId)
      else next.add(folderId)
      return next
    })
  }

  const toggleAgent = (agentId: string) => {
    setOpenAgents((prev) => {
      const next = new Set(prev)
      if (next.has(agentId)) next.delete(agentId)
      else next.add(agentId)
      return next
    })
  }

  const prepareRename = (type: 'chat' | 'folder' | 'agent', id: string, name: string) => {
    setSelectedItem({ type, id, name })
    setRenameOpen(true)
  }

  const prepareDelete = (type: 'chat' | 'folder' | 'agent', id: string, name: string) => {
    setSelectedItem({ type, id, name })
    setDeleteOpen(true)
  }

  const prepareEditAgent = (agent: Agent) => {
    setEditingAgent(agent)
    setAgentDialogOpen(true)
  }

  return {
    state: {
      chats,
      folders,
      agents,
      session,
      activeChatId,
      renameOpen,
      deleteOpen,
      selectedItem,
      newFolderOpen,
      openFolders,
      agentDialogOpen,
      editingAgent,
      openAgents,
      isLoading: chatsLoading || foldersLoading || agentsLoading,
    },
    setters: {
      setRenameOpen,
      setDeleteOpen,
      setNewFolderOpen,
      setAgentDialogOpen,
      setEditingAgent,
    },
    actions: {
      handleNewChat,
      handleNewFolder,
      handleAgentSubmit,
      handleRenameConfirm,
      handleDeleteConfirm,
      handleMoveToFolder,
      toggleFolder,
      toggleAgent,
      prepareRename,
      prepareDelete,
      prepareEditAgent,
    },
  }
}
