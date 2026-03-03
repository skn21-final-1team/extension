/**
 * 액션 바 컴포넌트
 * 하단 버튼 영역: URL 추가, 폴더 생성, 전체 선택/삭제
 */

import { useState, useMemo } from 'react';
import { Pin, FolderPlus, Link2, X, AlertCircle, CheckSquare, Trash2 } from 'lucide-react';
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

const FolderSelectOption = ({ folder }: { folder: { id: string; name: string; level: number } }) => (
  <option value={folder.id}>
    {'\u00A0\u00A0'.repeat(folder.level)}{folder.level > 0 ? '└ ' : ''}{folder.name}
  </option>
);

export function ActionBar() {
  const { selectedIds, selectAll, deselectAll, createFolder, bookmarks, addBookmark } =
    useBookmarkStore();
  const [showEditor, setShowEditor] = useState(false);

  // 폴더 생성 모달
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [folderParentId, setFolderParentId] = useState('');
  const [folderError, setFolderError] = useState('');

  // 현재 탭 저장 모달
  const [showCurrentTabModal, setShowCurrentTabModal] = useState(false);
  const [currentTabInfo, setCurrentTabInfo] = useState<{ title: string; url: string } | null>(null);
  const [tabDestFolderId, setTabDestFolderId] = useState('');

  const folderOptions = useMemo(() => flattenFolders(bookmarks), [bookmarks]);

  // ── 현재 탭 저장 ──
  const openCurrentTabModal = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab?.url) {
        setCurrentTabInfo({ title: tab.title || tab.url, url: tab.url });
        setTabDestFolderId(folderOptions[0]?.id || '');
        setShowCurrentTabModal(true);
      }
    });
  };

  const saveCurrentTab = async () => {
    if (!currentTabInfo) return;
    await addBookmark(currentTabInfo.title, currentTabInfo.url, tabDestFolderId || undefined);
    setShowCurrentTabModal(false);
    setCurrentTabInfo(null);
  };

  // ── 폴더 생성 ──
  const openFolderModal = () => {
    setFolderName('');
    setFolderParentId('');
    setFolderError('');
    setShowFolderModal(true);
  };

  const closeFolderModal = () => {
    setShowFolderModal(false);
    setFolderError('');
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      setFolderError('폴더 이름을 입력해주세요.');
      return;
    }
    setFolderError('');
    await createFolder(folderName.trim(), folderParentId || undefined);
    setShowFolderModal(false);
  };

  return (
    <>
      <div className="action-bar">
        {/* 선택 버튼 */}
        <div className="action-bar-left">
          {selectedIds.size > 0 ? (
            <>
              <button
                className="action-icon-btn"
                onClick={deselectAll}
                title="선택 해제"
              >
                <X size={15} />
              </button>
              <button
                className="action-icon-btn action-icon-btn--danger"
                onClick={async () => {
                  if (confirm(`선택한 ${selectedIds.size}개의 항목을 삭제하시겠습니까?`)) {
                    await useBookmarkStore.getState().deleteSelectedBookmarks();
                  }
                }}
                title="선택 항목 삭제"
              >
                <Trash2 size={15} />
              </button>
            </>
          ) : (
            <button
              className="action-icon-btn"
              onClick={selectAll}
              title="전체 선택"
            >
              <CheckSquare size={15} />
            </button>
          )}
        </div>

        {/* 메인 액션 */}
        <div className="action-bar-right">
          <button
            className="action-icon-btn"
            onClick={openCurrentTabModal}
            title="현재 탭을 북마크에 저장"
          >
            <Pin size={15} />
          </button>
          <button
            className="action-icon-btn"
            onClick={openFolderModal}
            title="새 폴더 생성"
          >
            <FolderPlus size={15} />
          </button>
          <button
            className="action-icon-btn action-icon-btn--primary"
            onClick={() => setShowEditor(true)}
            title="URL 추가"
          >
            <Link2 size={15} />
          </button>
        </div>
      </div>

      {/* 북마크 추가 모달 */}
      {showEditor && <BookmarkEditor onClose={() => setShowEditor(false)} />}

      {/* ── 현재 탭 저장 모달 ── */}
      {showCurrentTabModal && currentTabInfo && (
        <div
          className="absolute inset-0 z-50 flex flex-col modal-overlay"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowCurrentTabModal(false)}
        >
          <div
            className="mt-auto w-full rounded-t-2xl overflow-hidden modal-sheet"
            style={{ background: 'var(--bg-elevated)', boxShadow: '0 -8px 40px rgba(0,0,0,0.5), 0 -1px 0 var(--border-default)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 드래그 핸들 */}
            <div className="flex justify-center pt-2.5 pb-0">
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)' }} />
            </div>
            {/* 헤더 */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(52, 211, 153, 0.15)' }}
                >
                  <Pin size={14} style={{ color: '#10b981' }} />
                </div>
                <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  현재 탭 저장
                </span>
              </div>
              <button
                className="w-7 h-7 rounded-md flex items-center justify-center"
                style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => setShowCurrentTabModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            {/* 본문 */}
            <div className="p-4 flex flex-col gap-3">
              {/* 탭 미리보기 */}
              <div
                className="rounded-xl p-3 flex flex-col gap-1"
                style={{ background: 'var(--bg-hover)' }}
              >
                <span
                  className="text-xs font-semibold"
                  style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
                >
                  {currentTabInfo.title || '제목 없음'}
                </span>
                <span
                  className="text-xs"
                  style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
                >
                  {currentTabInfo.url}
                </span>
              </div>

              {/* 폴더 선택 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  저장 폴더
                </label>
                <select
                  className="input"
                  value={tabDestFolderId}
                  onChange={(e) => setTabDestFolderId(e.target.value)}
                >
                  {folderOptions.length === 0 && <option value="">폴더 로딩 중...</option>}
                  {folderOptions.map((folder) => (
                    <FolderSelectOption key={folder.id} folder={folder} />
                  ))}
                </select>
              </div>

              {/* 버튼 */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  className="btn btn-secondary flex-1"
                  onClick={() => setShowCurrentTabModal(false)}
                >
                  취소
                </button>
                <button
                  type="button"
                  className="btn btn-primary flex-1"
                  onClick={saveCurrentTab}
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 폴더 생성 모달 ── */}
      {showFolderModal && (
        <div
          className="absolute inset-0 z-50 flex flex-col modal-overlay"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={closeFolderModal}
        >
          <div
            className="mt-auto w-full rounded-t-2xl overflow-hidden modal-sheet"
            style={{ background: 'var(--bg-elevated)', boxShadow: '0 -8px 40px rgba(0,0,0,0.5), 0 -1px 0 var(--border-default)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 드래그 핸들 */}
            <div className="flex justify-center pt-2.5 pb-0">
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)' }} />
            </div>
            {/* 헤더 */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(251, 191, 36, 0.15)' }}
                >
                  <FolderPlus size={14} style={{ color: '#f59e0b' }} />
                </div>
                <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  새 폴더 생성
                </span>
              </div>
              <button
                className="w-7 h-7 rounded-md flex items-center justify-center"
                style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={closeFolderModal}
              >
                <X size={16} />
              </button>
            </div>

            {/* 본문 */}
            <div className="p-4 flex flex-col gap-3">
              {folderError && (
                <div
                  className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(248, 113, 113, 0.1)', color: 'var(--error-color)' }}
                >
                  <AlertCircle size={12} style={{ flexShrink: 0 }} />
                  {folderError}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  폴더 이름
                </label>
                <input
                  type="text"
                  className="input"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="새 폴더 이름 입력"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateFolder();
                  }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  저장 위치
                </label>
                <select
                  className="input"
                  value={folderParentId}
                  onChange={(e) => setFolderParentId(e.target.value)}
                >
                  <option value="">최상위 (루트)</option>
                  {folderOptions.map((folder) => (
                    <FolderSelectOption key={folder.id} folder={folder} />
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  className="btn btn-secondary flex-1"
                  onClick={closeFolderModal}
                >
                  취소
                </button>
                <button
                  type="button"
                  className="btn btn-primary flex-1"
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
