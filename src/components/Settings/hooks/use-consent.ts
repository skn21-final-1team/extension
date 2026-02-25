import { useState, useEffect } from 'react';
import { storageService } from '../../../services/storageService';

const CONSENT_KEY = 'privacyConsent';

/**
 * 개인정보 취급 방침 동의 모달 관련 상태와 로직을 관리하는 커스텀 훅입니다.
 */
export const useConsent = () => {
  const [showConsent, setShowConsent] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);

  // 컴포넌트 마운트 시 스토리지에서 동의 여부를 확인합니다.
  useEffect(() => {
    const checkConsent = async () => {
      const consent = await storageService.get<boolean>(CONSENT_KEY);
      setHasConsent(!!consent);
    };
    checkConsent();
  }, []);

  /**
   * 사용자가 동의 버튼을 클릭했을 때 호출됩니다.
   * 스토리지에 동의 내역을 저장하고 모달을 닫습니다.
   */
  const handleConsent = async () => {
    await storageService.set(CONSENT_KEY, true);
    setHasConsent(true);
    setShowConsent(false);
  };

  /**
   * 동의가 아직 이루어지지 않았을 때 모달을 띄우는 함수입니다.
   */
  const requestConsent = () => {
    setShowConsent(true);
  };

  return {
    showConsent,
    setShowConsent,
    hasConsent,
    handleConsent,
    requestConsent,
  };
};
