import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { InspectionTour, sampleRoute } from './tour.js?v=20';
import { scrollTopForHeight, heightForScrollTop, fixedCameraPose, centeredCameraHeight, topCameraHeight, splitScrollDelta } from './scroll-view.js';
import { layoutLabels } from './label-layout.js';
import { PanoramaViewer } from './panorama.js';
import { EvidenceViewer } from './evidence.js';

const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const zh = params.get('lang') === 'zh';
const presentationMode = params.get('present') === '1';
const t = (en, chinese) => zh ? chinese : en;
const words = { hint: ['Scroll to explore floors', '捲動以探索樓層'], follow: ['Follow robot', '跟隨機械人'], fullscreen: ['Fullscreen', '全螢幕'], loading: ['Preparing your inspection…', '正在準備巡檢示範…'], errorTitle: ['The 3D view could not load.', '無法載入 3D 畫面。'], retry: ['Try again', '重試'], browse: ['Explore 360° captures', '探索 360° 影像'] };
document.documentElement.lang = zh ? 'zh-Hant' : 'en';
document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = words[el.dataset.i18n][zh ? 1 : 0]; });
$('floor-scroll').setAttribute('aria-label', t('Stairwell floors. Scroll up for higher floors, down for lower floors. Arrow and Page keys also work.', '樓梯間樓層。向上捲動查看較高樓層，向下捲動查看較低樓層。亦可使用方向鍵。'));
const captureSVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8V5h3m8 0h3v3M5 16v3h3m8 0h3v-3M2 12c0-3 20-3 20 0s-20 3-20 0Z"/><path d="m19 9 3 3-3 3"/></svg>';
const alertSVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 10 18H2L12 3Z"/><path d="M12 9v5m0 3v.1"/></svg>';
const hazardNames = { box: ['Blocked tread', '踏步阻塞'], folded_cart: ['Handcart obstruction', '手推車阻塞'], wet_floor: ['Wet tread', '濕滑踏步'], open_fire_door: ['Open fire door', '防火門敞開'], loose_cable: ['Loose cable', '鬆散電線'], paper_litter: ['Paper on stairs', '楼梯紙張'] };
const host = $('scene-frame'), fullscreenHost = $('experience'), scroll = $('floor-scroll');
const loader = new GLTFLoader(), annotations = [], floorButtons = new Map();
const vec = values => new THREE.Vector3().fromArray(values);
const toThree = values => new THREE.Vector3(values[0], values[2], -values[1]);
let scene, renderer, camera, robot, battery, tour, data, pano, evidence;
let visible = window.parent === window || presentationMode, following = true, alive = true, contextLost = false;
let panoOpen = false, evidenceOpen = false, evidenceOrigin, dirty = true, currentId = null, previousTime = 0;
let centerRobot = false;
let viewHeight = 4.4, minHeight = 4.4, maxHeight = 40, expectedScroll = 0;
let reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
// Embedded tours remain passive until a dashboard button is activated.
let interactionEnabled = parent === window || presentationMode;
function updateInteractionHint() {
  host.querySelector('[data-i18n="hint"]').textContent = interactionEnabled
    ? t('Scroll to explore floors', '捲動以探索樓層')
    : t('Select a control to explore', '點選控制按鈕以探索');
  scroll.setAttribute('aria-label', interactionEnabled
    ? t('Stairwell floors. Scroll or use arrow keys to explore.', '樓梯間樓層。捲動或使用方向鍵探索。')
    : t('Automatic inspection. Scrolling continues down the page. Select a dashboard button to explore floors.', '自動巡檢。捲動會繼續瀏覽網頁；點選儀表板按鈕後即可探索樓層。'));
}
fullscreenHost.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button || button.disabled || interactionEnabled) return;
  interactionEnabled = true;
  updateInteractionHint();
}, {capture:true});
updateInteractionHint();

