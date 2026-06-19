'use client'

import React, { useEffect, useLayoutEffect, useRef, useState, useTransition } from 'react'
import { updateLiveField } from '@/app/actions/liveEdit'
import { useAdminEditMode } from '@/hooks/useAdminEditMode'
import type { EditableCollection } from '@/lib/cms/editable'

interface EditableFieldProps {
  collection: EditableCollection
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
  const isEditModeActive = useAdminEditMode()
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(currentValue)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Keep value in sync if the page reloads with fresh RSC data
  useEffect(() => {
    if (!isEditing) setValue(currentValue)
  }, [currentValue, isEditing])

  // Auto-grow to full content height as soon as the textarea mounts —
  // prevents a clipped 3-row view on first tap before the user types anything.
  // Must be declared unconditionally (before any early return) — React Hooks rules.
  useLayoutEffect(() => {
    if (!isEditing || !textareaRef.current) return
    const t = textareaRef.current
    t.style.height = 'auto'
    t.style.height = t.scrollHeight + 'px'
    t.focus()
    t.select()
  }, [isEditing])

  // Passthrough — zero cost for regular shoppers
  if (!isEditModeActive) return <>{children}</>

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isEditing || isPending) return
    setSaved(false)
    setIsEditing(true)
  }

  const handleSave = () => {
    setIsEditing(false)
    if (value.trim() !== currentValue.trim()) {
      setSaveError(false)
      startTransition(async () => {
        try {
          await updateLiveField({ collection, id, field, value, locale })
          setSaved(true)
          // Signal the FAB to show the save strip with undo capability
          window.dispatchEvent(
            new CustomEvent('lp:field-patched', {
              detail: {
                field,
                label: fieldLabel ?? field,
                previousValue: currentValue,
                collection,
                id,
                locale,
              },
            }),
          )
        } catch {
          setSaveError(true)
          setValue(currentValue) // revert to original on error
          setTimeout(() => setSaveError(false), 3000)
        }
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
  // span/input = valid inside <p>/<h*>; div/textarea for multiline block fields only.
  const Wrapper = multiline ? 'div' : 'span'
  const ClickWrapper = multiline ? 'div' : 'span'
  const wrapperStyle: React.CSSProperties = multiline
    ? { display: 'block', position: 'relative', touchAction: 'manipulation' }
    : { display: 'inline', position: 'relative', touchAction: 'manipulation' }

  const outlineStyle: React.CSSProperties = {
    borderRadius: 3,
    outline: saved
      ? '2px solid rgba(34,197,94,0.5)'
      : '1.5px dashed rgba(99,102,241,0.4)',
    outlineOffset: 2,
    transition: 'outline-color 0.2s',
  }

  const sharedInputStyle: React.CSSProperties = {
    background: 'rgba(99,102,241,0.06)',
    border: 'none',
    borderBottom: '2px solid rgba(99,102,241,0.7)',
    color: 'inherit',
    font: 'inherit',
    // Minimum 16px prevents iOS auto-zoom on focus
    fontSize: 'max(16px, 1em)',
    letterSpacing: 'inherit',
    lineHeight: 'inherit',
    margin: 0,
    outline: 'none',
    padding: '4px 0',
    touchAction: 'manipulation',
    width: multiline ? '100%' : 'auto',
    minWidth: multiline ? undefined : '8ch',
  }

  return (
    <Wrapper
      data-lp-field={field}
      style={wrapperStyle}
      title={isEditing ? undefined : `Cliquez pour modifier : ${label}`}
    >
      {isEditing ? (
        multiline ? (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              const t = e.currentTarget
              t.style.height = 'auto'
              t.style.height = t.scrollHeight + 'px'
            }}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            disabled={isPending}
            rows={Math.max(3, value.split('\n').length)}
            style={{
              ...sharedInputStyle,
              display: 'block',
              minHeight: '5em',
              overflow: 'hidden',
              resize: 'none',
            }}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSave()
              }
              if (e.key === 'Escape') {
                setIsEditing(false)
                setValue(currentValue)
              }
            }}
            disabled={isPending}
            style={{
              ...sharedInputStyle,
              display: 'inline',
            }}
          />
        )
      ) : (
        <ClickWrapper
          onClick={handleClick}
          style={{
            ...outlineStyle,
            cursor: 'text',
            userSelect: 'none',
            ...(multiline ? { display: 'block' } : { display: 'inline' }),
          }}
          aria-label={`Modifier : ${label}`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleClick(e as unknown as React.MouseEvent<HTMLElement>)
            }
          }}
        >
          {children}
        </ClickWrapper>
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
      {saveError && (
        <span
          aria-live="polite"
          style={{
            bottom: -18,
            color: 'rgba(239,68,68,0.85)',
            fontSize: 10,
            fontFamily: 'system-ui, sans-serif',
            left: 0,
            position: 'absolute',
          }}
        >
          Échec — vérifiez votre connexion admin
        </span>
      )}
    </Wrapper>
  )
}
