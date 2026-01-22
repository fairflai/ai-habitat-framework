import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Folder } from '@/types'

async function fetchFolders(): Promise<Folder[]> {
  const res = await fetch('/api/folders')
  if (!res.ok) throw new Error('Failed to fetch folders')
  return res.json()
}

async function createFolder(name: string): Promise<Folder> {
  const res = await fetch('/api/folders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error('Failed to create folder')
  return res.json()
}

async function updateFolder({ id, name }: { id: string; name: string }): Promise<Folder> {
  const res = await fetch(`/api/folders/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error('Failed to update folder')
  return res.json()
}

async function deleteFolder(id: string): Promise<void> {
  const res = await fetch(`/api/folders/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete folder')
}

export function useFolders() {
  return useQuery({
    queryKey: ['folders'],
    queryFn: fetchFolders,
  })
}

export function useCreateFolder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] })
    },
  })
}

export function useUpdateFolder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateFolder,
    onSuccess: (updatedFolder) => {
      queryClient.invalidateQueries({ queryKey: ['folders'] })
      queryClient.setQueryData(['folders'], (old: Folder[] | undefined) => {
        if (!old) return [updatedFolder]
        return old.map((folder) => (folder.id === updatedFolder.id ? updatedFolder : folder))
      })
    },
  })
}

export function useDeleteFolder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] })
      queryClient.invalidateQueries({ queryKey: ['chats'] })
    },
  })
}