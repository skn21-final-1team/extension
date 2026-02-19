# 📚 히히bookmark (Bookmark Manager)

Chrome 북마크를 효율적으로 관리하고 구조화할 수 있는 확장 프로그램입니다.

## ✨ 주요 기능

- ✅ **Chrome 북마크 관리**: 읽기, 추가, 수정, 삭제
- ✅ **폴더 생성**: 북마크를 체계적으로 구조화
- ✅ **위치 변경**: 북마크 이동 기능 (Drag & Drop 지원)
- ✅ **검색 기능**: 북마크 빠른 검색
- ✅ **폴더 트리**: 계층적 폴더 구조 표시
- ✅ **선택적 서버 동기화**: API 키를 통한 백엔드 동기화 지원

## 🚀 빠른 시작

### 1. 의존성 설치

```bash
pnpm install
```

### 2. 환경 설정 (선택사항)

`.env.example` 파일을 복사하여 `.env` 파일을 생성하세요:

```bash
# 서버 동기화 기능을 사용하지 않는 경우 (기본값)
VITE_ENABLE_SYNC=false
```

### 3. 개발 모드 실행

```bash
pnpm dev
```

### 4. 빌드

```bash
pnpm build
```

빌드 결과물은 `dist/` 폴더에 생성됩니다.

### 5. Chrome에 설치

1. Chrome 브라우저에서 `chrome://extensions` 접속
2. 우측 상단 **개발자 모드** 활성화
3. **압축해제된 확장 프로그램을 로드합니다** 클릭
4. 프로젝트 폴더 내 `dist` 폴더 선택

## 📁 프로젝트 구조

```
extension/
├── manifest.json              # Chrome Extension 설정
├── package.json               # 의존성 및 스크립트
├── vite.config.ts             # Vite 빌드 설정
├── public/
│   └── icons/                 # 확장프로그램 아이콘 (16, 48, 128px)
├── src/
│   ├── assets/                # 정적 자원 (로고 이미지 등)
│   ├── background/            # Service Worker
│   ├── popup/                 # 팝업 UI (App.tsx)
│   ├── components/            # React 컴포넌트
│   │   ├── ActionBar/         # 하단 액션 버튼
│   │   ├── BookmarkEditor/    # 북마크 추가/수정
│   │   ├── BookmarkItem/      # 개별 북마크
│   │   ├── FolderTree/        # 폴더 트리
│   │   ├── Icons/             # SVG 아이콘 모음
│   │   ├── SearchBar/         # 검색 바
│   │   ├── Settings/          # 설정 (API 키 입력)
│   │   └── Sidebar/           # 메인 레이아웃
│   ├── services/              # 비즈니스 로직 (Chrome API, Backend API)
│   └── store/                 # Zustand 상태 관리
└── scripts/
    └── generate-icons.js      # 아이콘 생성 스크립트
```

## 🛠 기술 스택

- **Frontend**: React 19.2.3 + TypeScript
- **Build Tool**: Vite + CRXJS
- **State Management**: Zustand
- **Package Manager**: pnpm

## 📦 배포

1. `pnpm build` 실행
2. `dist` 폴더를 압축하여 스토어에 업로드하거나 배포

## 📝 라이선스

MIT License



```1.2.1 은 api연결 x
   1.2.3 은 api연결 o
```