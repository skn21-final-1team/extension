/**
 * Background Service Worker
 * 확장프로그램 백그라운드에서 실행되는 스크립트
 */

// 확장프로그램 설치 시 실행
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Bookmark Extension] 설치됨:', details.reason);

  // 최초 설치 시 환영 메시지 또는 초기 설정
  if (details.reason === 'install') {
    console.log('[Bookmark Extension] 최초 설치 - 초기화 중...');
  }
});

// 확장프로그램 아이콘 클릭 시 (팝업이 없을 때만)
chrome.action.onClicked.addListener((tab) => {
  console.log('[Bookmark Extension] 아이콘 클릭:', tab.url);
});

// 북마크 생성 이벤트 (향후 실시간 동기화용)
chrome.bookmarks.onCreated.addListener((_id, bookmark) => {
  console.log('[Bookmark Extension] 북마크 생성:', bookmark.title);
  // TODO: v2.0에서 실시간 동기화 구현
});

// 북마크 삭제 이벤트
chrome.bookmarks.onRemoved.addListener((id, _removeInfo) => {
  console.log('[Bookmark Extension] 북마크 삭제:', id);
  // TODO: v2.0에서 실시간 동기화 구현
});

// 북마크 변경 이벤트
chrome.bookmarks.onChanged.addListener((_id, changeInfo) => {
  console.log('[Bookmark Extension] 북마크 변경:', changeInfo);
  // TODO: v2.0에서 실시간 동기화 구현
});

// 메시지 리스너 (Popup ↔ Background 통신)
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('[Bookmark Extension] 메시지 수신:', message);

  switch (message.type) {
    case 'GET_BOOKMARKS':
      chrome.bookmarks.getTree((tree) => {
        sendResponse({ success: true, data: tree });
      });
      return true; // 비동기 응답을 위해 true 반환

    case 'PING':
      sendResponse({ success: true, message: 'pong' });
      break;

    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
});

console.log('[Bookmark Extension] Service Worker 시작됨');
