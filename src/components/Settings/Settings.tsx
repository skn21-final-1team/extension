import { useState } from 'react'
import { X, Send, Eye, EyeOff, Folder, CheckCircle2, AlertCircle, Cloud } from 'lucide-react'
import { useBookmarkStore } from '../../store/bookmarkStore'
import useConsent from './hooks/use-consent'
import useSync from './hooks/use-sync'
import './Settings.css'

interface SettingsProps {
  onClose: () => void
}

function Settings({ onClose }: SettingsProps) {
  const { selectedIds, selectedFolderIds, bookmarks } = useBookmarkStore()
  const { showConsent, setShowConsent, hasConsent, handleConsent, requestConsent } = useConsent()
  const { syncKey, setSyncKey, isImporting, message, startSync, handleCancelSync } = useSync()
  const [showSyncKey, setShowSyncKey] = useState(false)

  const handleImportClick = () => {
    if (!hasConsent) { requestConsent(); return }
    startSync()
  }

  return (
    <>
      {/* ── 동기화 패널 ── */}
      <div className="form-panel">
        <div className="fp-head">
          <span className="fp-title">
            <span className="settings-cloud-icon">
              <Cloud size={11} />
            </span>
            Notebook으로 동기화
          </span>
          <button className="fp-close" onClick={onClose}><X size={12} /></button>
        </div>

        <div className="fp-body">
          {/* Sync Key 입력 */}
          <div className="drawer-field">
            <label className="drawer-label">Sync Key</label>
            <div className="settings-key-wrap">
              <input
                type={showSyncKey ? 'text' : 'password'}
                className="input fp-input settings-key-input"
                value={syncKey}
                onChange={(e) => setSyncKey(e.target.value)}
                placeholder="발급받은 Key 입력"
                disabled={isImporting}
              />
              <button
                type="button"
                className="settings-eye-btn"
                onClick={() => setShowSyncKey((v) => !v)}
              >
                {showSyncKey ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
            </div>
          </div>

          {/* 선택된 항목 요약 */}
          <div className="drawer-info-box">
            <div className="settings-info-row">
              <span className="settings-info-label">선택된 폴더</span>
              <span className="settings-count-badge">{selectedFolderIds.size}개</span>
            </div>
            <div className="settings-info-sub">
              북마크 <strong>{selectedIds.size}</strong>개 포함
            </div>
            {selectedFolderIds.size === 0 ? (
              <p className="settings-hint">폴더 체크박스를 선택해주세요</p>
            ) : (
              <div className="settings-folder-list">
                {bookmarks
                  .filter((f) => selectedFolderIds.has(f.id))
                  .slice(0, 3)
                  .map((f) => (
                    <div key={f.id} className="settings-folder-item">
                      <Folder size={9} className="settings-folder-icon" />
                      {f.name}
                    </div>
                  ))}
                {selectedFolderIds.size > 3 && (
                  <span className="settings-more">+{selectedFolderIds.size - 3}개 더...</span>
                )}
              </div>
            )}
          </div>

          {/* 결과 메시지 */}
          {message && (
            <div className={`settings-message settings-message--${message.type}`}>
              {message.type === 'success'
                ? <CheckCircle2 size={11} className="settings-msg-icon" />
                : <AlertCircle size={11} className="settings-msg-icon" />}
              {message.text}
            </div>
          )}

          {/* 전송 버튼 */}
          {isImporting ? (
            <button className="btn btn-secondary fp-btn settings-btn-full" onClick={handleCancelSync}>
              취소
            </button>
          ) : (
            <button
              className="btn btn-primary fp-btn settings-btn-full"
              onClick={handleImportClick}
              disabled={!syncKey || (selectedIds.size === 0 && selectedFolderIds.size === 0)}
            >
              <Send size={11} /> Notebook으로 전송
            </button>
          )}
        </div>
      </div>

      {/* ── 개인정보 동의 드로어 (z-60, app-main 전체 덮음) ── */}
      {showConsent && (
        <div
          className="drawer-overlay settings-consent-overlay"
          onClick={() => setShowConsent(false)}
        >
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-grip" />
            <div className="drawer-head">
              <div className="drawer-head-icon settings-consent-icon">
                <span className="settings-lock-emoji">🔒</span>
              </div>
              <span className="drawer-head-title">개인정보 보호 안내</span>
              <button className="drawer-close" onClick={() => setShowConsent(false)}>
                <X size={14} />
              </button>
            </div>
            <div className="drawer-divider" />
            <div className="drawer-body">
              <p className="settings-consent-text">
                이 확장프로그램은 사용자가 직접 선택한 북마크만 Kalpie Notebook에 저장합니다.
              </p>
              <div className="settings-consent-list">
                {['선택한 북마크만 전송', '언제든지 자유롭게 삭제 가능', '안전한 통신망(HTTPS)을 통한 전송'].map((text) => (
                  <div key={text} className="settings-consent-item">
                    <CheckCircle2 size={13} className="settings-consent-check" />
                    {text}
                  </div>
                ))}
              </div>
            </div>
            <div className="drawer-footer">
              <button className="btn btn-primary flex-1" onClick={handleConsent}>
                동의하고 계속하기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Settings
