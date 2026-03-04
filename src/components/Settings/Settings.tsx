/**
 * Settings 컴포넌트 — 하단 패널 형태 (Notebook 동기화)
 */

import { useState } from 'react';
import { X, Send, Eye, EyeOff, Folder, CheckCircle2, AlertCircle, Cloud } from 'lucide-react';
import { useBookmarkStore } from '../../store/bookmarkStore';
import { useConsent } from './hooks/use-consent';
import { useSync } from './hooks/use-sync';

interface SettingsProps {
  onClose: () => void;
}

export const Settings = ({ onClose }: SettingsProps) => {
  const { selectedIds, selectedFolderIds, bookmarks } = useBookmarkStore();
  const { showConsent, setShowConsent, hasConsent, handleConsent, requestConsent } = useConsent();
  const { syncKey, setSyncKey, isImporting, message, startSync, handleCancelSync } = useSync();
  const [showSyncKey, setShowSyncKey] = useState(false);

  const handleImportClick = () => {
    if (!hasConsent) { requestConsent(); return; }
    startSync();
  };

  return (
    <>
      {/* ── 동기화 패널 ── */}
      <div className="form-panel">
        <div className="fp-head">
          <span className="fp-title">
            <span style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 20, height: 20, borderRadius: 5,
              background: 'rgba(139,92,246,0.15)', flexShrink: 0,
            }}>
              <Cloud size={11} style={{ color: 'var(--accent-color)' }} />
            </span>
            Notebook으로 동기화
          </span>
          <button className="fp-close" onClick={onClose}><X size={12} /></button>
        </div>

        <div className="fp-body">
          {/* Sync Key 입력 */}
          <div className="drawer-field">
            <label className="drawer-label">Sync Key</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showSyncKey ? 'text' : 'password'}
                className="input fp-input"
                style={{ paddingRight: '30px' }}
                value={syncKey}
                onChange={(e) => setSyncKey(e.target.value)}
                placeholder="발급받은 Key 입력"
                disabled={isImporting}
              />
              <button
                type="button"
                onClick={() => setShowSyncKey((v) => !v)}
                style={{
                  position: 'absolute', right: '8px',
                  color: 'var(--text-muted)', background: 'none',
                  border: 'none', cursor: 'pointer', padding: 0,
                  display: 'flex', alignItems: 'center',
                }}
              >
                {showSyncKey ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
            </div>
          </div>

          {/* 선택된 항목 요약 */}
          <div className="drawer-info-box">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>선택된 폴더</span>
              <span style={{
                fontSize: 10, fontWeight: 600,
                padding: '1px 7px', borderRadius: 20,
                background: 'var(--accent-bg)', color: 'var(--accent-hover)',
              }}>
                {selectedFolderIds.size}개
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              북마크 <strong style={{ color: 'var(--text-primary)' }}>{selectedIds.size}</strong>개 포함
            </div>
            {selectedFolderIds.size === 0 ? (
              <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>폴더 체크박스를 선택해주세요</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {bookmarks
                  .filter((f) => selectedFolderIds.has(f.id))
                  .slice(0, 3)
                  .map((f) => (
                    <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-primary)' }}>
                      <Folder size={9} style={{ color: '#fbbf24', flexShrink: 0 }} />
                      {f.name}
                    </div>
                  ))}
                {selectedFolderIds.size > 3 && (
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>+{selectedFolderIds.size - 3}개 더...</span>
                )}
              </div>
            )}
          </div>

          {/* 결과 메시지 */}
          {message.text && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 11, padding: '7px 10px', borderRadius: 7,
              background: message.type === 'success' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
              color: message.type === 'success' ? 'var(--success-color)' : 'var(--error-color)',
              border: `1px solid ${message.type === 'success' ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`,
            }}>
              {message.type === 'success'
                ? <CheckCircle2 size={11} style={{ flexShrink: 0 }} />
                : <AlertCircle size={11} style={{ flexShrink: 0 }} />}
              {message.text}
            </div>
          )}

          {/* 전송 버튼 */}
          {isImporting ? (
            <button className="btn btn-secondary fp-btn" style={{ width: '100%' }} onClick={handleCancelSync}>취소</button>
          ) : (
            <button
              className="btn btn-primary fp-btn"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
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
          className="drawer-overlay"
          style={{ zIndex: 60 }}
          onClick={() => setShowConsent(false)}
        >
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-grip" />
            <div className="drawer-head">
              <div className="drawer-head-icon" style={{ background: 'rgba(52,211,153,0.15)' }}>
                <span style={{ fontSize: 14, lineHeight: 1 }}>🔒</span>
              </div>
              <span className="drawer-head-title">개인정보 보호 안내</span>
              <button className="drawer-close" onClick={() => setShowConsent(false)}><X size={14} /></button>
            </div>
            <div className="drawer-divider" />
            <div className="drawer-body">
              <p style={{ fontSize: 12, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                이 확장프로그램은 사용자가 직접 선택한 북마크만 Kalpie Notebook에 저장합니다.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {['선택한 북마크만 전송', '언제든지 자유롭게 삭제 가능', '안전한 통신망(HTTPS)을 통한 전송'].map((text) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-primary)' }}>
                    <CheckCircle2 size={13} style={{ color: 'var(--success-color)', flexShrink: 0 }} />
                    {text}
                  </div>
                ))}
              </div>
            </div>
            <div className="drawer-footer">
              <button className="btn btn-primary flex-1" onClick={handleConsent}>동의하고 계속하기</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
