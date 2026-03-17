import { useState, useEffect } from 'react'
import { storageService } from '../../../services/storageService'

const CONSENT_KEY = 'privacyConsent'

/**
 * 개인정보 취급 방침 동의 모달 관련 상태와 로직을 관리하는 커스텀 훅
 */
function useConsent() {
  const [showConsent, setShowConsent] = useState(false)
  const [hasConsent, setHasConsent] = useState(false)

  // 컴포넌트 마운트 시 스토리지에서 동의 여부를 확인
  useEffect(() => {
    const checkConsent = async () => {
      try {
        const consent = await storageService.get<boolean>(CONSENT_KEY)
        setHasConsent(!!consent)
      } catch {
        setHasConsent(false)
      }
    }
    checkConsent()
  }, [])

  // 사용자가 동의 버튼을 클릭했을 때 — 스토리지에 저장 후 모달 닫기
  const handleConsent = async () => {
    await storageService.set(CONSENT_KEY, true)
    setHasConsent(true)
    setShowConsent(false)
  }

  // 동의가 아직 이루어지지 않았을 때 모달 표시
  const requestConsent = () => {
    setShowConsent(true)
  }

  return {
    showConsent,
    setShowConsent,
    hasConsent,
    handleConsent,
    requestConsent,
  }
}

export default useConsent
