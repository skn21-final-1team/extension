/**
 * 검색바 컴포넌트 — 검색 입력 + 전체 접기/펼치기 버튼 통합
 */

import { Search, X, ChevronsUp, ChevronsDown } from 'lucide-react';
import { useBookmarkStore } from '../../store/bookmarkStore';

interface SearchBarProps {
  onCollapseAll?: () => void;
  onExpandAll?: () => void;
}

export function SearchBar({ onCollapseAll, onExpandAll }: SearchBarProps) {
  const { searchQuery, setSearchQuery } = useBookmarkStore();

  return (
    <div
      className="flex items-center gap-2 px-3"
      style={{
        height: '40px',
        borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0,
        background: 'var(--bg-surface)',
      }}
    >
      {/* 검색 영역 */}
      <div
        className="flex items-center gap-1.5 flex-1 px-2.5 py-1.5 rounded-lg"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
      >
        <Search size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          type="text"
          className="flex-1 bg-transparent text-xs outline-none"
          style={{ color: 'var(--text-primary)' }}
          placeholder="북마크 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            className="flex items-center justify-center w-3.5 h-3.5 rounded-full"
            style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
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
          onClick={onCollapseAll}
          title={searchQuery ? '검색 중에는 사용할 수 없습니다' : '전체 접기'}
          disabled={!!searchQuery}
          style={{
            background: 'none',
            border: 'none',
            cursor: searchQuery ? 'default' : 'pointer',
            padding: '3px',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            borderRadius: '4px',
            flexShrink: 0,
            opacity: searchQuery ? 0.35 : 1,
          }}
          onMouseEnter={(e) => { if (!searchQuery) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
        >
          <ChevronsUp size={14} />
        </button>
      )}
      {onExpandAll && (
        <button
          onClick={onExpandAll}
          title={searchQuery ? '검색 중에는 사용할 수 없습니다' : '전체 펼치기'}
          disabled={!!searchQuery}
          style={{
            background: 'none',
            border: 'none',
            cursor: searchQuery ? 'default' : 'pointer',
            padding: '3px',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            borderRadius: '4px',
            flexShrink: 0,
            opacity: searchQuery ? 0.35 : 1,
          }}
          onMouseEnter={(e) => { if (!searchQuery) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
        >
          <ChevronsDown size={14} />
        </button>
      )}
    </div>
  );
}
