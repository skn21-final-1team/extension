/**
 * FolderTree 컴포넌트 — VS Code 스타일 트리 구조
 * DndContext를 래핑하고 드래그 이벤트를 처리하는 메인 엔트리
 */

import {
  DndContext, DragEndEvent, closestCenter,
  PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import type { BookmarkFolderList } from '../../types/bookmark';
import { useBookmarkStore } from '../../store/bookmarkStore';
import { getSubFolderIds } from '../../store/store-utils';
import { bookmarkService } from '../../services/bookmarkService';
import { findBookmarkIndex } from './tree-utils';
import { FolderTreeList } from './FolderTreeList';
import './FolderTree.css';

interface FolderTreeProps {
  items: BookmarkFolderList;
  depth?: number;
  isRoot?: boolean;
}

export function FolderTree({ items, depth = 0, isRoot = false }: FolderTreeProps) {
  const { moveBookmark } = useBookmarkStore();
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
        // 같은 부모 내에서 순서 변경 — Chrome 실제 인덱스 사용
        const children = await bookmarkService.getChildren(activeParentId || '0');
        const overChromeIndex = children.findIndex((c) => c.id === (over.id as string));
        if (overChromeIndex === -1) return;

        await moveBookmark(active.id as string, {
          parentId: activeParentId,
          index: overChromeIndex,
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

      // Chrome 실제 인덱스 사용 (폴더·URL 혼재 순서 반영)
      const children = await bookmarkService.getChildren(overInfo.parentId);
      const overChromeIndex = children.findIndex((c) => c.id === (over.id as string));
      if (overChromeIndex === -1) return;

      await moveBookmark(active.id as string, {
        parentId: overInfo.parentId,
        index: overChromeIndex,
      });
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
