'use strict';
const $=id=>document.getElementById(id);
const cv=$('game'), ctx=cv.getContext('2d',{alpha:false});
const W=540,H=960;
const d={bossName:'Chefão Mascote',bossX:377,bossY:601,bossW:170,bossH:205,bossHP:340,movingBoss:false,bgData:'',bossData:'',useScene:false,platforms:[{x:105,y:728,w:155,h:16},{x:280,y:643,w:120,h:16}],attackMode:'surprise',attacks:[{type:'aim',rate:2.3,speed:4},{type:'fan',rate:2.6,speed:4},{type:'rain',rate:3.0,speed:4},{type:'spiral',rate:3.1,speed:3},{type:'wave',rate:2.7,speed:4},{type:'parry',rate:3.2,speed:3},{type:'meteor',rate:3.3,speed:4},{type:'homing',rate:3.1,speed:3},{type:'bounce',rate:3.0,speed:4}]};
let tool='boss', editing=true, playing=false, gameOver=false, drag=null;
let bgImage=null,bossImage=null;
const input={left:false,right:false,jump:false,shoot:false,dash:false};
const aim={x:1,y:0,active:false};let aimOwner=null,aimShoot=false,attackClock=.8,lastPattern=-1,attackCounter=0,patternName='';
const sprites={};const sprNames={idle:'cuphead_idle',run:'cuphead_run',shoot:'cuphead_shoot_straight',shootUp:'cuphead_shoot_up',shootDown:'cuphead_shoot_down',shootDiagUp:'cuphead_shoot_diagonal_up',shootDiagDown:'cuphead_shoot_diagonal_down',jump:'cuphead_jump',dash:'cuphead_dash',intro:'cuphead_intro',parry:'cuphead_parry',parryPink:'cuphead_parryPink',death:'cuphead_death',ghost:'cuphead_ghost'};
const spriteCount={idle:5,run:12,shoot:3,shootUp:3,shootDown:3,shootDiagUp:3,shootDiagDown:3,jump:8,dash:6,intro:44,parry:8,parryPink:8,death:16,ghost:24};
for(const [k,v] of Object.entries(sprNames)){let im=new Image();im.src='img/'+v+'.png';sprites[k]=im;}
const PLAYER_W=64,PLAYER_H=86,FLOOR_Y=874;
let jumpBuffer=0,coyote=0,parryCooldown=0,stuckFrames=0;
let player={x:62,y:FLOOR_Y-PLAYER_H,w:PLAYER_W,h:PLAYER_H,vx:0,vy:0,facing:1,grounded:true,hp:3,inv:0,dash:0,dashCooldown:0,shootCooldown:0};
let bossLife=d.bossHP,enemyBullets=[],myBullets=[],particles=[],attackTimers=[],totalTime=0,simTime=0,accumulator=0,lastFrame=performance.now(),lastRender=0,shotsHit=0;
let lastHitSfx=-100;
let fightState='idle',stateClock=0,fightPhase=1,warningTime=0,warned=false,shake=0,parryWindow=0,parryAnim=0,parries=0,hitsTaken=0,bulletsFired=0,phaseBanner=0,rank='C',wonLast=false,introVoicePlayed=false,readyVoicePlayed=false,parryGlow=0;
const priorAnnouncer={intro:null,ready:null};
let soundCtx=null,noiseNode=null;let audioEnabled=true,continuousFire=null;
const soundAsset={intro:['announcer_0001_a','announcer_0001_b','announcer_0001_c','announcer_0001_d','announcer_0001_e'],ready:['announcer_0002_a','announcer_0002_b','announcer_0002_c','announcer_0002_d','announcer_0002_e'],win:['announcer_knockout_0004'],hurt:['player_damage_crack_level1','player_damage_crack_level2','player_damage_crack_level3'],dash:['player_dash_01','player_dash_02','player_dash_03'],death:['player_death_01','player_death_02'],shot:['player_default_fire_loop_01','player_default_fire_loop_02']};
const soundCache={};for(const names of Object.values(soundAsset))for(const n of names){const a=new Audio('audio/'+n+'.ogg');a.preload='auto';soundCache[n]=a;}
function playSound(tag){if(!audioEnabled)return null;const names=soundAsset[tag]||[];if(!names.length)return null;let pool=names.filter(n=>n!==priorAnnouncer[tag]);if(!pool.length)pool=names;const name=pool[Math.floor(Math.random()*pool.length)];if(tag==='intro'||tag==='ready')priorAnnouncer[tag]=name;const base=soundCache[name];try{const a=base.cloneNode();a.volume=['intro','ready','win'].includes(tag)?.94:tag==='shot'?.16:.50;const result=a.play();if(result&&result.catch)result.catch(()=>{});return a}catch(e){return null}}
function syncShootAudio(){const active=playing&&fightState==='fight'&&!gameOver&&(input.shoot||aimShoot)&&audioEnabled;if(active){if(!continuousFire||continuousFire.paused){continuousFire=playSound('shot');if(continuousFire){continuousFire.loop=true;continuousFire.volume=.20}}}else if(continuousFire){continuousFire.pause();continuousFire.currentTime=0;continuousFire=null}}

// Músicas e efeitos importados pelo próprio usuário, guardados APENAS no aparelho.
const music={tracks:[],mode:'random',volume:.33,current:null,element:null,last:'',importing:false};
const soundKeys={hit:[],parry:[]};let sfxLast=0;
function musicLibrary(){
 try{if(!bridge())return [];
  const arr=JSON.parse(Android.listImportedMedia());music.tracks=arr.filter(x=>x.type==='music');
  soundKeys.hit=arr.filter(x=>x.type==='hit').map(x=>x.name);
  soundKeys.parry=arr.filter(x=>x.type==='parry').map(x=>x.name);
  const area=$('musicList');if(area)area.textContent=music.tracks.length?music.tracks.map(t=>'♫ '+t.name).join(' • '):'Nenhuma música importada. Escolha MP3s ou o ZIP de efeitos.';
  const fx=$('sfxCount');if(fx)fx.textContent=`Efeitos extras: ${soundKeys.hit.length} de acerto, ${soundKeys.parry.length} de parry`;
  return arr;
 }catch(e){toast('Não foi possível listar áudios: '+e.message);return []}
}
function newTrack(){if(!music.tracks.length)return null;
 let tracks=music.tracks.filter(x=>x.name!==music.last);if(!tracks.length)tracks=music.tracks;
 return tracks[Math.floor(Math.random()*tracks.length)]}
