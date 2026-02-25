/**
 * 검색바 컴포넌트
 */

import { useBookmarkStore } from '../../store/bookmarkStore';
import './SearchBar.css';

export function SearchBar() {
  const { searchQuery, setSearchQuery } = useBookmarkStore();

  return (
    <div className="searchbar">
      <span className="searchbar-icon">🔍</span>
      <input
        type="text"
        className="searchbar-input"
        placeholder="북마크 검색..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      {searchQuery && (
        <button
          className="searchbar-clear"
          onClick={() => setSearchQuery('')}
          aria-label="검색어 지우기"
        >
          ✕
        </button>
      )}
    </div>
  );
}
