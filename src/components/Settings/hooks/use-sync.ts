import { useState, useEffect } from 'react';
import { useBookmarkStore } from '../../../store/bookmarkStore';

interface SyncMessage {
  text: string;
  type: 'success' | 'error' | 'info' | '';
}

/**
 * 북마크를 서버로 전송하는 전체 통신 프로세스 및 UI 상태를 관리하는 훅입니다.
 */
export const useSync = () => {
  const { 
    syncToServer, 
    cancelSync, 
    selectedIds, 
    isLoading,
    syncProgress 
  } = useBookmarkStore();

  const [syncKey, setSyncKey] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState<SyncMessage>({ text: '', type: '' });

  // 팝업이 예기치 않게 닫힐 경우(beforeunload) 전송을 안전하게 취소합니다.
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isLoading) {
        cancelSync();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isLoading, cancelSync]);

  // Settings 패널이 닫힐 때(언마운트) 진행 중인 sync 취소
  useEffect(() => {
    return () => {
      if (useBookmarkStore.getState().isLoading) {
        cancelSync();
      }
    };
  }, [cancelSync]);

  /**
   * 전송 프로세스를 시작합니다.
   * 동기화를 실행하고 성공/실패 여부에 따라 UI 메시지를 세팅합니다.
   */
  const startSync = async () => {
    // 1. 입력 검증
    if (!syncKey.trim()) {
      setMessage({ text: 'Key를 먼저 입력해주세요.', type: 'error' });
      return false; // 필수값 누락
    }

    if (selectedIds.size === 0) {
      setMessage({ text: '전송할 북마크를 하나 이상 선택해주세요.', type: 'error' });
      return false;
    }

    // 2. 동기화 실행
    setIsImporting(true);
    setMessage({ text: 'Kalpie Notebook으로 안전하게 전송 중입니다...', type: 'info' });

    try {
      await syncToServer(syncKey);

      const latestError = useBookmarkStore.getState().error;
      if (latestError) {
        setMessage({ text: `전송 실패: ${latestError}`, type: 'error' });
        return false;
      } else {
        setMessage({ text: '🎉 성공적으로 전송되었습니다!', type: 'success' });
        // 일정 시간 후 성공 메시지를 초기화합니다.
        setTimeout(() => setMessage({ text: '', type: '' }), 5000);
        return true;
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      setMessage({ text: `오류: ${msg}`, type: 'error' });
      return false;
    } finally {
      setIsImporting(false);
    }
  };

  /**
   * 전송을 중간에 취소합니다.
   */
  const handleCancelSync = () => {
    cancelSync();
    setIsImporting(false);
    setMessage({ text: '전송이 취소되었습니다.', type: 'info' });
  };

  return {
    syncKey,
    setSyncKey,
    isImporting,
    syncProgress,
    message,
    setMessage,
    startSync,
    handleCancelSync,
  };
};
