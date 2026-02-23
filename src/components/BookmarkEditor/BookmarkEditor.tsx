import { useState, useMemo } from 'react';
import { useBookmarkStore } from '../../store/bookmarkStore';
import type { BookmarkFolderList } from '../../types/bookmark';
import { logger } from '../../utils/logger';
import './BookmarkEditor.css';

interface BookmarkEditorProps {
  onClose: () => void;
  editBookmark?: {
    id: string;
    title: string;
    url: string;
    parentId?: string; // 추가: 현재 부모 폴더 ID
  };
  defaultParentId?: string; // 폴더에서 직접 URL 추가 시 사용
}

// 폴더 구조 평탄화 (Dropdown용)
const flattenFolders = (
  list: BookmarkFolderList,
  depth = 0,
  result: Array<{ id: string; name: string; level: number }> = []
) => {
  for (const item of list) {
    if ('folders' in item) { // 폴더인 경우
       // 루트 폴더(북마크바, 기타 등)도 포함
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

  // 폴더 리스트 생성
  const folderOptions = useMemo(() => flattenFolders(bookmarks), [bookmarks]);

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 유효성 검사
    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }

    if (!url.trim()) {
      setError('URL을 입력해주세요.');
      return;
    }

    if (!validateUrl(url)) {
      setError('올바른 URL 형식이 아닙니다.');
      return;
    }
    
    // 타겟 폴더 ID (없으면 루트 중 첫번째 or 북마크바)
    const targetParentId = parentId || folderOptions[0]?.id;
    if (!targetParentId) {
        setError('저장할 폴더를 선택해주세요.');
        return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing) {
        // 1. 내용 수정
        await updateBookmark(editBookmark.id, { title, url });
        
        // 2. 폴더 이동 (변경된 경우에만)
        if (editBookmark.parentId && targetParentId !== editBookmark.parentId) {
             await moveBookmark(editBookmark.id, { parentId: targetParentId });
        }
      } else {
        // 추가
        await addBookmark(title, url, targetParentId);
      }
      onClose();
    } catch (err) {
      logger.error('북마크 저장 실패:', err);
      const userMessage = logger.getUserMessage(err);
      setError(userMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="editor-overlay" onClick={onClose}>
      <div className="editor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="editor-header">
          <h3 className="editor-title">
            {isEditing ? '북마크 수정' : '북마크 추가'}
          </h3>
          <button className="editor-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form className="editor-form" onSubmit={handleSubmit}>
          {error && <div className="editor-error">{error}</div>}

          <div className="editor-field">
            <label className="editor-label">제목</label>
            <input
              type="text"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="북마크 제목"
              autoFocus
            />
          </div>

          <div className="editor-field">
            <label className="editor-label">URL</label>
            <input
              type="text"
              className="input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          <div className="editor-field">
            <label className="editor-label">폴더 위치</label>
            <select
                className="input select"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
            >
                {folderOptions.length === 0 && <option value="">폴더 로딩 중...</option>}
                {folderOptions.map(folder => (
                    <option key={folder.id} value={folder.id}>
                        {'\u00A0\u00A0'.repeat(folder.level)}{folder.level > 0 ? '└ ' : ''}{folder.name}
                    </option>
                ))}
            </select>
          </div>

          <div className="editor-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              취소
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? '저장 중...' : isEditing ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
