'use client'

import React from 'react'
import {
  type TriageInfo,
  TRIAGE_CATEGORY_STYLES,
} from '@/lib/aiTriage'

export function TriageBadge({
  triage,
  variant = 'admin',
}: {
  triage: TriageInfo
  variant?: 'admin' | 'storefront'
}) {
  const style = TRIAGE_CATEGORY_STYLES[triage.category]
  const isStorefront = variant === 'storefront'

  return (
    <div
      style={{
        maxWidth: '85%',
        padding: '8px 12px',
        borderRadius: 8,
        background: style.bg,
        border: `1px solid ${style.border}`,
        fontSize: 11,
        lineHeight: 1.45,
        color: isStorefront ? style.color : style.color,
        marginBottom: 4,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4 }}>
        {triage.category}
        {triage.category === 'Contenu' && ' · exécutable'}
        {triage.category === 'Développement' && ' · plan uniquement'}
      </div>
      <div>
        <span style={{ fontWeight: 600 }}>À faire :</span> {triage.todo}
      </div>
      <div>
        <span style={{ fontWeight: 600 }}>Demande :</span> {triage.requires}
      </div>
    </div>
  )
}
