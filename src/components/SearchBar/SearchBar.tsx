/**
 * 검색바 컴포넌트 — 검색 입력 + 전체 접기/펼치기 버튼 통합
 */

import { Search, X, ChevronsUp, ChevronsDown } from 'lucide-react'
import { useBookmarkStore } from '../../store/bookmarkStore'
import './SearchBar.css'

interface SearchBarProps {
  onCollapseAll?: () => void
  onExpandAll?: () => void
}

function SearchBar({ onCollapseAll, onExpandAll }: SearchBarProps) {
  const { searchQuery, setSearchQuery } = useBookmarkStore()

  return (
    <div className="searchbar">
      {/* 검색 영역 */}
      <div className="searchbar-field">
        <Search size={13} className="searchbar-icon" />
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
            <X size={11} />
          </button>
        )}
      </div>

      {/* 전체 접기/펼치기 버튼 */}
      {onCollapseAll && (
        <button
          className="searchbar-toggle-btn"
          onClick={onCollapseAll}
          title={searchQuery ? '검색 중에는 사용할 수 없습니다' : '전체 접기'}
          disabled={!!searchQuery}
        >
          <ChevronsUp size={14} />
        </button>
      )}
      {onExpandAll && (
        <button
          className="searchbar-toggle-btn"
          onClick={onExpandAll}
          title={searchQuery ? '검색 중에는 사용할 수 없습니다' : '전체 펼치기'}
          disabled={!!searchQuery}
        >
          <ChevronsDown size={14} />
        </button>
      )}
    </div>
  )
}

export default SearchBar
