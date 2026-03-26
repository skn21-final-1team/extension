/**
 * 북마크 추가/수정 에디터 — 미니 카드
 */

import { useState, useMemo } from 'react'
import { X, Link2, AlertCircle } from 'lucide-react'
import { useBookmarkStore } from '../../store/bookmarkStore'
import { flattenFolders } from '../../store/store-utils'
import { logger } from '../../utils/logger'
import './BookmarkEditor.css'

interface BookmarkEditorProps {
  onClose: () => void
  editBookmark?: { id: string; title: string; url: string; parentId?: string }
  defaultParentId?: string
}

function BookmarkEditor({ onClose, editBookmark, defaultParentId }: BookmarkEditorProps) {
  const { bookmarks, addBookmark, updateBookmark, moveBookmark } = useBookmarkStore()

  const [title, setTitle] = useState(editBookmark?.title || '')
  const [url, setUrl] = useState(editBookmark?.url || '')
  const [parentId, setParentId] = useState(editBookmark?.parentId || defaultParentId || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const isEditing = !!editBookmark
  const folderOptions = useMemo(() => flattenFolders(bookmarks), [bookmarks])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!title.trim()) return setError('제목을 입력해주세요.')
    if (!url.trim()) return setError('URL을 입력해주세요.')
    try { new URL(url) } catch { return setError('올바른 URL 형식이 아닙니다.') }

    const targetParentId = parentId || folderOptions[0]?.id
    if (!targetParentId) return setError('저장할 폴더를 선택해주세요.')

    setIsSubmitting(true)
    try {
      if (isEditing) {
        await updateBookmark(editBookmark.id, { title, url })
        if (editBookmark.parentId && targetParentId !== editBookmark.parentId) {
          await moveBookmark(editBookmark.id, { parentId: targetParentId })
        }
      } else {
        await addBookmark(title, url, targetParentId)
      }
      onClose()
    } catch (err) {
      logger.error('북마크 저장 실패:', err)
      setError(logger.getUserMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="card-backdrop" onClick={onClose} />
      <div className="mini-card">
        <div className="mini-card-head">
          <span className="mini-card-title">
            <Link2 size={11} className="mini-card-link-icon" />
            {isEditing ? '북마크 수정' : '북마크 추가'}
          </span>
          <button className="mini-card-close" onClick={onClose}><X size={11} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mini-card-body">
            {error && (
              <div className="mini-card-error">
                <AlertCircle size={10} className="mini-card-error-icon" />{error}
              </div>
            )}
            <div className="mini-card-field">
              <label className="mini-card-label">제목</label>
              <input
                type="text"
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="북마크 제목"
                autoFocus
              />
            </div>
            <div className="mini-card-field">
              <label className="mini-card-label">URL</label>
              <input
                type="text"
                className="input"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div className="mini-card-field">
              <label className="mini-card-label">폴더</label>
              <select className="input" value={parentId} onChange={(e) => setParentId(e.target.value)}>
                {folderOptions.length === 0 && <option value="">로딩 중...</option>}
                {folderOptions.map((f) => (
                  <option key={f.id} value={f.id}>
                    {'\u00A0\u00A0'.repeat(f.level)}{f.level > 0 ? '└ ' : ''}{f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mini-card-footer">
            <button type="button" className="btn btn-secondary flex-1" onClick={onClose}>취소</button>
            <button type="submit" className="btn btn-primary flex-1" disabled={isSubmitting}>
              {isSubmitting ? '저장 중...' : isEditing ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

export default BookmarkEditor
