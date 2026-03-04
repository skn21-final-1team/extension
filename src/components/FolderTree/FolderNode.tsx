/**
 * FolderNode — 개별 폴더 행 컴포넌트
 */

import React, { useMemo, useState, useRef } from 'react';
import { useDndContext } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronRight, ChevronDown, FolderOpen, Folder,
  Plus, Trash2, Pencil, GripVertical,
} from 'lucide-react';
import type { BookmarkFolder } from '../../types/bookmark';
import { useBookmarkStore } from '../../store/bookmarkStore';
import { BookmarkItem } from '../BookmarkItem/BookmarkItem';
import { ConfirmDrawer } from '../ConfirmDrawer/ConfirmDrawer';
import { CustomCheckbox } from '../CustomCheckbox/CustomCheckbox';
import { FolderTreeList } from './FolderTreeList';

interface FolderNodeProps {
  folder: BookmarkFolder;
  depth: number;
  parentId: string | undefined;
}

export const FolderNode = React.memo(({ folder, depth, parentId }: FolderNodeProps) => {
  const {
    expandedFolderIds, toggleFolder, searchQuery,
    deleteFolder, selectedFolderIds, toggleFolderForSync,
    renameFolder,
  } = useBookmarkStore();
  const [showActions, setShowActions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);
  const inputRef = useRef<HTMLInputElement>(null);

  // 모든 폴더 드래그 가능 (루트 포함)
  const isDraggable = true;

  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({
    id: folder.id,
    data: { type: 'folder', id: folder.id, parentId },
    disabled: !isDraggable,
  });

  // useDndContext로 북마크가 이 폴더 위에 드래그 오버 중인지 계산
  const { active, over: dndOver } = useDndContext();
  const isBookmarkOver =
    active?.data.current?.type === 'bookmark' && dndOver?.id === folder.id;

  const isExpanded = searchQuery ? true : expandedFolderIds.has(folder.id);
  const isSelected = selectedFolderIds.has(folder.id);
  const childCount = (folder.urls?.length || 0) + (folder.folders?.length || 0);

  const urlIds = useMemo(() => folder.urls?.map((u) => u.id) || [], [folder.urls]);

  const folderRowClass = [
    'folder-row',
    isSelected ? 'folder-row--selected' : '',
    isBookmarkOver ? 'folder-row--drag-over' : '',
    isDragging ? 'folder-row--dragging' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleDeleteFolder = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const confirmDeleteFolder = async () => {
    setShowDeleteConfirm(false);
    setIsDeleting(true);
    try {
      await deleteFolder(folder.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('openAddUrl', { detail: { folderId: folder.id } }));
  };

  const handleRenameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditName(folder.name);
    setIsEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditName(folder.name);
    setIsEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const handleRenameConfirm = async () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== folder.name) {
      await renameFolder(folder.id, trimmed);
    }
    setIsEditing(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameConfirm();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  return (
    <li
      ref={setNodeRef}
      className="list-none"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      {/* 폴더 행 */}
      <div
        className={folderRowClass}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* 드래그 핸들 (hover 시 표시) */}
        {isDraggable && (
          <span
            className="folder-drag-handle"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={12} />
          </span>
        )}

        {/* 접기/펼치기 */}
        <button className="folder-chevron-btn" onClick={() => toggleFolder(folder.id)}>
          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>

        {/* 체크박스 */}
        <div className="px-1.5">
          <CustomCheckbox
            checked={isSelected}
            onChange={(e) => { e.stopPropagation(); toggleFolderForSync(folder.id); }}
            title="이 폴더를 Notebook에 전송"
          />
        </div>

        {/* 폴더 아이콘 */}
        <span className="flex-shrink-0 mr-1.5 flex items-center" style={{ color: '#f59e0b' }}>
          {isExpanded ? <FolderOpen size={14} /> : <Folder size={14} />}
        </span>

        {/* 폴더 이름 (더블클릭 → 인라인 수정) */}
        {isEditing ? (
          <input
            ref={inputRef}
            className="folder-name-input"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRenameConfirm}
            onKeyDown={handleRenameKeyDown}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <button
            className="folder-name-btn"
            onClick={() => toggleFolder(folder.id)}
            onDoubleClick={handleDoubleClick}
          >
            {folder.name}
          </button>
        )}

        {/* 자식 수 (호버 시 숨김) */}
        {childCount > 0 && !showActions && !isEditing && (
          <span className="folder-child-count">{childCount}</span>
        )}

        {/* 액션 버튼 */}
        {showActions && !isEditing && (
          <div className="folder-actions">
            <button
              className="icon-action-btn"
              onClick={handleAddUrl}
              title="URL 추가"
            >
              <Plus size={12} />
            </button>
            <button
              className="icon-action-btn"
              onClick={handleRenameClick}
              title="이름 변경"
            >
              <Pencil size={12} />
            </button>
            <button
              className="icon-action-btn icon-action-btn--danger"
              onClick={handleDeleteFolder}
              title="폴더 삭제"
              disabled={isDeleting}
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {/* 하위 요소 (드래그 중엔 숨김) */}
      {isExpanded && !isDragging && (
        <div className="folder-children">
          {folder.folders && folder.folders.length > 0 && (
            <FolderTreeList items={folder.folders} depth={depth + 1} parentId={folder.id} />
          )}
          {folder.urls && folder.urls.length > 0 && (
            <SortableContext items={urlIds} strategy={verticalListSortingStrategy}>
              <ul className="list-none p-0 m-0">
                {folder.urls.map((url) => (
                  <li key={url.id} className="list-none">
                    <BookmarkItem bookmark={url} parentId={folder.id} depth={depth + 1} />
                  </li>
                ))}
              </ul>
            </SortableContext>
          )}
        </div>
      )}

      {showDeleteConfirm && (
        <ConfirmDrawer
          title="폴더 삭제"
          message={`"${folder.name}" 폴더와 하위 항목을 모두 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
          confirmLabel="삭제"
          variant="danger"
          onConfirm={confirmDeleteFolder}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </li>
  );
});
