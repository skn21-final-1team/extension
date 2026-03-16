/**
 * 액션 바 컴포넌트
 * 버튼 클릭 시 Sidebar 안의 FormPanel을 열어줌
 */

import { useState, useMemo } from 'react'
import { Pin, FolderPlus, Link2, X, CheckSquare, Trash2, Zap, Loader2, Check, AlertCircle } from 'lucide-react'
import { useBookmarkStore } from '../../store/bookmarkStore'
import ConfirmDrawer from '../ConfirmDrawer/ConfirmDrawer'
import type { FormPanelType } from '../FormPanel/FormPanel'
import type { QuickSaveFolder, QuickSaveStatus } from '../../hooks/useQuickSave'
import './ActionBar.css'

interface QuickSaveProps {
  folder: QuickSaveFolder | null
  status: QuickSaveStatus
  quickSave: () => void
}

interface ActionBarProps {
  onOpenPanel: (type: FormPanelType) => void
  quickSave: QuickSaveProps
  onOpenQuickSaveConfig: () => void
}

function ActionBar({ onOpenPanel, quickSave, onOpenQuickSaveConfig }: ActionBarProps) {
  const { selectedIds, selectedFolderIds, selectAll, deselectAll } = useBookmarkStore()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const totalSelected = useMemo(
    () => selectedIds.size + selectedFolderIds.size,
    [selectedIds, selectedFolderIds]
  )

  const qs = quickSave

  const renderQuickSaveBtn = () => {
    if (!qs.folder) {
      return (
        <button className="action-label-btn" onClick={onOpenQuickSaveConfig} title="빠른저장 폴더 설정">
          <Zap size={12} /> 빠른저장
        </button>
      )
    }
    switch (qs.status) {
      case 'saving':
        return (
          <button className="action-label-btn" disabled>
            <Loader2 size={12} className="animate-spin" /> 저장중...
          </button>
        )
      case 'success':
        return (
          <button className="action-label-btn action-label-btn--success" disabled>
            <Check size={12} /> 저장됨!
          </button>
        )
      case 'error':
        return (
          <button className="action-label-btn action-label-btn--error" disabled>
            <AlertCircle size={12} /> 실패
          </button>
        )
      default:
        return (
          <button
            className="action-label-btn"
            onClick={qs.quickSave}
            onContextMenu={(e) => { e.preventDefault(); onOpenQuickSaveConfig() }}
            title={`빠른저장 → ${qs.folder.name} (우클릭: 설정변경)`}
          >
            <Zap size={12} /> 빠른저장
          </button>
        )
    }
  }

  return (
    <>
      <div className="action-bar">
        <div className="action-bar-left">
          {totalSelected > 0 ? (
            <>
              <span className="action-count">{totalSelected}개</span>
              <button className="action-icon-btn" onClick={deselectAll} title="선택 해제">
                <X size={14} />
              </button>
              <button
                className="action-icon-btn action-icon-btn--danger"
                title="선택 항목 삭제"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 size={14} />
              </button>
            </>
          ) : (
            <button className="action-icon-btn" onClick={selectAll} title="전체 선택">
              <CheckSquare size={14} />
            </button>
          )}
        </div>

        <div className="action-bar-right">
          {renderQuickSaveBtn()}
          <button className="action-label-btn" onClick={() => onOpenPanel('saveTab')} title="현재 탭 저장">
            <Pin size={12} /> 현재탭
          </button>
          <button className="action-label-btn" onClick={() => onOpenPanel('folder')} title="새 폴더 생성">
            <FolderPlus size={12} /> 폴더
          </button>
          <button className="action-label-btn action-label-btn--primary" onClick={() => onOpenPanel('addUrl')} title="URL 추가">
            <Link2 size={12} /> URL 추가
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmDrawer
          title="선택 항목 삭제"
          message={`선택한 ${totalSelected}개 항목을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
          confirmLabel="삭제"
          variant="danger"
          onConfirm={async () => {
            setShowDeleteConfirm(false)
            await useBookmarkStore.getState().deleteSelectedBookmarks()
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  )
}

export default ActionBar
