/**
 * FolderTree 컴포넌트 — VS Code 스타일 트리 구조
 * 스타일은 FolderTree.css로 분리, Tailwind는 레이아웃 보조용으로만 사용
 */

import React, { useMemo, useState, useRef } from 'react';
import {
  DndContext,
  DragEndEvent,
  useDndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronRight,
  ChevronDown,
  FolderOpen,
  Folder,
  Plus,
  Trash2,
  GripVertical,
} from 'lucide-react';
import type { BookmarkFolderList, BookmarkFolder } from '../../types/bookmark';
import { useBookmarkStore } from '../../store/bookmarkStore';
import { getSubFolderIds } from '../../store/store-utils';
import { BookmarkItem } from '../BookmarkItem/BookmarkItem';
import { BookmarkEditor } from '../BookmarkEditor/BookmarkEditor';
import './FolderTree.css';

interface FolderTreeProps {
  items: BookmarkFolderList;
  depth?: number;
  isRoot?: boolean;
}

// 검색 필터링 함수
const filterBookmarks = (
  items: BookmarkFolderList,
  query: string
): BookmarkFolderList => {
  if (!query) return items;
  const lowerQuery = query.toLowerCase();
  return items
    .map((folder) => {
      const filteredUrls = (folder.urls || []).filter(
        (url) =>
          (url.title || '').toLowerCase().includes(lowerQuery) ||
          (url.url || '').toLowerCase().includes(lowerQuery)
      );
      const filteredSubFolders = folder.folders
        ? filterBookmarks(folder.folders, query)
        : [];
      const isFolderNameMatch = (folder.name || '').toLowerCase().includes(lowerQuery);
      if (filteredUrls.length > 0 || filteredSubFolders.length > 0 || isFolderNameMatch) {
        return { ...folder, folders: filteredSubFolders, urls: filteredUrls } as BookmarkFolder;
      }
      return null;
    })
    .filter((item): item is BookmarkFolder => item !== null);
};

// 커스텀 체크박스
const CustomCheckbox = ({
  checked,
  onChange,
  title,
}: {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  title?: string;
}) => (
  <label className="custom-checkbox" title={title}>
    <input type="checkbox" checked={checked} onChange={onChange} />
    <div className="custom-checkbox-box">
      {checked && (
        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
          <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  </label>
);

// 개별 폴더 노드
const FolderNode = React.memo(({
  folder,
  depth,
  parentId,
}: {
  folder: BookmarkFolder;
  depth: number;
  parentId: string | undefined;
}) => {
  const {
    expandedFolderIds, toggleFolder, searchQuery,
    deleteFolder, selectedFolderIds, toggleFolderForSync,
    renameFolder,
  } = useBookmarkStore();
  const [showActions, setShowActions] = useState(false);
  const [showUrlEditor, setShowUrlEditor] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);
  const inputRef = useRef<HTMLInputElement>(null);

  // 모든 폴더 드래그 가능 (루트 포함)
  const isDraggable = true;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
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

  const handleDeleteFolder = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`"${folder.name}" 폴더를 삭제하시겠습니까?`)) {
      await deleteFolder(folder.id);
    }
  };

  const handleAddUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowUrlEditor(true);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditName(folder.name);
    setIsEditing(true);
    // 다음 렌더링에서 input 포커스
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
              className="icon-action-btn icon-action-btn--danger"
              onClick={handleDeleteFolder}
              title="폴더 삭제"
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

      {showUrlEditor && (
        <BookmarkEditor
          onClose={() => setShowUrlEditor(false)}
          defaultParentId={folder.id}
        />
      )}
    </li>
  );
});

// 트리 리스트 (재귀용)
const FolderTreeList = React.memo(
  ({ items, depth, parentId }: { items: BookmarkFolderList; depth: number; parentId: string | undefined }) => {
    const { searchQuery } = useBookmarkStore();
    const filteredItems = useMemo(
      () => filterBookmarks(items, searchQuery),
      [items, searchQuery]
    );
    const folderIds = useMemo(() => filteredItems.map((f) => f.id), [filteredItems]);

    return (
      <SortableContext items={folderIds} strategy={verticalListSortingStrategy}>
        <ul className="tree-root">
          {filteredItems.map((folder) => (
            <FolderNode key={folder.id} folder={folder} depth={depth} parentId={parentId} />
          ))}
        </ul>
      </SortableContext>
    );
  }
);

const findBookmarkIndex = (
  folders: BookmarkFolderList,
  bookmarkId: string
): { parentId: string; index: number } | null => {
  for (const folder of folders) {
    const idx = folder.urls?.findIndex((u) => u.id === bookmarkId) ?? -1;
    if (idx !== -1) return { parentId: folder.id, index: idx };
    if (folder.folders) {
      const result = findBookmarkIndex(folder.folders, bookmarkId);
      if (result) return result;
    }
  }
  return null;
};

function findFolderById(folders: BookmarkFolderList, folderId: string): BookmarkFolder | null {
  for (const folder of folders) {
    if (folder.id === folderId) return folder;
    if (folder.folders) {
      const result = findFolderById(folder.folders, folderId);
      if (result) return result;
    }
  }
  return null;
}

function findSiblingFolders(
  folders: BookmarkFolderList,
  parentId: string | undefined
): BookmarkFolder[] {
  if (!parentId) return folders as BookmarkFolder[];
  const parent = findFolderById(folders, parentId);
  return parent?.folders || [];
}

export function FolderTree({ items, depth = 0, isRoot = false }: FolderTreeProps) {
  const { moveBookmark, loadBookmarks } = useBookmarkStore();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeData = active.data.current;
    const overData = over.data.current;
    if (!activeData) return;

    // Case 1: 폴더 → 폴더
    if (activeData.type === 'folder' && overData?.type === 'folder') {
      const activeParentId = activeData.parentId as string | undefined;
      const overParentId = overData.parentId as string | undefined;

      if (activeParentId === overParentId) {
        // 같은 부모 내에서 순서 변경
        const siblings = findSiblingFolders(items, activeParentId);
        const oldIndex = siblings.findIndex((f) => f.id === active.id);
        const newIndex = siblings.findIndex((f) => f.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;

        await moveBookmark(active.id as string, {
          parentId: activeParentId,
          index: newIndex,
        });
      } else {
        // 다른 부모: over 폴더 내부로 이동 (순환 참조 방지)
        const subIds = getSubFolderIds(items, active.id as string);
        if (subIds.includes(over.id as string)) return;

        await moveBookmark(active.id as string, { parentId: over.id as string });
      }
      return;
    }

    // Case 2: 북마크 → 폴더 (폴더로 이동)
    if (activeData.type === 'bookmark' && overData?.type === 'folder') {
      await moveBookmark(active.id as string, { parentId: overData.id as string });
      return;
    }

    // Case 3: 북마크 → 북마크 (같은/다른 폴더 내 순서 변경)
    if (activeData.type === 'bookmark') {
      const overInfo = findBookmarkIndex(items, over.id as string);
      if (!overInfo) return;

      const activeParentId = activeData.parentId as string;
      const folder = findFolderById(
        items,
        activeParentId === overInfo.parentId ? activeParentId : overInfo.parentId
      );
      const subFolderCount = folder?.folders?.length || 0;
      await moveBookmark(active.id as string, {
        parentId: overInfo.parentId,
        index: subFolderCount + overInfo.index,
      });
      await loadBookmarks();
    }
  };

  if (isRoot) {
    return (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <FolderTreeList items={items} depth={depth} parentId={undefined} />
      </DndContext>
    );
  }
  return <FolderTreeList items={items} depth={depth} parentId={undefined} />;
}
