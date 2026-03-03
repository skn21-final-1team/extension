/**
 * 사이드 패널 — 팝업 오른쪽에 붙어서 확장되는 폼 패널
 * 폴더 생성 / 현재탭 저장 / URL 추가
 */

import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useBookmarkStore } from '../../store/bookmarkStore';

export type SidePanelType = 'folder' | 'saveTab' | 'addUrl';

interface SidePanelProps {
  type: SidePanelType;
  onClose: () => void;
}

interface FolderOpt { id: string; name: string; level: number; }

function flattenTree(
  nodes: chrome.bookmarks.BookmarkTreeNode[],
  depth = 0,
  out: FolderOpt[] = []
): FolderOpt[] {
  for (const n of nodes) {
    if (!n.url) {
      out.push({ id: n.id, name: n.title || '(이름 없음)', level: depth });
      if (n.children) flattenTree(n.children, depth + 1, out);
    }
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
    <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
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
    if (!name.trim()) { setError('폴더 이름을 입력해주세요.'); return; }
    await chrome.bookmarks.create({ title: name.trim(), parentId: parentId || undefined });
    useBookmarkStore.getState().loadBookmarks();
    onClose();
  };

  return (
    <>
      <div className="side-panel-body">
        {error && (
          <div className="side-panel-error">
            <AlertCircle size={11} /> {error}
          </div>
        )}
        <div className="side-panel-field">
          <span className="side-panel-label">이름</span>
          <input
            className="input" type="text" value={name} autoFocus
            onChange={(e) => { setName(e.target.value); setError(''); }}
            placeholder="폴더 이름"
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') onClose(); }}
          />
        </div>
        <div className="side-panel-field">
          <span className="side-panel-label">위치</span>
          <FolderSelect value={parentId} onChange={setParentId} folders={folders} includeRoot />
        </div>
      </div>
      <div className="side-panel-footer">
        <button className="btn btn-secondary flex-1" onClick={onClose}>취소</button>
        <button className="btn btn-primary flex-1" onClick={handleCreate}>생성</button>
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
      <div className="side-panel-body">
        {tabInfo && (
          <div className="side-panel-url">
            {tabInfo.favIconUrl && (
              <img
                src={tabInfo.favIconUrl} alt=""
                style={{ width: 12, height: 12, borderRadius: 2, flexShrink: 0 }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <span className="side-panel-url-text">{tabInfo.url}</span>
          </div>
        )}
        <div className="side-panel-field">
          <span className="side-panel-label">제목</span>
          <input
            className="input" type="text" value={title} autoFocus
            onChange={(e) => setTitle(e.target.value)}
            placeholder="북마크 제목"
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose(); }}
          />
        </div>
        <div className="side-panel-field">
          <span className="side-panel-label">폴더</span>
          <FolderSelect value={folderId} onChange={setFolderId} folders={folders} />
        </div>
      </div>
      <div className="side-panel-footer">
        <button className="btn btn-secondary flex-1" onClick={onClose}>취소</button>
        <button className="btn btn-primary flex-1" onClick={handleSave} disabled={!tabInfo}>저장</button>
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
    if (!targetId) { setError('저장할 폴더를 선택해주세요.'); return; }
    setSaving(true);
    await chrome.bookmarks.create({ title: title.trim(), url, parentId: targetId });
    useBookmarkStore.getState().loadBookmarks();
    onClose();
  };

  return (
    <>
      <div className="side-panel-body">
        {error && (
          <div className="side-panel-error">
            <AlertCircle size={11} /> {error}
          </div>
        )}
        <div className="side-panel-field">
          <span className="side-panel-label">제목</span>
          <input
            className="input" type="text" value={title} autoFocus
            onChange={(e) => { setTitle(e.target.value); setError(''); }}
            placeholder="북마크 제목"
          />
        </div>
        <div className="side-panel-field">
          <span className="side-panel-label">URL</span>
          <input
            className="input" type="text" value={url}
            onChange={(e) => { setUrl(e.target.value); setError(''); }}
            placeholder="https://example.com"
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') onClose(); }}
          />
        </div>
        <div className="side-panel-field">
          <span className="side-panel-label">폴더</span>
          <FolderSelect value={folderId} onChange={setFolderId} folders={folders} />
        </div>
      </div>
      <div className="side-panel-footer">
        <button className="btn btn-secondary flex-1" onClick={onClose}>취소</button>
        <button className="btn btn-primary flex-1" onClick={handleAdd} disabled={saving}>
          {saving ? '추가 중...' : '추가'}
        </button>
      </div>
    </>
  );
}

// ── 패널 헤더 타이틀 ──
const PANEL_TITLES: Record<SidePanelType, string> = {
  folder:  '📁 새 폴더 생성',
  saveTab: '📌 현재 탭 저장',
  addUrl:  '🔗 북마크 추가',
};

// ── 메인 컴포넌트 ──
export function SidePanel({ type, onClose }: SidePanelProps) {
  const [folders, setFolders] = useState<FolderOpt[]>([]);

  useEffect(() => {
    chrome.bookmarks.getTree((tree) => {
      const result: FolderOpt[] = [];
      for (const root of tree) {
        if (root.children) flattenTree(root.children, 0, result);
      }
      setFolders(result);
    });
  }, []);

  return (
    <aside className="side-panel">
      <div className="side-panel-head">
        <span className="side-panel-title">{PANEL_TITLES[type]}</span>
        <button className="side-panel-close" onClick={onClose}><X size={14} /></button>
      </div>

      {type === 'folder'  && <FolderForm  folders={folders} onClose={onClose} />}
      {type === 'saveTab' && <SaveTabForm folders={folders} onClose={onClose} />}
      {type === 'addUrl'  && <AddUrlForm  folders={folders} onClose={onClose} />}
    </aside>
  );
}
