# Bookalpie — Chrome Bookmark Manager Extension

Chrome 북마크를 Kalpie Notebook으로 전송하여 AI 기반 Q&A와 문서 생성에 활용할 수 있는 확장 프로그램입니다.

## 주요 기능

### 북마크 관리
- **폴더 트리**: VS Code 스타일 계층적 폴더/북마크 트리
- **드래그 앤 드롭**: 폴더/북마크 순서 변경, 다른 폴더로 이동 (dnd-kit)
- **인라인 수정**: 폴더 더블클릭으로 이름 변경, 북마크 편집 미니 카드
- **검색**: 폴더명/북마크 제목/URL 실시간 검색 필터
- **전체 선택/해제**: 체크박스로 폴더 단위 또는 전체 선택
- **현재 탭 저장**: 열린 탭을 원하는 폴더에 북마크로 저장
- **퀵 세이브**: 지정 폴더에 한 번 클릭으로 북마크 저장

### Kalpie Notebook 연동
- **Sync Key 인증**: Notebook에서 발급받은 키로 안전하게 인증
- **선택 전송**: 체크한 폴더/북마크만 Notebook으로 전송
- **전송 취소**: 진행 중 언제든 취소 가능
- **개인정보 보호**: 사용자 동의 후 선택한 항목만 전송

## 빠른 시작

```bash
# 의존성 설치
pnpm install

# 빌드
pnpm build

# Chrome에 로드
# chrome://extensions → 개발자 모드 → 압축해제된 확장 프로그램 로드 → dist/ 선택
```

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

## 프로젝트 구조

```
extension/src/
├── popup/                          # 팝업 엔트리포인트
│   ├── styles/
│   │   ├── popup.css               # 전역: 테마 변수, 리셋, 애니메이션, 공유 UI
│   │   ├── form-panel.css          # FormPanel 스타일
│   │   └── drawer.css              # Drawer 스타일 (ConfirmDrawer, Settings 등)
│   ├── App.tsx
│   └── main.tsx
├── components/
│   ├── FolderTree/                 # VS Code 스타일 폴더 트리
│   │   ├── FolderTree.tsx          # DndContext + handleDragEnd
│   │   ├── FolderNode.tsx          # 개별 폴더 행 (useSortable, 인라인 수정)
│   │   ├── FolderTreeList.tsx      # 재귀 리스트 래퍼 (SortableContext)
│   │   ├── tree-utils.ts           # filterBookmarks, findBookmarkIndex
│   │   └── FolderTree.css
│   ├── BookmarkItem/               # 개별 북마크 행 (useSortable)
│   ├── BookmarkEditor/             # 미니 카드 — 북마크 추가/수정
│   ├── ActionBar/                  # 하단 액션 바 (선택, 삭제, 폼 열기)
│   ├── FormPanel/                  # 하단 폼 (폴더 생성, 탭 저장, URL 추가, 퀵세이브 설정)
│   ├── ConfirmDrawer/              # 삭제 확인 드로어
│   ├── SearchBar/                  # 검색 입력 + 전체 접기/펼치기
│   ├── Settings/                   # Sync Key 입력, 동기화 전송/취소
│   │   ├── hooks/                  # use-consent, use-sync
│   │   └── utils/                  # settings-utils
│   ├── Sidebar/                    # 메인 레이아웃 (검색→트리→액션바→폼/설정)
│   ├── CustomCheckbox/             # 커스텀 체크박스
│   ├── Icons/                      # 공통 아이콘 (EmptyBox 등)
│   └── TagBadge/                   # 태그 배지
├── store/
│   ├── bookmarkStore.ts            # Zustand 스토어 (슬라이스 조합)
│   ├── types.ts                    # BookmarkState, SliceCreator 타입
│   ├── store-utils.ts              # 트리 유틸 (collectUrlIds, filterBySelectedIds 등)
│   └── slices/
│       ├── selectionSlice.ts       # 선택 로직 (toggleSelect, selectAll 등)
│       ├── crudSlice.ts            # CRUD (add/update/delete/move, 폴더 관리)
│       ├── syncSlice.ts            # 서버 동기화 (syncToServer, cancelSync)
│       └── uiSlice.ts              # UI 상태 (loadBookmarks, toggleFolder, 검색)
├── services/
│   ├── bookmarkService.ts          # Chrome Bookmarks API 래퍼
│   ├── apiService.ts               # 백엔드 API 통신
│   └── storageService.ts           # Chrome Storage 유틸
├── hooks/
│   └── useQuickSave.ts             # 퀵 세이브 훅
├── types/
│   └── bookmark.ts                 # BookmarkFolder, BookmarkUrl, 타입 가드
├── utils/
│   └── logger.ts                   # 로깅 유틸
├── forms/                          # 별도 폼 윈도우 (독립 엔트리포인트)
│   ├── FormApp.tsx
│   ├── form.css
│   ├── index.html
│   └── main.tsx
├── assets/                         # 아이콘 등 정적 리소스
└── background/                     # Service Worker
    └── index.ts
```

## 기술 스택

| 항목 | 기술 |
|------|------|
| UI | React 19 + TypeScript 5.3 |
| 빌드 | Vite 5 + CRXJS (Manifest V3) |
| 상태관리 | Zustand 5 (슬라이스 패턴) |
| 스타일 | Tailwind CSS 4 + 컴포넌트별 CSS |
| 드래그 앤 드롭 | @dnd-kit/core + @dnd-kit/sortable |
| 아이콘 | lucide-react |
| 패키지 매니저 | pnpm |

## 상태 관리 설계

Zustand 스토어를 **슬라이스 패턴**으로 분리하여 관심사를 명확히 구분합니다.

```
bookmarkStore.ts (조합)
├── uiSlice        → 북마크 로드, 폴더 열기/닫기, 검색 필터링
├── selectionSlice → 체크박스 토글, 폴더 단위 선택, 전체 선택/해제
├── crudSlice      → 폴더/북마크 생성, 수정, 삭제, 드래그 이동
└── syncSlice      → Sync Key 인증, 서버 전송, 전송 취소
```

`store-utils.ts`에서 트리 순회 유틸 (`collectSubFolderIds`, `collectUrlIds`, `filterBySelectedIds` 등)을 분리하여 슬라이스 간 공유합니다.

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

## 버전 히스토리

| 버전 | 주요 변경 |
|------|-----------|
| **v3.0.1** (현재) | 코드 품질 개선 — flattenFolders 공통 유틸 분리, 검색 디바운싱(300ms), 퀵세이브 폴더 삭제 감지 |
| v3.0.0 | 퀵 세이브, 다크/라이트 테마, 드래그 앤 드롭 개선, 전체 UI 리뉴얼 |
| v1.2.4 | UI 개선, 스타일 분리, 모듈화, Chrome Web Store 배포 준비 |
| v1.2.3 | API 연동 추가 |
| v1.2.1 | 기본 버전 |

## 라이선스

MIT License
