/**
 * 메인 Popup 컴포넌트
 * NotebookLM 스타일 북마크 사이드바 UI
 */

import { useEffect } from 'react';
import iconLogo from '../assets/icon48.png';
import { useBookmarkStore } from '../store/bookmarkStore';
import { Settings } from '../components/Settings/Settings';
import { Sidebar } from '../components/Sidebar/Sidebar';

function App() {
  const { loadBookmarks, isLoading, error } = useBookmarkStore();

  // 컴포넌트 마운트 시 북마크 로드
  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">
          <img src={iconLogo} alt="Logo" className="app-logo" width="24" height="24" />
          히히bookmark
        </h1>
      </header>

      <main className="app-main">
        {/* 설정 및 가져오기 UI */}
        <Settings />

        {error && <div className="error-banner">{error}</div>}

        {isLoading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <span>북마크 불러오는 중...</span>
          </div>
        ) : (
          <Sidebar />
        )}
      </main>
    </div>
  );
}

export default App;
