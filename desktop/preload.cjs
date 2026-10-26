const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('tightDesktop', {
    getHosting: () => ipcRenderer.invoke('tight:hosting'),
    setHosting: address => ipcRenderer.invoke('tight:set-hosting', address),
});
