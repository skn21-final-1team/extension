/**
 * 북마크 아이템 컴포넌트
 * 개별 북마크 표시 (체크박스, 파비콘, 태그)
 */

import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { BookmarkUrl } from '../../types/bookmark';
import { useBookmarkStore } from '../../store/bookmarkStore';
import { TagBadge } from '../TagBadge/TagBadge';
import { BookmarkEditor } from '../BookmarkEditor/BookmarkEditor';
import { Icons } from '../Icons/Icons';
import './BookmarkItem.css';

interface BookmarkItemProps {
  bookmark: BookmarkUrl;
  parentId: string;
}

export const BookmarkItem = React.memo(({ bookmark, parentId }: BookmarkItemProps) => {
  const { selectedIds, toggleSelect, deleteBookmark } = useBookmarkStore();
  const [showActions, setShowActions] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [faviconError, setFaviconError] = useState(false);

  // sortable 설정 (폴더 내 순서 변경 + 폴더 간 이동 모두 지원)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: bookmark.id,
    data: {
      type: 'bookmark',
      id: bookmark.id,
      parentId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto' as const,
  };

  const isSelected = selectedIds.has(bookmark.id);

  // 파비콘 URL 생성
  const getFaviconUrl = () => {
    if (!bookmark.url) return null;
    try {
      const hostname = new URL(bookmark.url).hostname;
      return `https://www.google.com/s2/favicons?domain=${hostname}&sz=16`;
    } catch {
      return null;
    }
  };

  const faviconUrl = getFaviconUrl();

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`"${bookmark.title}" 북마크를 삭제하시겠습니까?`)) {
      await deleteBookmark(bookmark.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEditor(true);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`bookmark-item ${isSelected ? 'selected' : ''}`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* ... (rest of JSX) */}
        {/* 체크박스 */}
        <label className="bookmark-checkbox">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelect(bookmark.id)}
          />
          <span className="bookmark-checkbox-custom"></span>
        </label>

        {/* 파비콘 */}
        <span className="bookmark-favicon">
          {faviconUrl && !faviconError ? (
            <img
              src={faviconUrl}
              alt=""
              width={16}
              height={16}
              onError={() => setFaviconError(true)}
            />
          ) : (
            <Icons.Globe />
          )}
        </span>

        {/* 제목 */}
        <span className="bookmark-title" title={bookmark.url}>
          {bookmark.title || '제목 없음'}
        </span>

        {/* 태그 */}
        {(bookmark.tags?.length ?? 0) > 0 && (
          <div className="bookmark-tags">
            {bookmark.tags!.map((tag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
          </div>
        )}

        {/* 액션 버튼 */}
        {showActions && (
          <div className="bookmark-actions">
            <button
              className="bookmark-action-btn"
              onClick={handleEdit}
              title="수정"
            >
              <Icons.Edit />
            </button>
            <button
              className="bookmark-action-btn"
              onClick={handleDelete}
              title="삭제"
            >
              <Icons.Trash />
            </button>
          </div>
        )}
      </div>

      {/* 북마크 수정 모달 */}
      {showEditor && (
        <BookmarkEditor
          onClose={() => setShowEditor(false)}
          editBookmark={{
            id: bookmark.id,
            title: bookmark.title,
            url: bookmark.url || '',
            parentId: parentId, // 부모 폴더 ID 전달
          }}
        />
      )}
    </>
  );
});
