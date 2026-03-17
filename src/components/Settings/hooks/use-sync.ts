import { useState, useEffect } from 'react'
import { useBookmarkStore } from '../../../store/bookmarkStore'

interface SyncMessage {
  text: string
  type: 'success' | 'error' | 'info'
}

/**
 * 북마크를 서버로 전송하는 전체 통신 프로세스 및 UI 상태를 관리하는 훅
 */
function useSync() {
  const {
    syncToServer,
    cancelSync,
    selectedIds,
    isLoading,
    syncProgress,
  } = useBookmarkStore()

  const [syncKey, setSyncKey] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [message, setMessage] = useState<SyncMessage | null>(null)

  // 팝업이 예기치 않게 닫힐 경우(beforeunload) 전송을 안전하게 취소
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isLoading) cancelSync()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isLoading, cancelSync])

  // Settings 패널이 닫힐 때(언마운트) 진행 중인 sync 취소
  useEffect(() => {
    return () => {
      if (useBookmarkStore.getState().syncAbortController) {
        cancelSync()
      }
    }
  }, [cancelSync])

  /**
   * 전송 프로세스를 시작
   */
  const startSync = async () => {
    if (!syncKey.trim()) {
      setMessage({ text: 'Key를 먼저 입력해주세요.', type: 'error' })
      return false
    }

    if (selectedIds.size === 0) {
      setMessage({ text: '전송할 북마크를 하나 이상 선택해주세요.', type: 'error' })
      return false
    }

    setIsImporting(true)
    setMessage({ text: 'Kalpie Notebook으로 안전하게 전송 중입니다...', type: 'info' })

    try {
      const success = await syncToServer(syncKey)

      if (!success) {
        const latestError = useBookmarkStore.getState().error
        setMessage({ text: `전송 실패: ${latestError || '알 수 없는 오류'}`, type: 'error' })
        return false
      } else {
        setMessage({ text: '성공적으로 전송되었습니다!', type: 'success' })
        setTimeout(() => setMessage(null), 5000)
        return true
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      setMessage({ text: `오류: ${msg}`, type: 'error' })
      return false
    } finally {
      setIsImporting(false)
    }
  }

  /**
   * 전송을 중간에 취소
   */
  const handleCancelSync = () => {
    cancelSync()
    setIsImporting(false)
    setMessage({ text: '전송이 취소되었습니다.', type: 'info' })
  }

  return {
    syncKey,
    setSyncKey,
    isImporting,
    syncProgress,
    message,
    setMessage,
    startSync,
    handleCancelSync,
  }
}

export default useSync
