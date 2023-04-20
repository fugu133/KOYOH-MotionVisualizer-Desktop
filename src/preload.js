const electron = require('electron');

process.once('loaded', () => {
    global.ipcRenderer = electron.ipcRenderer;
    global.app = electron.remote.app;
});

electron.contextBridge.exposeInMainWorld('electronAPI', {
    importMotionFile: () => ipcRenderer.invoke('import-motion-file')
});