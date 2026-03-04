/**
 * FastAPI 백엔드 통신 서비스
 * 북마크 동기화 전송 처리
 */

import type { ApiResponse } from '../types/bookmark'

// 백엔드 BaseResponse 타입
interface BaseResponse<T> {
  code: number
  message: string
  data: T | null
  status: 'success' | 'error'
}

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * API 요청 헬퍼 (타임아웃, 재시도, AbortSignal 지원)
 */
const fetchApi = async <T>(
  endpoint: string,
  options?: RequestInit & { abortSignal?: AbortSignal },
  retries = 2,
  timeoutMs = 10000
): Promise<ApiResponse<T>> => {
  try {
    const { headers: optionHeaders, abortSignal, ...restOptions } = options || {};

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(optionHeaders as Record<string, string>),
    };

    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

    let finalSignal: AbortSignal;

    if (abortSignal) {
      if (typeof AbortSignal.any === 'function') {
        finalSignal = AbortSignal.any([abortSignal, timeoutController.signal]);
      } else {
        finalSignal = abortSignal;
        timeoutController.signal.addEventListener('abort', () => {
          if (!abortSignal.aborted) {
            console.warn('[API] Request timeout');
          }
        }, { once: true });
      }
    } else {
      finalSignal = timeoutController.signal;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...restOptions,
      headers,
      signal: finalSignal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status >= 500 && retries > 0) {
        console.warn(`[API] Server error (${response.status}). Retrying... (${retries} left)`);
        const delay = (3 - retries) * 1000 + Math.random() * 500;
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchApi<T>(endpoint, options, retries - 1, timeoutMs);
      }

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
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, error: '전송이 취소되었습니다.' };
    }

    if (error instanceof TypeError && error.message.includes('fetch') && retries > 0) {
      console.warn(`[API] Network error. Retrying... (${retries} left)`);
      const delay = (3 - retries) * 1000 + Math.random() * 500;
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchApi<T>(endpoint, options, retries - 1, timeoutMs);
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { success: false, error: '네트워크 연결을 확인해주세요.' };
    }
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return { success: false, error: message };
  }
};

/**
 * 북마크를 Backend로 전송 (Directory Sync)
 */
export const syncBookmarks = async (
  syncKey: string,
  bookmarks: import('../types/bookmark').ExtensionBookmarkNode[],
  onProgress?: (progress: number) => void,
  abortSignal?: AbortSignal
): Promise<ApiResponse<void>> => {
  if (bookmarks.length === 0) {
    return { success: true };
  }

  const payload = {
    sync_key: syncKey,
    bookmarks: bookmarks
  };

  if (onProgress) onProgress(50);

  const response = await fetchApi<void>('/directory/sync', {
    method: 'POST',
    body: JSON.stringify(payload),
    abortSignal,
  });

  if (onProgress) onProgress(100);

  return response;
};

export const apiService = {
  syncBookmarks,
};
