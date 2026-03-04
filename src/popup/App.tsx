/**
 * 메인 Popup 컴포넌트
 * - 메인: 북마크 관리 (Sidebar 전체 차지)
 * - 부가: API 동기화 (헤더 아이콘 클릭 시 Sidebar 하단 패널로 오픈)
 */

import { useEffect, useState } from 'react';
import { Cloud, Sun, Moon, X } from 'lucide-react';
import iconLogo from '../assets/icon48.png';
import { useBookmarkStore } from '../store/bookmarkStore';
import { Sidebar } from '../components/Sidebar/Sidebar';

function App() {
  const { loadBookmarks, isLoading } = useBookmarkStore();
  // Settings(API 동기화) 패널 열림 여부
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 테마 상태 — localStorage에서 초기화하고 즉시 적용 (플리커 방지)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme') as 'dark' | 'light' | null;
    const t = saved ?? 'dark';
    document.documentElement.dataset.theme = t;
    return t;
  });

  // 테마 변경 시 DOM + localStorage 동기화
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  // 컴포넌트 마운트 시 북마크 로드
  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  return (
    <div className="app">
      <header className="app-header">
        {/* 로고 영역 */}
        <h1 className="app-title">
          <img src={iconLogo} alt="Logo" className="app-logo" width="24" height="24" />
          <span className="app-logo-text">Bookalpie</span>
        </h1>

        {/* 헤더 우측 액션 버튼 */}
        <div className="app-header-actions">
          {/* 테마 토글 버튼 */}
          <button
            className="header-icon-btn"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            title="테마 전환"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* 동기화(Sync) 버튼 — 클릭 시 하단 패널 토글 */}
          <button
            className={`header-icon-btn ${isSettingsOpen ? 'active' : ''}`}
            onClick={() => setIsSettingsOpen((prev) => !prev)}
            title="Notebook으로 동기화"
          >
            <Cloud size={18} />
          </button>

          {/* 팝업 닫기 버튼 */}
          <button
            className="header-icon-btn"
            onClick={() => window.close()}
            title="닫기"
          >
            <X size={16} />
          </button>
        </div>
      </header>

      <main className="app-main">
        {isLoading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <span>북마크 불러오는 중...</span>
          </div>
        ) : (
          /* 메인 기능: 북마크 트리 + 하단 패널(폼/설정) */
          <Sidebar
            isSettingsOpen={isSettingsOpen}
            onCloseSettings={() => setIsSettingsOpen(false)}
          />
        )}
      </main>
    </div>
  );
}

export default App;
