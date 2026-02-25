/**
 * 사이드바 컴포넌트
 * 검색, 폴더 트리, 액션 버튼 포함
 */

import { useBookmarkStore } from '../../store/bookmarkStore';
import { SearchBar } from '../SearchBar/SearchBar';
import { FolderTree } from '../FolderTree/FolderTree';
import { ActionBar } from '../ActionBar/ActionBar';
import { Icons } from '../Icons/Icons';
import './Sidebar.css';

// 서버 동기화 기능 활성화 여부
const ENABLE_SYNC = import.meta.env.VITE_ENABLE_SYNC === 'true';

export function Sidebar() {
  const { bookmarks, selectedIds, syncProgress, isLoading } =
    useBookmarkStore();

  return (
    <div className="sidebar">
      {/* 헤더 영역 */}
      <div className="sidebar-header">
        <h2 className="sidebar-title">BOOKMARKS</h2>
        <span className="sidebar-count">
          {selectedIds.size > 0 && `${selectedIds.size}개 선택`}
        </span>
      </div>

      {/* 검색바 */}
      <SearchBar />

      {/* 북마크 트리 */}
      <div className="sidebar-content">
        {bookmarks.length === 0 ? (
          <div className="sidebar-empty">
            <span className="sidebar-empty-icon">
              <Icons.EmptyBox />
            </span>
            <p>북마크가 없습니다</p>
          </div>
        ) : (
          <FolderTree items={bookmarks} isRoot={true} />
        )}
      </div>

      {/* 동기화 진행률 (선택적) */}
      {ENABLE_SYNC && isLoading && syncProgress > 0 && (
        <div className="sidebar-progress">
          <div
            className="sidebar-progress-bar"
            style={{ width: `${syncProgress}%` }}
          />
          <span className="sidebar-progress-text">{syncProgress}% 동기화 중...</span>
        </div>
      )}

      {/* 하단 액션 바 */}
      <ActionBar />
    </div>
  );
}
