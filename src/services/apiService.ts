/**
 * FastAPI 백엔드 통신 서비스
 * 북마크 동기화 및 크롤링 요청 처리
 */

import type {
  BookmarkFolderList,
  BookmarkItem,
  BookmarkCreateRequest,
  BookmarkUpdateRequest,
  ApiResponse,
} from '../types/bookmark'

// 백엔드 BaseResponse 타입 (Backend 기준)
interface BaseResponse<T> {
  code: number
  message: string
  data: T | null
  status: 'success' | 'error'
}

// API 기본 URL (환경에 따라 변경)
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * API 요청 헬퍼 (Backend BaseResponse 형식 처리)
 * 타임아웃 및 자동 재시도 로직 포함
 * AbortController 지원 추가 ✅
 */
const fetchApi = async <T>(
  endpoint: string,
  options?: RequestInit & { abortSignal?: AbortSignal }, // ✅ AbortSignal 추가
  retries = 2,
  timeoutMs = 10000
): Promise<ApiResponse<T>> => {
  try {
    const { headers: optionHeaders, abortSignal, ...restOptions } = options || {};

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(optionHeaders as Record<string, string>),
    };

    // ✅ 타임아웃용 AbortController 생성
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

    // ✅ 하위 호환성을 위한 signal 병합 로직
    let finalSignal: AbortSignal;

    if (abortSignal) {
      // 외부 signal과 timeout signal을 모두 처리
      // AbortSignal.any()가 없는 환경을 위한 수동 구현
      if (typeof AbortSignal.any === 'function') {
        // ✅ Chrome 119+ (최신 브라우저)
        finalSignal = AbortSignal.any([abortSignal, timeoutController.signal]);
      } else {
        // ✅ 구형 브라우저: 이벤트 리스너로 수동 처리
        finalSignal = abortSignal;

        // timeout signal이 abort되면 로그 출력
        const handleTimeoutAbort = () => {
          if (!abortSignal.aborted) {
            console.warn('[API] Request timeout');
          }
        };
        timeoutController.signal.addEventListener('abort', handleTimeoutAbort, { once: true });
      }
    } else {
      // 외부 signal이 없으면 timeout signal만 사용
      finalSignal = timeoutController.signal;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...restOptions,
      headers,
      signal: finalSignal, // ✅ 브라우저 호환성 확보된 signal 사용
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
       // 500번대 에러이면서 재시도 횟수가 남아있으면 재시도
      if (response.status >= 500 && retries > 0) {
          console.warn(`[API] Server error (${response.status}). Retrying... (${retries} retries left)`);
          const delay = (3 - retries) * 1000 + Math.random() * 500;
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchApi<T>(endpoint, options, retries - 1, timeoutMs);
      }

      // 서버 에러 메시지 추출 시도
      let errorMessage = `서버 오류 (${response.status})`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        if (response.status === 401) {
          errorMessage = 'Sync Key가 유효하지 않거나 만료되었습니다.';
        } else if (response.status === 404) {
          errorMessage = '요청한 리소스를 찾을 수 없습니다.';
        } else if (response.status >= 500) {
          errorMessage = '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
        }
      }
      throw new Error(errorMessage);
    }

    const backendResponse: BaseResponse<T> = await response.json();

    if (backendResponse.status === 'success') {
      return { success: true, data: backendResponse.data as T };
    } else {
      return { success: false, error: backendResponse.message || '요청 처리 중 오류가 발생했습니다.' };
    }
  } catch (error) {
    // ✅ AbortError 처리 (사용자가 취소한 경우)
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, error: '전송이 취소되었습니다.' };
    }

    // 네트워크 에러(TypeError)이면서 재시도 횟수가 남아있으면 재시도
    if (error instanceof TypeError && error.message.includes('fetch') && retries > 0) {
        console.warn(`[API] Network error. Retrying... (${retries} retries left)`);
        const delay = (3 - retries) * 1000 + Math.random() * 500;
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchApi<T>(endpoint, options, retries - 1, timeoutMs);
    }

    // 네트워크 에러 등 처리 (최종 실패 시)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { success: false, error: '네트워크 연결을 확인해주세요.' };
    }
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
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
 * 북마크를 Backend로 전송 (Directory Sync)
 * ✅ AbortSignal 지원 추가
 * @param syncKey DeepDive Notebook에서 발급받은 동기화 키 (이미 user_id와 notebook_id 포함)
 * @param bookmarks 전송할 북마크 트리 노드 목록
 * @param onProgress 진행률 콜백 (0-100)
 * @param abortSignal 취소 신호 (선택사항)
 */
export const syncBookmarks = async (
  syncKey: string,
  bookmarks: import('../types/bookmark').ExtensionBookmarkNode[],
  onProgress?: (progress: number) => void,
  abortSignal?: AbortSignal // ✅ 취소 신호 추가
): Promise<ApiResponse<void>> => {
  if (bookmarks.length === 0) {
    return { success: true };
  }

  // Backend DirectorySyncRequest 형식
  const payload = {
    sync_key: syncKey,
    bookmarks: bookmarks
  };

  if (onProgress) {
    onProgress(50); // 요청 시작
  }

  // ✅ abortSignal 전달
  const response = await fetchApi<void>('/directory/sync', {
    method: 'POST',
    body: JSON.stringify(payload),
    abortSignal, // ✅ 취소 신호 전달
  });

  if (onProgress) {
    onProgress(100); // 완료
  }

  return response;
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
};
