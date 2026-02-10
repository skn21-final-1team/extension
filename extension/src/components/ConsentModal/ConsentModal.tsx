/**
 * 동의 모달 컴포넌트
 * 최초 동기화 시 프라이버시 동의
 */

import { useState, useEffect } from 'react';
import { storageService } from '../../services/storageService';
import './ConsentModal.css';

const CONSENT_KEY = 'privacyConsent';

export function ConsentModal() {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // 동의 여부 확인
    const checkConsent = async () => {
      const hasConsent = await storageService.get<boolean>(CONSENT_KEY);
      if (!hasConsent) {
        setShowModal(true);
      }
    };
    checkConsent();
  }, []);

  const handleAccept = async () => {
    await storageService.set(CONSENT_KEY, true);
    setShowModal(false);
  };

  if (!showModal) return null;

  return (
    <div className="consent-overlay">
      <div className="consent-modal">
        <div className="consent-icon">🔒</div>
        <h2 className="consent-title">개인정보 보호 안내</h2>
        <p className="consent-text">
          이 확장프로그램은 선택한 북마크만 서버에 저장합니다.
          <br />
          <br />
          <strong>✓ 선택한 북마크만 전송</strong>
          <br />
          <strong>✓ 데이터 암호화 보관</strong>
          <br />
          <strong>✓ 언제든지 삭제 가능</strong>
        </p>
        <button className="btn btn-primary consent-btn" onClick={handleAccept}>
          동의하고 시작하기
        </button>
      </div>
    </div>
  );
}
