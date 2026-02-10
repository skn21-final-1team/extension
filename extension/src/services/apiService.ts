/**
 * FastAPI 백엔드 통신 서비스
 * 북마크 동기화 및 크롤링 요청 처리
 */

import type {
  BookmarkFolder,
  BookmarkFolderList,
  BookmarkItem,
  BookmarkCreateRequest,
  BookmarkUpdateRequest,
  ApiResponse,
} from '../types/bookmark'

// 동기화 관련 타입 (백엔드 API 정의 후 공용 타입으로 이동 예정)
interface SyncRequest {
  folders: BookmarkFolder[]
  chunkIndex: number
  totalChunks: number
}

interface SyncResponse {
  success: boolean
  message: string
  syncedCount: number
}

// API 기본 URL (환경에 따라 변경)
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// 청크 사이즈 (대용량 처리용)
const CHUNK_SIZE = 500;

// API 키 (메모리에만 보관)
let _apiKey = '';

export const setApiKey = (key: string) => {
  _apiKey = key;
};

/**
 * API 요청 헬퍼
 */
const fetchApi = async <T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string>),
    };

    if (_apiKey) {
      headers['Authorization'] = `Bearer ${_apiKey}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers,
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
};

/**
 * 전체 북마크 조회
 */
export const getBookmarks = async (): Promise<ApiResponse<BookmarkFolderList>> => {
  return fetchApi<BookmarkFolderList>('/bookmarks');
};

/**
 * 북마크 생성
 */
export const createBookmark = async (
  data: BookmarkCreateRequest
): Promise<ApiResponse<BookmarkItem>> => {
  return fetchApi<BookmarkItem>('/bookmarks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * 북마크 수정
 */
export const updateBookmark = async (
  id: string,
  data: BookmarkUpdateRequest
): Promise<ApiResponse<BookmarkItem>> => {
  return fetchApi<BookmarkItem>(`/bookmarks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * 북마크 삭제
 */
export const deleteBookmark = async (
  id: string
): Promise<ApiResponse<void>> => {
  return fetchApi<void>(`/bookmarks/${id}`, {
    method: 'DELETE',
  });
};

/**
 * 북마크 청크 동기화 (대용량 처리)
 * @param bookmarks 동기화할 북마크 배열
 * @param onProgress 진행률 콜백 (0-100)
 */
/**
 * 북마크 청크 동기화 (대용량 처리)
 * @param bookmarks 동기화할 북마크 폴더 리스트
 * @param onProgress 진행률 콜백 (0-100)
 */
export const syncBookmarks = async (
  bookmarks: BookmarkFolderList,
  onProgress?: (progress: number) => void
): Promise<ApiResponse<SyncResponse>> => {
  // 최상위 폴더 단위로 청크 분할
  const totalChunks = Math.ceil(bookmarks.length / CHUNK_SIZE);
  let totalSynced = 0;

  // 만약 bookmarks가 비어있으면?
  if (bookmarks.length === 0) {
      return { success: true, data: { success: true, message: '동기화 할 항목 없음', syncedCount: 0 } };
  }

  // 1개 청크로 처리 (트리 구조 복잡성 때문에 단순 분할 어려움)
  // 대용량 처리가 꼭 필요하다면 재귀적으로 평탄화해서 보내야 하지만,
  // Frontend 스키마가 트리 구조를 요구하므로 일단 통째로 보내거나 최상위 폴더별로 보냄.
  // 여기서는 최상위 폴더 갯수가 적으므로(보통 2~3개), CHUNK_SIZE보다 작을 확률 높음.
  // 따라서 그냥 한 번에 보내는 로직으로 단순화하거나, 상위 폴더 단위로 쪼깸.
  
  // 여기서는 단순히 배열 슬라이싱 사용 (최상위 폴더 단위)
  for (let i = 0; i < totalChunks; i++) {
    const chunk = bookmarks.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);

    const syncRequest: SyncRequest = {
      folders: chunk,
      chunkIndex: i,
      totalChunks,
    };

    const response = await fetchApi<SyncResponse>('/bookmarks/sync', {
      method: 'POST',
      body: JSON.stringify(syncRequest),
    });

    if (!response.success) {
      return response;
    }

    // 대략적인 진행률 (항목 수가 아닌 청크 단위)
    totalSynced += chunk.length; // 상위 폴더 개수임

    if (onProgress) {
      const progress = Math.round(((i + 1) / totalChunks) * 100);
      onProgress(progress);
    }
  }

  return {
    success: true,
    data: {
      success: true,
      message: '동기화 완료',
      syncedCount: totalSynced,
    },
  };
};

/**
 * 크롤링 요청
 */
export const requestCrawl = async (
  bookmarkId: string
): Promise<ApiResponse<{ status: string }>> => {
  return fetchApi<{ status: string }>(`/bookmarks/${bookmarkId}/crawl`, {
    method: 'POST',
  });
};

export const apiService = {
  getBookmarks,
  createBookmark,
  updateBookmark,
  deleteBookmark,
  syncBookmarks,
  requestCrawl,
  setApiKey,
};
