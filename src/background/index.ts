/**
 * Background Service Worker
 * 확장프로그램 백그라운드에서 실행되는 스크립트
 */

import { logger } from '../utils/logger';

// 확장프로그램 설치 시 실행
chrome.runtime.onInstalled.addListener((details) => {
  logger.info('확장프로그램 설치됨:', details.reason);

  if (details.reason === 'install') {
    logger.info('최초 설치 완료');
    // 환영 페이지 또는 초기 설정 추가 가능
  } else if (details.reason === 'update') {
    logger.info('확장프로그램 업데이트됨');
  }
});


// 메시지 리스너 (Popup ↔ Background 통신)
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  logger.info('메시지 수신:', message.type);

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
      logger.warn('알 수 없는 메시지 타입:', message.type);
      sendResponse({ success: false, error: 'Unknown message type' });
  }
});

logger.info('Service Worker 시작됨');
