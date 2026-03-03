/**
 * 액션 바 컴포넌트
 * 버튼 클릭 시 Sidebar 안의 FormPanel을 열어줌
 */

import { useMemo } from 'react';
import { Pin, FolderPlus, Link2, X, CheckSquare, Trash2 } from 'lucide-react';
import { useBookmarkStore } from '../../store/bookmarkStore';
import type { FormPanelType } from '../FormPanel/FormPanel';
import './ActionBar.css';

interface ActionBarProps {
  onOpenPanel: (type: FormPanelType) => void;
}

export function ActionBar({ onOpenPanel }: ActionBarProps) {
  const { selectedIds, selectedFolderIds, selectAll, deselectAll } = useBookmarkStore();

  const totalSelected = useMemo(
    () => selectedIds.size + selectedFolderIds.size,
    [selectedIds, selectedFolderIds]
  );

  return (
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
              onClick={async () => {
                if (confirm(`선택한 ${totalSelected}개를 삭제하시겠습니까?`)) {
                  await useBookmarkStore.getState().deleteSelectedBookmarks();
                }
              }}
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
  );
}
