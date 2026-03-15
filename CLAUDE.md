# VaultNote — Obsidian 연동 포스트잇 메모 앱

## 프로젝트 개요

Windows용 데스크톱 메모 앱. Windows 스티커 메모(Sticky Notes)와 동일한 UX를 제공하되,
저장 시 Obsidian Vault에 `.md` 파일로 직접 기록되는 것이 핵심 차이점이다.

---

## 기술 스택

- **Runtime**: Electron v28 (Node.js 기반)
- **대상 OS**: Windows (primary)
- **언어**: JavaScript (vanilla JS, 번들러 없음)
- **빌드**: electron-packager (electron-builder는 Windows 심볼릭 링크 권한 문제로 미사용)

---

## 현재 구현 상태 (2026-03-15 기준)

### 완료된 기능

#### 1. 글로벌 단축키
- 기본: `Ctrl+Shift+N` (설정에서 변경 가능)
- 앱이 트레이에 상주하면서 단축키 수신

#### 2. 메모 창 (포스트잇)
- **기본 크기**: 360×360px, 최소 200px
- **프레임리스** 커스텀 창
- **타이틀바**: 숨김 상태가 기본, 커서를 상단 40px 영역에 올리면 슬라이드인 (오른쪽→왼쪽)
- **다중 창**: `+` 버튼 또는 `Ctrl+N`으로 추가. 새 창은 이전 창에서 24px 오프셋
- **드래그**: 타이틀바 영역으로 이동
- **크기 조절**: 가능

#### 3. 색상 테마 (Floral Fantasy)
총 5가지 색상, 타이틀바 스와치(사각형)로 전환 가능. 새 창 생성 시 자동 순환.
| 이름 | 메모지 bg | 타이틀바 bar |
|---|---|---|
| 햇살 | #FFFBE0 | #FFE97A |
| 새잎 | #EDFAF4 | #A8E6C3 |
| 여명 | #EEF0FB | #BCC4F0 |
| 벚꽃 | #FFF0F2 | #FFD5DC |
| 노을 | #FFF4EE | #FFCCA8 |

#### 4. 저장 방식
- **창당 1파일 고정**: 창이 열릴 때 파일명 예약, 이후 저장은 항상 같은 파일에 덮어씀 (중복 파일 없음)
- **debounce 자동저장**: 타이핑 멈추면 1.5초 후 자동저장
- **Ctrl+S**: 즉시 저장 (창 유지)
- **X 버튼**: 마지막 저장 후 닫힘. 저장 실패 시 에러 토스트 표시 후 창 유지 (데이터 손실 방지)
- 내용 없으면 저장 없이 닫힘
- 저장 경로: `{VaultPath}/YYYY-MM-DD-HHmm.md` (Vault 루트에 바로 저장)
- 같은 분에 여러 창 열면 `-1`, `-2` 접미사로 충돌 방지
- Frontmatter 자동 생성: `created` (창 생성 시각), `tags` (본문의 `#태그` 파싱)

#### 5. 타이틀바 메뉴 구성 (SVG 아이콘)
왼쪽: 색상 스와치 5개 (사각형)
오른쪽: 설정 / +새메모 / 핀(항상위) / 최소화 / 닫기

#### 6. 설정 창
- Vault 경로 (폴더 선택 다이얼로그)
- 글로벌 단축키 변경
- Windows 시작 시 자동 실행 토글
- 설정 저장: `userData/config.json`

#### 7. 시스템 트레이
- 우클릭 메뉴: 새 메모 / 설정 / 종료
- 트레이 클릭: 새 메모 생성
- 모든 창 닫혀도 트레이 상주

---

## 파일 구조

```
01_sticker/
├── CLAUDE.md
├── package.json
└── src/
    ├── main.js          # 메인 프로세스 (트레이, 단축키, 창 관리, 파일 저장)
    ├── preload.js       # contextBridge IPC 브릿지
    ├── note.html        # 포스트잇 메모 창 UI
    ├── settings.html    # 설정 창 UI
    └── assets/
        └── icon.png
```

빌드 결과물: `dist/VaultNote-win32-x64/VaultNote.exe`

---

## IPC 채널 목록

| 채널명 | 방향 | 설명 |
|---|---|---|
| `note:save` | renderer→main | 메모 저장 요청 (창당 동일 파일 덮어쓰기) |
| `config:get` | renderer→main | 설정 조회 |
| `config:set` | renderer→main | 설정 저장 (autoStart 포함, vaultPath 변경 시 windowData 초기화) |
| `config:select-vault` | renderer→main | 폴더 선택 다이얼로그 |
| `config:get-autologin` | renderer→main | 자동 시작 여부 조회 |
| `window:new` | renderer→main | 새 메모 창 생성 |
| `window:close` | renderer→main | 현재 창 닫기 |
| `window:minimize` | renderer→main | 최소화 |
| `window:pin` | renderer→main | 항상 위 토글 |
| `window:colors` | renderer→main | 색상 팔레트 목록 조회 |
| `window:settings` | renderer→main | 설정 창 열기 |

---

## 빌드 방법

```bash
npm install
npx electron-packager . VaultNote --platform=win32 --arch=x64 --out=dist --overwrite \
  --ignore=node_modules/electron-builder --ignore=node_modules/electron-packager --ignore=dist
```

> ⚠️ electron-builder는 Windows에서 심볼릭 링크 권한(개발자 모드 또는 관리자) 없이는 빌드 실패.
> electron-packager 사용 권장.

---

## 주요 설계 결정 및 주의사항

- `contextIsolation: true`, `nodeIntegration: false` 유지
- 모든 파일 I/O는 메인 프로세스에서만 처리
- 타이틀바 hover 감지: `document.mousemove` + `e.clientY <= 40`, `requestAnimationFrame`으로 스로틀 (hover-zone div 방식은 z-index가 버튼 클릭을 막음)
- 색상 변경 시 `applyColor()` 함수가 body.background + titlebar.background + swatch.active 동기 처리
- 새 창 생성 시 `nextColorIndex` 순환하여 색상 자동 할당
- 저장 경로는 VaultNotes 서브폴더 없이 Vault 루트에 직접 저장
- **창당 1파일 보장**: `windowData` Map (webContentsId → {filePath, createdAt}) + `reservedNames` Set으로 파일명 충돌 방지
- Vault 경로 변경 시 `windowData`/`reservedNames` 초기화 → 기존 열린 창은 다음 저장 시 새 경로로 재예약
