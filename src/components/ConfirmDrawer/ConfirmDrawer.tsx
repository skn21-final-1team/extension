/**
 * 확인 드로어 — confirm() 대체 커스텀 UI
 * 기존 drawer 스타일을 재사용하여 일관된 UX 제공
 */

import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDrawerProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDrawer({
  title,
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDrawerProps) {
  const isDanger = variant === 'danger';

  return (
    <div className="drawer-overlay" style={{ zIndex: 70 }} onClick={onCancel}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-grip" />
        <div className="drawer-head">
          <div
            className="drawer-head-icon"
            style={{
              background: isDanger ? 'rgba(248,113,113,0.15)' : 'rgba(96,165,250,0.15)',
            }}
          >
            <AlertTriangle
              size={12}
              style={{ color: isDanger ? 'var(--error-color)' : 'var(--accent-color)' }}
            />
          </div>
          <span className="drawer-head-title">{title}</span>
          <button className="drawer-close" onClick={onCancel}>
            <X size={14} />
          </button>
        </div>
        <div className="drawer-divider" />
        <div className="drawer-body">
          <p style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
            {message}
          </p>
        </div>
        <div className="drawer-footer">
          <button className="btn btn-secondary flex-1" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`btn flex-1 ${isDanger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
