/**
 * 별도 창 폼 앱 — 폴더 생성 / 현재탭 저장 / URL 추가
 * ActionBar에서 chrome.windows.create()로 열림
 */

import { useState, useEffect } from 'react'
import './form.css'

type FormType = 'folder' | 'saveTab' | 'addUrl'

interface FolderOpt { id: string; name: string; level: number }

function flattenTree(
  nodes: chrome.bookmarks.BookmarkTreeNode[],
  depth = 0,
  out: FolderOpt[] = []
): FolderOpt[] {
  for (const n of nodes) {
    if (!n.url) {
      out.push({ id: n.id, name: n.title || '(이름 없음)', level: depth })
      if (n.children) flattenTree(n.children, depth + 1, out)
    }
  }
  return out
}

function FolderSelect({
  value, onChange, folders, includeRoot = false,
}: {
  value: string; onChange: (v: string) => void
  folders: FolderOpt[]; includeRoot?: boolean
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {includeRoot && <option value="">최상위 (루트)</option>}
      {folders.map((f) => (
        <option key={f.id} value={f.id}>
          {'\u00A0\u00A0'.repeat(f.level)}{f.level > 0 ? '└ ' : ''}{f.name}
        </option>
      ))}
    </select>
  )
}

// ── 폴더 생성 ──
function FolderForm({ folders }: { folders: FolderOpt[] }) {
  const [name, setName] = useState('')
  const [parentId, setParentId] = useState('')
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!name.trim()) { setError('폴더 이름을 입력해주세요.'); return }
    await chrome.bookmarks.create({ title: name.trim(), parentId: parentId || undefined })
    window.close()
  }

  return (
    <div className="form-wrap">
      <div className="form-title">
        <span>📁</span> 새 폴더 생성
      </div>
      {error && <div className="form-error">⚠ {error}</div>}
      <div className="form-field">
        <label>이름</label>
        <input
          type="text" value={name} autoFocus
          onChange={(e) => setName(e.target.value)}
          placeholder="폴더 이름"
          onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
        />
      </div>
      <div className="form-field">
        <label>위치</label>
        <FolderSelect value={parentId} onChange={setParentId} folders={folders} includeRoot />
      </div>
      <div className="form-actions">
        <button className="btn-cancel" onClick={() => window.close()}>취소</button>
        <button className="btn-primary" onClick={handleCreate}>생성</button>
      </div>
    </div>
  )
}

// ── 현재 탭 저장 ──
function SaveTabForm({ folders }: { folders: FolderOpt[] }) {
  const [tabInfo, setTabInfo] = useState<{ title: string; url: string; favIconUrl?: string } | null>(null)
  const [title, setTitle] = useState('')
  const [folderId, setFolderId] = useState('')

  useEffect(() => {
    chrome.storage.local.get('formTabData', (result) => {
      if (result.formTabData) {
        setTabInfo(result.formTabData)
        setTitle(result.formTabData.title || '')
      }
    })
  }, [])

  useEffect(() => {
    if (folders.length > 0) setFolderId((prev) => prev || folders[0].id)
  }, [folders])

  const handleSave = async () => {
    if (!tabInfo) return
    const targetId = folderId || folders[0]?.id
    if (!targetId) return
    await chrome.bookmarks.create({ title: title.trim() || tabInfo.title, url: tabInfo.url, parentId: targetId })
    chrome.storage.local.remove('formTabData')
    window.close()
  }

  return (
    <div className="form-wrap">
      <div className="form-title">
        <span>📌</span> 현재 탭 저장
      </div>
      {tabInfo && (
        <div className="form-site-row">
          {tabInfo.favIconUrl
            ? <img
                src={tabInfo.favIconUrl}
                alt=""
                className="form-site-favicon"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
            : <span className="form-site-icon">🌐</span>
          }
          <span className="form-site-url">{tabInfo.url}</span>
        </div>
      )}
      <div className="form-field">
        <label>제목</label>
        <input
          type="text" value={title} autoFocus
          onChange={(e) => setTitle(e.target.value)}
          placeholder="북마크 제목"
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
        />
      </div>
      <div className="form-field">
        <label>폴더</label>
        <FolderSelect value={folderId} onChange={setFolderId} folders={folders} />
      </div>
      <div className="form-actions">
        <button className="btn-cancel" onClick={() => window.close()}>취소</button>
        <button className="btn-primary" onClick={handleSave} disabled={!tabInfo}>저장</button>
      </div>
    </div>
  )
}

// ── URL 추가 ──
function AddUrlForm({ folders }: { folders: FolderOpt[] }) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [folderId, setFolderId] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (folders.length > 0) setFolderId((prev) => prev || folders[0].id)
  }, [folders])

  const handleAdd = async () => {
    setError('')
    if (!title.trim()) { setError('제목을 입력해주세요.'); return }
    if (!url.trim()) { setError('URL을 입력해주세요.'); return }
    try { new URL(url) } catch { setError('올바른 URL 형식이 아닙니다.'); return }
    const targetId = folderId || folders[0]?.id
    if (!targetId) { setError('저장할 폴더를 선택해주세요.'); return }
    setSaving(true)
    await chrome.bookmarks.create({ title: title.trim(), url, parentId: targetId })
    window.close()
  }

  return (
    <div className="form-wrap">
      <div className="form-title">
        <span>🔗</span> 북마크 추가
      </div>
      {error && <div className="form-error">⚠ {error}</div>}
      <div className="form-field">
        <label>제목</label>
        <input type="text" value={title} autoFocus
          onChange={(e) => setTitle(e.target.value)} placeholder="북마크 제목" />
      </div>
      <div className="form-field">
        <label>URL</label>
        <input type="text" value={url}
          onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com"
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }} />
      </div>
      <div className="form-field">
        <label>폴더</label>
        <FolderSelect value={folderId} onChange={setFolderId} folders={folders} />
      </div>
      <div className="form-actions">
        <button className="btn-cancel" onClick={() => window.close()}>취소</button>
        <button className="btn-primary" onClick={handleAdd} disabled={saving}>
          {saving ? '추가 중...' : '추가'}
        </button>
      </div>
    </div>
  )
}

// ── 라우터 ──
function FormApp() {
  const params = new URLSearchParams(location.search)
  const type = (params.get('type') || 'addUrl') as FormType
  const theme = params.get('theme') || 'dark'

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const [folders, setFolders] = useState<FolderOpt[]>([])
  useEffect(() => {
    chrome.bookmarks.getTree((tree) => {
      const result: FolderOpt[] = []
      for (const root of tree) {
        if (root.children) flattenTree(root.children, 0, result)
      }
      setFolders(result)
    })
  }, [])

  if (type === 'folder') return <FolderForm folders={folders} />
  if (type === 'saveTab') return <SaveTabForm folders={folders} />
  return <AddUrlForm folders={folders} />
}

export default FormApp