function stopBattleMusic(fade=false){const a=music.element;if(!a)return;
 music.element=null;try{a.onended=null;if(fade){a.volume=Math.min(a.volume,.08)}a.pause();a.src='';a.load()}catch(e){}
}
function startBattleMusic(){stopBattleMusic();if(music.mode==='off'||!bridge())return;
 if(!music.tracks.length)musicLibrary();const item=newTrack();if(!item)return;
 music.last=item.name;music.current=item.name;
 const track=new Audio(Android.importedMediaUrl('music',item.name));track.preload='auto';track.volume=music.volume;
 track.onended=()=>{if(music.element===track&&fightState==='fight')startBattleMusic()};
 track.onerror=()=>{if(music.element===track){toast('Não foi possível tocar '+item.name);stopBattleMusic()}};
 music.element=track;const promise=track.play();if(promise&&promise.catch)promise.catch(()=>toast('Toque em JOGAR novamente para habilitar o áudio'));
}
function playCustomEffect(type){try{if(!bridge()||!audioEnabled)return;const list=soundKeys[type]||[];if(!list.length)return;
 if(type==='hit'&&performance.now()-sfxLast<90)return;sfxLast=performance.now();
 const pick=list[Math.floor(Math.random()*list.length)];const a=new Audio(Android.importedMediaUrl(type,pick));a.volume=type==='hit'?.18:.55;
 a.play().catch(()=>{});
 }catch(e){}
}
async function importAudioFiles(files){if(!bridge()){toast('Importação persistente disponível no APK Android.');return}
 if(music.importing)return;music.importing=true;const fs=Array.from(files);$('importAudio').disabled=true;$('importSoundZip').disabled=true;
 let success=0;
 for(const file of fs){try{
  const started=Android.beginMediaImport(file.name);if(started!=='OK')throw Error(started);
  for(let off=0;off<file.size;off+=65536){
   const bytes=new Uint8Array(await file.slice(off,Math.min(file.size,off+65536)).arrayBuffer());
   let binary='';for(let i=0;i<bytes.length;i++)binary+=String.fromCharCode(bytes[i]);
   const status=Android.appendMediaImport(btoa(binary));if(status!=='OK')throw Error(status);
   if(off%(65536*30)===0){$('musicList').textContent=`Importando ${file.name} (${Math.round(off/file.size*100)}%)`;await new Promise(r=>setTimeout(r,0))}
  }
  const finished=Android.finishMediaImport();if(!finished.startsWith('OK'))throw Error(finished);
  success++;
 }catch(e){try{Android.cancelMediaImport()}catch(_){}toast('Falha em '+file.name+': '+e.message);}
 }
 music.importing=false;$('importAudio').disabled=false;$('importSoundZip').disabled=false;
 musicLibrary();toast(`${success} arquivo(s) importado(s) no celular!`);
}
$('importAudio').onclick=()=>$('musicFiles').click();
$('importSoundZip').onclick=()=>$('soundZipFile').click();
$('musicFiles').addEventListener('change',e=>{importAudioFiles(e.target.files);e.target.value=''})
$('soundZipFile').addEventListener('change',e=>{importAudioFiles(e.target.files);e.target.value=''})
$('musicMode').addEventListener('change',e=>{music.mode=e.target.value;if(music.mode==='off')stopBattleMusic();else if(fightState==='fight')startBattleMusic()});
$('musicVolume').addEventListener('input',e=>{music.volume=Number(e.target.value)/100;if(music.element)music.element.volume=music.volume;$('musicVolumeText').textContent=`${e.target.value}%`});
$('previewMusic').onclick=()=>{if(music.element){stopBattleMusic();toast('Prévia interrompida')}else{if(!music.tracks.length)musicLibrary();if(!music.tracks.length){toast('Importe músicas primeiro');return}music.mode='random';$('musicMode').value='random';startBattleMusic();toast('Tocando prévia da seleção aleatória')}};
$('stopMusic').onclick=stopBattleMusic;
musicLibrary();

let recorder=null,recChunks=[],recording=false,recordingActive=false,recordFormat='vertical',recCanvas=null,recCtx=null;
function toast(msg){let el=$('toast');el.textContent=msg;el.classList.remove('hidden');clearTimeout(toast._t);toast._t=setTimeout(()=>el.classList.add('hidden'),3100)}
function alertModal(title,html){$('modalTitle').textContent=title;$('modalContent').innerHTML=html;$('modal').classList.remove('hidden')}
function closeModal(){$('modal').classList.add('hidden')}
$('modalClose').onclick=closeModal;for(const [id,cls] of [['tabTools','show-tools'],['tabBoss','show-boss']])$(id).onclick=()=>{document.body.classList.remove('show-tools','show-boss');document.body.classList.add(cls);$('tabTools').classList.toggle('active',cls==='show-tools');$('tabBoss').classList.toggle('active',cls==='show-boss')};document.body.classList.add('show-tools');
function clone(v){return JSON.parse(JSON.stringify(v))}
const defaults=clone(d);
function loadImage(data,kind){return new Promise(resolve=>{if(!data){if(kind==='bg')bgImage=null;else bossImage=null;resolve();return;}let im=new Image();im.onload=()=>{if(kind==='bg')bgImage=im;else bossImage=im;resolve()};im.onerror=()=>{toast('Imagem inválida');resolve()};im.src=data})}
function imageFile(kind,file){if(!file)return; if(!file.type.startsWith('image/')){toast('Escolha uma imagem PNG/JPG/WebP');return;}
 const rd=new FileReader();rd.onload=()=>{let src=new Image();src.onload=()=>{const max=1280,scale=Math.min(1,max/Math.max(src.width,src.height));let a=document.createElement('canvas');a.width=Math.round(src.width*scale);a.height=Math.round(src.height*scale);a.getContext('2d').drawImage(src,0,0,a.width,a.height);const png=a.toDataURL('image/png');if(kind==='bg'){d.bgData=png;d.useScene=!d.bossData;loadImage(png,'bg');toast('Cenário importado! Arraste a hitbox até o boss.')}else{d.bossData=png;d.useScene=false;loadImage(png,'boss');toast('Imagem do chefão importada!')}};src.src=rd.result};rd.readAsDataURL(file)}
