/**
 * 검색바 컴포넌트 — 검색 입력 + 전체 접기/펼치기 버튼 통합
 */

import { useState, useEffect, useRef } from 'react'
import { Search, X, ChevronsUp, ChevronsDown } from 'lucide-react'
import { useBookmarkStore } from '../../store/bookmarkStore'
import './SearchBar.css'

interface SearchBarProps {
  onCollapseAll?: () => void
  onExpandAll?: () => void
}

function SearchBar({ onCollapseAll, onExpandAll }: SearchBarProps) {
  const { searchQuery, setSearchQuery } = useBookmarkStore()
  const [localQuery, setLocalQuery] = useState(searchQuery)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setSearchQuery(localQuery), 300)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [localQuery, setSearchQuery])

  // 외부에서 searchQuery가 초기화되면 (예: 검색어 지우기) 로컬도 동기화
  // eslint-disable-next-line react-hooks/exhaustive-deps -- localQuery를 deps에 넣으면 무한 루프 발생
  useEffect(() => {
    if (searchQuery === '' && localQuery !== '') setLocalQuery('')
  }, [searchQuery])

  return (
    <div className="searchbar">
      {/* 검색 영역 */}
      <div className="searchbar-field">
        <Search size={13} className="searchbar-icon" />
        <input
          type="text"
          className="searchbar-input"
          placeholder="북마크 검색..."
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
        />
        {localQuery && (
          <button
            className="searchbar-clear"
            onClick={() => { setLocalQuery(''); setSearchQuery('') }}
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
          title={localQuery ? '검색 중에는 사용할 수 없습니다' : '전체 접기'}
          disabled={!!localQuery}
        >
          <ChevronsUp size={14} />
        </button>
      )}
      {onExpandAll && (
        <button
          className="searchbar-toggle-btn"
          onClick={onExpandAll}
          title={localQuery ? '검색 중에는 사용할 수 없습니다' : '전체 펼치기'}
          disabled={!!localQuery}
        >
          <ChevronsDown size={14} />
        </button>
      )}
    </div>
  )
}

export default SearchBar
