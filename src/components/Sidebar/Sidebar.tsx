/**
 * 사이드바 컴포넌트 — 검색, 폴더 트리, 액션 버튼 포함
 * 메인 화면 전체를 차지하는 핵심 UI
 */

import { useBookmarkStore } from '../../store/bookmarkStore';
import { SearchBar } from '../SearchBar/SearchBar';
import { FolderTree } from '../FolderTree/FolderTree';
import { ActionBar } from '../ActionBar/ActionBar';
import { Icons } from '../Icons/Icons';

// 서버 동기화 기능 활성화 여부
const ENABLE_SYNC = import.meta.env.VITE_ENABLE_SYNC === 'true';

export function Sidebar() {
  const { bookmarks, syncProgress, isLoading, expandAll, collapseAll } = useBookmarkStore();

  return (
    <div className="flex flex-col">
      {/* 검색바 + 접기/펼치기 통합 행 */}
      <SearchBar onCollapseAll={collapseAll} onExpandAll={expandAll} />

      {/* 북마크 트리 — 스크롤 가능 */}
      <div style={{ overflowY: 'auto', maxHeight: 'var(--tree-max-height)' }}>
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
      <ActionBar />
    </div>
  );
}
