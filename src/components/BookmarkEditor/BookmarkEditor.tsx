/**
 * 북마크 추가/수정 에디터 컴포넌트 — 모달 형태
 */

import { useState, useMemo } from 'react';
import { X, Link2, AlertCircle } from 'lucide-react';
import { useBookmarkStore } from '../../store/bookmarkStore';
import type { BookmarkFolderList } from '../../types/bookmark';
import { logger } from '../../utils/logger';

interface BookmarkEditorProps {
  onClose: () => void;
  editBookmark?: {
    id: string;
    title: string;
    url: string;
    parentId?: string;
  };
  defaultParentId?: string;
}

// 폴더 구조 평탄화 (Select 드롭다운용)
const flattenFolders = (
  list: BookmarkFolderList,
  depth = 0,
  result: Array<{ id: string; name: string; level: number }> = []
) => {
  for (const item of list) {
    if ('folders' in item) {
      result.push({ id: item.id, name: item.name, level: depth });
      if (item.folders) {
        flattenFolders(item.folders, depth + 1, result);
      }
    }
  }
  return result;
};

export function BookmarkEditor({ onClose, editBookmark, defaultParentId }: BookmarkEditorProps) {
  const { bookmarks, addBookmark, updateBookmark, moveBookmark } = useBookmarkStore();

  const [title, setTitle] = useState(editBookmark?.title || '');
  const [url, setUrl] = useState(editBookmark?.url || '');
  const [parentId, setParentId] = useState(editBookmark?.parentId || defaultParentId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!editBookmark;
  const folderOptions = useMemo(() => flattenFolders(bookmarks), [bookmarks]);

  const validateUrl = (value: string): boolean => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) return setError('제목을 입력해주세요.');
    if (!url.trim()) return setError('URL을 입력해주세요.');
    if (!validateUrl(url)) return setError('올바른 URL 형식이 아닙니다.');

    const targetParentId = parentId || folderOptions[0]?.id;
    if (!targetParentId) return setError('저장할 폴더를 선택해주세요.');

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updateBookmark(editBookmark.id, { title, url });
        if (editBookmark.parentId && targetParentId !== editBookmark.parentId) {
          await moveBookmark(editBookmark.id, { parentId: targetParentId });
        }
      } else {
        await addBookmark(title, url, targetParentId);
      }
      onClose();
    } catch (err) {
      logger.error('북마크 저장 실패:', err);
      setError(logger.getUserMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="absolute inset-0 z-50 flex items-end modal-overlay"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-t-2xl overflow-hidden modal-sheet"
        style={{ background: 'var(--bg-elevated)', boxShadow: '0 -8px 40px rgba(0,0,0,0.5), 0 -1px 0 var(--border-default)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 드래그 핸들 */}
        <div className="flex justify-center pt-2.5 pb-0">
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)' }} />
        </div>
        {/* 헤더 */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--accent-bg)' }}
            >
              <Link2 size={14} style={{ color: 'var(--accent-color)' }} />
            </div>
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              {isEditing ? '북마크 수정' : '북마크 추가'}
            </h3>
          </div>
          <button
            className="w-7 h-7 flex items-center justify-center rounded-md"
            style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={onClose}
          >
            <X size={15} />
          </button>
        </div>

        {/* 폼 */}
        <form className="p-4 flex flex-col gap-3" onSubmit={handleSubmit}>
          {/* 에러 */}
          {error && (
            <div
              className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
              style={{ background: 'rgba(248, 113, 113, 0.1)', color: 'var(--error-color)' }}
            >
              <AlertCircle size={12} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* 제목 + URL 카드 */}
          <div
            className="rounded-xl p-3 flex flex-col gap-2.5"
            style={{ background: 'var(--bg-hover)' }}
          >
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                제목
              </label>
              <input
                type="text"
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="북마크 제목"
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                URL
              </label>
              <input
                type="text"
                className="input"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>

          {/* 폴더 위치 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
              폴더 위치
            </label>
            <select
              className="input"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
            >
              {folderOptions.length === 0 && <option value="">폴더 로딩 중...</option>}
              {folderOptions.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {'\u00A0\u00A0'.repeat(folder.level)}
                  {folder.level > 0 ? '└ ' : ''}
                  {folder.name}
                </option>
              ))}
            </select>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-2 pt-1">
            <button type="button" className="btn btn-secondary flex-1" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn btn-primary flex-1" disabled={isSubmitting}>
              {isSubmitting ? '저장 중...' : isEditing ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
