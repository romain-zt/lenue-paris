'use client'

import { useLivePreviewContext } from '@payloadcms/ui'
import React, { useEffect } from 'react'

interface BreakpointBarProps {
  onFullscreen: () => void
}

export const BreakpointBar: React.FC<BreakpointBarProps> = ({ onFullscreen }) => {
  const { breakpoint, breakpoints, setBreakpoint } = useLivePreviewContext()

  useEffect(() => {
    setBreakpoint('mobile')
  }, [setBreakpoint])

  const allBreakpoints = [
    { label: 'Responsive', name: 'responsive' },
    ...(breakpoints ?? []).filter((bp: { name: string; label?: string }) => bp.name !== 'responsive'),
  ]

  return (
    <div
      style={{
        alignItems: 'center',
        background: 'var(--theme-bg)',
        borderBottom: '1px solid var(--theme-elevation-100)',
        display: 'flex',
        flexShrink: 0,
        gap: 8,
        padding: '6px 12px',
      }}
    >
      <select
        onChange={(e) => setBreakpoint(e.target.value)}
        value={breakpoint ?? 'responsive'}
        style={{
          background: 'var(--theme-elevation-100)',
          border: 'none',
          borderRadius: 4,
          color: 'var(--theme-text)',
          cursor: 'pointer',
          fontSize: 12,
          padding: '4px 8px',
        }}
      >
        {allBreakpoints.map((bp) => (
          <option key={bp.name} value={bp.name}>
            {bp.label}
          </option>
        ))}
      </select>

      <span
        style={{
          color: 'var(--theme-elevation-500)',
          flex: 1,
          fontSize: 11,
        }}
      >
        Click any field in the preview to focus it in the form
      </span>

      <button
        type="button"
        title="Open fullscreen preview"
        onClick={onFullscreen}
        style={{
          alignItems: 'center',
          background: 'var(--theme-elevation-150)',
          border: 'none',
          borderRadius: 4,
          color: 'var(--theme-text)',
          cursor: 'pointer',
          display: 'flex',
          fontSize: 11,
          fontWeight: 600,
          gap: 5,
          height: 26,
          padding: '0 10px',
          userSelect: 'none',
        }}
      >
        ⛶ Full
      </button>
    </div>
  )
}