$('bgBtn').onclick=()=>$('backgroundFile').click();$('bossBtn').onclick=()=>$('bossFile').click();
$('backgroundFile').onchange=e=>{imageFile('bg',e.target.files[0]);e.target.value=''};
$('bossFile').onchange=e=>{imageFile('boss',e.target.files[0]);e.target.value=''};
function writeInspector(){ $('bossName').value=d.bossName;$('bossHp').value=d.bossHP;$('hitW').value=d.bossW;$('hitH').value=d.bossH;$('bossHpVal').textContent=d.bossHP;$('hitWVal').textContent=d.bossW;$('hitHVal').textContent=d.bossH;$('movingBoss').checked=d.movingBoss;$('attackMode').value=d.attackMode||'surprise';renderAttacks()}
function renderAttacks(){let area=$('attackList');area.replaceChildren();const names={aim:'Direcionado',fan:'Leque',rain:'Chuva',wave:'Onda',spiral:'Espiral',ring:'Explosão circular',zigzag:'Zigue-zague',homing:'Caçador',meteor:'Meteoro',laser:'Raio',bounce:'Saltitantes',split:'Fragmentação',columns:'Colunas',parry:'Estrela rosa'};d.attacks.forEach((a,i)=>{let r=document.createElement('div');r.className='attackItem';let txt=document.createElement('span');txt.style.flex='1';txt.textContent=`${i+1}. ${names[a.type]} • ${a.rate.toFixed(1)}s`;let b=document.createElement('button');b.textContent='×';b.title='Remover padrão';b.onclick=()=>{d.attacks.splice(i,1);renderAttacks()};r.append(txt,b);area.append(r)})}
for(const id of ['bossHp','hitW','hitH'])$(id).addEventListener('input',()=>{let prop={bossHp:'bossHP',hitW:'bossW',hitH:'bossH'}[id];d[prop]=+$ (id).value;$(id+'Val').textContent=d[prop]});
$('bossName').oninput=()=>d.bossName=$('bossName').value;
$('movingBoss').onchange=()=>{d.movingBoss=$('movingBoss').checked;if(d.movingBoss&&d.useScene)toast('Para animar o chefão, importe uma imagem dele separada.')};
$('attackMode').onchange=()=>{d.attackMode=$('attackMode').value;toast('Padrão de ataques atualizado')};
$('addAttack').onclick=()=>{if(d.attacks.length>=18){toast('Máximo: 18 padrões');return}let a={type:$('attackType').value,rate:+$('attackRate').value,speed:+$('attackSpeed').value};d.attacks.push(a);renderAttacks();toast('Novo padrão adicionado')};
for(let x of ['attackRate','attackSpeed'])$(x).oninput=()=>$(x+'Val').textContent=x==='attackRate'?Number($(x).value).toFixed(2):$(x).value;
Array.from(document.querySelectorAll('.tool')).forEach(b=>b.onclick=()=>{tool=b.dataset.tool;document.querySelectorAll('.tool').forEach(t=>t.classList.toggle('active',t===b));$('status').textContent={boss:'Toque e arraste para mover o chefe',hitbox:'Arraste para definir a hitbox',platform:'Arraste para desenhar uma plataforma'}[tool]});
function canvasPoint(e){let r=cv.getBoundingClientRect();return{x:Math.max(0,Math.min(W,(e.clientX-r.left)*W/r.width)),y:Math.max(0,Math.min(H,(e.clientY-r.top)*H/r.height))}}
cv.addEventListener('pointerdown',e=>{if(!editing||playing)return;e.preventDefault();cv.setPointerCapture(e.pointerId);let p=canvasPoint(e);if(tool==='boss'){drag={tool,dx:p.x-d.bossX,dy:p.y-d.bossY}}else if(tool==='hitbox'){drag={tool,x:p.x,y:p.y};d.bossX=p.x;d.bossY=p.y;d.bossW=20;d.bossH=20;writeInspector()}else{let it={x:p.x,y:p.y,w:14,h:16};d.platforms.push(it);drag={tool,item:it,start:p}}});
cv.addEventListener('pointermove',e=>{if(!drag)return;let p=canvasPoint(e);if(drag.tool==='boss'){d.bossX=Math.max(0,Math.min(W,p.x-drag.dx));d.bossY=Math.max(0,Math.min(H,p.y-drag.dy))}else if(drag.tool==='hitbox'){d.bossX=(drag.x+p.x)/2;d.bossY=(drag.y+p.y)/2;d.bossW=Math.max(20,Math.abs(p.x-drag.x));d.bossH=Math.max(20,Math.abs(p.y-drag.y));$('hitW').value=d.bossW;$('hitH').value=d.bossH;$('hitWVal').textContent=Math.round(d.bossW);$('hitHVal').textContent=Math.round(d.bossH)}else{drag.item.x=Math.min(drag.start.x,p.x);drag.item.y=Math.min(drag.start.y,p.y);drag.item.w=Math.max(40,Math.abs(p.x-drag.start.x));drag.item.h=16}});
for(const ev of ['pointerup','pointercancel'])cv.addEventListener(ev,()=>drag=null);
$('deletePlatform').onclick=()=>{if(d.platforms.length){d.platforms.pop();toast('Última plataforma excluída')}else toast('Não há plataformas')};
$('bReset').onclick=()=>alertModal('Restaurar exemplo?',`<p>Isso vai substituir a edição atual. Salve antes, se quiser guardar.</p><button id="reallyReset">Restaurar exemplo</button>`),setTimeout(()=>{let b=$('reallyReset');if(b)b.onclick=()=>{Object.assign(d,clone(defaults));loadImage('','bg');loadImage('','boss');writeInspector();closeModal();toast('Exemplo restaurado')}},0);
function bridge(){return typeof Android!=='undefined'&&Android!==null}
function save(){const project={version:3,created:new Date().toISOString(),...clone(d)};try{let data=JSON.stringify(project),result=bridge()?Android.saveProject(data):null;if(!bridge()){let key='cm_'+(d.bossName||'Sem nome').replace(/[<>"']/g,'').slice(0,40);localStorage.setItem(key,data);result='OK'}if(result==='OK')toast('Projeto salvo no celular!');else toast('Não foi possível salvar: '+result)}catch(e){toast('Erro ao salvar: '+e.message)}}
$('bSave').onclick=save;
function listProjects(){try{if(bridge())return JSON.parse(Android.listProjects());return Object.keys(localStorage).filter(s=>s.startsWith('cm_')).map(s=>s.slice(3))}catch(e){return []}}
function readProject(name){return bridge()?Android.loadProject(name):localStorage.getItem('cm_'+name)}
function delProject(name){bridge()?Android.deleteProject(name):localStorage.removeItem('cm_'+name)}
function projects(){let names=listProjects();alertModal('Seus chefões',`<p>Projetos salvos neste aparelho. Escolha um para continuar editando.</p><div id="projList"></div>`);const list=$('projList');if(!names.length)list.textContent='Nenhum projeto salvo ainda.';names.forEach(name=>{const row=document.createElement('div');row.className='project';const span=document.createElement('span');span.textContent='★ '+name;const open=document.createElement('button');open.textContent='Abrir';open.onclick=()=>{try{let raw=readProject(name);if(!raw)throw new Error('Não encontrado');let obj=JSON.parse(raw);Object.assign(d,clone(defaults),obj);if((obj.version||1)<3 && d.bossHP<200){d.bossHP=Math.max(240,Math.round(d.bossHP*6))}if((obj.version||1)<2){const sx=W/960,sy=H/540;d.bossX*=sx;d.bossY*=sy;d.bossW*=sx;d.bossH*=sy;d.platforms=d.platforms.map(p=>({x:p.x*sx,y:p.y*sy,w:p.w*sx,h:p.h*sy}));}loadImage(d.bgData,'bg');loadImage(d.bossData,'boss');writeInspector();closeModal();toast('Projeto carregado!')}catch(e){toast('Erro ao abrir: '+e.message)}};const del=document.createElement('button');del.textContent='✕';del.onclick=()=>{delProject(name);projects()};row.append(span,open,del);list.append(row)})}
$('bLoad').onclick=projects;
$('bHelp').onclick=()=>alertModal('Como jogar — v1.4',`<p>Crie chefes com imagens da galeria e ajuste plataformas e hitbox. Agora existe uma <b>entrada cinematográfica</b>, batalha por fases e tela de resultados.</p><p><b>Rosa = parry:</b> toque no botão rosa PARRY perto de uma estrela rosa (também funciona com PULAR no ar). Isso destrói o projétil, dá impulso, pontua e pode recuperar vida ao juntar 3 parries.</p><p><b>Mira:</b> arraste o círculo direito para atirar nas oito direções. DASH desvia. Chefões duram muito mais e podem usar até 18 padrões.</p><p>Use o gravador do Android para vídeo MP4 com áudio: a captura WebM do canvas pode não incluir os sons no WebView.</p>`);
function resetGame(){stopBattleMusic();player={x:62,y:FLOOR_Y-PLAYER_H,w:PLAYER_W,h:PLAYER_H,vx:0,vy:0,facing:1,grounded:true,hp:3,inv:0,dash:0,dashCooldown:0,shootCooldown:0};jumpBuffer=0;coyote=0;parryCooldown=0;enemyBullets=[];myBullets=[];particles=[];bossLife=d.bossHP;attackTimers=[];attackClock=2.3;lastPattern=-1;attackCounter=0;patternName='';totalTime=0;simTime=0;shotsHit=0;bulletsFired=0;parries=0;hitsTaken=0;fightPhase=1;fightState='intro';stateClock=0;warningTime=0;warned=false;shake=0;parryWindow=0;parryAnim=0;parryGlow=0;phaseBanner=0;wonLast=false;gameOver=false;introVoicePlayed=false;readyVoicePlayed=false;$('gameOverlay').classList.add('hidden');syncShootAudio()}
function startGame(){if(playing)return;resetGame();playing=true;editing=false;document.body.classList.add('playing');$('playHUD').classList.remove('hidden');$('touchUI').classList.remove('hidden');$('modeTag').textContent='COMBATE';$('modeTag').style.background='#a9e7bf';$('status').textContent=d.bossName;$('bPlay').textContent='↻ REINICIAR';$('bPlay').onclick=()=>{resetGame();clearInput();ensureSound()};clearInput();ensureSound();}
function grade(){let score=(player.hp>0?player.hp*20:0)+parries*10+Math.min(30,shotsHit/Math.max(1,bulletsFired)*30)+Math.max(0,30-totalTime*.3);return score>=100?'S':score>=84?'A':score>=68?'B':score>=50?'C':'D'}
function showResults(){fightState='results';rank=grade();syncShootAudio();const survived=wonLast;const head=survived?'VITÓRIA!':'TENTE OUTRA VEZ';$('endTitle').textContent=head;$('endText').textContent=survived?'O chefão caiu. Eis o seu resultado:':'A luta ainda não acabou!';const item=(label,value)=>`<div><span>${label}</span><strong>${value}</strong></div>`;$('resultMetrics').innerHTML=item('NOTA',`<em>${rank}</em>`)+item('TEMPO',`${totalTime.toFixed(1)}s`)+item('ACERTOS',shotsHit)+item('PARRIES',parries)+item('DANO SOFRIDO',hitsTaken)+item('VIDAS RESTANTES',player.hp);$('gameOverlay').classList.remove('hidden')}
function endGame(won){if(gameOver)return;stopBattleMusic(true);gameOver=true;wonLast=won;fightState=won?'knockout':'defeat';stateClock=0;shake=won?19:8;stopInput();syncShootAudio();playSound(won?'win':'death');particlesBurst(d.bossX,d.bossY,won?'#ffdf88':'#d0e8fb',50);if(recording)toast('Continue gravando: a tela de resultados vai aparecer!')}
function stopGame(){stopBattleMusic();playing=false;editing=true;fightState='idle';gameOver=false;stopInput();syncShootAudio();document.body.classList.remove('playing');$('playHUD').classList.add('hidden');$('touchUI').classList.add('hidden');$('gameOverlay').classList.add('hidden');$('modeTag').textContent='MODO EDIÇÃO';$('modeTag').style.background='#edca83';$('status').textContent='Configure seu cenário e personalize os ataques';$('bPlay').textContent='▶ JOGAR';$('bPlay').onclick=startGame;}
$('bPlay').onclick=startGame;$('bEdit').onclick=stopGame;$('again').onclick=()=>{resetGame();playing=true;clearInput();ensureSound()};$('exitGame').onclick=stopGame;
function clearInput(){for(const k in input)input[k]=false;aim.active=false;aimShoot=false;aimOwner=null;syncAimUI();syncShootAudio()}
function stopInput(){clearInput()}
const keys={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'jump',KeyJ:'shoot',KeyZ:'shoot',ShiftLeft:'dash',KeyK:'dash',KeyX:'dash'};
addEventListener('keydown',e=>{if(keys[e.code]){e.preventDefault();if(keys[e.code]==='jump'&&!input.jump)jumpPressed();input[keys[e.code]]=true}});addEventListener('keyup',e=>{if(keys[e.code]){e.preventDefault();input[keys[e.code]]=false}});addEventListener('blur',clearInput);
// Right thumb: freely select any of 8 firing directions. Drag towards the rim to lock the angle.
const aimPad=$('aimPad'),aimKnob=$('aimKnob'),aimLabel=$('aimLabel');
function syncAimUI(){if(!aimPad)return;aimKnob.style.transform=`translate(calc(-50% + ${aim.active?aim.x*37:0}px),calc(-50% + ${aim.active?aim.y*37:0}px))`;aimPad.classList.toggle('aiming',aim.active);if(aimLabel)aimLabel.textContent=aim.active?'MIRANDO + ATIRANDO':'MIRA • 8 DIREÇÕES';}
function updateAim(e){const r=aimPad.getBoundingClientRect();let dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2;if(Math.hypot(dx,dy)<6){aim.active=false;aimShoot=false;syncAimUI();return}let oct=Math.round(Math.atan2(dy,dx)/(Math.PI/4)),a=oct*Math.PI/4;aim.x=Math.round(Math.cos(a)*1000)/1000;aim.y=Math.round(Math.sin(a)*1000)/1000;aim.active=true;aimShoot=true;if(Math.abs(aim.x)>.2)player.facing=Math.sign(aim.x);syncAimUI();}
aimPad.addEventListener('pointerdown',e=>{e.preventDefault();ensureSound();aimOwner=e.pointerId;aimPad.setPointerCapture(e.pointerId);updateAim(e)});
aimPad.addEventListener('pointermove',e=>{if(aimOwner===e.pointerId)updateAim(e)});
for(const name of ['pointerup','pointercancel','lostpointercapture'])aimPad.addEventListener(name,e=>{if(e.pointerId!==aimOwner)return;aimOwner=null;aimShoot=false;aim.active=false;syncAimUI()});
addEventListener('keydown',e=>{const compass={Numpad8:[0,-1],Numpad9:[.707,-.707],Numpad6:[1,0],Numpad3:[.707,.707],Numpad2:[0,1],Numpad1:[-.707,.707],Numpad4:[-1,0],Numpad7:[-.707,-.707],KeyW:[0,-1],KeyS:[0,1],KeyQ:[-.707,-.707],KeyE:[.707,-.707]};if(compass[e.code]){e.preventDefault();[aim.x,aim.y]=compass[e.code];aim.active=true;syncAimUI()}});
addEventListener('keyup',e=>{if(['KeyW','KeyS','KeyQ','KeyE'].includes(e.code)||e.code.startsWith('Numpad')){aim.active=false;syncAimUI()}});
syncAimUI();
for(const [id,key] of [['moveLeft','left'],['moveRight','right'],['btnJump','jump'],['btnShoot','shoot'],['btnDash','dash']]){let b=$(id);b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);if(key==='jump'&&!input.jump)jumpPressed();input[key]=true;ensureSound()});for(let k of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(k,e=>{e.preventDefault();input[key]=false})}
$('btnParry').addEventListener('pointerdown',e=>{e.preventDefault();$('btnParry').setPointerCapture(e.pointerId);ensureSound();parryPressed()});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const intersects=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function boxBoss(){return{x:d.bossX-d.bossW/2,y:d.bossY-d.bossH/2,w:d.bossW,h:d.bossH}}
function sound(f=280,dur=.08,type='square'){try{if(!soundCtx)return;let osc=soundCtx.createOscillator(),g=soundCtx.createGain();osc.type=type;osc.frequency.setValueAtTime(f,soundCtx.currentTime);osc.frequency.exponentialRampToValueAtTime(Math.max(40,f*.62),soundCtx.currentTime+dur);g.gain.setValueAtTime(.07,soundCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,soundCtx.currentTime+dur);osc.connect(g);g.connect(soundCtx.destination);osc.start();osc.stop(soundCtx.currentTime+dur)}catch(e){}}
function ensureSound(){try{if(!soundCtx)soundCtx=new (window.AudioContext||window.webkitAudioContext)();soundCtx.resume()}catch(e){}}
function jumpPressed(){if(fightState!=='fight')return;jumpBuffer=.16;
 // Pulo normal continua sendo o comando principal; perto de um objeto rosa, também permite parry no ar.
 if(!player.grounded&&enemyBullets.some(b=>b.pink&&Math.hypot(player.x+player.w/2-b.x,player.y+player.h/2-b.y)<110))parryPressed();}
function parryPressed(){if(fightState!=='fight'||parryCooldown>0)return;
 parryWindow=.48;parryAnim=.46;parryCooldown=.22;
 if(!player.grounded)player.vy=Math.min(player.vy,-160);
 tryParry();}
function tryParry(){if(fightState!=='fight'||parryWindow<=0)return false;
 const cx=player.x+player.w*.5,cy=player.y+player.h*.5;
 let best=-1,dist=Infinity;
 for(let i=0;i<enemyBullets.length;i++){const b=enemyBullets[i];if(!b.pink)continue;
  const delta=Math.hypot(cx-b.x,cy-b.y);
  if(delta<Math.max(102,65+b.r)&&delta<dist){best=i;dist=delta}
 }
 if(best<0)return false;
 const b=enemyBullets.splice(best,1)[0];parries++;parryGlow=.72;parryAnim=.45;parryWindow=0;
 player.vy=-390;player.inv=Math.max(player.inv,.38);if(parries%3===0)player.hp=Math.min(3,player.hp+1);
 shake=5;particlesBurst(b.x,b.y,'#ff7fdb',24);playCustomEffect('parry');sound(840,.11,'sine');return true;
}
function hurt(){if(player.inv>0||gameOver||fightState!=='fight')return;player.hp--;hitsTaken++;player.inv=1.20;shake=9;particlesBurst(player.x+player.w/2,player.y+player.h/2,'#ffcb85',13);playSound('hurt');if(player.hp<=0)endGame(false)}
function particlesBurst(x,y,color,n){for(let i=0;i<n;i++){let ang=Math.random()*Math.PI*2,v=70+Math.random()*200;particles.push({x,y,vx:Math.cos(ang)*v,vy:Math.sin(ang)*v,life:.4+Math.random()*.4,c:color})}}
function emit(x,y,vx,vy,kind='aim',extra={}){if(enemyBullets.length>140)return;const pink=kind==='parry'||((attackCounter*17+enemyBullets.length*3)%13===0);enemyBullets.push({x,y,vx,vy,r:kind==='rain'?10:kind==='ring'?8:kind==='meteor'?18:kind==='laser'?13:kind==='parry'?17:12,life:9,rotation:Math.random()*6.2,kind,baseY:y,phase:Math.random()*6.28,pink,age:0,...extra})}
const patternLabels={aim:'DISPARO',fan:'LEQUE',rain:'CHUVA',wave:'ONDA',spiral:'ESPIRAL',ring:'EXPLOSÃO',zigzag:'ZIGUE-ZAGUE',homing:'CAÇADORES',meteor:'METEOROS',laser:'RAIO',bounce:'SALTITANTES',split:'FRAGMENTAÇÃO',columns:'COLUNAS',parry:'ESTRELAS ROSAS'};
function fireBoss(a){const bx=d.bossX,by=d.bossY,spd=a.speed*45*(1+(fightPhase-1)*.09),ang=Math.atan2(player.y+player.h/2-by,player.x+player.w/2-bx);
 switch(a.type){
 case 'aim':emit(bx,by,Math.cos(ang)*spd,Math.sin(ang)*spd,'aim');break;
 case 'fan':for(let t=-2;t<=2;t++){let v=ang+t*.27;emit(bx,by,Math.cos(v)*spd,Math.sin(v)*spd,'fan')}break;
 case 'rain':for(let t=0;t<7;t++)emit(22+((t*81+attackCounter*39)%(W-40)),-30-Math.random()*170,Math.sin(totalTime+t)*9,spd*.76,'rain');break;
 case 'wave':for(let t=-2;t<=2;t++)emit(bx,by+t*22,(player.x<bx?-1:1)*spd,Math.sin(totalTime+t)*40,'wave');break;
 case 'spiral':for(let t=0;t<9;t++){let v=attackCounter*.7+t*Math.PI*2/9;emit(bx,by,Math.cos(v)*spd*.8,Math.sin(v)*spd*.8,'spiral')}break;
 case 'ring':for(let t=0;t<13;t++){let v=t*Math.PI*2/13;emit(bx,by,Math.cos(v)*spd*.77,Math.sin(v)*spd*.77,'ring')}break;
 case 'zigzag':for(let t=-2;t<=2;t++)emit(bx,by+t*29,(player.x<bx?-1:1)*spd,0,'zigzag');break;
 case 'homing':for(let t=-1;t<=1;t++)emit(bx,by+t*25,-spd*.35,spd*.05,'homing',{turnRate:1.2+t*.1,life:6});break;
 case 'meteor':for(let t=0;t<4;t++)emit(62+((t*133+attackCounter*73)%(W-125)),-30-70*t,(t%2?28:-28),spd*.67,'meteor',{explode:true});break;
 case 'laser':for(let t=0;t<5;t++){const y=420+t*70;emit(W+22,y,-spd*1.7,0,'laser',{r:15,pink:t===2})}break;
 case 'bounce':for(let t=0;t<4;t++)emit(bx,by-t*12,(player.x<bx?-1:1)*spd*(.6+t*.1),-spd*(.9+t*.10),'bounce',{gravity:550,bounces:2});break;
 case 'split':for(let t=-1;t<=1;t++){let v=ang+t*.2;emit(bx,by,Math.cos(v)*spd*.7,Math.sin(v)*spd*.7,'split',{splitAt:1.0+t*.16})}break;
 case 'columns':for(let t=0;t<6;t++)emit(30+t*96,-15-t*25,0,spd*(.7+Math.random()*.2),'columns',{r:10,pink:t===3});break;
 case 'parry':for(let t=0;t<3;t++){let v=ang+(t-1)*.34;emit(bx,by,Math.cos(v)*spd*.73,Math.sin(v)*spd*.73,'parry',{pink:true})}break;
 default:emit(bx,by,Math.cos(ang)*spd,Math.sin(ang)*spd,'aim');
 }
 patternName=patternLabels[a.type]||'ATAQUE';sound(140+Math.random()*70,.12,'triangle');
}
function attackPatterns(){let list=(d.attacks||[]).filter(x=>x&&x.type);if(!list.length)list=clone(defaults.attacks);if(list.length===1&&d.attackMode!=='solo')list=list.concat(clone(defaults.attacks));if(fightPhase>=2)list=list.concat([{type:'split',rate:2.7,speed:4},{type:'laser',rate:3.1,speed:4},{type:'columns',rate:3.1,speed:4}]);if(fightPhase>=3)list=list.concat([{type:'ring',rate:2.6,speed:4},{type:'zigzag',rate:2.4,speed:4}]);return list}
function chooseAttack(){const options=attackPatterns();if(!options.length)return;const mode=d.attackMode||'surprise';let idx;if(mode==='cycle'||mode==='solo')idx=attackCounter%options.length;else{idx=Math.floor(Math.random()*options.length);if(options.length>1&&idx===lastPattern)idx=(idx+1+Math.floor(Math.random()*(options.length-1)))%options.length}lastPattern=idx;attackCounter++;const selected=options[idx];fireBoss(selected);attackClock=Math.max(1.12,(selected.rate||2.8)*(fightPhase===3?.80:fightPhase===2?.9:1));warned=false}

function step(dt){if(!playing)return;simTime+=dt;stateClock+=dt;shake=Math.max(0,shake-26*dt);parryGlow=Math.max(0,parryGlow-dt);parryAnim=Math.max(0,parryAnim-dt);phaseBanner=Math.max(0,phaseBanner-dt);
 if(fightState==='intro'){
  if(stateClock>=.32&&!introVoicePlayed){introVoicePlayed=true;playSound('intro')}
  if(stateClock>=2.25&&!readyVoicePlayed){readyVoicePlayed=true;playSound('ready')}
  if(stateClock>=4.25){fightState='fight';stateClock=0;attackClock=1.6;clearInput();startBattleMusic();sound(590,.2,'sawtooth')}
  return;
 }
 if(fightState==='knockout'||fightState==='defeat'){
  if(stateClock>3.1)showResults();
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=130*dt;p.life-=dt;if(p.life<=0)particles.splice(i,1)}
  return;
 }
 if(fightState!=='fight')return;
 totalTime+=dt;player.inv=Math.max(0,player.inv-dt);player.dashCooldown=Math.max(0,player.dashCooldown-dt);player.shootCooldown=Math.max(0,player.shootCooldown-dt);player.dash=Math.max(0,player.dash-dt);parryWindow=Math.max(0,parryWindow-dt);parryCooldown=Math.max(0,parryCooldown-dt);
 let newPhase=bossLife/d.bossHP<.30?3:bossLife/d.bossHP<.64?2:1;if(newPhase>fightPhase){fightPhase=newPhase;phaseBanner=2.4;attackClock=1.8;enemyBullets=enemyBullets.slice(-18);shake=12;particlesBurst(d.bossX,d.bossY,'#f4c66c',32);sound(310,.4,'sawtooth')}
 // Física com cruzamento real da plataforma: nunca reposiciona o herói se ele passou por baixo.
 const oldY=player.y,oldBottom=player.y+player.h;
 const motion=(input.right?1:0)-(input.left?1:0);if(motion&&!aim.active)player.facing=motion;
 coyote=player.grounded?.095:Math.max(0,coyote-dt);
 jumpBuffer=Math.max(0,jumpBuffer-dt);
 if(input.dash&&player.dashCooldown<=0){player.dash=.14;player.dashCooldown=1;player.vx=player.facing*415;playSound('dash');particlesBurst(player.x,player.y+35,'#d8f9ee',8)}
 if(player.dash<=0){
  const desired=motion*190;
  player.vx+=(desired-player.vx)*Math.min(1,17*dt);
  if(jumpBuffer>0&&(player.grounded||coyote>0)){player.vy=-550;player.grounded=false;coyote=0;jumpBuffer=0;sound(500,.12,'triangle')}
  player.vy=Math.min(850,player.vy+1400*dt);
 }
 let nextX=clamp(player.x+clamp(player.vx*dt,-15,15),0,W-player.w);
 let nextY=player.y+clamp(player.vy*dt,-20,20);
 // O dash também não atravessa a arena; colisões horizontais não movem o jogador verticalmente.
 player.x=nextX;player.y=nextY;player.grounded=false;
 if(player.vy>=0){
  let landing=FLOOR_Y;
  for(const p of d.platforms){
   if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.w<=0)continue;
   const crossesTop=oldBottom<=p.y+2 && player.y+player.h>=p.y;
   const overlapsX=player.x+player.w>p.x+5&&player.x<p.x+p.w-5;
   if(crossesTop&&overlapsX&&p.y<landing)landing=p.y;
  }
  if(player.y+player.h>=landing){player.y=landing-player.h;player.vy=0;player.grounded=true}
 }
 player.y=clamp(player.y,-player.h,FLOOR_Y-player.h);
 if(!Number.isFinite(player.x)||!Number.isFinite(player.y)){player.x=62;player.y=FLOOR_Y-player.h;player.vx=player.vy=0;player.grounded=true} 
 if(parryWindow>0)tryParry();syncShootAudio();if((input.shoot||aimShoot)&&player.shootCooldown<=0){player.shootCooldown=.145;let dx=aim.active?aim.x:player.facing,dy=aim.active?aim.y:0;let mag=Math.hypot(dx,dy)||1;dx/=mag;dy/=mag;const x=player.x+player.w*.5+dx*25,y=player.y+player.h*.43+dy*20;myBullets.push({x,y,vx:dx*825,vy:dy*825,life:2.4,ang:Math.atan2(dy,dx)});bulletsFired++}
 attackClock-=dt;if(attackClock<.45&&!warned){warned=true;warningTime=.5;patternName='PREPARE-SE!'}warningTime=Math.max(0,warningTime-dt);if(attackClock<=0)chooseAttack();
 for(let i=enemyBullets.length-1;i>=0;i--){const b=enemyBullets[i];b.age+=dt;
  if(b.kind==='homing'&&b.age<2.7){let ang=Math.atan2(player.y+player.h*.5-b.y,player.x+player.w*.5-b.x),old=Math.atan2(b.vy,b.vx),difference=Math.atan2(Math.sin(ang-old),Math.cos(ang-old)),a=old+clamp(difference,-1.1*dt,1.1*dt),speed=Math.hypot(b.vx,b.vy);b.vx=Math.cos(a)*speed;b.vy=Math.sin(a)*speed}
  if(b.gravity){b.vy+=b.gravity*dt;if(b.y+b.r>=FLOOR_Y&&b.bounces>0){b.vy=-Math.abs(b.vy)*.73;b.y=FLOOR_Y-b.r;b.bounces--}}
  b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.kind==='zigzag')b.y+=Math.sin(totalTime*11+b.phase)*100*dt;
  if(b.kind==='split'&&b.age>(b.splitAt||1)){for(let j=-1;j<=1;j++)emit(b.x,b.y,Math.cos(j*.5)*b.vx-Math.sin(j*.5)*b.vy,Math.sin(j*.5)*b.vx+Math.cos(j*.5)*b.vy,'fan',{pink:j===0});enemyBullets.splice(i,1);continue}
  if(b.kind==='meteor'&&b.y>=FLOOR_Y-20){for(let j=-2;j<=2;j++)emit(b.x,FLOOR_Y-18,j*66,-165,'wave',{life:2.3});particlesBurst(b.x,b.y,'#ffc286',12);enemyBullets.splice(i,1);continue}
  b.life-=dt;b.rotation+=dt*2;if(b.life<=0||b.x<-85||b.x>W+85||b.y>H+90){enemyBullets.splice(i,1);continue}
  if(b.pink&&parryWindow>0&&tryParry())continue;
  if(intersects(player,{x:b.x-b.r,y:b.y-b.r,w:b.r*2,h:b.r*2})&&player.dash<=0){if(b.pink&&parryWindow>0){tryParry();continue}enemyBullets.splice(i,1);hurt()}
 }
 const hb=boxBoss();for(let i=myBullets.length-1;i>=0;i--){let b=myBullets[i];b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(b.life<=0||b.x<-40||b.x>W+40||b.y<-40||b.y>H+40){myBullets.splice(i,1);continue}if(intersects({x:b.x-8,y:b.y-8,w:16,h:16},hb)){myBullets.splice(i,1);bossLife--;shotsHit++;if(simTime-lastHitSfx>.125){lastHitSfx=simTime;playCustomEffect('hit')}if(shotsHit%4===0)particlesBurst(b.x,b.y,'#ffee9f',4);if(bossLife<=0){endGame(true);break}}}
 for(let i=particles.length-1;i>=0;i--){let p=particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=120*dt;p.life-=dt;if(p.life<=0)particles.splice(i,1)}
}
function roundRect(c,x,y,w,h,r,fill){c.beginPath();c.roundRect(x,y,w,h,r);if(fill)c.fill();else c.stroke()}
function drawBg(){ctx.fillStyle='#eddbbf';ctx.fillRect(0,0,W,H);if(bgImage){ctx.drawImage(bgImage,0,0,bgImage.width,bgImage.height,0,0,W,H)}else{const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#72829e');sky.addColorStop(.64,'#e6b78b');sky.addColorStop(1,'#fbe8b9');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);ctx.fillStyle='#394a59';ctx.beginPath();ctx.arc(90,920,360,Math.PI,Math.PI*2);ctx.fill();ctx.fillStyle='#293c50';ctx.beginPath();ctx.arc(520,940,370,Math.PI,Math.PI*2);ctx.fill();ctx.strokeStyle='#f8d7a6';ctx.lineWidth=6;for(let i=0;i<11;i++){let x=i*110-60;ctx.beginPath();ctx.moveTo(x,100+Math.sin(i)*10);ctx.lineTo(x+55,180+Math.cos(i)*10);ctx.stroke()}ctx.fillStyle='#b34559';ctx.fillRect(0,874,W,H-874)}
 const grd=ctx.createLinearGradient(0,874,0,H);grd.addColorStop(0,'#463f58');grd.addColorStop(1,'#2b2d3d');ctx.fillStyle=grd;ctx.fillRect(0,874,W,H-874);ctx.fillStyle='#fae9bf';ctx.fillRect(0,874,W,7);for(let i=0;i<W;i+=36){ctx.fillStyle=i%72===0?'#4c5365':'#384255';ctx.fillRect(i+2,908,29,3)}
 for(const p of d.platforms){ctx.save();ctx.globalAlpha=.70;ctx.shadowBlur=5;ctx.shadowColor='#0004';ctx.fillStyle='#453d53';roundRect(ctx,p.x,p.y,p.w,p.h+6,6,true);ctx.shadowBlur=0;ctx.fillStyle='#eed295';roundRect(ctx,p.x,p.y,p.w,9,4,true);ctx.strokeStyle='#8a5b58';ctx.strokeRect(p.x+7,p.y+12,Math.max(0,p.w-14),2);ctx.restore()}
}
function drawBoss(){const t=playing||gameOver?simTime:performance.now()/3000;const bob=d.movingBoss&&!d.useScene?Math.sin(t*2.1)*14:0;let x=d.bossX,y=d.bossY+bob;const drawImage=bossImage&&bossImage.complete;if(drawImage){ctx.drawImage(bossImage,x-d.bossW/2,y-d.bossH/2,d.bossW,d.bossH)}else if(!d.useScene){ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(t*1.5)*.035);let bw=d.bossW,bh=d.bossH;ctx.fillStyle='#10162255';ctx.beginPath();ctx.ellipse(0,bh*.51,bw*.4,11,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#cb6272';ctx.strokeStyle='#5b4555';ctx.lineWidth=8;roundRect(ctx,-bw*.43,-bh*.40,bw*.86,bh*.78,44,true);ctx.stroke();ctx.fillStyle='#fff5d9';roundRect(ctx,-bw*.35,-bh*.26,bw*.70,bh*.34,19,true);ctx.fillStyle='#202439';ctx.beginPath();ctx.arc(-bw*.15,-bh*.13,10,0,7);ctx.arc(bw*.15,-bh*.13,10,0,7);ctx.fill();ctx.fillStyle='#a13449';ctx.beginPath();ctx.arc(0,bh*.08,20,0,Math.PI);ctx.fill();ctx.fillStyle='#f7d58b';ctx.font=`${Math.min(55,bw*.33)}px Georgia`;ctx.textAlign='center';ctx.fillText('★',0,-bh*.39);ctx.restore()}
 if(editing){const hb=boxBoss();ctx.save();ctx.setLineDash([12,8]);ctx.lineWidth=3;ctx.strokeStyle='#ffed7c';ctx.fillStyle='#ffe65a28';ctx.fillRect(hb.x,hb.y,hb.w,hb.h);ctx.strokeRect(hb.x,hb.y,hb.w,hb.h);ctx.setLineDash([]);ctx.fillStyle='#191729d9';roundRect(ctx,hb.x,hb.y-26,Math.max(hb.w,135),24,7,true);ctx.textAlign='left';ctx.font='bold 13px system-ui';ctx.fillStyle='#fff2ac';ctx.fillText('HITBOX • '+Math.round(hb.w)+'×'+Math.round(hb.h),hb.x+7,hb.y-9);ctx.restore()}
}
function drawSprite(mode,x,y,width=145,height=163,frameOverride=null,opacity=1){let im=sprites[mode],count=spriteCount[mode];if(!(im&&im.complete&&im.naturalWidth))return;let frame=frameOverride===null?Math.floor(simTime*(mode==='run'?14:11))%count:Math.max(0,Math.min(count-1,frameOverride));ctx.save();ctx.globalAlpha*=opacity;ctx.drawImage(im,frame*128,0,128,144,x,y,width,height);ctx.restore()}
function drawPlayer(){let mode='idle';if(fightState==='intro')mode='intro';else if(fightState==='defeat')mode='death';else if(parryAnim>0)mode=parryGlow>0?'parryPink':'parry';else if(player.dash>0)mode='dash';else if(input.shoot||aimShoot){if(aim.active&&aim.y<-.3)mode=Math.abs(aim.x)<.3?'shootUp':'shootDiagUp';else if(aim.active&&aim.y>.3)mode=Math.abs(aim.x)<.3?'shootDown':'shootDiagDown';else mode='shoot'}else if(!player.grounded)mode='jump';else if(Math.abs(player.vx)>5)mode='run';
 ctx.save();if(player.inv>0&&Math.floor(player.inv*12)%2===0)ctx.globalAlpha=.48;let direction=player.facing;if(aim.active&&Math.abs(aim.x)>.2)direction=Math.sign(aim.x);const renderW=110,renderH=130;let dx=player.x+(player.w-renderW)/2,dy=player.y+player.h-renderH;
 if(direction<0){ctx.translate(dx+renderW,0);ctx.scale(-1,1);dx=0}else ctx.translate(dx,0);
 const frame=(fightState==='intro')?Math.min(43,Math.floor(Math.max(0,stateClock-.35)*17)):(fightState==='defeat')?Math.min(15,Math.floor(stateClock*12)):(mode.startsWith('parry'))?Math.min(7,Math.floor((.45-parryAnim)*20)):null;
 const im=sprites[mode];if(im&&im.complete&&im.naturalWidth)drawSprite(mode,dx,dy,renderW,renderH,frame);else{ctx.fillStyle='#f8e7bd';ctx.beginPath();ctx.arc(45,dy+35,30,0,7);ctx.fill();ctx.fillStyle='#e35854';ctx.fillRect(20,dy+70,50,57)}ctx.restore();
 if(fightState==='defeat'&&stateClock>.5){let ghostY=player.y-45-Math.min(230,stateClock*65);drawSprite('ghost',player.x-12,ghostY,95,113,Math.floor(stateClock*13)%24,.82)}
}
function drawBullets(){for(const b of myBullets){ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.ang||0);ctx.shadowColor='#9cfeff';ctx.shadowBlur=9;ctx.fillStyle='#baffff';ctx.beginPath();ctx.ellipse(0,0,15,6,0,0,Math.PI*2);ctx.fill();ctx.restore()}ctx.shadowBlur=0;
 const colors={aim:'#ab4976',fan:'#f5a345',rain:'#51a5b6',wave:'#8a6bca',spiral:'#d6539b',ring:'#ecbe77',zigzag:'#74db9f',homing:'#8af6c0',meteor:'#feae59',laser:'#ef7589',bounce:'#e5d58a',split:'#ba9bea',columns:'#8ee6f1',parry:'#ff7fcf'};
 for(const b of enemyBullets){ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.rotation);ctx.fillStyle=b.pink?'#ff70d6':(colors[b.kind]||'#a45682');ctx.strokeStyle=b.pink?'#ffffff':'#fff0b5';ctx.lineWidth=b.pink?4:3;ctx.shadowColor=b.pink?'#ff66cd':'transparent';ctx.shadowBlur=b.pink?24:0;ctx.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5,rr=i%2===0?b.r+3:b.r*.7;ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}ctx.closePath();ctx.fill();ctx.stroke();if(b.pink){ctx.rotate(-b.rotation);ctx.fillStyle='#fff';ctx.font='bold 13px Georgia';ctx.textAlign='center';ctx.fillText('✦',0,5)}ctx.restore()}
 for(const p of particles){ctx.globalAlpha=clamp(p.life*2,0,1);ctx.fillStyle=p.c;ctx.fillRect(p.x,p.y,5,5)}ctx.globalAlpha=1}