function reportReady() { $('loading').hidden = true; parent.postMessage({ type: 'stairio:ready' }, location.origin); }
function setStatus(message) { $('status').textContent = message; }
function syncModals() { host.classList.toggle('modal-open', panoOpen || evidenceOpen); previousTime = 0; dirty = true; }
function updatePlay() {
  $('play-icon').textContent = tour?.phase === 'complete' ? '↻' : tour?.playing ? 'Ⅱ' : '▶';
  const label = tour?.phase === 'complete' ? t('Replay inspection', '重新播放巡檢') : tour?.playing ? t('Pause inspection', '暫停巡檢') : t('Play inspection', '播放巡檢');
  $('play').setAttribute('aria-label', label); $('play').title = label;
}
function stopFollowing() {
  following = false;
  $('follow').setAttribute('aria-pressed', 'false'); dirty = true;
}
function startFollowing(center = false) { centerRobot = center; following = true; $('follow').setAttribute('aria-pressed', 'true'); dirty = true; }
function openCapture(id, trigger) {
  if (!pano || !tour?.captured.has(id)) return;
  stopFollowing(); panoOpen = true; syncModals(); pano.open(id, trigger);
}
function openEvidence(id, trigger) {
  if (!evidence || !data.hazards.some(h => h.unique_instance === id && h.capture_ids.some(c => tour?.revealed.has(c)))) return;
  stopFollowing(); evidenceOrigin = trigger; evidenceOpen = true; syncModals(); evidence.open(id, trigger);
}
function tourEvent(event) {
  if (event.type === 'reset') {
    currentId = null;
    for (const a of annotations) if (a.type !== 'floor-label') { a.revealed = false; a.el.hidden = true; }
    setStatus(t('Moving to first capture', '前往首個拍攝位置')); return;
  }
  if (event.type === 'arrive') { currentId = event.capture.id; setStatus(t(`Inspecting floors ${event.capture.pair}`, `正在巡檢 ${event.capture.pair} 樓`)); }
  if (event.type === 'capture') {
    const a = annotations.find(item => item.type === 'capture-icon' && item.captureId === event.capture.id);
    if (a) a.revealed = true;
  }
  if (event.type === 'findings') {
    const hazards = data.hazards.filter(h => h.capture_ids.includes(event.capture.id));
    for (const hazard of hazards) { const a = annotations.find(item => item.hazardId === hazard.unique_instance); if (a) a.revealed = true; }
    setStatus(hazards.length ? t('Finding captured · select a tag', '已記錄發現 · 點選標籤查看') : t('Capture complete · stair clear', '拍攝完成 · 樓梯暢通'));
  }
  if (event.type === 'depart') setStatus(t('Moving to next capture', '前往下一個拍攝位置'));
  if (event.type === 'complete') { setStatus(t('Inspection complete', '巡檢完成')); updatePlay(); }
  dirty = true;
}
function addAnnotation({type,position,captureId,hazardId,floor,label}) {
  const el = document.createElement(type === 'floor-label' ? 'div' : 'button');
  el.className = `annotation ${type}`; el.hidden = true;
  if (type === 'capture-icon') el.innerHTML = captureSVG + '<span>360°</span>';
  else if (type === 'hazard') { el.innerHTML = alertSVG; const text = document.createElement('span'); text.textContent = label; el.append(text); }
  else { const small = document.createElement('small'); small.textContent = t('FLOOR', '樓層'); const number = document.createElement('strong'); number.textContent = String(floor).padStart(2, '0'); el.append(small, number); }
  el.setAttribute('aria-label', label); el.title = label;
  if (type !== 'floor-label') el.addEventListener('click', () => type === 'hazard' ? openEvidence(hazardId, el) : openCapture(captureId, el));
  const leader = document.createElementNS('http://www.w3.org/2000/svg','line');
  leader.classList.add('annotation-leader',type); leader.style.display='none'; $('annotation-leaders').append(leader);
  $('annotations').append(el); annotations.push({el,leader,type,position,captureId,hazardId,revealed:type === 'floor-label'});
}
function addSceneUI() {
  for (const capture of data.captures) addAnnotation({type:'capture-icon', position:toThree(capture.rail_midpoint).add(new THREE.Vector3(0,.67,0)), captureId:capture.id, label:t(`Open 360° · floors ${capture.pair}, ${capture.side.toLowerCase()} flight`, `開啟 360° · ${capture.pair} 樓${capture.side === 'Left' ? '左' : '右'}側梯段`)});
  for (const hazard of data.hazards) addAnnotation({type:'hazard',position:toThree(hazard.center_world_m).add(new THREE.Vector3(0,.7,0)),hazardId:hazard.unique_instance,label:hazardNames[hazard.kind]?.[zh?1:0] || hazard.title});
  for (let floor = 1; floor <= 5; floor++) addAnnotation({type:'floor-label',floor,position:new THREE.Vector3(-1.2,(floor-1)*data.halfRise*2+2.72,-.1),label:t(`Floor ${floor}`, `${floor} 樓`)});
  for (let floor = 5; floor >= 1; floor--) {
    const button = document.createElement('button'); button.textContent = String(floor).padStart(2,'0'); button.setAttribute('aria-label',t(`Go to floor ${floor}`,`前往 ${floor} 樓`));
    button.addEventListener('click', () => { stopFollowing(); const height = minHeight+(floor-1)*data.halfRise*2; scroll.scrollTo({top:scrollTopForHeight(height,scrollMinHeight(),maxHeight,scroll.scrollHeight-scroll.clientHeight),behavior:reduced?'instant':'smooth'}); });
    $('floor-nav').append(button); floorButtons.set(floor,button);
  }
}
function scrollMinHeight() {
  return centerRobot && data ? Math.min(minHeight,centeredCameraHeight(sampleRoute(data.route,0).position)) : minHeight;
}
function syncScroll() {
  expectedScroll = scrollTopForHeight(viewHeight,scrollMinHeight(),maxHeight,scroll.scrollHeight-scroll.clientHeight);
  scroll.scrollTop = expectedScroll; expectedScroll = scroll.scrollTop;
}
function resize() {
  if (!renderer || !camera || !host.clientWidth) return;
  renderer.setSize(host.clientWidth,host.clientHeight); camera.aspect = host.clientWidth/host.clientHeight; camera.updateProjectionMatrix();
  $('floor-scroll-content').style.height = `${host.clientHeight*5}px`; syncScroll(); dirty = true;
}
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme; const light = theme === 'light';
  if (scene) { scene.background = new THREE.Color(light?'#ffffff':'#071122'); scene.traverse(o => {if(o.userData.stair)o.material.color.set(light?'#697d7e':'#b4c9c6');}); }
  dirty = true;
}
async function buildScene() {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.8));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.35;
  $('map').append(renderer.domElement);
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault(); contextLost = true; $('error').hidden = false; reportReady();
  });
  renderer.domElement.addEventListener('webglcontextrestored', () => location.reload());
  scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xeaf5ff, 0x53646b, 2.7));
  const key = new THREE.DirectionalLight(0xffffff, 3.4); key.position.set(-5, 18, 12); scene.add(key);
  const rim = new THREE.DirectionalLight(0xb6d8ff, 2.0); rim.position.set(5, 20, -7); scene.add(rim);
  camera = new THREE.PerspectiveCamera(35, 16 / 9, .03, 180);
  const [environment, shell] = await Promise.all([loader.loadAsync('./staircase-v11.glb'), loader.loadAsync('./robot-exterior-v21.glb')]);
  environment.scene.traverse(object => {
    if (!object.isMesh) return;
    const name = object.name + ' ' + object.parent?.name;
    if (object.name.includes('LandingNumber')) object.visible = false;
    if (/^P3_Door_\d/.test(object.name)) object.material = new THREE.MeshStandardMaterial({ color: '#263239', roughness: .68, metalness: .12 });
    if (/Flight_\d|Landing_\d|GroundLanding|LandingApron|LandingEndApron/.test(name) && !/Handrail|Number/.test(object.name)) {
      object.material = new THREE.MeshStandardMaterial({ color: '#b4c9c6', roughness: .85, metalness: .05, transparent: true, opacity: .3, depthWrite: true, side: THREE.FrontSide });
      object.userData.stair = true;
      // Render the outside faces without a wire overlay or interior backfaces.
    }
  });
  scene.add(environment.scene);
  robot = shell.scene; robot.scale.setScalar(1.65); scene.add(robot);
  battery = robot.getObjectByName('BatteryGravityPivot');
  const ring = new THREE.Mesh(new THREE.RingGeometry(.23, .26, 40), new THREE.MeshBasicMaterial({ color: '#c7ee71', side: THREE.DoubleSide, transparent: true, opacity: .4, depthWrite: false }));
  ring.name = 'InspectionPulse'; scene.add(ring);
  robot.userData.pulse = ring;
  applyTheme(document.documentElement.dataset.theme || 'dark');
  resize(); updateRobot(1); updateCamera(1); renderer.render(scene, camera);
}

