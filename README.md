# VaultNote

> **Sticky notes that live inside your Obsidian Vault.**

![Electron](https://img.shields.io/badge/Electron-28-47848F?style=flat&logo=electron)
![Platform](https://img.shields.io/badge/Platform-Windows-0078D6?style=flat&logo=windows)
![License](https://img.shields.io/badge/License-MIT-green?style=flat)

---

## What is VaultNote?

You have great ideas at random moments. But switching to Obsidian, creating a file, typing a title — by the time you're done, the thought is gone.

**VaultNote solves this.**

Press `Ctrl+Shift+N` — a sticky note appears instantly on your screen. Write your thought. Close it. Done.
Your note is already waiting for you in Obsidian, properly formatted with frontmatter and tags.

No cloud sync. No extra app. No friction. Just your thought, captured.

---

## Features

- **⚡ Global shortcut** `Ctrl+Shift+N` — summon a new note from anywhere, instantly
- **💾 Auto-save while you type** — saves to your Vault 1.5 seconds after you stop typing, no action needed
- **📄 One file per note** — each window maps to exactly one `.md` file; saving again overwrites it, never duplicates
- **🏷️ Auto tag extraction** — write `#tag` inline, frontmatter is generated automatically
- **🎨 5 color themes** — warm, handcrafted palette inspired by real sticky notes
- **🪟 Multi-window** — keep multiple notes floating on your screen simultaneously
- **👻 Ghost UI** — looks like a plain sticky note; hover the top edge to reveal controls
- **📌 System tray** — lives quietly in the background, always ready
- **🚀 Launch on startup** — optional auto-start with Windows

---

## How it saves

Each window gets its own file the moment it opens. The filename is locked in at creation time — saving again just overwrites it.

```
{YourVault}/2026-03-15-1523.md
```

```markdown
---
created: 2026-03-15T15:23:00
tags: [idea, todo]
---

Your note content here

#idea #todo
```

- Saves automatically 1.5s after you stop typing
- `Ctrl+S` saves immediately
- Closing the window does a final save — if it fails, the window stays open so you don't lose anything
- No subfolders. No special plugins. Just files Obsidian already knows how to read.

---

## Color Themes

| 햇살 | 새잎 | 여명 | 벚꽃 | 노을 |
|:----:|:----:|:----:|:----:|:----:|
| 🌕 Honey | 🌿 Mint | 💜 Lavender | 🌸 Rose | 🍑 Peach |

---

## Getting Started

```bash
git clone https://github.com/nodeul99-dev/vaultnote.git
cd vaultnote
npm install
npm start
```

**Build a standalone `.exe`:**
```bash
npx electron-packager . VaultNote --platform=win32 --arch=x64 --out=dist --overwrite
```

Run `dist/VaultNote-win32-x64/VaultNote.exe` — or create a desktop shortcut.

On first launch, a setup window will ask for your Obsidian Vault folder. That's it.

---

## Tech Stack

- [Electron](https://www.electronjs.org/) v28
- Vanilla JavaScript — no bundler, no framework
- electron-packager

---

---

## 소개 (한국어)

VaultNote는 Windows용 데스크톱 메모 앱입니다.
포스트잇처럼 화면에 띄워두고 빠르게 메모하면, **Obsidian Vault에 `.md` 파일로 자동 저장**됩니다.

별도의 동기화 설정 없이 Obsidian에서 바로 열어볼 수 있어요.

### 주요 기능

- **글로벌 단축키** `Ctrl+Shift+N` — 앱이 백그라운드에 있어도 새 메모 즉시 생성
- **자동 저장** — 타이핑 멈추면 1.5초 후 자동 저장. 창당 파일 1개 고정, 저장해도 중복 파일 없음
- **안전한 닫기** — X 버튼 클릭 시 최종 저장 후 닫힘. 저장 실패 시 창 유지 (메모 손실 방지)
- **Frontmatter 자동 생성** — `created` (창 생성 시각), `tags` (`#태그` 자동 파싱)
- **5가지 색상 테마** — 독자적인 한국어 이름의 파스텔 팔레트
- **다중 창** — 여러 메모를 동시에 띄울 수 있음
- **미니멀 UI** — 평소엔 한 장의 메모지처럼, 상단에 커서를 올리면 메뉴 등장
- **시스템 트레이 상주** — 창을 모두 닫아도 백그라운드에서 계속 실행
- **Windows 시작 시 자동 실행** 옵션

### 실행 방법

```bash
npm install
npm start
```

첫 실행 시 Vault 경로 설정 창이 자동으로 열립니다.
트레이 아이콘 우클릭 → **설정** 에서 언제든지 변경 가능합니다.