function hud(){ctx.fillStyle='#111c2dc9';roundRect(ctx,15,14,210,46,11,true);ctx.font='900 19px Georgia';ctx.fillStyle='#fff1c1';ctx.textAlign='left';ctx.fillText('HP',26,43);for(let h=0;h<3;h++){ctx.fillStyle=h<player.hp?'#ef777e':'#565364';ctx.beginPath();ctx.arc(85+h*39,37,13,0,7);ctx.fill();ctx.fillStyle=h<player.hp?'#fff1f1':'#9393a6';ctx.font='bold 17px Arial';ctx.fillText('♥',77+h*39,43)}ctx.fillStyle='#141d33dd';roundRect(ctx,15,66,510,58,10,true);ctx.fillStyle='#fff1bf';ctx.font='bold 16px Georgia';ctx.textAlign='left';ctx.fillText(d.bossName.slice(0,31),27,85);ctx.fillStyle='#4c3b4e';roundRect(ctx,27,97,482,13,6,true);ctx.fillStyle=fightPhase===3?'#ea7b8e':fightPhase===2?'#f2a870':'#f4bf78';roundRect(ctx,27,97,Math.max(0,482*bossLife/d.bossHP),13,6,true);ctx.font='900 10px system-ui';ctx.fillStyle='#ffedca';ctx.textAlign='right';ctx.fillText(`FASE ${fightPhase}  ·  ${Math.ceil(100*bossLife/d.bossHP)}%`,506,89);if(recording){ctx.fillStyle='#ea3649';ctx.beginPath();ctx.arc(425,38,10,0,7);ctx.fill();ctx.fillStyle='#f8f5ec';ctx.font='bold 14px Arial';ctx.textAlign='left';ctx.fillText('REC',442,43)}ctx.fillStyle='#f1e0bdcc';ctx.font='bold 13px system-ui';ctx.textAlign='right';ctx.fillText(Math.floor(totalTime)+'s',515,941);ctx.fillStyle='#ff93da';ctx.textAlign='left';ctx.fillText('✦ PARRY '+parries,20,941);if(patternName&&fightState==='fight'){ctx.textAlign='left';ctx.font='bold 14px system-ui';ctx.fillStyle='#fff1c7';ctx.fillText('✦ '+patternName,20,147)}}
function dramaticText(text,y,size,stroke='#422034',fill='#fce9c7'){ctx.save();ctx.translate(W/2,y);ctx.rotate(-.065);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`900 ${size}px Georgia,serif`;ctx.lineWidth=11;ctx.strokeStyle=stroke;ctx.strokeText(text,0,0);ctx.shadowColor='#000a';ctx.shadowBlur=16;ctx.fillStyle=fill;ctx.fillText(text,0,0);ctx.restore()}
function cinematic(){if(fightState==='intro'){
  const x=stateClock;ctx.fillStyle=`rgba(12,12,28,${Math.min(.52,x*.32)})`;ctx.fillRect(0,150,W,540);
  if(x<1.4){dramaticText('UM NOVO',360,48);dramaticText('DESAFIO!',437,59,'#562a42','#fff3d1')}
  else if(x<3.35){dramaticText('PREPARE-SE...',380,47,'#46243f','#fff1bc');ctx.fillStyle='#efb9b4';ctx.font='bold 17px Georgia';ctx.textAlign='center';ctx.fillText('O CHEFÃO ESTÁ PRONTO',W/2,443)}
  else{dramaticText('VALENDO!',398,77,'#653047','#fef1ba');ctx.fillStyle='#fff1cf';ctx.textAlign='center';ctx.font='bold 22px Georgia';ctx.fillText('VAMOS À LUTA!',W/2,482)}
  ctx.fillStyle='#fff0cf';ctx.fillRect(110,533,320*Math.min(1,stateClock/4.25),5);
 }
 if(phaseBanner>0){ctx.save();ctx.globalAlpha=Math.min(1,phaseBanner*2);ctx.fillStyle='#2d172aaa';ctx.fillRect(0,355,W,116);dramaticText('FASE '+fightPhase+'!',409,65,'#54203e','#ffddac');ctx.restore()}
 if(warningTime>0&&fightState==='fight'){ctx.save();ctx.globalAlpha=warningTime*1.5;ctx.strokeStyle='#ffdf78';ctx.lineWidth=5;for(let r=0;r<3;r++){ctx.beginPath();ctx.arc(d.bossX,d.bossY,70+r*25+Math.sin(simTime*10)*8,0,Math.PI*2);ctx.stroke()}ctx.restore()}
 if(parryGlow>0){ctx.save();ctx.globalAlpha=parryGlow*.75;ctx.strokeStyle='#f779d9';ctx.lineWidth=13;ctx.beginPath();ctx.arc(player.x+player.w/2,player.y+25,65+(1-parryGlow)*80,0,7);ctx.stroke();ctx.restore()}
 if(fightState==='knockout'){let scale=Math.min(1,stateClock/.35);ctx.fillStyle=`rgba(28,16,33,${Math.min(.83,.4+stateClock*.2)})`;ctx.fillRect(0,0,W,H);ctx.save();ctx.translate(W/2,H*.44);ctx.rotate(-.10+Math.sin(stateClock*4)*.012);ctx.scale(scale,scale);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='900 80px Georgia,serif';ctx.lineWidth=15;ctx.strokeStyle='#621a38';ctx.strokeText('KNOCKOUT!',0,0);ctx.fillStyle='#fff0c3';ctx.shadowBlur=22;ctx.shadowColor='#e9b66d';ctx.fillText('KNOCKOUT!',0,0);ctx.restore();ctx.fillStyle='#f3d5b5';ctx.textAlign='center';ctx.font='bold 20px Georgia';ctx.fillText('CHEFÃO DERROTADO',W/2,H*.53)}
 if(fightState==='defeat'){ctx.fillStyle=`rgba(21,23,41,${Math.min(.80,stateClock*.3+.18)})`;ctx.fillRect(0,0,W,H);dramaticText('VOCÊ PERDEU!',410,60,'#572c4d','#f9ded6')}
 if(fightState==='results'){ctx.fillStyle='#2b1e39ed';ctx.fillRect(0,0,W,H);dramaticText(wonLast?'RESULTADO!':'FIM DA LUTA',208,57);ctx.fillStyle='#fff1c8';ctx.font='bold 23px Georgia';ctx.textAlign='center';const lines=[`NOTA ${rank}`,`TEMPO: ${totalTime.toFixed(1)}s`,`ACERTOS: ${shotsHit}`,`PARRIES: ${parries}`,`DANO: ${hitsTaken}`];lines.forEach((line,i)=>ctx.fillText(line,W/2,305+i*53));}
}
function render(){ctx.save();if(shake>0&&playing){ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake)}drawBg();if(fightState!=='knockout'&&fightState!=='results')drawBoss();if(playing||gameOver){drawBullets();if(fightState!=='results')drawPlayer();hud();cinematic()}else{ctx.fillStyle='#161a2f99';roundRect(ctx,18,12,320,39,9,true);ctx.fillStyle='#fff0c3';ctx.textAlign='left';ctx.font='bold 16px Georgia';ctx.fillText('EDITOR DE FASE • TOQUE PARA EDITAR',31,37);drawPlayer();ctx.fillStyle='#20283c';ctx.font='bold 12px Arial';ctx.fillText('Jogador',55,759)}ctx.restore()}

