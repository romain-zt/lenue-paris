'use client'

import React, { useState } from 'react'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface FABMenuItemProps {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  primary?: boolean
}

const FABMenuItem: React.FC<FABMenuItemProps> = ({ children, onClick, disabled, primary }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    style={{
      background: primary ? '#6366f1' : 'transparent',
      border: 'none',
      borderRadius: 7,
      color: '#fff',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: 12,
      fontWeight: primary ? 600 : 400,
      opacity: disabled ? 0.5 : 1,
      padding: '8px 10px',
      textAlign: 'left',
      transition: 'background 0.12s',
      width: '100%',
    }}
    onMouseEnter={(e) => {
      if (!primary && !disabled)
        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)'
    }}
    onMouseLeave={(e) => {
      if (!primary)
        (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
    }}
  >
    {children}
  </button>
)

interface FABProps {
  locale: string
  onSave: () => void
  onPublish: () => void
  onExit: () => void
  isSaving: boolean
  saveStatus: SaveStatus
  selectedField?: string | null
  onAI?: (fieldPath?: string) => void
}

export const FAB: React.FC<FABProps> = ({ locale, onSave, onPublish, onExit, isSaving, saveStatus, selectedField, onAI }) => {
  const [open, setOpen] = useState(false)

  const statusColor =
    saveStatus === 'saved' ? '#22c55e' : saveStatus === 'error' ? '#ef4444' : 'rgba(255,255,255,0.5)'
  const statusLabel =
    saveStatus === 'saving' ? 'Saving…'
    : saveStatus === 'saved' ? '✓ Saved'
    : saveStatus === 'error' ? 'Save failed'
    : null

  return (
    <div style={{ bottom: 20, position: 'absolute', right: 20, zIndex: 50 }}>
      {open && (
        <div
          style={{
            background: 'rgba(12,12,12,0.94)',
            backdropFilter: 'blur(14px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            bottom: 60,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            minWidth: 168,
            padding: 8,
            position: 'absolute',
            right: 0,
          }}
        >
          <div style={{ alignItems: 'center', display: 'flex', gap: 6, padding: '4px 6px' }}>
            <span
              style={{
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 4,
                color: 'rgba(255,255,255,0.5)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.07em',
                padding: '2px 6px',
                textTransform: 'uppercase',
              }}
            >
              {locale}
            </span>
            {statusLabel && (
              <span style={{ color: statusColor, fontSize: 11 }}>{statusLabel}</span>
            )}
          </div>

          <div style={{ background: 'rgba(255,255,255,0.06)', height: 1, margin: '2px 0' }} />

          {onAI && (
            <>
              <FABMenuItem
                onClick={() => { onAI(selectedField ?? undefined); setOpen(false) }}
                primary
              >
                ✦ {selectedField ? 'Modifier avec l\'IA' : 'Assistant IA'}
              </FABMenuItem>
              <div style={{ background: 'rgba(255,255,255,0.06)', height: 1, margin: '2px 0' }} />
            </>
          )}

          <FABMenuItem onClick={() => { onSave(); setOpen(false) }} disabled={isSaving}>
            Save draft
          </FABMenuItem>
          <FABMenuItem onClick={() => { onPublish(); setOpen(false) }} disabled={isSaving}>
            Publish
          </FABMenuItem>

          <div style={{ background: 'rgba(255,255,255,0.06)', height: 1, margin: '2px 0' }} />

          <FABMenuItem onClick={onExit}>✕ Exit fullscreen</FABMenuItem>
        </div>
      )}

      <button
        type="button"
        title={open ? 'Close menu' : 'Preview menu'}
        onClick={() => setOpen((v) => !v)}
        style={{
          alignItems: 'center',
          background: open ? 'rgba(255,255,255,0.15)' : 'rgba(12,12,12,0.88)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '50%',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          fontSize: 18,
          height: 48,
          justifyContent: 'center',
          transition: 'background 0.15s',
          userSelect: 'none',
          width: 48,
        }}
      >
        {open ? '✕' : '⚙'}
      </button>
    </div>
  )
}
