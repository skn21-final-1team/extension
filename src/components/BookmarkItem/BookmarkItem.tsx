/**
 * 북마크 아이템 컴포넌트 — VS Code 스타일 트리 행
 * 스타일은 BookmarkItem.css로 분리
 */

import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Pencil, Trash2, Globe } from 'lucide-react';
import type { BookmarkUrl } from '../../types/bookmark';
import { useBookmarkStore } from '../../store/bookmarkStore';
import { TagBadge } from '../TagBadge/TagBadge';
import { BookmarkEditor } from '../BookmarkEditor/BookmarkEditor';
import './BookmarkItem.css';

interface BookmarkItemProps {
  bookmark: BookmarkUrl;
  parentId: string;
  depth?: number;
}

// 커스텀 체크박스 (FolderTree와 동일한 CSS 클래스 사용)
const CustomCheckbox = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) => (
  <label className="custom-checkbox">
    <input type="checkbox" checked={checked} onChange={onChange} />
    <div className="custom-checkbox-box">
      {checked && (
        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
          <path
            d="M1 3L3 5L7 1"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  </label>
);

export const BookmarkItem = React.memo(
  ({ bookmark, parentId, depth = 0 }: BookmarkItemProps) => {
    const { selectedIds, toggleSelect, deleteBookmark } = useBookmarkStore();
    const [showActions, setShowActions] = useState(false);
    const [showEditor, setShowEditor] = useState(false);
    const [faviconError, setFaviconError] = useState(false);

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: bookmark.id,
      data: { type: 'bookmark', id: bookmark.id, parentId },
    });

    const isSelected = selectedIds.has(bookmark.id);

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

    const handleTitleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (bookmark.url) {
        chrome.tabs.create({ url: bookmark.url });
      }
    };

    const bookmarkRowClass = [
      'bookmark-row',
      isSelected ? 'bookmark-row--selected' : '',
      isDragging ? 'bookmark-row--dragging' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const titleClass = [
      'bookmark-title',
      isSelected ? 'bookmark-title--selected' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <>
        <div
          ref={setNodeRef}
          {...attributes}
          {...listeners}
          className={bookmarkRowClass}
          style={{
            // depth 기반 동적 값만 인라인으로 유지
            transform: CSS.Transform.toString(transform),
            transition,
            paddingLeft: `${depth * 16 + 20}px`,
          }}
          onMouseEnter={() => setShowActions(true)}
          onMouseLeave={() => setShowActions(false)}
        >
          {/* 커스텀 체크박스 */}
          <div className="pr-1.5">
            <CustomCheckbox
              checked={isSelected}
              onChange={() => toggleSelect(bookmark.id)}
            />
          </div>

          {/* 파비콘 */}
          <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center mr-1.5">
            {faviconUrl && !faviconError ? (
              <img
                src={faviconUrl}
                alt=""
                width={13}
                height={13}
                className="rounded-sm"
                onError={() => setFaviconError(true)}
              />
            ) : (
              <Globe size={12} className="text-[#9ca3af]" />
            )}
          </span>

          {/* 제목 */}
          <span
            className={titleClass}
            title={bookmark.url}
            onClick={handleTitleClick}
            style={{ cursor: 'pointer' }}
          >
            {bookmark.title || '제목 없음'}
          </span>

          {/* 태그 (액션 표시 중엔 숨김) */}
          {(bookmark.tags?.length ?? 0) > 0 && !showActions && (
            <div className="flex items-center gap-1 ml-1">
              {bookmark.tags!.map((tag) => (
                <TagBadge key={tag} tag={tag} />
              ))}
            </div>
          )}

          {/* 호버 액션 버튼 */}
          {showActions && (
            <div className="bookmark-actions">
              <button className="icon-action-btn" onClick={handleEdit} title="수정">
                <Pencil size={11} />
              </button>
              <button
                className="icon-action-btn icon-action-btn--danger"
                onClick={handleDelete}
                title="삭제"
              >
                <Trash2 size={11} />
              </button>
            </div>
          )}
        </div>

        {showEditor && (
          <BookmarkEditor
            onClose={() => setShowEditor(false)}
            editBookmark={{
              id: bookmark.id,
              title: bookmark.title,
              url: bookmark.url || '',
              parentId,
            }}
          />
        )}
      </>
    );
  }
);
