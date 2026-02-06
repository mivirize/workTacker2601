import { useState, useCallback } from 'react'

export interface ModalState<T> {
  isAdding: boolean
  editingItem: T | null
  openAdd: () => void
  openEdit: (item: T) => void
  close: () => void
}

/**
 * Hook for managing modal open/close state with add/edit modes
 * Reduces boilerplate for [isAdding, setIsAdding] + [editingItem, setEditingItem] patterns
 */
export function useModalState<T>(): ModalState<T> {
  const [isAdding, setIsAdding] = useState(false)
  const [editingItem, setEditingItem] = useState<T | null>(null)

  const openAdd = useCallback(() => {
    setIsAdding(true)
    setEditingItem(null)
  }, [])

  const openEdit = useCallback((item: T) => {
    setIsAdding(false)
    setEditingItem(item)
  }, [])

  const close = useCallback(() => {
    setIsAdding(false)
    setEditingItem(null)
  }, [])

  return {
    isAdding,
    editingItem,
    openAdd,
    openEdit,
    close,
  }
}
