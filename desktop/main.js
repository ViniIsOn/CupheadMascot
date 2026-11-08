'use strict';
const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const AdmZip = require('adm-zip');

app.setAppUserModelId('com.viniison.cupheadmascot.desktop');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let mainWindow = null;
let videoFile = null;
let videoHandle = null;

function safeName(value, fallback) {
  const name = path.basename(String(value || fallback || 'arquivo'))
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').replace(/[. ]+$/g, '').slice(-110);
  return name || (fallback || 'arquivo');
}
function userFolder(...parts) {
  const folder = path.join(app.getPath('userData'), ...parts);
  fs.mkdirSync(folder, { recursive: true });
  return folder;
}
function mediaFolder(type) {
  if (!['music', 'hit', 'parry'].includes(type)) throw new Error('Tipo de áudio inválido');
  return userFolder('user_media', type);
}
function audioType(name) {
  const lower = String(name).toLowerCase();
  if (!/\.(mp3|ogg|wav)$/.test(lower)) return null;
  if (lower.endsWith('.wav') && lower.includes('parry')) return 'parry';
  if (lower.endsWith('.wav') && lower.includes('hit')) return 'hit';
  return 'music';
}
function addAudio(buffer, fileName) {
  const name = safeName(fileName, 'audio.mp3');
  const type = audioType(name);
  if (!type) return false;
  if (buffer.length > 95_000_000) throw new Error('Arquivo maior que 95 MB');
  const folder = mediaFolder(type);
  const target = path.join(folder, name);
  const temp = target + '.' + process.pid + '.tmp';
  fs.writeFileSync(temp, buffer);
  fs.renameSync(temp, target);
  return true;
}
function listMedia() {
  const result = [];
  for (const type of ['music', 'hit', 'parry']) {
    for (const name of fs.readdirSync(mediaFolder(type)).sort((a, b) => a.localeCompare(b))) {
      const file = path.join(mediaFolder(type), name);
      try { const stat = fs.statSync(file); if (stat.isFile()) result.push({ type, name, size: stat.size }); } catch (_) {}
    }
  }
  return result;
}
function progress(sender, state, message, processed, total) {
  if (!sender.isDestroyed()) sender.send('cm-audio-progress', { state, message, processed: processed || 0, total: total || 0 });
}
async function pickAudio(sender, mode) {
  const filters = mode === 'zip'
    ? [{ name: 'Pacotes ZIP', extensions: ['zip'] }]
    : [{ name: 'Áudios', extensions: ['mp3', 'ogg', 'wav', 'zip'] }];
  const result = await dialog.showOpenDialog(mainWindow, {
    title: mode === 'zip' ? 'Importar músicas e efeitos' : 'Importar músicas',
    properties: ['openFile', 'multiSelections'],
    filters
  });
  if (result.canceled || !result.filePaths.length) {
    progress(sender, 'cancel', 'Importação cancelada');
    return;
  }
  let imported = 0, errors = 0;
  for (let i = 0; i < result.filePaths.length; i++) {
    const file = result.filePaths[i];
    const name = path.basename(file);
    progress(sender, 'progress', 'Importando ' + name + ' (' + (i + 1) + '/' + result.filePaths.length + ')', i, result.filePaths.length);
    try {
      if (name.toLowerCase().endsWith('.zip')) {
        const zip = new AdmZip(file);
        const entries = zip.getEntries().filter(entry => !entry.isDirectory).slice(0, 100);
        for (const entry of entries) {
          const clean = entry.entryName.replace(/\\/g, '/');
          if (clean.split('/').includes('..') || !audioType(clean)) continue;
          const data = entry.getData();
          if (data.length <= 48_000_000 && addAudio(data, path.basename(clean))) imported++;
        }
      } else if (addAudio(fs.readFileSync(file), name)) {
        imported++;
      } else {
        throw new Error('Formato não suportado');
      }
    } catch (error) {
      errors++;
      progress(sender, 'progress', 'Falha em ' + name + ': ' + error.message, i + 1, result.filePaths.length);
    }
  }
  const state = errors ? (imported ? 'partial' : 'error') : 'done';
  progress(sender, state, 'Importação concluída: ' + imported + ' áudio(s)' + (errors ? '; ' + errors + ' arquivo(s) com erro' : ''), result.filePaths.length, result.filePaths.length);
}
function projectsFolder() { return userFolder('projects'); }
function projectName(value) {
  return String(value || 'Chefao').replace(/[^\p{L}\p{N}_ -]/gu, '_').trim().replace(/ +/g, ' ').slice(0, 45) || 'Chefao';
}

