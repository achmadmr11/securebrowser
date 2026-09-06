const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('examEduAPI', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  verifyAdminPassword: (password) => ipcRenderer.invoke('verify-admin-password', password),
  updateSettings: (settings) => ipcRenderer.invoke('update-settings', settings),
  verifyExitPassword: (password) => ipcRenderer.invoke('verify-exit-password', password),
  quitApp: (password) => ipcRenderer.invoke('quit-app', password),
  
  onTriggerExitDialog: (callback) => {
    ipcRenderer.on('trigger-exit-dialog', () => callback());
  },
  onTriggerAdminDialog: (callback) => {
    ipcRenderer.on('trigger-admin-dialog', () => callback());
  }
});
