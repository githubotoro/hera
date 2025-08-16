import { contextBridge } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

// Custom APIs for renderer
const api = {
  storage: {
    load: () => electronAPI.ipcRenderer.invoke('storage:load'),
    save: (data: any) => electronAPI.ipcRenderer.invoke('storage:save', data),
    clear: () => electronAPI.ipcRenderer.invoke('storage:clear')
  },
  window: {
    setTransparent: (isTransparent: boolean) =>
      electronAPI.ipcRenderer.invoke('window:setTransparent', isTransparent),
    minimize: () => electronAPI.ipcRenderer.invoke('window:minimize'),
    maximize: () => electronAPI.ipcRenderer.invoke('window:maximize'),
    close: () => electronAPI.ipcRenderer.invoke('window:close'),
    toggleTransparency: () => electronAPI.ipcRenderer.invoke('gamepad:toggleTransparency')
  }
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
