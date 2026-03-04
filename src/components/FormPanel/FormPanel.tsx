/**
 * 폼 패널 — 액션바 아래 펼쳐지는 컴팩트 폼
 * 폴더 생성 / 현재탭 저장 / URL 추가
 */

import { useState, useEffect, useMemo } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useBookmarkStore } from '../../store/bookmarkStore';
import type { BookmarkFolder } from '../../types/bookmark';
import type { QuickSaveFolder } from '../../hooks/useQuickSave';

export type FormPanelType = 'folder' | 'saveTab' | 'addUrl' | 'quickSaveConfig';

interface QuickSaveConfigProps {
  currentFolder: QuickSaveFolder | null;
  onSave: (folder: QuickSaveFolder) => void;
  onClear: () => void;
}

interface FormPanelProps {
  type: FormPanelType;
  onClose: () => void;
  quickSaveConfig?: QuickSaveConfigProps;
}

interface FolderOpt { id: string; name: string; level: number; }

function flattenFolders(nodes: BookmarkFolder[], depth = 0, out: FolderOpt[] = []): FolderOpt[] {
  for (const f of nodes) {
    out.push({ id: f.id, name: f.name, level: depth });
    if (f.folders) flattenFolders(f.folders, depth + 1, out);
  }
  return out;
}

function FolderSelect({
  value, onChange, folders, includeRoot = false,
}: {
  value: string; onChange: (v: string) => void;
  folders: FolderOpt[]; includeRoot?: boolean;
}) {
  return (
    <select className="input fp-input" value={value} onChange={(e) => onChange(e.target.value)}>
      {includeRoot && <option value="">최상위 (루트)</option>}
      {folders.map((f) => (
        <option key={f.id} value={f.id}>
          {'\u00A0\u00A0'.repeat(f.level)}{f.level > 0 ? '└ ' : ''}{f.name}
        </option>
      ))}
    </select>
  );
}

// ── 폴더 생성 ──
function FolderForm({ folders, onClose }: { folders: FolderOpt[]; onClose: () => void }) {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) { setError('이름을 입력해주세요.'); return; }
    await chrome.bookmarks.create({ title: name.trim(), parentId: parentId || undefined });
    useBookmarkStore.getState().loadBookmarks();
    onClose();
  };

  return (
    <>
      {error && <div className="fp-error"><AlertCircle size={10} />{error}</div>}
      <div className="fp-row">
        <div className="fp-field">
          <span className="fp-label">이름</span>
          <input
            className="input fp-input" type="text" value={name} autoFocus
            onChange={(e) => { setName(e.target.value); setError(''); }}
            placeholder="폴더 이름"
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') onClose(); }}
          />
        </div>
        <div className="fp-field">
          <span className="fp-label">위치</span>
          <FolderSelect value={parentId} onChange={setParentId} folders={folders} includeRoot />
        </div>
      </div>
      <div className="fp-actions">
        <button className="btn btn-secondary fp-btn" onClick={onClose}>취소</button>
        <button className="btn btn-primary fp-btn" onClick={handleCreate}>생성</button>
      </div>
    </>
  );
}

