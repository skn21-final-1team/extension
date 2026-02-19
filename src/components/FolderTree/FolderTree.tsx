import { useMemo, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  useDroppable,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { BookmarkFolderList, BookmarkFolder } from '../../types/bookmark';
import { useBookmarkStore } from '../../store/bookmarkStore';
import { BookmarkItem } from '../BookmarkItem/BookmarkItem';
import { BookmarkEditor } from '../BookmarkEditor/BookmarkEditor';
import { Icons } from '../Icons/Icons';
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
      const filteredUrls = folder.urls.filter(
        (url) =>
          url.title.toLowerCase().includes(lowerQuery) ||
          url.url.toLowerCase().includes(lowerQuery)
      );

      const filteredSubFolders = folder.folders
        ? filterBookmarks(folder.folders, query)
        : [];

      const isFolderNameMatch = folder.name.toLowerCase().includes(lowerQuery);

      const hasMatches =
        filteredUrls.length > 0 ||
        filteredSubFolders.length > 0 ||
        isFolderNameMatch;

      if (hasMatches) {
        return {
          ...folder,
          folders: filteredSubFolders,
          urls: filteredUrls,
        } as BookmarkFolder;
      }
      return null;
    })
    .filter((item): item is BookmarkFolder => item !== null);
};

// 개별 폴더 노드 컴포넌트 (Droppable + SortableContext 적용)
function FolderNode({ folder, depth }: { folder: BookmarkFolder; depth: number }) {
  const { expandedFolderIds, toggleFolder, searchQuery, deleteFolder } = useBookmarkStore();
  const [showActions, setShowActions] = useState(false);
  const [showUrlEditor, setShowUrlEditor] = useState(false);

  // 드롭 타겟 설정 (폴더 간 이동용)
  const { setNodeRef, isOver } = useDroppable({
    id: `folder-${folder.id}`,
    data: {
      type: 'folder',
      id: folder.id,
    },
  });

  // 검색 중이면 항상 펼침, 아니면 store 상태 따름
  const isExpanded = searchQuery ? true : expandedFolderIds.has(folder.id);

  // 북마크 ID 목록 (SortableContext용)
  const urlIds = useMemo(
    () => folder.urls?.map((url) => url.id) || [],
    [folder.urls]
  );

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

  return (
    <li className="folder-node">
      {/* 폴더 헤더 (Droppable) */}
      <div
        ref={setNodeRef}
        className={`folder-header-wrapper ${isOver ? 'folder-over' : ''}`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <button
          className={`folder-header ${isExpanded ? 'expanded' : ''}`}
          onClick={() => toggleFolder(folder.id)}
        >
          <span className="folder-chevron">
            {isExpanded ? <Icons.ChevronDown /> : <Icons.ChevronRight />}
          </span>
          <span className="folder-icon">
            <Icons.Folder />
          </span>
          <span className="folder-title">{folder.name}</span>
          <span className="folder-count">
            {(folder.urls?.length || 0) + (folder.folders?.length || 0)}
          </span>
        </button>

        {/* 폴더 액션 버튼 */}
        {showActions && (
          <div className="folder-actions">
            <button
              className="folder-action-btn"
              onClick={handleAddUrl}
              title="이 폴더에 URL 추가"
            >
              <Icons.Plus />
            </button>
            <button
              className="folder-action-btn folder-action-btn-danger"
              onClick={handleDeleteFolder}
              title="폴더 삭제"
            >
              <Icons.Trash />
            </button>
          </div>
        )}
      </div>

      {/* 하위 항목 (재귀) */}
      {isExpanded && (
        <div className="folder-children">
          {/* 하위 폴더 */}
          {folder.folders && folder.folders.length > 0 && (
            <FolderTreeList items={folder.folders} depth={depth + 1} />
          )}

          {/* 하위 URL (SortableContext로 순서 변경 지원) */}
          {folder.urls && folder.urls.length > 0 && (
            <SortableContext items={urlIds} strategy={verticalListSortingStrategy}>
              <ul className="bookmark-list">
                {folder.urls.map((url) => (
                  <li key={url.id} className="bookmark-node">
                    <BookmarkItem bookmark={url} parentId={folder.id} />
                  </li>
                ))}
              </ul>
            </SortableContext>
          )}
        </div>
      )}

      {/* 이 폴더에 URL 추가 모달 */}
      {showUrlEditor && (
        <BookmarkEditor
          onClose={() => setShowUrlEditor(false)}
          defaultParentId={folder.id}
        />
      )}

    </li>
  );
}

// 트리 리스트 (재귀 호출용)
function FolderTreeList({ items, depth }: { items: BookmarkFolderList; depth: number }) {
  const { searchQuery } = useBookmarkStore();

  const filteredItems = useMemo(
    () => filterBookmarks(items, searchQuery),
    [items, searchQuery]
  );

  return (
    <ul className="folder-tree" style={{ '--depth': depth } as React.CSSProperties}>
      {filteredItems.map((folder) => (
        <FolderNode key={folder.id} folder={folder} depth={depth} />
      ))}
    </ul>
  );
}

// 트리에서 폴더 ID로 해당 폴더의 URL 목록에서 인덱스를 찾는 헬퍼
const findBookmarkIndex = (
  folders: BookmarkFolderList,
  bookmarkId: string
): { parentId: string; index: number } | null => {
  for (const folder of folders) {
    const idx = folder.urls?.findIndex((u) => u.id === bookmarkId) ?? -1;
    if (idx !== -1) {
      return { parentId: folder.id, index: idx };
    }
    if (folder.folders) {
      const result = findBookmarkIndex(folder.folders, bookmarkId);
      if (result) return result;
    }
  }
  return null;
};

export function FolderTree({ items, depth = 0, isRoot = false }: FolderTreeProps) {
  const { moveBookmark, loadBookmarks } = useBookmarkStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragOver = (_event: DragOverEvent) => {
    // 향후 드래그 중 시각적 피드백 추가 가능
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData) return;

    // Case 1: 폴더 헤더에 드롭 → 다른 폴더로 이동
    if (overData?.type === 'folder') {
      const targetFolderId = overData.id as string;
      await moveBookmark(active.id as string, { parentId: targetFolderId });
      return;
    }

    // Case 2: 다른 북마크 위에 드롭 → 순서 변경
    const activeParentId = activeData.parentId as string;
    const overInfo = findBookmarkIndex(items, over.id as string);

    if (!overInfo) return;

    if (activeParentId === overInfo.parentId) {
      // 같은 폴더 내 순서 변경
      // Chrome API에서 index는 폴더 내 전체 자식(폴더+URL) 기준
      // 여기서는 URL의 상대 위치를 사용하되, 폴더 내 하위 폴더 개수를 오프셋으로 더함
      const folder = findFolderById(items, activeParentId);
      const subFolderCount = folder?.folders?.length || 0;
      const chromeIndex = subFolderCount + overInfo.index;

      await moveBookmark(active.id as string, {
        parentId: activeParentId,
        index: chromeIndex,
      });
    } else {
      // 다른 폴더의 북마크 위에 드롭 → 해당 폴더로 이동 (해당 위치에)
      const folder = findFolderById(items, overInfo.parentId);
      const subFolderCount = folder?.folders?.length || 0;
      const chromeIndex = subFolderCount + overInfo.index;

      await moveBookmark(active.id as string, {
        parentId: overInfo.parentId,
        index: chromeIndex,
      });
    }

    await loadBookmarks();
  };

  // 루트일 때만 Context 제공
  if (isRoot) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <FolderTreeList items={items} depth={depth} />
      </DndContext>
    );
  }

  return <FolderTreeList items={items} depth={depth} />;
}

// 폴더 ID로 폴더 찾기
function findFolderById(
  folders: BookmarkFolderList,
  folderId: string
): BookmarkFolder | null {
  for (const folder of folders) {
    if (folder.id === folderId) return folder;
    if (folder.folders) {
      const result = findFolderById(folder.folders, folderId);
      if (result) return result;
    }
  }
  return null;
}
