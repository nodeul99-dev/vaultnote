# VaultNote

> Obsidian Vault에 바로 저장되는 포스트잇 메모 앱

![Electron](https://img.shields.io/badge/Electron-28-47848F?style=flat&logo=electron)
![Platform](https://img.shields.io/badge/Platform-Windows-0078D6?style=flat&logo=windows)
![License](https://img.shields.io/badge/License-MIT-green?style=flat)

---

## 소개

VaultNote는 Windows용 데스크톱 메모 앱입니다.
포스트잇처럼 화면에 띄워두고 빠르게 메모하면, **Obsidian Vault에 `.md` 파일로 자동 저장**됩니다.

별도의 동기화 설정 없이 Obsidian에서 바로 열어볼 수 있어요.

---

## 주요 기능

- **글로벌 단축키** `Ctrl+Shift+N` — 앱이 백그라운드에 있어도 새 메모 즉시 생성
- **자동 저장** — X 버튼 클릭 시 Vault에 저장 후 닫힘
- **Frontmatter 자동 생성** — `created`, `tags` (`#태그` 자동 파싱)
- **5가지 색상 테마** — Post-it Floral Fantasy 컬렉션 기반
- **다중 창** — 여러 메모를 동시에 띄울 수 있음
- **미니멀 UI** — 평소엔 한 장의 메모지처럼, 상단에 커서를 올리면 메뉴 등장
- **시스템 트레이 상주** — 창을 모두 닫아도 백그라운드에서 계속 실행
- **Windows 시작 시 자동 실행** 옵션

---

## 저장 형식

메모를 저장하면 Vault 루트에 아래 형식으로 파일이 생성됩니다.

```
{VaultPath}/2026-03-14-1523.md
```

```markdown
---
created: 2026-03-14T15:23:00
tags: [아이디어, 할일]
---

오늘 할 일 정리

#아이디어 #할일
```

---

## 색상 테마

| Sunnyside | Limeade | Blue Paradise | Positively Pink | Guava |
|:---------:|:-------:|:-------------:|:---------------:|:-----:|
| 🟡 | 🟢 | 🔵 | 🩷 | 🟠 |

---

## 실행 방법

```bash
# 의존성 설치
npm install

# 개발 실행
npm start

# Windows 실행파일 빌드
npx electron-packager . VaultNote --platform=win32 --arch=x64 --out=dist --overwrite
```

빌드 후 `dist/VaultNote-win32-x64/VaultNote.exe` 를 실행하거나 바탕화면에 바로가기를 만들어 사용합니다.

---

## 기술 스택

- [Electron](https://www.electronjs.org/) v28
- Vanilla JavaScript (번들러 없음)
- electron-packager

---

## 설정

첫 실행 시 자동으로 설정 창이 열립니다.
트레이 아이콘 우클릭 → **설정** 에서 언제든지 변경할 수 있습니다.

- Obsidian Vault 폴더 경로
- 글로벌 단축키
- Windows 시작 시 자동 실행
