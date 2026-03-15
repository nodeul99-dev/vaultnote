const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // 메모 저장
  saveNote: (content) => ipcRenderer.invoke('note:save', content),

  // 설정
  getConfig: () => ipcRenderer.invoke('config:get'),
  setConfig: (config) => ipcRenderer.invoke('config:set', config),
  selectVault: () => ipcRenderer.invoke('config:select-vault'),
  getAutoLogin: () => ipcRenderer.invoke('config:get-autologin'),

  // 창 제어
  newNote: () => ipcRenderer.send('window:new'),
  openSettings: () => ipcRenderer.send('window:settings'),
  getColors: () => ipcRenderer.invoke('window:colors'),
  closeWindow: () => ipcRenderer.send('window:close'),
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  togglePin: () => ipcRenderer.invoke('window:pin'),
});
