'use client'

import React, { useEffect, useRef, useState, useTransition } from 'react'
import { updateLiveField } from '@/app/actions/liveEdit'

interface EditableFieldProps {
  collection: 'pages' | 'products'
  id: string
  field: string
  fieldLabel?: string
  currentValue: string
  locale?: string
  multiline?: boolean
  children: React.ReactNode
}

/**
 * Wraps a storefront element with inline click-to-edit capability.
 * Active only when admin-edit-mode CSS class is on <html>.
 * Zero overhead for regular shoppers — passthrough when not in edit mode.
 */
export function EditableField({
  collection,
  id,
  field,
  fieldLabel,
  currentValue,
  locale,
  multiline = false,
  children,
}: EditableFieldProps) {
  const [isEditModeActive, setIsEditModeActive] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(currentValue)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const check = () =>
      setIsEditModeActive(document.documentElement.classList.contains('admin-edit-mode'))
    check()

    const handle = (e: Event) => {
      setIsEditModeActive((e as CustomEvent<{ enabled: boolean }>).detail.enabled)
    }
    document.addEventListener('admin-edit-mode', handle)
    return () => document.removeEventListener('admin-edit-mode', handle)
  }, [])

  // Keep value in sync if the page reloads with fresh RSC data
  useEffect(() => {
    if (!isEditing) setValue(currentValue)
  }, [currentValue, isEditing])

  // Passthrough — zero cost for regular shoppers
  if (!isEditModeActive) return <>{children}</>

  const handleClick = () => {
    if (isEditing || isPending) return
    setSaved(false)
    setIsEditing(true)
    setTimeout(() => {
      textareaRef.current?.focus()
      textareaRef.current?.select()
    }, 0)
  }

  const handleSave = () => {
    setIsEditing(false)
    if (value.trim() !== currentValue.trim()) {
      startTransition(async () => {
        await updateLiveField({ collection, id, field, value, locale })
        setSaved(true)
        // Signal the FAB to show the "Recharger" hint
        window.dispatchEvent(
          new CustomEvent('lp:field-patched', { detail: { field, label: fieldLabel ?? field } }),
        )
      })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') {
      setIsEditing(false)
      setValue(currentValue)
    }
  }

  const label = fieldLabel ?? field

  return (
    <div
      data-lp-field={field}
      style={{ position: 'relative' }}
      title={isEditing ? undefined : `Cliquez pour modifier : ${label}`}
    >
      {/* Dashed outline hint */}
      {!isEditing && (
        <div
          aria-hidden
          style={{
            borderRadius: 3,
            bottom: -3,
            left: -4,
            outline: saved
              ? '2px solid rgba(34,197,94,0.5)'
              : '1.5px dashed rgba(99,102,241,0.4)',
            outlineOffset: 0,
            pointerEvents: 'none',
            position: 'absolute',
            right: -4,
            top: -3,
            transition: 'outline-color 0.2s',
            zIndex: 1,
          }}
        />
      )}

      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isPending}
          rows={Math.max(1, value.split('\n').length)}
          style={{
            background: 'rgba(99,102,241,0.06)',
            border: 'none',
            borderBottom: '2px solid rgba(99,102,241,0.7)',
            color: 'inherit',
            display: 'block',
            font: 'inherit',
            letterSpacing: 'inherit',
            lineHeight: 'inherit',
            margin: 0,
            minHeight: '1.4em',
            outline: 'none',
            padding: '2px 0',
            resize: 'none',
            width: '100%',
          }}
        />
      ) : (
        <div
          onClick={handleClick}
          style={{ cursor: 'text', position: 'relative', userSelect: 'none', zIndex: 2 }}
          aria-label={`Modifier : ${label}`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        >
          {children}
        </div>
      )}

      {isPending && (
        <span
          aria-hidden
          style={{
            bottom: -18,
            color: 'rgba(99,102,241,0.7)',
            fontSize: 10,
            fontFamily: 'system-ui, sans-serif',
            left: 0,
            position: 'absolute',
          }}
        >
          Enregistrement…
        </span>
      )}
    </div>
  )
}
