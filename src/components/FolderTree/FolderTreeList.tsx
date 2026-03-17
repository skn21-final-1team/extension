/**
 * FolderTreeList — 재귀 폴더 리스트 래퍼
 */

import { memo, useMemo } from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { BookmarkFolderList } from '../../types/bookmark'
import { useBookmarkStore } from '../../store/bookmarkStore'
import { filterBookmarks } from './tree-utils'
import FolderNode from './FolderNode'

interface FolderTreeListProps {
  items: BookmarkFolderList
  depth: number
  parentId: string | undefined
}

export const FolderTreeList = memo(({ items, depth, parentId }: FolderTreeListProps) => { // named export — FolderNode, FolderTree에서 사용
  const { searchQuery } = useBookmarkStore()
  // 루트에서만 필터 적용 — 하위 FolderTreeList는 이미 필터된 items를 받음
  const filteredItems = useMemo(
    () => parentId === undefined ? filterBookmarks(items, searchQuery) : items,
    [items, searchQuery, parentId]
  )
  const folderIds = useMemo(() => filteredItems.map((f) => f.id), [filteredItems])

  return (
    <SortableContext items={folderIds} strategy={verticalListSortingStrategy}>
      <ul className="tree-root">
        {filteredItems.map((folder) => (
          <FolderNode key={folder.id} folder={folder} depth={depth} parentId={parentId} />
        ))}
      </ul>
    </SortableContext>
  )
})

export default FolderTreeList
