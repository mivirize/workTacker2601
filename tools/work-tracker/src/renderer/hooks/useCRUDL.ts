import { useCallback } from 'react'
import { logError } from '../utils/logger'

export interface CRUDLApi<T, CreateT = Omit<T, 'id'>> {
  create: (data: CreateT) => Promise<T>
  update: (data: T) => Promise<T>
  delete: (id: number) => Promise<void>
}

export interface CRUDLHandlers<T, CreateT = Omit<T, 'id'>> {
  handleCreate: (data: CreateT) => Promise<void>
  handleUpdate: (data: T) => Promise<void>
  handleDelete: (id: number, confirmMessage?: string) => Promise<void>
}

export interface UseCRUDLOptions {
  entityName: string
  onSuccess?: () => void
  onCreateSuccess?: () => void
  onUpdateSuccess?: () => void
  onDeleteSuccess?: () => void
}

/**
 * Hook for standardized CRUD operations with error handling
 * Eliminates duplicate handler patterns across Settings, Timeline, etc.
 */
export function useCRUDL<T extends { id: number }, CreateT = Omit<T, 'id'>>(
  api: CRUDLApi<T, CreateT>,
  refetch: () => Promise<void>,
  options: UseCRUDLOptions
): CRUDLHandlers<T, CreateT> {
  const { entityName, onSuccess, onCreateSuccess, onUpdateSuccess, onDeleteSuccess } = options

  const handleCreate = useCallback(async (data: CreateT) => {
    try {
      await api.create(data)
      await refetch()
      onCreateSuccess?.()
      onSuccess?.()
    } catch (error) {
      logError(`Failed to create ${entityName}:`, error)
      throw error
    }
  }, [api, refetch, entityName, onCreateSuccess, onSuccess])

  const handleUpdate = useCallback(async (data: T) => {
    try {
      await api.update(data)
      await refetch()
      onUpdateSuccess?.()
      onSuccess?.()
    } catch (error) {
      logError(`Failed to update ${entityName}:`, error)
      throw error
    }
  }, [api, refetch, entityName, onUpdateSuccess, onSuccess])

  const handleDelete = useCallback(async (id: number, confirmMessage?: string) => {
    const message = confirmMessage ?? `この${entityName}を削除しますか？`
    if (!confirm(message)) return

    try {
      await api.delete(id)
      await refetch()
      onDeleteSuccess?.()
      onSuccess?.()
    } catch (error) {
      logError(`Failed to delete ${entityName}:`, error)
      throw error
    }
  }, [api, refetch, entityName, onDeleteSuccess, onSuccess])

  return {
    handleCreate,
    handleUpdate,
    handleDelete,
  }
}
