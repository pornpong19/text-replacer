const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    selectFiles: () => ipcRenderer.invoke('select-files'),
    processFiles: (data) => ipcRenderer.invoke('process-files', data),
    getFilePaths: (fileItems) => ipcRenderer.invoke('get-file-paths', fileItems),
    savePresetDialog: () => ipcRenderer.invoke('save-preset-dialog'),
    openPresetDialog: () => ipcRenderer.invoke('open-preset-dialog'),
    writePresetFile: (filePath, content) => ipcRenderer.invoke('write-preset-file', filePath, content),
    readPresetFile: (filePath) => ipcRenderer.invoke('read-preset-file', filePath)
});