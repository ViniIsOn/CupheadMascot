from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parent.parent
DESKTOP = ROOT / 'desktop'
ASSETS = ROOT / 'app' / 'src' / 'main' / 'assets'
GAME = DESKTOP / 'game'

if not ASSETS.is_dir():
    raise SystemExit(f'Assets do jogo não encontrados: {ASSETS}')
shutil.copytree(ASSETS, GAME, dirs_exist_ok=True)

index = GAME / 'index.html'
html = index.read_text(encoding='utf-8')
html = html.replace('BOSS STUDIO / BETA 1.7 • 9:16', 'VERSÃO WINDOWS • TECLADO + MOUSE')
html = html.replace('<strong>TRILHA SONORA (NO SEU CELULAR)</strong>', '<strong id="audioStorageTitle">TRILHA SONORA (NO SEU PC)</strong>')
html = html.replace('Importe seus MP3s ou o ZIP enviado. As faixas são sorteadas a cada batalha e ao terminar uma música; não vão para o GitHub público.', '<span id="audioStorageNote">Importe MP3s ou um ZIP. As faixas e efeitos ficam salvos no seu computador.</span>')
html = html.replace('Grava o próprio cenário em 9:16, sem barras. Formato WebM (se o Android permitir). Para vídeos MP4, use o gravador de tela do celular.', 'Exporta o cenário em WebM para a pasta Vídeos/CupheadMascot. Para capturar também o áudio do computador, use a gravação de tela do Windows.')
html = html.replace('</div><div id="stageFooter">', '</div><div id="pcKeyGuide" class="pc-key-guide hidden"><strong>CONTROLES DO PC</strong><span><kbd>A</kbd> <kbd>D</kbd> / <kbd>←</kbd> <kbd>→</kbd> andar</span><span><kbd>ESPAÇO</kbd> pular &nbsp; <kbd>SHIFT</kbd> dash</span><span><kbd>J</kbd> / <kbd>Z</kbd> atirar &nbsp; <kbd>P</kbd> parry</span><span><kbd>NUMPAD 1–9</kbd> mirar em 8 direções</span><span><kbd>F11</kbd> tela cheia &nbsp; <kbd>ESC</kbd> sair</span></div><div id="stageFooter">')
html = html.replace('<script src="sprite_metrics.js"></script><script src="engine.js"></script>', '<script src="sprite_metrics.js"></script><script src="engine.js"></script><script src="pc-mode.js"></script>')
index.write_text(html, encoding='utf-8')

engine = GAME / 'engine.js'
js = engine.read_text(encoding='utf-8')
old_down = "addEventListener('keydown',e=>{const compass={Numpad8:[0,-1],Numpad9:[.707,-.707],Numpad6:[1,0],Numpad3:[.707,.707],Numpad2:[0,1],Numpad1:[-.707,.707],Numpad4:[-1,0],Numpad7:[-.707,-.707],KeyW:[0,-1],KeyS:[0,1],KeyQ:[-.707,-.707],KeyE:[.707,-.707]};if(compass[e.code]){e.preventDefault();[aim.x,aim.y]=compass[e.code];aim.active=true;syncAimUI()}});"
new_down = "addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;const compass={Numpad8:[0,-1],Numpad9:[.707,-.707],Numpad6:[1,0],Numpad3:[.707,.707],Numpad2:[0,1],Numpad1:[-.707,.707],Numpad4:[-1,0],Numpad7:[-.707,-.707],Digit8:[0,-1],Digit9:[.707,-.707],Digit6:[1,0],Digit3:[.707,.707],Digit2:[0,1],Digit1:[-.707,.707],Digit4:[-1,0],Digit7:[-.707,-.707],KeyW:[0,-1],KeyS:[0,1],KeyQ:[-.707,-.707],KeyE:[.707,-.707]};if(compass[e.code]){e.preventDefault();[aim.x,aim.y]=compass[e.code];aim.active=true;aimShoot=true;ensureSound();syncAimUI()}});"
old_up = "addEventListener('keyup',e=>{if(['KeyW','KeyS','KeyQ','KeyE'].includes(e.code)||e.code.startsWith('Numpad')){aim.active=false;syncAimUI()}});"
new_up = "addEventListener('keyup',e=>{if(['KeyW','KeyS','KeyQ','KeyE'].includes(e.code)||e.code.startsWith('Numpad')||/^Digit[1-9]$/.test(e.code)){aim.active=false;aimShoot=false;syncAimUI()}});"
if old_down not in js:
    raise SystemExit('Nao encontrei o handler original de mira no engine.js')
if old_up not in js:
    raise SystemExit('Nao encontrei o handler original de soltar mira no engine.js')
js = js.replace(old_down, new_down).replace(old_up, new_up)
engine.write_text(js, encoding='utf-8')

css = GAME / 'style.css'
css_text = css.read_text(encoding='utf-8')
css_text += """

/* CupheadMascot Desktop — arena vertical e teclado/mouse no Windows. */
.pc-mode #touchUI { display:none !important; }
.pc-mode #pcKeyGuide { display:none; }
.pc-mode.playing #stage { position:relative; display:flex; align-items:center; justify-content:center; padding:18px; background:radial-gradient(ellipse at center,#2b3552 0%,#0b1120 72%); }
.pc-mode.playing #canvasWrap { flex:0 1 auto; width:auto !important; height:min(92vh,calc(100vh - 22px)) !important; max-width:min(48vw,760px) !important; max-height:92vh !important; aspect-ratio:var(--arena-aspect) !important; margin:auto !important; border:2px solid #a98a74 !important; border-radius:7px !important; box-shadow:0 14px 45px #000b,0 0 0 1px #f1d7a2 !important; overflow:hidden; }
.pc-mode.playing #game { width:100%; height:100%; display:block; object-fit:contain; }
.pc-mode.playing #touchUI { display:none !important; }
.pc-mode.playing #pcKeyGuide { display:flex; position:absolute; right:clamp(14px,2vw,34px); top:50%; transform:translateY(-50%); width:min(265px,22vw); flex-direction:column; gap:10px; padding:16px 17px; border:1px solid #c3a77b88; border-radius:14px; color:#f4e6c9; background:#121b2ddd; box-shadow:0 12px 30px #0007; font-size:12px; line-height:1.45; }
.pc-mode.playing #pcKeyGuide strong { color:#f4cc7d; letter-spacing:1.4px; font-size:11px; }
.pc-mode.playing #pcKeyGuide span { display:block; }
.pc-mode.playing #pcKeyGuide kbd { display:inline-block; min-width:23px; padding:2px 5px; margin-right:2px; border:1px solid #7d8194; border-bottom-width:3px; border-radius:5px; text-align:center; background:#26314a; color:#fff4d7; font:700 10px system-ui; }
.pc-mode:not(.playing) #canvasWrap { height:calc(100% - 40px); width:auto; max-width:100%; aspect-ratio:var(--arena-aspect); }
.pc-mode:not(.playing) #touchUI { display:none !important; }
.pc-mode #stageFooter span:first-child { font-size:0; }
.pc-mode #stageFooter span:first-child:after { content:'Windows • Arena vertical'; font-size:10px; }
@media(max-width:1180px) { .pc-mode.playing #pcKeyGuide { width:205px; font-size:10px; right:10px; padding:10px; } }
@media(max-width:1080px) { .pc-mode.playing #pcKeyGuide { display:none !important; } .pc-mode.playing #canvasWrap { max-width:88vw !important; } }
"""
css.write_text(css_text, encoding='utf-8')
