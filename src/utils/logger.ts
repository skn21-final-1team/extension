/**
 * Production-ready Logger
 * 개발 환경에서만 console.log 출력
 */

const IS_DEV = import.meta.env.MODE === 'development';

type LogLevel = 'log' | 'info' | 'warn' | 'error';

class Logger {
  private prefix = '[DeepDive]';

  private shouldLog(level: LogLevel): boolean {
    // Production에서는 error만 허용
    if (!IS_DEV && level !== 'error') {
      return false;
    }
    return true;
  }

  log(...args: unknown[]): void {
    if (this.shouldLog('log')) {
      console.log(this.prefix, ...args);
    }
  }

  info(...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info(this.prefix, ...args);
    }
  }

  warn(...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.prefix, ...args);
    }
  }

  error(...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(this.prefix, ...args);
    }
  }

  // 에러 객체를 사용자 친화적인 메시지로 변환
  getUserMessage(error: unknown): string {
    if (error instanceof Error) {
      // Chrome API 에러 처리
      if (error.message.includes('chrome.bookmarks')) {
        return '북마크 작업 중 오류가 발생했습니다. 다시 시도해주세요.';
      }
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return '네트워크 연결을 확인해주세요.';
      }
      if (error.message.includes('HTTP error')) {
        return '서버 응답 오류가 발생했습니다.';
      }
      return error.message;
    }
    return '알 수 없는 오류가 발생했습니다.';
  }
}

export const logger = new Logger();
