'use strict';
(() => {
  const desktop = !!(window.Android && typeof window.Android.isDesktop === 'function' && window.Android.isDesktop());
  if (!desktop) return;
  document.body.classList.add('pc-mode');
  const guide = document.getElementById('pcKeyGuide');
  if (guide) guide.classList.remove('hidden');
  if (window.PCBridge && typeof window.PCBridge.onAudioProgress === 'function') {
    window.PCBridge.onAudioProgress(info => { if (typeof window.cmFastImportProgress === 'function') window.cmFastImportProgress(info); });
  }
  const audioTitle = document.getElementById('audioStorageTitle');
  if (audioTitle) audioTitle.textContent = 'TRILHA SONORA (NO SEU PC)';
  const audioNote = document.getElementById('audioStorageNote');
  if (audioNote) audioNote.textContent = 'Importe MP3s ou um ZIP. As faixas e os efeitos ficam salvos no seu computador.';
  const recordNote = document.getElementById('recordNote');
  if (recordNote) recordNote.textContent = 'Exporta o cenário em WebM para a pasta Vídeos/CupheadMascot. Para capturar também o áudio do computador, use a gravação de tela do Windows.';
  const help = document.getElementById('bHelp');
  if (help) help.onclick = () => alertModal('Como jogar no PC', '<p><b>ANDAR:</b> A / D ou ← / →</p><p><b>PULAR:</b> Espaço &nbsp; <b>DASH:</b> Shift</p><p><b>ATIRAR:</b> J ou Z &nbsp; <b>PARRY:</b> P</p><p><b>MIRA:</b> teclado numérico 1, 2, 3, 4, 6, 7, 8 e 9. Segure para mirar e atirar.</p><p><b>EDITOR:</b> use o mouse para mover o chefão, desenhar hitbox e criar plataformas.</p><p><b>F11:</b> tela cheia &nbsp; <b>Esc:</b> sair da partida</p>');
  window.addEventListener('keydown', event => {
    const target = event.target;
    const typing = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
    if (!typing && event.code === 'KeyP' && !event.repeat && document.body.classList.contains('playing')) {
      event.preventDefault();
      if (typeof window.parryPressed === 'function') window.parryPressed();
    }
    if (!typing && event.code === 'Escape' && document.body.classList.contains('playing')) {
      event.preventDefault();
      if (typeof window.stopGame === 'function') window.stopGame();
    }
  });
})();