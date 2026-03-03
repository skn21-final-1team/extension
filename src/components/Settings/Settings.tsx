/**
 * Settings 컴포넌트 — 모달 형태 (부가 기능: API 동기화)
 * 헤더의 Cloud 아이콘 클릭 시 오버레이로 표시됩니다.
 */

import { useState } from 'react';
import { X, Send, Eye, EyeOff, Folder, CheckCircle2, AlertCircle } from 'lucide-react';
import { useBookmarkStore } from '../../store/bookmarkStore';
import { useConsent } from './hooks/use-consent';
import { useSync } from './hooks/use-sync';

interface SettingsProps {
  onClose: () => void;
}

export const Settings = ({ onClose }: SettingsProps) => {
  const { selectedIds, selectedFolderIds, bookmarks } = useBookmarkStore();

  const {
    showConsent,
    setShowConsent,
    hasConsent,
    handleConsent,
    requestConsent,
  } = useConsent();

  const {
    syncKey,
    setSyncKey,
    isImporting,
    message,
    startSync,
    handleCancelSync,
  } = useSync();

  const [showSyncKey, setShowSyncKey] = useState(false);
  const totalSelectedUrls = selectedIds.size;

  const handleImportClick = () => {
    if (!hasConsent) {
      requestConsent();
      return;
    }
    startSync();
  };

  return (
    <>
      {/* 모달 오버레이 — 클릭 시 닫기 */}
      <div
        className="absolute inset-0 z-50 flex flex-col modal-overlay"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        {/* 모달 패널 */}
        <div
          className="mt-auto w-full rounded-t-2xl overflow-hidden modal-sheet"
          style={{
            background: 'var(--bg-elevated)',
            boxShadow: '0 -8px 40px rgba(0,0,0,0.5), 0 -1px 0 var(--border-default)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 드래그 핸들 */}
          <div className="flex justify-center pt-2.5 pb-0">
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)' }} />
          </div>
          {/* 모달 헤더 */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--accent-bg)' }}
              >
                <span style={{ fontSize: 14 }}>☁️</span>
              </div>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                Notebook으로 동기화
              </h3>
            </div>
            <button
              className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onClick={onClose}
            >
              <X size={16} />
            </button>
          </div>

          {/* 모달 본문 */}
          <div className="p-4 flex flex-col gap-4">
            {/* Sync Key 입력 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                SYNC KEY
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showSyncKey ? 'text' : 'password'}
                  className="input"
                  style={{ paddingRight: '32px', width: '100%' }}
                  value={syncKey}
                  onChange={(e) => setSyncKey(e.target.value)}
                  placeholder="Kalpie Notebook에서 발급받은 Key 입력"
                  disabled={isImporting}
                />
                <button
                  type="button"
                  onClick={() => setShowSyncKey((v) => !v)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  title={showSyncKey ? '숨기기' : '보기'}
                >
                  {showSyncKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                💡 Kalpie Notebook에서 Key를 발급받아 입력하세요.
              </p>
            </div>

            {/* 선택된 폴더 요약 */}
            <div
              className="rounded-lg p-3 flex flex-col gap-2"
              style={{ background: 'var(--bg-hover)' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  선택된 폴더
                </span>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--accent-bg)', color: 'var(--accent-hover)' }}
                >
                  {selectedFolderIds.size}개
                </span>
              </div>

              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                총 포함된 북마크:{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{totalSelectedUrls}</strong>개
              </div>

              {selectedFolderIds.size === 0 ? (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  북마크 목록에서 폴더 체크박스를 선택해주세요
                </p>
              ) : (
                <div className="flex flex-col gap-1">
                  {bookmarks
                    .filter((folder) => selectedFolderIds.has(folder.id))
                    .slice(0, 3)
                    .map((folder) => (
                      <div
                        key={folder.id}
                        className="text-xs flex items-center gap-1"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        <Folder size={11} style={{ color: '#f59e0b', flexShrink: 0 }} />
                        {folder.name}
                      </div>
                    ))}
                  {selectedFolderIds.size > 3 && (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      +{selectedFolderIds.size - 3}개 더...
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 액션 버튼 */}
            <div className="flex flex-col gap-2">
              {isImporting ? (
                <button className="btn btn-ghost w-full" onClick={handleCancelSync}>
                  취소
                </button>
              ) : (
                <button
                  className="btn btn-primary w-full"
                  onClick={handleImportClick}
                  disabled={!syncKey || selectedIds.size === 0}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Send size={13} />
                  Notebook으로 전송
                </button>
              )}

              {message.text && (
                <div
                  className="text-xs py-2 px-3 rounded-lg"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: message.type === 'success' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                    color: message.type === 'success' ? 'var(--success-color)' : 'var(--error-color)',
                  }}
                >
                  {message.type === 'success'
                    ? <CheckCircle2 size={13} style={{ flexShrink: 0 }} />
                    : <AlertCircle size={13} style={{ flexShrink: 0 }} />}
                  {message.text}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 개인정보 동의 모달 */}
      {showConsent && (
        <div
          className="absolute inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowConsent(false)}
        >
          <div
            className="w-full max-w-xs rounded-2xl p-5 flex flex-col gap-4"
            style={{ background: 'var(--bg-elevated)', boxShadow: '0 8px 40px rgba(0,0,0,0.55)', border: '1px solid var(--border-default)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">🔒</div>
              <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                개인정보 보호 안내
              </h2>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              이 확장프로그램은 사용자가 직접 선택한 북마크만 Kalpie Notebook에 저장합니다.
              <br /><br />
              ✓ 선택한 북마크만 전송
              <br />
              ✓ 언제든지 자유롭게 삭제 가능
              <br />
              ✓ 안전한 통신망(HTTPS)을 통한 전송
            </p>
            <button className="btn btn-primary w-full" onClick={handleConsent}>
              동의하고 계속하기
            </button>
          </div>
        </div>
      )}
    </>
  );
};
