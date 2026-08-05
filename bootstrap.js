const {app, BrowserWindow, Menu, nativeTheme} = require('electron');
const path = require('path');
const {autoUpdater} = require('electron-updater');
const {getNewWindowRect, getNewWindowMaximized, saveWindowState} = require('./window-state');
const {registerElectronBridge} = require('./electron-main-bridge');

let firstWindowCreated = false;

registerElectronBridge();
  const titleBarColors = () => nativeTheme.shouldUseDarkColors
    ? {color: '#121212', symbolColor: '#ffffff', height: 34}
    : {color: '#f2f2f2', symbolColor: '#202020', height: 34};


function createWindow(dev) {
  if (!firstWindowCreated) { // Check for update once in the process (if subsequent windows are opened, don't check again)
    void autoUpdater.checkForUpdatesAndNotify().catch(error => {
      console.warn('Automatic update check failed:', error.message);
    });
  }

  const windowRect = getNewWindowRect({
    defaultWidth: 1400,
    defaultHeight: 800,
    isFirstWindow: !firstWindowCreated
  });

  const window = new BrowserWindow({
    width: windowRect.width,
    height: windowRect.height,
    x: windowRect.x,
    y: windowRect.y,
    minWidth: 400,
    minHeight: 200,
    show: false,
    darkTheme: process.platform === 'linux' && nativeTheme.shouldUseDarkColors,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1e1e1e' : '#ffffff',
    titleBarStyle: 'hidden',
    titleBarOverlay: titleBarColors(),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      // Bridge a minimal, safe API (window.electron.openExternal) into the renderer via contextBridge. shell is only
      // reachable from the main process under Electron's default contextIsolation, so external links go through IPC.
      preload: path.join(__dirname, 'preload.js')
    }
  });

  const updateTitleBar = () => window.setTitleBarOverlay(titleBarColors());
  nativeTheme.on('updated', updateTitleBar);
  window.on('closed', () => nativeTheme.removeListener('updated', updateTitleBar));
  window.on('close', () => {
    saveWindowState(window.getNormalBounds(), window.isMaximized());
  });

  window.webContents.setWindowOpenHandler(() => ({action: 'deny'}));
  window.webContents.on('will-navigate', event => {
    event.preventDefault();
  });

  window.webContents.session.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));

  window.webContents.addListener('context-menu', (e, params) => {
    if (params.isEditable || params.inputFieldType !== 'none') {
      Menu.buildFromTemplate([
        {
          label: 'Undo',
          role: 'undo',
          enabled: params.editFlags.canUndo
        }, {
          label: 'Redo',
          role: 'redo',
          enabled: params.editFlags.canRedo
        }, {
          type: 'separator',
        }, {
          label: 'Cut',
          role: 'cut',
          enabled: params.editFlags.canCut
        }, {
          label: 'Copy',
          role: 'copy',
          enabled: params.editFlags.canCopy
        }, {
          label: 'Paste',
          role: 'paste',
          enabled: params.editFlags.canPaste
        }, {
          label: 'Select all',
          role: 'selectAll',
          enabled: params.editFlags.canSelectAll
        }
      ]).popup();
    }
  });

  if (dev) {
    window.webContents.openDevTools();
    window.loadURL('http://localhost:4300');
  } else {
    window.setMenu(null);
    window.loadFile('build/index.html');
  }
  if (getNewWindowMaximized(!firstWindowCreated)) {
    window.maximize();
  }
  window.show();
  firstWindowCreated = true;
}

module.exports = function(dev) {
  if (app.requestSingleInstanceLock()) {
    app.on('ready', () => createWindow(dev));
    app.on('second-instance', () => createWindow(dev));
    app.on('window-all-closed', () => app.quit());
  } else {
    console.log('Opened new window in primary process');
    app.quit();
  }
};
