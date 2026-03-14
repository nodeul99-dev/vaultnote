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
  { name: 'Sunnyside',       bg: '#FFFBEA', bar: '#FFF3A3' },
  { name: 'Limeade',         bg: '#F2FAE8', bar: '#CDEEA0' },
  { name: 'Blue Paradise',   bg: '#E8F6FB', bar: '#A4DCEE' },
  { name: 'Positively Pink', bg: '#FFF0F5', bar: '#FFD0E2' },
  { name: 'Guava',           bg: '#FFF0EC', bar: '#FFBDAC' },
];

// ── 상태 ──────────────────────────────────────────────────────
let config = loadConfig();
let tray = null;
let settingsWin = null;
let lastWinBounds = null; // { x, y, width, height }
let nextColorIndex = 0;

// ── 파일명 생성 ───────────────────────────────────────────────
function generateFileName(dir) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const base = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  let name = `${base}.md`;
  if (!fs.existsSync(path.join(dir, name))) return name;
  let i = 1;
  while (fs.existsSync(path.join(dir, `${base}-${i}.md`))) i++;
  return `${base}-${i}.md`;
}

// ── 태그 추출 ─────────────────────────────────────────────────
function extractTags(content) {
  const matches = content.match(/#([^\s#]+)/g) || [];
  return matches.map((t) => t.slice(1));
}

// ── .md 파일 저장 ─────────────────────────────────────────────
function saveNoteFile(content) {
  if (!config.vaultPath) throw new Error('Vault 경로가 설정되지 않았습니다.');

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const dir = config.vaultPath;
  fs.mkdirSync(dir, { recursive: true });

  const fileName = generateFileName(dir);
  const filePath = path.join(dir, fileName);

  const tags = extractTags(content);
  const created = now.toISOString().slice(0, 19);
  const tagsStr = tags.length ? `[${tags.join(', ')}]` : '[]';

  const fileContent = `---\ncreated: ${created}\ntags: ${tagsStr}\n---\n\n${content}`;
  fs.writeFileSync(filePath, fileContent, 'utf-8');
  return filePath;
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

  win.on('close', () => {
    const b = win.getBounds();
    lastWinBounds = b;
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
    height: 360,
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
    throw new Error('Vault 경로가 설정되지 않았습니다.');
  }
  try {
    const filePath = saveNoteFile(content);
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.webContents.send('note:saved', { filePath });
    return { ok: true, filePath };
  } catch (err) {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.webContents.send('note:save-error', err.message);
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('config:get', () => config);

ipcMain.handle('config:set', (_, newConfig) => {
  config = { ...config, ...newConfig };
  saveConfig(config);
  registerShortcut();
  // 자동 시작 설정 반영
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
