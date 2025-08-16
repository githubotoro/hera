import { ElectronAPI } from '@electron-toolkit/preload';

interface StorageAPI {
  load: () => Promise<any>;
  save: (data: any) => Promise<boolean>;
  clear: () => Promise<boolean>;
}

interface WindowAPI {
  setTransparent: (isTransparent: boolean) => Promise<boolean>;
  minimize: () => Promise<boolean>;
  maximize: () => Promise<boolean>;
  close: () => Promise<boolean>;
  toggleTransparency: () => Promise<boolean>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      storage: StorageAPI;
      window: WindowAPI;
    };
  }
}