function loop(timestamp){let elapsed=Math.min((timestamp-lastFrame)/1000,.06);lastFrame=timestamp;accumulator+=elapsed;let steps=0;while(accumulator>=1/60&&steps<4){step(1/60);accumulator-=1/60;steps++}render();$('stats').textContent=playing?`HP ${player.hp}/3 · Boss ${Math.ceil(100*bossLife/d.bossHP)}%`:'★ '+d.platforms.length+' plataformas · '+d.attacks.length+' ataques';requestAnimationFrame(loop)}
async function startRecording(){if(recording){await stopRecording();return}if(typeof MediaRecorder==='undefined'||typeof cv.captureStream!=='function'){toast('Gravação indisponível neste WebView. Use o gravador de tela do Android.');return}try{recordFormat=$('videoFormat').value;recChunks=[];recCanvas=cv;recCtx=null;recording=true;const types=['video/webm;codecs=vp8','video/webm;codecs=vp9','video/webm'];const mime=types.find(t=>MediaRecorder.isTypeSupported(t))||'';recorder=new MediaRecorder(recCanvas.captureStream(30),mime?{mimeType:mime,videoBitsPerSecond:2500000}:{videoBitsPerSecond:2500000});recorder.ondataavailable=e=>{if(e.data&&e.data.size)recChunks.push(e.data)};recorder.onerror=e=>{toast('Erro na gravação: '+(e.error?.message||'indisponível'));recording=false};recorder.onstop=saveRecordedVideo;recorder.start(1000);$('recordBtn').textContent='■ Parar e salvar';$('playRecord').textContent='■ SALVAR';$('bRecordTop').textContent='■ PARAR REC';$('recordBtn').style.background='#ba4b56';toast('Gravando a partida! Clique para parar.')}catch(e){recording=false;recCtx=null;toast('Gravação indisponível: '+e.message+'. Use o gravador de tela do Android.')}}
async function stopRecording(){if(!recorder||recorder.state==='inactive')return;recording=false;recorder.stop();$('recordBtn').textContent='● Iniciar gravação';$('playRecord').textContent='● GRAVAR';$('bRecordTop').textContent='● GRAVAR';$('recordBtn').style.background='';toast('Preparando vídeo, aguarde...')}
async function saveRecordedVideo(){let blob=new Blob(recChunks,{type:'video/webm'});recChunks=[];if(blob.size<2000){toast('A gravação ficou vazia. Tente novamente.');return}let name='CupheadMascot_'+new Date().toISOString().replace(/[:.]/g,'-')+'.webm';if(bridge()){try{let r=Android.startVideo(name,'video/webm');if(r!=='OK')throw new Error(r);let bytes=new Uint8Array(await blob.arrayBuffer());let chunkSize=98304;for(let i=0;i<bytes.length;i+=chunkSize){let sub=bytes.subarray(i,Math.min(bytes.length,i+chunkSize));let binary='';for(let j=0;j<sub.length;j++)binary+=String.fromCharCode(sub[j]);let res=Android.appendVideo(btoa(binary));if(res!=='OK')throw new Error(res)}Android.finishVideo();toast('Vídeo salvo em Filmes/CupheadMascot!');}catch(e){toast('Falha ao exportar: '+e.message)}}else{let url=URL.createObjectURL(blob);let a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),25000);toast('Vídeo exportado!')}}
$('recordBtn').onclick=startRecording;$('bRecordTop').onclick=startRecording;$('playRecord').onclick=startRecording;$('playExit').onclick=stopGame;
writeInspector();requestAnimationFrame(loop);
