const { app, BrowserWindow, ipcMain, Menu, globalShortcut, dialog, session } = require('electron');
const path = require('path');
const Store = require('./store');

let mainWindow = null;
let store = null;
let isQuittingAllowed = false;

function createWindow() {
  store = new Store();

  // Deny all web/system notifications from webview and main session
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'notifications' || permission === 'mediaKeySystem') {
      return callback(false);
    }
    callback(true);
  });

  session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
    if (permission === 'notifications') {
      return false;
    }
    return true;
  });

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    fullscreen: true,
    kiosk: true, // macOS Kiosk mode (locks down spaces, menubar, dock)
    alwaysOnTop: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    closable: false,
    title: store.get('appTitle') || 'Secure Exam Browser',
    icon: path.join(__dirname, 'src/assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true, // Enable <webview> for the CBT exam portal
      spellcheck: false,
      devTools: false // Disable DevTools in production
    }
  });

  // Elevate window level to 'screen-saver' to render above macOS Notification Center banners and system popups
  mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // Enable macOS Screenshot and Screen Capture protection
  if (typeof mainWindow.setContentProtection === 'function') {
    mainWindow.setContentProtection(true);
  }

  // Remove macOS default menu (disables default Cmd+Q, Cmd+W, etc.)
  Menu.setApplicationMenu(null);

  // Load UI
  mainWindow.loadFile(path.join(__dirname, 'src/index.html'));

  // Anti-Cheat: If user attempts to click notification banner, dock, or switch apps, reclaim focus immediately
  mainWindow.on('blur', () => {
    if (!isQuittingAllowed && mainWindow && !mainWindow.isDestroyed()) {
      setTimeout(() => {
        if (!isQuittingAllowed && mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
          app.focus({ steal: true });
          if (mainWindow.webContents) {
            mainWindow.webContents.send('app-blur-warning');
          }
        }
      }, 50);
    }
  });

  // Intercept window close attempt (e.g. system signal)
  mainWindow.on('close', (e) => {
    if (!isQuittingAllowed) {
      e.preventDefault();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('trigger-exit-dialog');
      }
    }
  });

  // Block popup windows / external links from opening new Electron windows
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });


  // Intercept keyboard shortcuts
  mainWindow.webContents.on('before-input-event', (event, input) => {
    const isMac = process.platform === 'darwin';
    const isCmd = isMac ? input.meta : input.control;

    // Block DevTools shortcuts (Cmd+Alt+I, Ctrl+Shift+I, F12)
    if (
      input.key === 'F12' ||
      ((input.control || input.meta) && input.shift && input.key.toLowerCase() === 'i') ||
      (input.meta && input.alt && input.key.toLowerCase() === 'i')
    ) {
      event.preventDefault();
      return;
    }

    // Block Reload shortcuts (Cmd+R, Ctrl+R, F5)
    if (
      input.key === 'F5' ||
      (isCmd && input.key.toLowerCase() === 'r')
    ) {
      event.preventDefault();
      return;
    }

    // Block Exit/Minimize/Hide shortcuts (Cmd+Q, Cmd+W, Cmd+M, Cmd+H, Alt+F4)
    if (
      (isCmd && ['q', 'w', 'm', 'h'].includes(input.key.toLowerCase())) ||
      (input.alt && input.key === 'F4')
    ) {
      event.preventDefault();
      mainWindow.webContents.send('trigger-exit-dialog');
      return;
    }

    // Secret Admin shortcut: Cmd+Shift+A or Ctrl+Shift+A
    if (isCmd && input.shift && input.key.toLowerCase() === 'a') {
      event.preventDefault();
      mainWindow.webContents.send('trigger-admin-dialog');
      return;
    }

    // Secret Exit shortcut: Cmd+Shift+X or Ctrl+Shift+X
    if (isCmd && input.shift && input.key.toLowerCase() === 'x') {
      event.preventDefault();
      mainWindow.webContents.send('trigger-exit-dialog');
      return;
    }
  });

  // Prevent right-click context menu (anti-inspect)
  mainWindow.webContents.on('context-menu', (e) => {
    e.preventDefault();
  });
}

// Register IPC handlers
ipcMain.handle('get-settings', async () => {

  return {
    examUrl: store.get('examUrl'),
    appTitle: store.get('appTitle')
  };
});

ipcMain.handle('verify-admin-password', async (event, password) => {
  const currentAdminPass = store.get('adminPassword');
  return password === currentAdminPass;
});

ipcMain.handle('update-settings', async (event, newSettings) => {
  if (newSettings.examUrl) {
    store.set('examUrl', newSettings.examUrl.trim());
  }
  if (newSettings.appTitle) {
    store.set('appTitle', newSettings.appTitle.trim());
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setTitle(newSettings.appTitle.trim());
    }
  }
  return { success: true };
});

ipcMain.handle('verify-exit-password', async (event, password) => {
  const currentExitPass = store.get('exitPassword');
  return password === currentExitPass;
});

ipcMain.handle('quit-app', async (event, password) => {
  const currentExitPass = store.get('exitPassword');
  if (password === currentExitPass) {
    isQuittingAllowed = true;
    try {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.setClosable(true);
        mainWindow.setKiosk(false);
        mainWindow.setFullScreen(false);
        mainWindow.destroy();
      }
    } catch (e) {
      console.error('Error closing window:', e);
    }
    app.quit();
    setTimeout(() => {
      app.exit(0);
    }, 100);
    return { success: true };
  }
  return { success: false, message: 'Password salah!' };
});

// App lifecycle
app.on('before-quit', () => {
  isQuittingAllowed = true;
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' || isQuittingAllowed) {
    app.quit();
  }
});

