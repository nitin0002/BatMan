// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

// Expose a simple API to the renderer
contextBridge.exposeInMainWorld("batteryAPI", {
  // This calls ipcRenderer.invoke("getBatteryData") in the main process
  getBatteryData: async () => {
    return ipcRenderer.invoke("getBatteryData");
  }
});