const up = new THREE.Vector3(0, 1, 0), basis = new THREE.Matrix4(), yawBasis = new THREE.Matrix4();
const q = new THREE.Quaternion(), yawQuaternion = new THREE.Quaternion();
function updateRobot(dt) {
  const sampled = sampleRoute(data.route, tour.distance);
  const tangent = vec(sampled.tangent), x = tangent.clone().negate();
  const z = new THREE.Vector3().crossVectors(x, up).normalize();
  const y = new THREE.Vector3().crossVectors(z, x).normalize();
  q.setFromRotationMatrix(basis.makeBasis(x, y, z));
  robot.position.fromArray(sampled.position);
  robot.quaternion.slerp(q, 1 - Math.exp(-dt * 18));
  if (battery) {
    const flatX = new THREE.Vector3(x.x, 0, x.z).normalize();
    const flatZ = new THREE.Vector3().crossVectors(flatX, up).normalize();
    yawQuaternion.setFromRotationMatrix(yawBasis.makeBasis(flatX, up, flatZ));
    battery.quaternion.copy(robot.quaternion).invert().multiply(yawQuaternion);
  }
  const pulse = robot.userData.pulse;
  pulse.position.copy(robot.position); pulse.quaternion.copy(camera.quaternion);
  pulse.visible = tour.phase === 'inspect';
  pulse.scale.setScalar(1 + (reduced ? 0 : Math.sin(tour.elapsed * Math.PI) * .15));
}

