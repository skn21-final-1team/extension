/**
 * 북마크 아이템 컴포넌트 — VS Code 스타일 트리 행
 * 스타일은 BookmarkItem.css로 분리
 */

import { memo, useState, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Pencil, Trash2, Globe } from 'lucide-react'
import type { BookmarkUrl } from '../../types/bookmark'
import { useBookmarkStore } from '../../store/bookmarkStore'
import { TagBadge } from '../TagBadge/TagBadge'
import BookmarkEditor from '../BookmarkEditor/BookmarkEditor'
import ConfirmDrawer from '../ConfirmDrawer/ConfirmDrawer'
import { CustomCheckbox } from '../CustomCheckbox/CustomCheckbox'
import './BookmarkItem.css'

interface BookmarkItemProps {
  bookmark: BookmarkUrl
  parentId: string
  depth?: number
}

const BookmarkItem = memo(({ bookmark, parentId, depth = 0 }: BookmarkItemProps) => {
  const { selectedIds, toggleSelect, deleteBookmark } = useBookmarkStore()
  const isSelected = selectedIds.has(bookmark.id)
  const [showActions, setShowActions] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [faviconError, setFaviconError] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // URL이 바뀌면 favicon 오류 상태 초기화
  useEffect(() => {
    setFaviconError(false)
  }, [bookmark.url])

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: bookmark.id,
    data: { type: 'bookmark', id: bookmark.id, parentId },
  })

  const getFaviconUrl = () => {
    if (!bookmark.url) return null
    try {
      const hostname = new URL(bookmark.url).hostname
      return `https://www.google.com/s2/favicons?domain=${hostname}&sz=16`
    } catch {
      return null
    }
  }

  const faviconUrl = getFaviconUrl()

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    setShowDeleteConfirm(false)
    setIsDeleting(true)
    try {
      await deleteBookmark(bookmark.id)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowEditor(true)
  }

  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (bookmark.url) {
      // Ctrl/Cmd+클릭: 백그라운드 탭, 일반 클릭: 활성 탭
      chrome.tabs.create({ url: bookmark.url, active: !(e.ctrlKey || e.metaKey) })
    }
  }

  const bookmarkRowClass = [
    'bookmark-row',
    isSelected ? 'bookmark-row--selected' : '',
    isDragging ? 'bookmark-row--dragging' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const titleClass = [
    'bookmark-title',
    isSelected ? 'bookmark-title--selected' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        className={bookmarkRowClass}
        style={{
          // DnD 라이브러리가 매 프레임 계산하는 값 — 인라인 필수
          transform: CSS.Transform.toString(transform),
          transition,
          '--bookmark-row-indent': `${depth * 16 + 20}px`,
        } as React.CSSProperties}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* 커스텀 체크박스 */}
        <div className="bookmark-checkbox-wrap">
          <CustomCheckbox
            checked={isSelected}
            onChange={() => toggleSelect(bookmark.id)}
          />
        </div>

        {/* 파비콘 */}
        <span className="bookmark-favicon-wrap">
          {faviconUrl && !faviconError ? (
            <img
              src={faviconUrl}
              alt=""
              width={13}
              height={13}
              className="bookmark-favicon-img"
              onError={() => setFaviconError(true)}
            />
          ) : (
            <Globe size={12} className="bookmark-favicon-icon" />
          )}
        </span>

        {/* 제목 */}
        <span className={titleClass} title={bookmark.url} onClick={handleTitleClick}>
          {bookmark.title || '제목 없음'}
        </span>

        {/* 태그 (액션 표시 중엔 숨김) */}
        {(bookmark.tags?.length ?? 0) > 0 && !showActions && (
          <div className="bookmark-tags">
            {(bookmark.tags ?? []).map((tag) => (
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
              disabled={isDeleting}
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

      {showDeleteConfirm && (
        <ConfirmDrawer
          title="북마크 삭제"
          message={`"${bookmark.title || '제목 없음'}" 북마크를 삭제하시겠습니까?`}
          confirmLabel="삭제"
          variant="danger"
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  )
})

export default BookmarkItem
