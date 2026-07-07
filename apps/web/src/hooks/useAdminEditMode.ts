'use client'

import { useSyncExternalStore } from 'react'

function getSnapshot(): boolean {
  return document.documentElement.classList.contains('admin-edit-mode')
}

function getServerSnapshot(): boolean {
  return false
}

function subscribe(onStoreChange: () => void): () => void {
  const onEditModeEvent = () => onStoreChange()

  document.addEventListener('admin-edit-mode', onEditModeEvent)

  const observer = new MutationObserver(onStoreChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })

  return () => {
    document.removeEventListener('admin-edit-mode', onEditModeEvent)
    observer.disconnect()
  }
}

/** True when the public FAB has enabled inline edit mode (`admin-edit-mode` on `<html>`). */
export function useAdminEditMode(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
