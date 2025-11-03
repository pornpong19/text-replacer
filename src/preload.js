const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    selectFiles: () => ipcRenderer.invoke('select-files'),
    processFiles: (data) => ipcRenderer.invoke('process-files', data),
    getFilePaths: (fileItems) => ipcRenderer.invoke('get-file-paths', fileItems)
});