// Frame the last landing with its floor label at 17% of the 16:9 view.
// The same upper limit applies to automatic follow, centered follow and scrolling.
function followHeight() {
  if (centerRobot) return Math.min(maxHeight,centeredCameraHeight(robot.position.toArray()));
  return THREE.MathUtils.clamp(robot.position.y+3.38,minHeight,maxHeight);
}
function updateCamera(dt) {
  if (following) {
    const target = followHeight();
    viewHeight = THREE.MathUtils.damp(viewHeight,target,5,dt); syncScroll();
  }
  viewHeight = Math.min(viewHeight,maxHeight);
  const pose = fixedCameraPose(viewHeight);
  camera.position.fromArray(pose.position); camera.lookAt(...pose.target); camera.updateMatrixWorld();
  const floor = viewHeight >= maxHeight-.05 ? 5 : THREE.MathUtils.clamp(Math.round((viewHeight-minHeight)/(data.halfRise*2))+1,1,5);
  for (const [number,button] of floorButtons) button.setAttribute('aria-current',String(number === floor));
}
function projectAnnotations() {
  const w=host.clientWidth,h=host.clientHeight,origin=host.getBoundingClientRect(),candidates=[];
  const obstacles=[...host.querySelectorAll('#floor-nav,.scroll-hint,.view-tools')].map(el=>{
    const r=el.getBoundingClientRect();return {x:r.left-origin.left+r.width/2,y:r.top-origin.top+r.height/2,width:r.width,height:r.height};
  });
  for(const [id,a] of annotations.entries()) {
    a.leader.style.display='none';
    if(!a.revealed){a.el.hidden=true;continue;}
    const p=a.position.clone().project(camera),x=(p.x*.5+.5)*w,y=(-p.y*.5+.5)*h;
    if(p.z < -1||p.z>1||x<0||x>w||y<12||y>h-12){a.el.hidden=true;continue;}
    a.el.hidden=false;a.el.style.visibility='hidden';
    candidates.push({id,type:a.type,x,y,anchorX:x,anchorY:y,width:a.el.offsetWidth,height:a.el.offsetHeight});
  }
  const positions=layoutLabels(candidates,w,h,obstacles),placed=new Set(positions.map(p=>p.id));
  for(const candidate of candidates)if(!placed.has(candidate.id))annotations[candidate.id].el.hidden=true;
  for(const p of positions){
    const a=annotations[p.id];a.el.style.visibility='';
    a.el.style.transform=`translate(${Math.round(p.x)}px,${Math.round(p.y)}px) translate(-50%,-50%)`;
    a.el.classList.toggle('current',a.type==='capture-icon'&&a.captureId===currentId&&tour.phase==='review');
    if(a.type!=='floor-label'&&Math.hypot(p.x-p.anchorX,p.y-p.anchorY)>12){
      const dx=p.anchorX-p.x,dy=p.anchorY-p.y,scale=Math.min((p.width/2)/Math.abs(dx||.001),(p.height/2)/Math.abs(dy||.001),1);
      a.leader.setAttribute('x1',p.x+dx*scale);a.leader.setAttribute('y1',p.y+dy*scale);
      a.leader.setAttribute('x2',p.anchorX);a.leader.setAttribute('y2',p.anchorY);a.leader.style.display='';
    }
  }
}
function animate(time){
  if(!alive)return; requestAnimationFrame(animate);
  const dt=Math.min(.075,previousTime?(time-previousTime)/1000:0);previousTime=time;
  if(!visible||document.hidden||panoOpen||evidenceOpen||contextLost||!renderer||!robot)return;
  if(tour.playing&&tour.phase!=='complete'){tour.tick(dt);updateRobot(dt);dirty=true;}
  const cameraSettling=following&&Math.abs(viewHeight-followHeight())>.001;
  if(cameraSettling||dirty){updateCamera(dt);dirty=true;}
  if(dirty){renderer.render(scene,camera);projectAnnotations();dirty=false;}
}
scroll.addEventListener('scroll',()=>{
  if(!interactionEnabled){syncScroll();return;}
  if(Math.abs(scroll.scrollTop-expectedScroll)<1.1)return;
  stopFollowing();viewHeight=heightForScrollTop(scroll.scrollTop,scrollMinHeight(),maxHeight,scroll.scrollHeight-scroll.clientHeight);dirty=true;
},{passive:true});
scroll.addEventListener('pointerdown',()=>{if(interactionEnabled)stopFollowing();},{passive:true});
function forwardPageScroll(delta) {
  if (!delta || document.fullscreenElement || parent === window) return;
  parent.postMessage({type:'stairio:page-scroll',delta},location.origin);
}
function scrollSceneBy(delta) {
  if (!Number.isFinite(delta) || !delta) return;
  if(!interactionEnabled){forwardPageScroll(delta);return;}
  stopFollowing();
  const {next,overflow}=splitScrollDelta(scroll.scrollTop,delta,scroll.scrollHeight-scroll.clientHeight);
  scroll.scrollTop=next;expectedScroll=scroll.scrollTop;
  viewHeight=heightForScrollTop(scroll.scrollTop,scrollMinHeight(),maxHeight,scroll.scrollHeight-scroll.clientHeight);
  dirty=true;forwardPageScroll(overflow);
}
scroll.addEventListener('keydown',event=>{
  if(panoOpen||evidenceOpen||event.ctrlKey||event.metaKey||event.altKey)return;
  const page=host.clientHeight*.9;
  const deltas={ArrowUp:-40,ArrowDown:40,PageUp:-page,PageDown:page,' ':event.shiftKey?-page:page};
  if(event.key in deltas){event.preventDefault();scrollSceneBy(deltas[event.key]);}
  else if(event.key==='Home'||event.key==='End'){
    event.preventDefault();
    if(!interactionEnabled){forwardPageScroll(event.key==='Home'?-1e6:1e6);return;}
    scrollSceneBy(event.key==='Home'?-scroll.scrollTop:scroll.scrollHeight-scroll.clientHeight-scroll.scrollTop);
  }
});
host.addEventListener('wheel',event=>{
  if(panoOpen||evidenceOpen||event.ctrlKey||Math.abs(event.deltaX)>Math.abs(event.deltaY))return;
  event.preventDefault();
  const unit=event.deltaMode===1?16:event.deltaMode===2?host.clientHeight:1;
  scrollSceneBy(event.deltaY*unit);
},{passive:false});
let touchY=null;
host.addEventListener('touchstart',event=>{
  touchY=!panoOpen&&!evidenceOpen&&event.touches.length===1&&(!interactionEnabled||!event.target.closest('button,a'))?event.touches[0].screenY:null;
},{passive:true});
host.addEventListener('touchmove',event=>{
  if(touchY===null||panoOpen||evidenceOpen||event.touches.length!==1){touchY=null;return;}
  const y=event.touches[0].screenY,delta=touchY-y;touchY=y;
  if(delta){event.preventDefault();scrollSceneBy(delta);}
},{passive:false});
host.addEventListener('touchend',()=>{touchY=null;},{passive:true});
host.addEventListener('touchcancel',()=>{touchY=null;},{passive:true});
$('play').addEventListener('click',()=>{
  if(!tour)return;
  if(tour.phase==='complete'){tour.reset(true);startFollowing();viewHeight=maxHeight;updateRobot(1);syncScroll();}
  else tour.playing=!tour.playing;
  setStatus(tour.playing?t('Inspection running','正在巡檢'):t('Inspection paused','巡檢已暫停'));updatePlay();dirty=true;
});
$('follow').addEventListener('click',()=>startFollowing(true));
$('fullscreen').addEventListener('click',async()=>{
  try{if(document.fullscreenElement)await document.exitFullscreen();else await fullscreenHost.requestFullscreen();}
  catch{window.open(location.href,'_blank','noopener');}
});
document.fonts.ready.then(()=>{dirty=true;});
document.addEventListener('fullscreenchange',()=>{
  const label=document.fullscreenElement?t('Exit fullscreen','離開全螢幕'):t('Enter fullscreen','進入全螢幕');
  $('fullscreen').setAttribute('aria-label',label);$('fullscreen').title=label;resize();
});
window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==parent)return;
  if(event.data?.type==='stairio:visibility'){visible=Boolean(event.data.visible);previousTime=0;dirty=true;}
  if(event.data?.type==='stairio:theme')applyTheme(event.data.theme==='light'?'light':'dark');
});
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',event=>{reduced=event.matches;if(reduced&&tour){tour.playing=false;updatePlay();setStatus(t('Ready when you are','準備好即可開始'));}});
new ResizeObserver(resize).observe(host);
$('browse-fallback').addEventListener('click',()=>openCapture([...tour.captured][0],$('browse-fallback')));
async function init(){
  try{
    const fetchJSON=async path=>{const r=await fetch(path);if(!r.ok)throw new Error('Inspection data unavailable');return r.json();};
    const [inspection,evidenceData]=await Promise.all([fetchJSON('./inspection-data.json'),fetchJSON('./evidence-metadata.json')]);data=inspection;maxHeight=topCameraHeight(data.halfRise);viewHeight=maxHeight;
    evidence=new EvidenceViewer({host:$('evidence-host'),items:evidenceData.items,lang:zh?'zh':'en',onClose:()=>{evidenceOpen=false;syncModals();},onOpenPanorama:id=>openCapture(id,evidenceOrigin)});
    pano=new PanoramaViewer({host:$('panorama-host'),captures:data.captures,lang:zh?'zh':'en',onClose:()=>{panoOpen=false;syncModals();},onHazard:(point,capture,trigger)=>openEvidence(point.unique_instance,trigger)});
    addSceneUI();tour=new InspectionTour(data.route,data.captures,{direction:-1,reducedMotion:reduced,onEvent:tourEvent});
    await buildScene();updatePlay();if(reduced)setStatus(t('Ready when you are · press play','準備好即可開始 · 點選播放'));
    reportReady();requestAnimationFrame(animate);
  }catch(error){console.error('Stairio inspection:',error);$('error').hidden=false;reportReady();$('browse-fallback').hidden=!tour?.captured.size;}
}
window.addEventListener('pagehide',()=>{
  alive=false;evidence?.dispose();pano?.dispose();
  const geometries=new Set(),materials=new Set(),textures=new Set();
  scene?.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[]){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});
  geometries.forEach(v=>v.dispose());textures.forEach(v=>v.dispose());materials.forEach(v=>v.dispose());renderer?.dispose();
});
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
init();
