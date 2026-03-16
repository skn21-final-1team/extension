/**
 * 확인 드로어 — confirm() 대체 커스텀 UI
 * 기존 drawer 스타일을 재사용하여 일관된 UX 제공
 */

import { AlertTriangle, X } from 'lucide-react'
import './ConfirmDrawer.css'

interface ConfirmDrawerProps {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmDrawer({
  title,
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDrawerProps) {
  const confirmBtnClass = `btn flex-1 ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`

  return (
    <div className="drawer-overlay confirm-drawer-overlay" onClick={onCancel}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-grip" />
        <div className="drawer-head">
          <div className={`drawer-head-icon confirm-drawer-icon--${variant}`}>
            <AlertTriangle size={12} />
          </div>
          <span className="drawer-head-title">{title}</span>
          <button className="drawer-close" onClick={onCancel}>
            <X size={14} />
          </button>
        </div>
        <div className="drawer-divider" />
        <div className="drawer-body">
          <p className="confirm-drawer-message">{message}</p>
        </div>
        <div className="drawer-footer">
          <button className="btn btn-secondary flex-1" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className={confirmBtnClass} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDrawer
