/**
 * 사이드바 컴포넌트 — 검색, 폴더 트리, 액션 버튼 포함
 * 메인 화면 전체를 차지하는 핵심 UI
 */

import { useState, useEffect } from 'react';
import { useBookmarkStore } from '../../store/bookmarkStore';
import { SearchBar } from '../SearchBar/SearchBar';
import { FolderTree } from '../FolderTree/FolderTree';
import { ActionBar } from '../ActionBar/ActionBar';
import { FormPanel, type FormPanelType } from '../FormPanel/FormPanel';
import { Settings } from '../Settings/Settings';
import { Icons } from '../Icons/Icons';

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

  // Settings가 열리면 열려 있던 폼 닫기
  useEffect(() => {
    if (isSettingsOpen) setActiveForm(null);
  }, [isSettingsOpen]);

  const openForm = async (type: FormPanelType) => {
    onCloseSettings(); // 폼 열 때 Settings 닫기
    if (type === 'saveTab') {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.url) return;
      await chrome.storage.local.set({
        formTabData: { title: tab.title || tab.url, url: tab.url, favIconUrl: tab.favIconUrl },
      });
    }
    setActiveForm(type);
  };

  const closeForm = () => setActiveForm(null);

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
      <div style={{
        overflowY: 'auto',
        maxHeight: treeHeight,
        transition: 'max-height 0.2s ease',
      }}>
        {bookmarks.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center gap-3"
            style={{ color: 'var(--text-muted)', minHeight: '160px' }}
          >
            <span style={{ opacity: 0.5 }}>
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
        <div
          className="relative mx-3 mb-1 rounded-full overflow-hidden"
          style={{ height: 4, background: 'var(--border-color)' }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all"
            style={{
              width: `${syncProgress}%`,
              background: 'var(--accent-color)',
            }}
          />
        </div>
      )}

      {/* 하단 액션 바 */}
      <ActionBar onOpenPanel={openForm} />

      {/* 폼 패널 — 액션바 아래로 펼쳐짐 */}
      {activeForm && (
        <FormPanel type={activeForm} onClose={closeForm} />
      )}

      {/* Settings 패널 — 액션바 아래로 펼쳐짐 */}
      {isSettingsOpen && (
        <Settings onClose={onCloseSettings} />
      )}
    </div>
  );
}
