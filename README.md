# 📚 DeepDive - Chrome Bookmark Manager Extension

Chrome 북마크를 Kalpie Notebook으로 전송하여 효율적으로 관리할 수 있는 확장 프로그램입니다.

## ✨ 주요 기능

### 북마크 관리
- ✅ **폴더 선택**: 북마크 폴더를 체크박스로 선택
- ✅ **검색 기능**: 북마크 빠른 검색
- ✅ **폴더 트리**: 계층적 폴더 구조 표시
- ✅ **선택된 북마크 확인**: 전송할 북마크 개수 실시간 표시

### Kalpie Notebook 연동
- 🔑 **Sync Key 입력**: Kalpie Notebook에서 발급받은 키로 인증
- 📤 **북마크 전송**: 선택한 폴더의 북마크를 Notebook으로 전송
- 🔒 **개인정보 보호**: 사용자 동의 후 선택한 북마크만 전송
- ✅ **전송 취소**: 전송 중 언제든지 취소 가능

## 🚀 빠른 시작

### 1. 의존성 설치

```bash
pnpm install
```

> **참고**: npm을 사용해도 되지만, 프로젝트는 pnpm을 권장합니다.

### 2. 빌드

```bash
pnpm run build
```

빌드 결과물은 `dist/` 폴더에 생성됩니다.

### 3. Chrome에 설치

1. Chrome 브라우저에서 `chrome://extensions` 접속
2. 우측 상단 **개발자 모드** 활성화
3. **압축해제된 확장 프로그램을 로드합니다** 클릭
4. `extension/dist` 폴더 선택

### 4. 사용 방법

1. Chrome 툴바에서 DeepDive 아이콘 클릭
2. **설정** 섹션에서 Kalpie Notebook에서 발급받은 **Sync Key** 입력
3. 하단 **BOOKMARKS** 섹션에서 전송할 폴더를 체크
4. **Notebook으로 전송 (Send)** 버튼 클릭
5. 개인정보 보호 동의 후 전송 진행

## 📁 프로젝트 구조

```
extension/
├── manifest.json              # Chrome Extension 설정
├── package.json               # 의존성 및 스크립트
├── vite.config.ts             # Vite 빌드 설정
├── public/
│   └── icons/                 # 확장프로그램 아이콘 (16, 48, 128px)
├── src/
│   ├── popup/                 # 팝업 UI 엔트리
│   ├── components/
│   │   ├── BookmarkItem/      # 개별 북마크/폴더 아이템
│   │   ├── BookmarkList/      # 북마크 목록
│   │   ├── SearchBar/         # 검색 바
│   │   ├── Settings/          # 설정 (Sync Key, 전송)
│   │   └── Sidebar/           # 메인 레이아웃
│   ├── services/
│   │   └── apiService.ts      # 백엔드 API 통신
│   ├── store/
│   │   └── bookmarkStore.ts   # Zustand 상태 관리
│   ├── types/
│   │   └── bookmark.ts        # TypeScript 타입 정의
│   └── utils/
│       └── bookmarkUtils.ts   # 북마크 유틸리티 함수
└── dist/                      # 빌드 결과물 (생성됨)
```

## 🛠 기술 스택

- **Frontend**: React 19.2.3 + TypeScript 5.3.3
- **Build Tool**: Vite 5.0.12 + CRXJS
- **State Management**: Zustand 5.0.11
- **UI**: CSS Modules (컴포넌트별 스타일링)
- **Package Manager**: pnpm (npm도 호환)

## 🔧 개발

### 개발 모드 실행

```bash
pnpm run dev
```

개발 모드에서는 핫 리로드가 지원되어 코드 변경 시 자동으로 반영됩니다.

### 빌드 미리보기

```bash
pnpm run preview
```

## 📡 API 통신

### Sync Key 발급
Kalpie Notebook 웹 애플리케이션에서 Sync Key를 발급받으세요.

### 전송 프로세스
1. 사용자가 Sync Key와 폴더를 선택
2. Extension이 선택된 북마크 데이터를 수집
3. `/api/directory/sync` 엔드포인트로 전송
4. 백엔드에서 `directory`와 `source` 테이블에 저장
5. 전송 완료 후 Kalpie Notebook에서 확인 가능

## 📦 배포

### Chrome Web Store 배포

1. `pnpm run build` 실행
2. `dist` 폴더를 ZIP으로 압축
3. [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)에 업로드

### 수동 배포 (개발용)

1. `pnpm run build` 실행
2. `dist` 폴더를 공유하거나 Git에 포함
3. 사용자가 직접 Chrome에 로드

## 🔒 개인정보 보호

- ✅ 선택한 북마크만 전송
- ✅ Sync Key를 통한 안전한 인증
- ✅ HTTPS 통신
- ✅ 사용자 동의 필수
- ✅ 언제든지 Kalpie Notebook에서 데이터 삭제 가능

## 📝 버전 정보

- **v1.2.4** (현재): UI 개선 및 안정성 향상
- **v1.2.3**: API 연동 추가
- **v1.2.1**: API 연동 없는 기본 버전

## 📄 라이선스

MIT License

## 🤝 기여

이슈와 PR은 언제나 환영합니다!

## 📧 문의

문제가 발생하면 GitHub Issues에 등록해주세요.
