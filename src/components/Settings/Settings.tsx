
import { useBookmarkStore } from '../../store/bookmarkStore';
import { useConsent } from './hooks/use-consent';
import { useSync } from './hooks/use-sync';

import './Settings.css';

/**
 * 북마크 동기화 및 개인정보 보호 동의를 제어하는 설정 컴포넌트입니다.
 * 비즈니스 로직은 커스텀 훅으로 위임하여 UI 렌더링에만 집중합니다.
 */
export const Settings = () => {
  const { selectedIds, selectedFolderIds, bookmarks } = useBookmarkStore();
  
  // ✅ 기능 단위로 분리된 커스텀 훅 사용
  const { 
    showConsent, 
    setShowConsent, 
    hasConsent, 
    handleConsent, 
    requestConsent 
  } = useConsent();

  const {
    syncKey,
    setSyncKey,
    isImporting,
    message,
    startSync,
    handleCancelSync,
  } = useSync();

  // 선택된 총 북마크 개수 계산 (직접 Set size 사용)
  const totalSelectedUrls = selectedIds.size;

  /** 
   * 전송 버튼 클릭 핸들러 
   * 동의 여부를 먼저 확인한 뒤 동기화 로직을 트리거합니다.
   */
  const handleImportClick = () => {
    if (!hasConsent) {
      requestConsent();
      return;
    }
    // 동의가 완료되었으면 동기화 진행
    startSync();
  };

  return (
    <>
      <div className="settings-panel">
        <h3>설정</h3>

        {/* Sync Key 입력 섹션 */}
        <div className="input-group">
          <label>Sync Key</label>
          <div className="input-row">
            <input
              type="text"
              value={syncKey}
              onChange={(e) => setSyncKey(e.target.value)}
              placeholder="Kalpie Notebook에서 발급받은 Key 입력"
              disabled={isImporting} // 전송 중 비활성화
            />
          </div>
          <p className="help-text">💡 Kalpie Notebook에서 Key를 발급받아 입력하세요.</p>
        </div>

        <hr />

        {/* 선택된 폴더 요약 섹션 */}
        <div className="selected-folders-info">
          <label>
            선택된 폴더 <span className="badge">{selectedFolderIds.size}개</span>
          </label>
          
          <div className="selection-stats">
            <span>총 포함된 북마크: <strong>{totalSelectedUrls}</strong>개</span>
          </div>

          {selectedFolderIds.size === 0 ? (
            <p className="info-text">하단 목록에서 전송할 폴더를 체크해주세요</p>
          ) : (
            <div className="selected-folders-list">
              {bookmarks
                .filter(folder => selectedFolderIds.has(folder.id))
                .map(folder => (
                  <div key={folder.id} className="selected-folder-item">
                    📁 {folder.name}
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* 액션 버튼 섹션 */}
        <div className="action-group">
          {/* 전송 중일 때 취소 버튼 표시 */}
          {isImporting ? (
            <button
              className="cancel-btn-compact"
              onClick={handleCancelSync}
            >
              취소
            </button>
          ) : (
            <button
              className="import-btn"
              onClick={handleImportClick}
              disabled={!syncKey || selectedIds.size === 0}
            >
              Notebook으로 전송 (Send)
            </button>
          )}
          
          {/* 상태 메시지 렌더링 */}
          {message.text && (
              <div className={`status-message ${message.type}`}>
                  {message.text}
              </div>
          )}
        </div>
      </div>

      {/* 개인정보 동의 모달 */}
        {showConsent && (
        <div className="consent-overlay" onClick={() => setShowConsent(false)}>
          <div className="consent-modal" onClick={(e) => e.stopPropagation()}>
            <div className="consent-icon">🔒</div>
            <h2 className="consent-title">개인정보 보호 안내</h2>
            <p className="consent-text">
              이 확장프로그램은 사용자가 직접 선택한 북마크만 Kalpie Notebook에 저장합니다.
              <br />
              <br />
              <strong>✓ 선택한 북마크만 전송</strong>
              <br />
              <strong>✓ 언제든지 자유롭게 삭제 가능</strong>
              <br />
              <strong>✓ 안전한 통신망(HTTPS)을 통한 전송</strong>
            </p>
            <button className="import-btn consent-btn" onClick={handleConsent}>
              동의하고 계속하기
            </button>
          </div>
        </div>
      )}
    </>
  );
};
