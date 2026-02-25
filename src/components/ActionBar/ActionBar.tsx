/**
 * 액션 바 컴포넌트
 * 하단 버튼 영역: URL 추가, 동기화
 */

import { useState, useMemo } from 'react';
import { useBookmarkStore } from '../../store/bookmarkStore';
import { BookmarkEditor } from '../BookmarkEditor/BookmarkEditor';
import type { BookmarkFolderList } from '../../types/bookmark';
import './ActionBar.css';

// 폴더 구조 평탄화 (Dropdown용)
const flattenFolders = (
  list: BookmarkFolderList,
  depth = 0,
  result: Array<{ id: string; name: string; level: number }> = []
) => {
  for (const item of list) {
    if ('folders' in item) {
      result.push({ id: item.id, name: item.name, level: depth });
      if (item.folders) {
        flattenFolders(item.folders, depth + 1, result);
      }
    }
  }
  return result;
};

export function ActionBar() {
  const { selectedIds, selectAll, deselectAll, createFolder, bookmarks } =
    useBookmarkStore();
  const [showEditor, setShowEditor] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [folderParentId, setFolderParentId] = useState('');

  const folderOptions = useMemo(() => flattenFolders(bookmarks), [bookmarks]);

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      alert('폴더 이름을 입력해주세요.');
      return;
    }
    await createFolder(folderName.trim(), folderParentId || undefined);
    setFolderName('');
    setFolderParentId('');
    setShowFolderModal(false);
  };

  return (
    <>
      <div className="action-bar">
        {/* 선택 버튼 */}
        <div className="action-bar-left">
          {selectedIds.size > 0 ? (
            <>
              <button className="btn btn-ghost" onClick={deselectAll}>
                선택 해제
              </button>
              <button 
                className="btn btn-ghost btn-danger" 
                onClick={async () => {
                  if (confirm(`선택한 ${selectedIds.size}개의 항목을 삭제하시겠습니까?`)) {
                    await useBookmarkStore.getState().deleteSelectedBookmarks();
                  }
                }}
                title="선택 항목 삭제"
                style={{ color: 'var(--error-color)' }}
              >
                삭제
              </button>
            </>
          ) : (
            <button className="btn btn-ghost" onClick={selectAll}>
              전체 선택
            </button>
          )}
        </div>

        {/* 메인 액션 */}
        <div className="action-bar-right">
          <button
            className="btn btn-ghost"
            onClick={() => setShowFolderModal(true)}
            title="폴더 생성"
          >
            📁 폴더
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setShowEditor(true)}
          >
            ➕ URL 추가
          </button>
        </div>
      </div>

      {/* 북마크 추가 모달 */}
      {showEditor && <BookmarkEditor onClose={() => setShowEditor(false)} />}

      {/* 폴더 생성 모달 */}
      {showFolderModal && (
        <div className="editor-overlay" onClick={() => setShowFolderModal(false)}>
          <div className="editor-modal" onClick={(e) => e.stopPropagation()}>
            <div className="editor-header">
              <h3 className="editor-title">폴더 생성</h3>
              <button className="editor-close" onClick={() => setShowFolderModal(false)}>
                ✕
              </button>
            </div>
            <div className="editor-form">
              <div className="editor-field">
                <label className="editor-label">폴더 이름</label>
                <input
                  type="text"
                  className="input"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="새 폴더"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateFolder();
                    }
                  }}
                />
              </div>
              <div className="editor-field">
                <label className="editor-label">위치</label>
                <select
                  className="input select"
                  value={folderParentId}
                  onChange={(e) => setFolderParentId(e.target.value)}
                >
                  <option value="">최상위 (루트)</option>
                  {folderOptions.map(folder => (
                    <option key={folder.id} value={folder.id}>
                      {'\u00A0\u00A0'.repeat(folder.level)}{folder.level > 0 ? '└ ' : ''}{folder.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="editor-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowFolderModal(false)}
                >
                  취소
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCreateFolder}
                >
                  생성
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
