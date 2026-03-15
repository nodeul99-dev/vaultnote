const { app, BrowserWindow, globalShortcut, ipcMain, Tray, Menu, dialog, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

// ── 설정 파일 경로 ──────────────────────────────────────────────
const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json');

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    }
  } catch (_) {}
  return { vaultPath: '', shortcut: 'Ctrl+Shift+N' };
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

// ── Floral Fantasy 배색 ───────────────────────────────────────
const COLORS = [
  { name: '햇살',   bg: '#FFFBE0', bar: '#FFE97A' },  // 노란→호박빛 amber
  { name: '새잎',   bg: '#EDFAF4', bar: '#A8E6C3' },  // 라임→민트 teal
  { name: '여명',   bg: '#EEF0FB', bar: '#BCC4F0' },  // 하늘→라벤더 blue
  { name: '벚꽃',   bg: '#FFF0F2', bar: '#FFD5DC' },  // 핑크→로즈 rose
  { name: '노을',   bg: '#FFF4EE', bar: '#FFCCA8' },  // 살몬→피치 peach
];

// ── 상태 ──────────────────────────────────────────────────────
let config = loadConfig();
let tray = null;
let settingsWin = null;
let lastWinBounds = null; // { x, y, width, height }
let nextColorIndex = 0;

// 창당 파일 정보: webContentsId → { filePath, createdAt }
const windowData = new Map();
// 예약된 파일명(아직 디스크에 없는): basename Set
const reservedNames = new Set();

// ── 파일명 예약 ───────────────────────────────────────────────
function reserveFileName() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const base = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  let name = `${base}.md`;
  let i = 1;
  while (fs.existsSync(path.join(config.vaultPath, name)) || reservedNames.has(name)) {
    name = `${base}-${i}.md`;
    i++;
  }
  reservedNames.add(name);
  return { filePath: path.join(config.vaultPath, name), createdAt: now };
}

