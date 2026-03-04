/**
 * 사이드바 컴포넌트 — 검색, 폴더 트리, 액션 버튼 포함
 * 메인 화면 전체를 차지하는 핵심 UI
 */

import { useState, useEffect, useCallback } from 'react';
import { useBookmarkStore } from '../../store/bookmarkStore';
import { SearchBar } from '../SearchBar/SearchBar';
import { FolderTree } from '../FolderTree/FolderTree';
import { ActionBar } from '../ActionBar/ActionBar';
import { FormPanel, type FormPanelType } from '../FormPanel/FormPanel';
import { Settings } from '../Settings/Settings';
import { Icons } from '../Icons/Icons';
import { useQuickSave } from '../../hooks/useQuickSave';
import './Sidebar.css';

// 서버 동기화 기능 활성화 여부
const ENABLE_SYNC = import.meta.env.VITE_ENABLE_SYNC === 'true';

// 폼 열릴 때 트리 높이를 줄여 팝업 전체 높이를 유지
const TREE_HEIGHT_NORMAL = 'var(--tree-max-height)'; // 420px
const TREE_HEIGHT_WITH_FORM = '220px';
const TREE_HEIGHT_WITH_SETTINGS = '150px';

interface SidebarProps {
  isSettingsOpen: boolean;
  onCloseSettings: () => void;
}

export function Sidebar({ isSettingsOpen, onCloseSettings }: SidebarProps) {
  const { bookmarks, syncProgress, isLoading, expandAll, collapseAll } = useBookmarkStore();
  const [activeForm, setActiveForm] = useState<FormPanelType | null>(null);
  const [defaultFolderId, setDefaultFolderId] = useState<string | undefined>();
  const { folder: qsFolder, status: qsStatus, saveFolder: qsSaveFolder, clearFolder: qsClearFolder, quickSave: qsQuickSave } = useQuickSave();

  // Settings가 열리면 열려 있던 폼 닫기
  useEffect(() => {
    if (isSettingsOpen) setActiveForm(null);
  }, [isSettingsOpen]);

  // FolderTree에서 + 버튼 클릭 시 addUrl 폼 열기
  const handleOpenAddUrl = useCallback((e: Event) => {
    const folderId = (e as CustomEvent).detail?.folderId;
    onCloseSettings();
    setDefaultFolderId(folderId);
    setActiveForm('addUrl');
  }, [onCloseSettings]);

  useEffect(() => {
    window.addEventListener('openAddUrl', handleOpenAddUrl);
    return () => window.removeEventListener('openAddUrl', handleOpenAddUrl);
  }, [handleOpenAddUrl]);

  const openForm = async (type: FormPanelType) => {
    onCloseSettings(); // 폼 열 때 Settings 닫기
    setDefaultFolderId(undefined); // 기본 폴더 초기화
    if (type === 'saveTab') {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.url) return;
        await chrome.storage.local.set({
          formTabData: { title: tab.title || tab.url, url: tab.url, favIconUrl: tab.favIconUrl },
        });
      } catch {
        // 탭 정보 저장 실패 시에도 폼은 열림
      }
    }
    setActiveForm(type);
  };

  const closeForm = () => {
    setActiveForm(null);
    setDefaultFolderId(undefined);
  };

  const treeHeight = isSettingsOpen
    ? TREE_HEIGHT_WITH_SETTINGS
    : activeForm
    ? TREE_HEIGHT_WITH_FORM
    : TREE_HEIGHT_NORMAL;

  return (
    <div className="flex flex-col">
      {/* 검색바 + 접기/펼치기 통합 행 */}
      <SearchBar onCollapseAll={collapseAll} onExpandAll={expandAll} />

      {/* 북마크 트리 — 폼/설정 열릴 때 높이 축소, 항상 스크롤 가능 */}
      <div className="sidebar-tree" style={{ maxHeight: treeHeight }}>
        {bookmarks.length === 0 ? (
          <div className="sidebar-empty">
            <span className="sidebar-empty-icon">
              <Icons.EmptyBox />
            </span>
            <p className="text-xs">북마크가 없습니다</p>
          </div>
        ) : (
          <FolderTree items={bookmarks} isRoot={true} />
        )}
      </div>

      {/* 동기화 진행률 (선택적 표시) */}
      {ENABLE_SYNC && isLoading && syncProgress > 0 && (
        <div className="sidebar-progress">
          <div className="sidebar-progress-bar" style={{ width: `${syncProgress}%` }} />
        </div>
      )}

      {/* 하단 액션 바 */}
      <ActionBar
        onOpenPanel={openForm}
        quickSave={{ folder: qsFolder, status: qsStatus, quickSave: qsQuickSave }}
        onOpenQuickSaveConfig={() => openForm('quickSaveConfig')}
      />

      {/* 폼 패널 — 액션바 아래로 펼쳐짐 */}
      {activeForm && (
        <FormPanel
          type={activeForm}
          onClose={closeForm}
          defaultFolderId={defaultFolderId}
          quickSaveConfig={activeForm === 'quickSaveConfig' ? {
            currentFolder: qsFolder,
            onSave: qsSaveFolder,
            onClear: qsClearFolder,
          } : undefined}
        />
      )}

      {/* Settings 패널 — 액션바 아래로 펼쳐짐 */}
      {isSettingsOpen && (
        <Settings onClose={onCloseSettings} />
      )}
    </div>
  );
}
