import { app, shell, BrowserWindow, ipcMain, session, globalShortcut, webContents } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';
import { storageManager, StorageData } from './storage';

function createWindow(): void {
  let isTransparentMode = false; // Track transparency state

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1920, // Full screen width
    height: 1080, // Full screen height
    show: false,
    autoHideMenuBar: true,
    transparent: false, // Disable transparency by default for normal operation
    hasShadow: true, // Enable window shadow for normal operation
    frame: true, // Enable window frame for window controls
    alwaysOnTop: false, // Don't keep on top by default
    type: 'default', // Use default window type for normal operation
    skipTaskbar: false, // Show in taskbar
    fullscreen: false, // Don't go fullscreen but allow overlay
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // Global keyboard shortcuts to toggle overlay mode (works even when window loses focus)
  // You can configure your gamepad software to send one of these keyboard shortcuts when LT+RT is pressed
  const toggleTransparency = () => {
    isTransparentMode = !isTransparentMode;
    if (isTransparentMode) {
      // Enable transparency and make window semi-transparent for overlay mode
      mainWindow.setBackgroundColor('#00000000'); // Transparent background
      mainWindow.setOpacity(0.2); // Semi-transparent for overlay indicators
      mainWindow.setIgnoreMouseEvents(true, { forward: true }); // Allow clicks to pass through
      mainWindow.setAlwaysOnTop(true, 'screen-saver'); // Keep on top with highest priority
      console.log('Window transparency enabled - overlay mode (via global shortcut)');
    } else {
      // Restore normal window
      mainWindow.setBackgroundColor('#ffffff'); // White background for normal operation
      mainWindow.setOpacity(1.0); // Fully opaque
      mainWindow.setIgnoreMouseEvents(false); // Restore normal mouse handling
      mainWindow.setAlwaysOnTop(false); // Don't keep on top in normal mode

      // Auto-focus the window when returning to normal mode
      mainWindow.focus();
      mainWindow.show(); // Ensure window is visible

      console.log('Window transparency disabled - normal mode (via global shortcut)');
    }

    // Notify renderer of state change
    mainWindow.webContents.send('transparency-state-changed', isTransparentMode);
  };

  // Register multiple shortcuts for convenience
  globalShortcut.register('Ctrl+Shift+G', toggleTransparency); // Gamepad shortcut
  globalShortcut.register('F12', toggleTransparency); // Easy to remember fallback

  // Start global shortcut detection when window is ready
  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  // IPC handler for gamepad transparency toggle from renderer (fallback)
  ipcMain.handle('gamepad:toggleTransparency', () => {
    isTransparentMode = !isTransparentMode;
    if (isTransparentMode) {
      // Enable transparency and make window semi-transparent for overlay mode
      mainWindow.setBackgroundColor('#00000000'); // Transparent background
      mainWindow.setOpacity(0.5); // Semi-transparent for overlay indicators
      mainWindow.setIgnoreMouseEvents(true, { forward: true }); // Allow clicks to pass through
      mainWindow.setAlwaysOnTop(true, 'screen-saver'); // Keep on top with highest priority
      console.log('Window transparency enabled - overlay mode (via gamepad)');
    } else {
      // Restore normal window
      mainWindow.setBackgroundColor('#ffffff'); // White background for normal operation
      mainWindow.setOpacity(1.0); // Fully opaque
      mainWindow.setIgnoreMouseEvents(false); // Restore normal mouse handling
      mainWindow.setAlwaysOnTop(false); // Don't keep on top in normal mode

      // Auto-focus the window when returning to normal mode
      mainWindow.focus();
      mainWindow.show(); // Ensure window is visible

      console.log('Window transparency disabled - normal mode (via gamepad)');
    }
    return isTransparentMode;
  });

  // IPC handlers for window transparency
  ipcMain.handle('window:setTransparent', (_, isTransparent: boolean) => {
    isTransparentMode = isTransparent;
    if (isTransparent) {
      // Enable transparency and make window semi-transparent for overlay mode
      mainWindow.setBackgroundColor('#00000000'); // Transparent background
      mainWindow.setOpacity(0.5); // Semi-transparent for overlay indicators
      mainWindow.setIgnoreMouseEvents(true, { forward: true }); // Allow clicks to pass through
      mainWindow.setAlwaysOnTop(true, 'screen-saver'); // Keep on top with highest priority
      console.log('Window transparency enabled - overlay mode');
    } else {
      // Restore normal window
      mainWindow.setBackgroundColor('#ffffff'); // White background for normal operation
      mainWindow.setOpacity(1.0); // Fully opaque
      mainWindow.setIgnoreMouseEvents(false); // Restore normal mouse handling
      mainWindow.setAlwaysOnTop(false); // Don't keep on top in normal mode

      // Auto-focus the window when returning to normal mode
      mainWindow.focus();
      mainWindow.show(); // Ensure window is visible

      console.log('Window transparency disabled - normal mode');
    }
    return true;
  });

  // IPC handlers for window controls
  ipcMain.handle('window:minimize', () => {
    mainWindow.minimize();
    return true;
  });

  ipcMain.handle('window:maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
    return true;
  });

  ipcMain.handle('window:close', () => {
    mainWindow.close();
    return true;
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

// Disable hardware acceleration for better transparency support
// This must be called before app is ready
app.disableHardwareAcceleration();

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron');

  // Configure CORS bypass for development
  if (is.dev) {
    session.defaultSession.webRequest.onBeforeSendHeaders(
      { urls: ['http://localhost:8000/*'] },
      (details, callback) => {
        details.requestHeaders['Origin'] = 'http://localhost:8000';
        callback({ requestHeaders: details.requestHeaders });
      }
    );

    session.defaultSession.webRequest.onHeadersReceived(
      { urls: ['http://localhost:8000/*'] },
      (details, callback) => {
        if (details.responseHeaders) {
          details.responseHeaders['Access-Control-Allow-Origin'] = ['*'];
          details.responseHeaders['Access-Control-Allow-Methods'] = [
            'GET, POST, PUT, DELETE, OPTIONS'
          ];
          details.responseHeaders['Access-Control-Allow-Headers'] = ['Content-Type, Authorization'];
        }
        callback({ responseHeaders: details.responseHeaders });
      }
    );
  }

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // IPC test
  ipcMain.on('ping', () => console.log('pong'));

  // Storage IPC handlers
  ipcMain.handle('storage:load', () => {
    return storageManager.load();
  });

  ipcMain.handle('storage:save', (_, data: StorageData) => {
    storageManager.save(data);
    return true;
  });

  ipcMain.handle('storage:clear', () => {
    storageManager.clear();
    return true;
  });

  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