// ── 태그 추출 ─────────────────────────────────────────────────
function extractTags(content) {
  const matches = content.match(/#([^\s#]+)/g) || [];
  return matches.map((t) => t.slice(1));
}

// ── 메모 창 생성 ──────────────────────────────────────────────
function createNoteWindow() {
  const offset = 24;
  let x, y;

  if (lastWinBounds) {
    x = lastWinBounds.x + offset;
    y = lastWinBounds.y + offset;
  }

  const colorIndex = nextColorIndex;
  nextColorIndex = (nextColorIndex + 1) % COLORS.length;

  const win = new BrowserWindow({
    width: lastWinBounds?.width || 360,
    height: lastWinBounds?.height || 360,
    x,
    y,
    minWidth: 200,
    minHeight: 200,
    frame: false,
    transparent: false,
    resizable: true,
    skipTaskbar: false,
    alwaysOnTop: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, 'note.html'), {
    query: { colorIndex: String(colorIndex) },
  });

  // 창 생성 시 파일명 예약 (vault 설정된 경우)
  if (config.vaultPath) {
    const reserved = reserveFileName();
    windowData.set(win.webContents.id, reserved);
  }

  win.on('close', () => {
    lastWinBounds = win.getBounds();
    const data = windowData.get(win.webContents.id);
    if (data) {
      reservedNames.delete(path.basename(data.filePath));
      windowData.delete(win.webContents.id);
    }
  });

  return win;
}

// ── 설정 창 ──────────────────────────────────────────────────
function createSettingsWindow() {
  if (settingsWin && !settingsWin.isDestroyed()) {
    settingsWin.focus();
    return;
  }
  settingsWin = new BrowserWindow({
    width: 480,
    height: 500,
    resizable: false,
    frame: true,
    title: 'VaultNote 설정',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  settingsWin.loadFile(path.join(__dirname, 'settings.html'));
  settingsWin.on('closed', () => { settingsWin = null; });
}

// ── 트레이 ───────────────────────────────────────────────────
function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  let icon;
  if (fs.existsSync(iconPath)) {
    icon = nativeImage.createFromPath(iconPath);
  } else {
    // 아이콘 파일이 없으면 빈 아이콘
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip('VaultNote');

  const menu = Menu.buildFromTemplate([
    { label: '새 메모', click: () => createNoteWindow() },
    { label: '설정', click: () => createSettingsWindow() },
    { type: 'separator' },
    { label: '종료', click: () => app.quit() },
  ]);

  tray.setContextMenu(menu);
  tray.on('click', () => createNoteWindow());
}

// ── 단축키 등록 ───────────────────────────────────────────────
function registerShortcut() {
  globalShortcut.unregisterAll();
  const shortcut = config.shortcut || 'Ctrl+Shift+N';
  globalShortcut.register(shortcut, () => {
    if (!config.vaultPath) {
      createSettingsWindow();
    } else {
      createNoteWindow();
    }
  });
}

// ── IPC 핸들러 ────────────────────────────────────────────────
ipcMain.handle('note:save', async (event, content) => {
  if (!config.vaultPath) {
    createSettingsWindow();
    return { ok: false, error: 'Vault 경로가 설정되지 않았습니다.' };
  }
  try {
    // 이 창에 할당된 파일 정보 조회 (없으면 지금 예약)
    let data = windowData.get(event.sender.id);
    if (!data) {
      data = reserveFileName();
      windowData.set(event.sender.id, data);
    }

    fs.mkdirSync(config.vaultPath, { recursive: true });
    const tags = extractTags(content);
    const created = data.createdAt.toISOString().slice(0, 19);
    const tagsStr = tags.length ? `[${tags.join(', ')}]` : '[]';
    fs.writeFileSync(data.filePath, `---\ncreated: ${created}\ntags: ${tagsStr}\n---\n\n${content}`, 'utf-8');

    // 파일이 실제로 생성됐으니 예약 목록에서 제거
    reservedNames.delete(path.basename(data.filePath));

    return { ok: true, filePath: data.filePath };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('config:get', () => config);

ipcMain.handle('config:set', (_, newConfig) => {
  const vaultChanged = newConfig.vaultPath && newConfig.vaultPath !== config.vaultPath;
  config = { ...config, ...newConfig };
  saveConfig(config);
  registerShortcut();
  if (vaultChanged) {
    // 이미 열린 창들의 파일 예약을 초기화 — 다음 저장 시 새 경로로 재예약됨
    windowData.clear();
    reservedNames.clear();
  }
  app.setLoginItemSettings({
    openAtLogin: !!config.autoStart,
    name: 'VaultNote',
  });
  return config;
});

ipcMain.handle('config:get-autologin', () => {
  return app.getLoginItemSettings().openAtLogin;
});

ipcMain.handle('config:select-vault', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory'],
    title: 'Obsidian Vault 폴더 선택',
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.on('window:new', (event) => {
  const sender = BrowserWindow.fromWebContents(event.sender);
  const bounds = sender?.getBounds();
  if (bounds) lastWinBounds = bounds;
  createNoteWindow();
});

ipcMain.handle('window:colors', () => COLORS);

ipcMain.handle('window:bounds', (event) => {
  return BrowserWindow.fromWebContents(event.sender)?.getBounds() ?? null;
});

ipcMain.on('window:settings', () => createSettingsWindow());

ipcMain.on('window:close', (event) => {
  BrowserWindow.fromWebContents(event.sender)?.close();
});

ipcMain.on('window:minimize', (event) => {
  BrowserWindow.fromWebContents(event.sender)?.minimize();
});

ipcMain.handle('window:pin', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return false;
  const next = !win.isAlwaysOnTop();
  win.setAlwaysOnTop(next);
  return next;
});

// ── 앱 초기화 ────────────────────────────────────────────────
app.whenReady().then(() => {
  createTray();
  registerShortcut();

  if (!config.vaultPath) {
    createSettingsWindow();
  } else {
    createNoteWindow();
  }
});

app.on('window-all-closed', (e) => {
  // 모든 창이 닫혀도 트레이에서 계속 실행
  e.preventDefault();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
