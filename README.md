# Bookalpie — Chrome Bookmark Manager Extension

Chrome 북마크를 Kalpie Notebook으로 전송하여 AI 기반 Q&A와 문서 생성에 활용할 수 있는 확장 프로그램입니다.

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Bookalpie-4285F4?logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/bookalpie/npfdkpgpijiokpmbjkgmbfchfnbahdhd?hl=ko&gl=DE)
**[사용 가이드](./USAGE_GUIDE.md)** | **[개인정보 처리방침](./PRIVACY_POLICY.md)** | **[Privacy](./PRIVACY.md)**

## 왜 만들었나요?

웹 브라우저의 보안 정책상, 외부 웹 앱에서는 사용자의 북마크에 직접 접근할 수 없습니다. Kalpie Notebook에 북마크 URL을 소스로 활용하려면 Chrome 확장 프로그램이 필요했고, 단순히 북마크를 전송하는 도구를 넘어 **북마크를 직접 관리할 수 있는 확장 프로그램**으로 발전시켰습니다.

## 빠른 시작

### Chrome Web Store
Chrome Web Store에서 **"Bookalpie"** 검색 → **"Chrome에 추가"** 클릭

### 개발자 모드
```bash
pnpm install
pnpm build
# chrome://extensions → 개발자 모드 → 압축해제된 확장 프로그램 로드 → dist/ 선택
```

## 화면 구성

```
┌─────────────────────────────────┐
│  🔖 Bookalpie       ☀️  ☁️  ✕  │  ← 헤더 (로고, 테마, 동기화, 닫기)
├─────────────────────────────────┤
│  🔍 검색창              ⬆  ⬇   │  ← 검색 + 전체 접기/펼치기
├─────────────────────────────────┤
│  📁 북마크 바                    │
│    📄 자주 가는 사이트            │
│  📁 기타 북마크                  │  ← 폴더 트리 (VS Code 스타일)
│    📁 개발                      │
│      📄 GitHub                  │
│      📄 Stack Overflow          │
├─────────────────────────────────┤
│ ☐  ⚡빠른저장  📌현재탭  📁폴더  🔗URL추가 │ ← 하단 액션 바
├─────────────────────────────────┤
│  (폼 패널 / 동기화 설정)          │  ← 필요 시 펼쳐지는 하단 패널
└─────────────────────────────────┘
```

## 주요 기능

### 북마크 관리
- **폴더 트리**: VS Code 스타일 계층적 폴더/북마크 트리
- **드래그 앤 드롭**: 폴더/북마크 순서 변경, 다른 폴더로 이동
- **인라인 수정**: 폴더 더블클릭으로 이름 변경, 북마크 편집 미니 카드
- **검색**: 폴더명/북마크 제목/URL 검색 필터 (300ms 디바운싱)
- **전체 선택/해제**: 체크박스로 폴더 단위 또는 전체 선택
- **현재 탭 저장**: 열린 탭을 원하는 폴더에 북마크로 저장
- **퀵 세이브**: 지정 폴더에 한 번 클릭으로 북마크 저장
- **다크/라이트 테마**: 원클릭 테마 전환, 설정 자동 저장

### Kalpie Notebook 연동
- **Sync Key 인증**: Notebook에서 발급받은 키로 안전하게 인증
- **선택 전송**: 체크한 폴더/북마크만 Notebook으로 전송
- **전송 취소**: 진행 중 언제든 취소 가능
- **개인정보 보호**: 사용자 동의 후 선택한 항목만 전송

## 기술 스택

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-5-orange)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![dnd--kit](https://img.shields.io/badge/dnd--kit-drag%20%26%20drop-ff6b6b)
![CRXJS](https://img.shields.io/badge/CRXJS-Manifest%20V3-yellow)
![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white)

## 아키텍처

```
[Chrome Bookmarks API]
        ↓
  bookmarkService.ts ─── Chrome 북마크 CRUD
        ↓
  Zustand Store (슬라이스 패턴)
  ├── uiSlice       ─── 북마크 로드, 폴더 토글, 검색
  ├── selectionSlice ─── 체크박스 선택/해제
  ├── crudSlice      ─── 폴더/북마크 생성·수정·삭제·이동
  └── syncSlice      ─── 서버 동기화 (Sync Key 인증)
        ↓
  React Components (Popup UI)
  ├── Sidebar        ─── 메인 레이아웃
  ├── FolderTree     ─── DndContext + 재귀 트리
  ├── BookmarkItem   ─── 개별 북마크 행
  ├── ActionBar      ─── 하단 액션 바
  └── Settings       ─── Sync Key 입력, 전송
        ↓
  apiService.ts ──→ Kalpie Backend API
```

`store-utils.ts`에서 트리 순회 유틸 (`flattenFolders`, `collectSubFolderIds`, `collectUrlIds` 등)을 분리하여 슬라이스 간 공유합니다.

## 프로젝트 구조

```
extension/src/
├── popup/           # 팝업 엔트리포인트 (App.tsx, main.tsx, styles/)
├── components/      # UI 컴포넌트
│   ├── Sidebar/     #   메인 레이아웃
│   ├── FolderTree/  #   DndContext + 재귀 폴더 트리
│   ├── BookmarkItem/#   개별 북마크 행
│   ├── ActionBar/   #   하단 액션 바
│   ├── Settings/    #   Sync Key 입력, 동기화
│   └── ...          #   SearchBar, FormPanel, ConfirmDrawer 등
├── store/           # Zustand (슬라이스 패턴)
│   └── slices/      #   uiSlice, selectionSlice, crudSlice, syncSlice
├── services/        # Chrome Bookmarks API, 백엔드 API, Storage
├── types/           # BookmarkFolder, BookmarkUrl, 타입 가드
└── background/      # Service Worker
```

## API 연동

### 동기화 엔드포인트

```
POST /api/directory/sync
Header: X-Sync-Key: <sync_key>
Body: { nodes: ExtensionBookmarkNode[] }
```

선택된 북마크를 `ExtensionBookmarkNode[]` 형태로 변환 후 전송합니다.
백엔드에서 `directory`와 `source` 테이블에 저장되며, Kalpie Notebook에서 AI Q&A 및 문서 생성의 소스로 활용됩니다.

## 개인정보 보호

- 선택한 북마크만 전송 (전체 북마크 접근 불가)
- Sync Key를 통한 노트북 단위 인증
- HTTPS 통신 (`api.kalpie.net`)
- 사용자 동의 필수 (동의 체크박스)

자세한 내용은 [개인정보 처리방침](./PRIVACY_POLICY.md)을 참고하세요.

## 버전 히스토리

| 버전 | 주요 변경 |
|------|-----------|
| **v3.0.1** (현재) | 코드 품질 개선 — flattenFolders 공통 유틸 분리, 검색 디바운싱(300ms), 퀵세이브 폴더 삭제 감지 |
| v3.0.0 | 퀵 세이브, 다크/라이트 테마, 드래그 앤 드롭 개선, 전체 UI 리뉴얼 |
| v1.2.4 | UI 개선, 스타일 분리, 모듈화, Chrome Web Store 배포 준비 |
| v1.2.3 | API 연동 추가 |
| v1.2.1 | 기본 버전 |
