const {contextBridge, ipcRenderer} = require('electron');

// Expose a minimal, safe API to the renderer. With Electron's default contextIsolation the renderer cannot reach
// `shell` directly, so opening external links (Jira issue URLs) is forwarded to the main process over IPC.
contextBridge.exposeInMainWorld('plaid', {
  isElectron: true,
  openExternal: url => ipcRenderer.invoke('plaid:open-external', url),
  request: request => ipcRenderer.invoke('plaid:jira-request', request),
  auth: {
    getProfile: () => ipcRenderer.sendSync('plaid:auth:get-profile'),
    set: authInfo => ipcRenderer.sendSync('plaid:auth:set', authInfo),
    clear: () => ipcRenderer.sendSync('plaid:auth:clear')
  },
  oauth: {
    getConfiguration: () => ipcRenderer.sendSync('plaid:oauth:get-configuration'),
    login: options => ipcRenderer.invoke('plaid:oauth:login', options)
  },
  theme: {
    getShouldUseDarkColors: () => ipcRenderer.sendSync('plaid:theme:get'),
    setSource: source => ipcRenderer.send('plaid:theme:set', source),
    onUpdated: callback => {
      const listener = (_event, darkMode) => callback(darkMode);
      ipcRenderer.on('plaid:theme-updated', listener);
      return () => ipcRenderer.removeListener('plaid:theme-updated', listener);
    }
  }
});