ipcMain.on('pc:is-desktop', event => { event.returnValue = true; });
ipcMain.on('pc:list-media', event => { event.returnValue = JSON.stringify(listMedia()); });
ipcMain.on('pc:media-url', (event, type, name) => {
  try {
    const file = path.join(mediaFolder(type), safeName(name));
    event.returnValue = fs.existsSync(file) ? pathToFileURL(file).href : '';
  } catch (_) { event.returnValue = ''; }
});
ipcMain.on('pc:pick-audio', (event, mode) => {
  event.returnValue = 'OK';
  setImmediate(() => pickAudio(event.sender, mode).catch(error => progress(event.sender, 'error', error.message)));
});
ipcMain.on('pc:save-project', (event, raw) => {
  try {
    const project = JSON.parse(raw);
    fs.writeFileSync(path.join(projectsFolder(), projectName(project.bossName) + '.json'), JSON.stringify(project), 'utf8');
    event.returnValue = 'OK';
  } catch (error) { event.returnValue = error.message || 'Erro ao salvar'; }
});
ipcMain.on('pc:list-projects', event => {
  try { event.returnValue = JSON.stringify(fs.readdirSync(projectsFolder()).filter(name => name.endsWith('.json')).map(name => name.slice(0, -5))); }
  catch (_) { event.returnValue = '[]'; }
});
ipcMain.on('pc:load-project', (event, name) => {
  try { event.returnValue = fs.readFileSync(path.join(projectsFolder(), projectName(name) + '.json'), 'utf8'); }
  catch (_) { event.returnValue = ''; }
});
ipcMain.on('pc:delete-project', (event, name) => {
  try { fs.unlinkSync(path.join(projectsFolder(), projectName(name) + '.json')); event.returnValue = 'OK'; }
  catch (_) { event.returnValue = 'Erro'; }
});

function videosFolder() { return userFolder('Videos', 'CupheadMascot'); }
ipcMain.on('pc:start-video', (event, name) => {
  try {
    if (videoHandle !== null) fs.closeSync(videoHandle);
    videoFile = path.join(videosFolder(), safeName(name, 'CupheadMascot.webm'));
    videoHandle = fs.openSync(videoFile, 'w');
    event.returnValue = 'OK';
  } catch (error) { event.returnValue = error.message; }
});
ipcMain.on('pc:append-video', (event, base64) => {
  try {
    if (videoHandle === null) throw new Error('Gravação não iniciada');
    fs.writeSync(videoHandle, Buffer.from(base64, 'base64'));
    event.returnValue = 'OK';
  } catch (error) { event.returnValue = error.message; }
});
ipcMain.on('pc:finish-video', event => {
  try {
    if (videoHandle !== null) fs.closeSync(videoHandle);
    videoHandle = null;
    if (videoFile) shell.showItemInFolder(videoFile);
    videoFile = null;
    event.returnValue = 'OK';
  } catch (error) { event.returnValue = error.message; }
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440, height: 940, minWidth: 1040, minHeight: 720,
    show: false, autoHideMenuBar: true, backgroundColor: '#0e1220',
    title: 'CupheadMascot — Boss Studio',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: false, webSecurity: true
    }
  });
  mainWindow.loadFile(path.join(__dirname, 'game', 'index.html'));
  mainWindow.once('ready-to-show', () => mainWindow && mainWindow.show());
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') {
      event.preventDefault();
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
  });
  mainWindow.on('closed', () => { mainWindow = null; });
}
app.whenReady().then(() => { createWindow(); app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); }); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('before-quit', () => { try { if (videoHandle !== null) fs.closeSync(videoHandle); } catch (_) {} });
