'use strict';
const { contextBridge, ipcRenderer } = require('electron');

const androidCompat = Object.freeze({
  isDesktop: () => ipcRenderer.sendSync('pc:is-desktop'),
  pickAudioFast: mode => ipcRenderer.sendSync('pc:pick-audio', mode),
  listImportedMedia: () => ipcRenderer.sendSync('pc:list-media'),
  importedMediaUrl: (type, name) => ipcRenderer.sendSync('pc:media-url', type, name),
  saveProject: json => ipcRenderer.sendSync('pc:save-project', json),
  listProjects: () => ipcRenderer.sendSync('pc:list-projects'),
  loadProject: name => ipcRenderer.sendSync('pc:load-project', name),
  deleteProject: name => ipcRenderer.sendSync('pc:delete-project', name),
  startVideo: (name, mime) => ipcRenderer.sendSync('pc:start-video', name, mime),
  appendVideo: data => ipcRenderer.sendSync('pc:append-video', data),
  finishVideo: () => ipcRenderer.sendSync('pc:finish-video')
});
contextBridge.exposeInMainWorld('Android', androidCompat);
contextBridge.exposeInMainWorld('PCBridge', Object.freeze({
  onAudioProgress: callback => {
    if (typeof callback === 'function') {
      ipcRenderer.on('cm-audio-progress', (_event, info) => callback(info));
    }
  }
}));