// ── 현재 탭 저장 ──
function SaveTabForm({ folders, onClose }: { folders: FolderOpt[]; onClose: () => void }) {
  const [tabInfo, setTabInfo] = useState<{ title: string; url: string; favIconUrl?: string } | null>(null);
  const [title, setTitle] = useState('');
  const [folderId, setFolderId] = useState('');

  useEffect(() => {
    chrome.storage.local.get('formTabData', (result) => {
      if (result.formTabData) {
        setTabInfo(result.formTabData);
        setTitle(result.formTabData.title || '');
      }
    });
  }, []);

  useEffect(() => {
    if (folders.length > 0 && !folderId) setFolderId(folders[0].id);
  }, [folders, folderId]);

  const handleSave = async () => {
    if (!tabInfo) return;
    const targetId = folderId || folders[0]?.id;
    if (!targetId) return;
    await chrome.bookmarks.create({ title: title.trim() || tabInfo.title, url: tabInfo.url, parentId: targetId });
    chrome.storage.local.remove('formTabData');
    useBookmarkStore.getState().loadBookmarks();
    onClose();
  };

  return (
    <>
      {tabInfo && (
        <div className="fp-url-preview">
          {tabInfo.favIconUrl && (
            <img
              src={tabInfo.favIconUrl} alt=""
              style={{ width: 11, height: 11, borderRadius: 2, flexShrink: 0 }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <span className="fp-url-text">{tabInfo.url}</span>
        </div>
      )}
      <div className="fp-row">
        <div className="fp-field">
          <span className="fp-label">제목</span>
          <input
            className="input fp-input" type="text" value={title} autoFocus
            onChange={(e) => setTitle(e.target.value)}
            placeholder="북마크 제목"
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose(); }}
          />
        </div>
        <div className="fp-field">
          <span className="fp-label">폴더</span>
          <FolderSelect value={folderId} onChange={setFolderId} folders={folders} />
        </div>
      </div>
      <div className="fp-actions">
        <button className="btn btn-secondary fp-btn" onClick={onClose}>취소</button>
        <button className="btn btn-primary fp-btn" onClick={handleSave} disabled={!tabInfo}>저장</button>
      </div>
    </>
  );
}

// ── URL 추가 ──
function AddUrlForm({ folders, onClose }: { folders: FolderOpt[]; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [folderId, setFolderId] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (folders.length > 0 && !folderId) setFolderId(folders[0].id);
  }, [folders, folderId]);

  const handleAdd = async () => {
    setError('');
    if (!title.trim()) { setError('제목을 입력해주세요.'); return; }
    if (!url.trim()) { setError('URL을 입력해주세요.'); return; }
    try { new URL(url); } catch { setError('올바른 URL 형식이 아닙니다.'); return; }
    const targetId = folderId || folders[0]?.id;
    if (!targetId) { setError('폴더를 선택해주세요.'); return; }
    setSaving(true);
    await chrome.bookmarks.create({ title: title.trim(), url, parentId: targetId });
    useBookmarkStore.getState().loadBookmarks();
    onClose();
  };

  return (
    <>
      {error && <div className="fp-error"><AlertCircle size={10} />{error}</div>}
      <div className="fp-row">
        <div className="fp-field">
          <span className="fp-label">제목</span>
          <input
            className="input fp-input" type="text" value={title} autoFocus
            onChange={(e) => { setTitle(e.target.value); setError(''); }}
            placeholder="북마크 제목"
          />
        </div>
        <div className="fp-field">
          <span className="fp-label">URL</span>
          <input
            className="input fp-input" type="text" value={url}
            onChange={(e) => { setUrl(e.target.value); setError(''); }}
            placeholder="https://"
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') onClose(); }}
          />
        </div>
      </div>
      <div className="fp-row">
        <div className="fp-field" style={{ flex: 1 }}>
          <span className="fp-label">폴더</span>
          <FolderSelect value={folderId} onChange={setFolderId} folders={folders} />
        </div>
        <div className="fp-actions fp-actions--inline">
          <button className="btn btn-secondary fp-btn" onClick={onClose}>취소</button>
          <button className="btn btn-primary fp-btn" onClick={handleAdd} disabled={saving}>
            {saving ? '...' : '추가'}
          </button>
        </div>
      </div>
    </>
  );
}

// ── 빠른저장 폴더 설정 ──
function QuickSaveConfigForm({ folders, onClose, config }: {
  folders: FolderOpt[]; onClose: () => void; config: QuickSaveConfigProps;
}) {
  const [folderId, setFolderId] = useState(config.currentFolder?.id || (folders[0]?.id ?? ''));

  useEffect(() => {
    if (!folderId && folders.length > 0) setFolderId(folders[0].id);
  }, [folders, folderId]);

  const handleSave = () => {
    const selected = folders.find((f) => f.id === folderId);
    if (!selected) return;
    config.onSave({ id: selected.id, name: selected.name });
    onClose();
  };

  const handleClear = () => {
    config.onClear();
    onClose();
  };

  return (
    <>
      <div className="fp-row">
        <div className="fp-field" style={{ flex: 1 }}>
          <span className="fp-label">저장 폴더</span>
          <FolderSelect value={folderId} onChange={setFolderId} folders={folders} />
        </div>
      </div>
      <div className="fp-actions">
        <button className="btn btn-secondary fp-btn" onClick={onClose}>취소</button>
        {config.currentFolder && (
          <button className="btn btn-secondary fp-btn" onClick={handleClear}>해제</button>
        )}
        <button className="btn btn-primary fp-btn" onClick={handleSave}>설정</button>
      </div>
    </>
  );
}

const PANEL_TITLES: Record<FormPanelType, string> = {
  folder:  '📁 새 폴더 생성',
  saveTab: '📌 현재 탭 저장',
  addUrl:  '🔗 북마크 추가',
  quickSaveConfig: '⚡ 빠른저장 폴더 설정',
};

export function FormPanel({ type, onClose, quickSaveConfig }: FormPanelProps) {
  const { bookmarks } = useBookmarkStore();
  const folders = useMemo(() => flattenFolders(bookmarks), [bookmarks]);

  return (
    <div className="form-panel">
      <div className="fp-head">
        <span className="fp-title">{PANEL_TITLES[type]}</span>
        <button className="fp-close" onClick={onClose}><X size={12} /></button>
      </div>
      <div className="fp-body">
        {type === 'folder'  && <FolderForm  folders={folders} onClose={onClose} />}
        {type === 'saveTab' && <SaveTabForm folders={folders} onClose={onClose} />}
        {type === 'addUrl'  && <AddUrlForm  folders={folders} onClose={onClose} />}
        {type === 'quickSaveConfig' && quickSaveConfig && (
          <QuickSaveConfigForm folders={folders} onClose={onClose} config={quickSaveConfig} />
        )}
      </div>
    </div>
  );
}
