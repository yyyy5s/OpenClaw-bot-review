'use client'

import { useI18n } from '@/lib/i18n'

interface EditActionBarProps {
  isDirty: boolean
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onSave: () => void
  onReset: () => void
}

const barBtnStyle: React.CSSProperties = {
  padding: '4px 12px',
  fontSize: '12px',
  background: '#1f2937',
  color: 'rgba(243, 255, 230, 0.84)',
  border: '2px solid rgba(148, 163, 184, 0.28)',
  borderRadius: 0,
  cursor: 'pointer',
  boxShadow: 'inset 0 -2px 0 rgba(0, 0, 0, 0.22)',
}

const disabledBtnStyle: React.CSSProperties = {
  ...barBtnStyle,
  opacity: 0.3,
  cursor: 'default',
}

export function EditActionBar({ isDirty, canUndo, canRedo, onUndo, onRedo, onSave, onReset }: EditActionBarProps) {
  const { t } = useI18n()

  if (!isDirty && !canUndo && !canRedo) return null

  return (
    <div style={{
      position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 50,
      background: '#141722', border: '4px solid #0e1119', borderRadius: 0,
      padding: '6px 10px', display: 'flex', gap: 4,
      boxShadow: '0 0 0 2px rgba(100, 71, 125, 0.3), 0 12px 24px rgba(3, 6, 20, 0.3)',
    }}>
      <button style={canUndo ? barBtnStyle : disabledBtnStyle} onClick={onUndo} disabled={!canUndo} title="Ctrl+Z">
        {t('pixelOffice.undo')}
      </button>
      <button style={canRedo ? barBtnStyle : disabledBtnStyle} onClick={onRedo} disabled={!canRedo} title="Ctrl+Y">
        {t('pixelOffice.redo')}
      </button>
      {isDirty && (
        <>
          <button style={{ ...barBtnStyle, background: 'rgba(120, 163, 64, 0.2)', border: '2px solid rgba(143, 190, 74, 0.82)', color: '#f3ffe6' }} onClick={onSave}>
            {t('pixelOffice.save')}
          </button>
          <button style={barBtnStyle} onClick={onReset}>
            {t('pixelOffice.reset')}
          </button>
        </>
      )}
    </div>
  )
}
