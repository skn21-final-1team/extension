/**
 * UI 슬라이스 — loadBookmarks, toggleFolder, setSearchQuery, expandAll, collapseAll
 */

import type { BookmarkState, SliceCreator } from '../types'
import { bookmarkService } from '../../services/bookmarkService'
import { collectSubFolderIds } from '../store-utils'

type UiSlice = Pick<
  BookmarkState,
  'loadBookmarks' | 'toggleFolder' | 'setSearchQuery' | 'expandAll' | 'collapseAll'
>

export const createUiSlice: SliceCreator<UiSlice> = (set, get) => ({
  loadBookmarks: async () => {
    set({ isLoading: true, error: null })
    try {
      const bookmarks = await bookmarkService.getAll()
      set({ bookmarks, isLoading: false })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '북마크 로드 실패'
      set({ error: message, isLoading: false })
    }
  },

  toggleFolder: (id: string) => {
    set((state) => {
      const newExpanded = new Set(state.expandedFolderIds)
      if (newExpanded.has(id)) {
        newExpanded.delete(id)
      } else {
        newExpanded.add(id)
      }
      return { expandedFolderIds: newExpanded }
    })
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query })
  },

  expandAll: () => {
    const allFolderIds = collectSubFolderIds(get().bookmarks)
    set({ expandedFolderIds: new Set(allFolderIds) })
  },

  collapseAll: () => {
    set({ expandedFolderIds: new Set() })
  },
})
