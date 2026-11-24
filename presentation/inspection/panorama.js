const RAD = Math.PI / 180;
const clamp = (n, low, high) => Math.min(high, Math.max(low, n));

export function panoramaQualityCandidates(viewportWidth, maximumTexture) {
  return viewportWidth >= 768 && maximumTexture >= 8192 ? ['8k', '4k'] : ['4k'];
}

const overlaps = (a, b, gap = 5) => a.left < b.left + b.width + gap && a.left + a.width + gap > b.left && a.top < b.top + b.height + gap && a.top + a.height + gap > b.top;

// Keep the dot on its image ray; only the connected text label may move.
export function layoutPanoramaLabels(items, width, height, reserved = []) {
  const placed = [...reserved], result = new Map(), padding = 8;
  const anchors = items.map(item => ({ left: item.x - 14, top: item.y - 14, width: 28, height: 28 }));
  for (const item of items) {
    const w = Math.min(item.width, width - padding * 2), h = item.height;
    const candidates = [
      [item.x + 25, item.y - h / 2], [item.x - 25 - w, item.y - h / 2],
      [item.x - w / 2, item.y - h - 25], [item.x - w / 2, item.y + 25],
      [item.x + 25, item.y - h - 18], [item.x - 25 - w, item.y - h - 18],
      [item.x + 25, item.y + 18], [item.x - 25 - w, item.y + 18],
    ];
    const rect = candidates.map(([left, top]) => ({
      left: clamp(left, padding, width - w - padding), top: clamp(top, padding, height - h - padding), width: w, height: h,
    })).find(candidate => ![...placed, ...anchors].some(block => overlaps(candidate, block)));
    result.set(item.id, rect || null);
    if (rect) placed.push(rect);
  }
  return result;
}

// Exact inverse of the v03 render shader, for annotations anchored to image rays.
export function projectPanoramaPoint(point, yaw, pitch, verticalFov, aspect) {
  const azimuth = point.yaw_degrees * RAD;
  const elevation = point.pitch_degrees * RAD;
  const x = Math.sin(azimuth) * Math.cos(elevation);
  const y = Math.sin(elevation);
  const z = -Math.cos(azimuth) * Math.cos(elevation);
  const localX = Math.cos(yaw) * x + Math.sin(yaw) * z;
  const yawZ = -Math.sin(yaw) * x + Math.cos(yaw) * z;
  const localY = Math.cos(pitch) * y + Math.sin(pitch) * yawZ;
  const localZ = -Math.sin(pitch) * y + Math.cos(pitch) * yawZ;
  if (localZ >= -0.001) return null;
  const tangent = Math.tan(verticalFov * RAD / 2);
  return { x: .5 + localX / -localZ / (aspect * tangent) / 2,
    y: .5 - localY / -localZ / tangent / 2 };
}

const WORDS = {
  en: { label: '360° inspection', close: 'Close panorama', loading: 'Loading your view…', error: 'This view could not load. Please try again.', retry: 'Try again', context: 'Restoring the panorama…', unsupported: 'Your browser could not start the 360° viewer.', floor: 'Floors', left: 'Left stairs', right: 'Right stairs', canvas: '360° image. Drag to look around, scroll or pinch to zoom. Use arrow keys to look around, plus and minus to zoom, and Home to reset.', view: 'View finding' },
  zh: { label: '360° 巡檢', close: '關閉全景', loading: '正在載入視角…', error: '無法載入此視角，請重試。', retry: '重試', context: '正在恢復全景…', unsupported: '瀏覽器無法啟動 360° 查看器。', floor: '樓層', left: '左側樓梯', right: '右側樓梯', canvas: '360° 影像。拖動環視，捲動或雙指縮放。方向鍵環視，加減鍵縮放，Home 鍵重設。', view: '查看隱患' },
};

const HAZARD_NAMES = {
  box: ['Blocked tread', '踏步阻塞'], folded_cart: ['Handcart obstruction', '手推車阻塞'],
  wet_floor: ['Wet floor', '地面濕滑'], open_fire_door: ['Open fire door', '防火門敞開'],
  loose_cable: ['Loose cable', '鬆散電線'], paper_litter: ['Paper litter', '紙張散落'],
};

export class PanoramaViewer {
  constructor({ host, captures, onClose = () => {}, onHazard, lang = 'en' }) {
    if (!host) throw new Error('PanoramaViewer needs a host element.');
    this.host = host;
    this.captures = Array.isArray(captures) ? captures : Object.values(captures);
    this.onClose = onClose;
    this.onHazard = onHazard;
    this.lang = lang.startsWith('zh') ? 'zh' : 'en';
    this.t = WORDS[this.lang];
    this.yaw = 0; this.pitch = 0; this.fov = 65;
    this.requestId = 0; this.pointers = new Map(); this.cleanups = [];
    this.destroyed = false; this.lost = false; this.ready = false; this.quality = '4k';
    const styleHref = new URL('./panorama.css', import.meta.url).href;
    if (![...document.querySelectorAll('link[rel="stylesheet"]')].some(link => link.href === styleHref)) {
      const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = styleHref; document.head.append(link);
    }
    this.build();
    this.bind();
  }

  element(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  button(text, label, action, className = '') {
    const button = this.element('button', 'si-pano-button ' + className, text);
    button.type = 'button'; button.setAttribute('aria-label', label); button.title = label;
    this.listen(button, 'click', action); return button;
  }

  listen(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    this.cleanups.push(() => target.removeEventListener(type, handler, options));
  }

  build() {
    const t = this.t;
    this.dialog = this.element('dialog', 'si-pano');
    this.dialog.setAttribute('aria-label', t.label);
    this.viewportFrame = this.element('div', 'si-pano-frame');
    this.stage = this.element('div', 'si-pano-stage');
    this.canvas = this.element('canvas', 'si-pano-canvas'); this.canvas.tabIndex = 0;
    this.canvas.setAttribute('aria-label', t.canvas);
    this.annotationLayer = this.element('div', 'si-pano-annotations');
    this.stage.append(this.canvas, this.annotationLayer);
    const header = this.element('header', 'si-pano-header');
    this.heading = this.element('div', 'si-pano-heading');
    this.heading.append(this.element('span', 'si-pano-eyebrow', t.label));
    this.title = this.element('h2', 'si-pano-title'); this.heading.append(this.title);
    this.closeButton = this.button('', t.close, () => this.close(), 'si-pano-close');
    header.append(this.heading, this.closeButton);
    this.message = this.element('div', 'si-pano-message');
    this.message.setAttribute('role', 'status'); this.message.setAttribute('aria-live', 'polite');
    this.messageText = this.element('p');
    this.retry = this.button(t.retry, t.retry, () => this.load(this.current.id));
    this.retry.hidden = true; this.message.append(this.element('span', 'si-pano-spinner'), this.messageText, this.retry);
    this.status = this.element('span', 'si-pano-sr'); this.status.setAttribute('aria-live', 'polite');
    this.viewportFrame.append(this.stage, header, this.message, this.status);
    this.dialog.append(this.viewportFrame);
    this.host.append(this.dialog);
  }

  captureLabel(capture) {
    const side = String(capture.side || '').toLowerCase() === 'right' ? this.t.right : this.t.left;
    return `${this.t.floor} ${capture.pair || capture.floor} · ${side}`;
  }

  hazardLabel(point) {
    return HAZARD_NAMES[point.kind]?.[this.lang === 'zh' ? 1 : 0] || point.title;
  }

  activateHazard(point, capture, triggerElement) {
    if (typeof this.onHazard === 'function') this.onHazard(point, capture, triggerElement);
    else {
      this.setView(point.yaw_degrees * RAD, point.pitch_degrees * RAD);
    }
  }

  bind() {
    this.listen(this.dialog, 'cancel', event => { event.preventDefault(); this.close(); });
    this.listen(this.dialog, 'keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.close();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = [...this.dialog.querySelectorAll('button, [tabindex="0"]')]
        .filter(element => !element.disabled && !element.hidden && element.getClientRects().length);
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && (document.activeElement === first || !this.dialog.contains(document.activeElement))) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    });
    this.listen(this.canvas, 'keydown', event => {
      const step = (event.shiftKey ? 10 : 3) * RAD;
      const actions = {
        ArrowLeft: () => this.setView(this.yaw - step), ArrowRight: () => this.setView(this.yaw + step),
        ArrowUp: () => this.setView(this.yaw, this.pitch + step), ArrowDown: () => this.setView(this.yaw, this.pitch - step),
        '+': () => this.setView(this.yaw, this.pitch, this.fov - 5), '=': () => this.setView(this.yaw, this.pitch, this.fov - 5),
        '-': () => this.setView(this.yaw, this.pitch, this.fov + 5), Home: () => this.reset(),
      };
      if (actions[event.key]) { event.preventDefault(); actions[event.key](); }
    });
    this.listen(this.canvas, 'pointerdown', event => {
      if (!this.ready || (event.pointerType === 'mouse' && event.button !== 0)) return;
      this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      this.canvas.setPointerCapture(event.pointerId); this.canvas.classList.add('is-dragging');
      this.canvas.focus({ preventScroll: true });
    });
    this.listen(this.canvas, 'pointermove', event => {
      const previous = this.pointers.get(event.pointerId); if (!previous || !this.ready) return;
      const before = this.pinchDistance();
      this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (this.pointers.size > 1) {
        const after = this.pinchDistance();
        if (before > 0 && after > 0) this.setView(this.yaw, this.pitch, this.fov * before / after);
      } else {
        const sensitivity = this.fov * RAD / Math.max(this.canvas.clientHeight, 1);
        this.setView(this.yaw - (event.clientX - previous.x) * sensitivity, this.pitch + (event.clientY - previous.y) * sensitivity);
      }
    });
    const endPointer = event => { this.pointers.delete(event.pointerId); if (!this.pointers.size) this.canvas.classList.remove('is-dragging'); };
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) this.listen(this.canvas, name, endPointer);
    this.listen(this.canvas, 'wheel', event => {
      if (!this.ready) return; event.preventDefault();
      const units = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? this.canvas.clientHeight : 1;
      this.setView(this.yaw, this.pitch, this.fov + clamp(event.deltaY * units, -120, 120) * .045);
    }, { passive: false });
    this.listen(this.canvas, 'webglcontextlost', event => {
      event.preventDefault(); this.lost = true; this.ready = false; ++this.requestId;
      this.abort?.abort(); this.pointers.clear(); this.canvas.classList.remove('is-dragging');
      if (this.dialog.open) this.notify(this.t.context);
    });
    this.listen(this.canvas, 'webglcontextrestored', () => {
      this.lost = false; this.program = null; this.buffer = null; this.texture = null;
      try { this.initialize(); if (this.dialog.open && this.current) this.load(this.current.id); }
      catch { this.notify(this.t.unsupported, true); }
    });
    this.resizeObserver = new ResizeObserver(() => this.invalidate()); this.resizeObserver.observe(this.stage);
  }

  pinchDistance() {
    const [a, b] = [...this.pointers.values()]; return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  }

  open(captureId, triggerElement) {
    if (this.destroyed || !this.captures.some(capture => capture.id === captureId)) return;
    if (!this.dialog.open) {
      this.trigger = triggerElement || document.activeElement;
      this.dialog.showModal(); this.closeButton.focus({ preventScroll: true });
    }
    this.load(captureId);
  }

  close() {
    if (!this.dialog.open) return;
    ++this.requestId; this.abort?.abort(); this.ready = false; this.pointers.clear();
    this.canvas.classList.remove('is-dragging'); this.releaseTexture();
    this.dialog.close();
    this.onClose();
    if (this.trigger?.isConnected) this.trigger.focus({ preventScroll: true });
  }

  notify(text, error = false) {
    this.message.hidden = false; this.messageText.textContent = text; this.retry.hidden = !error;
    this.message.classList.toggle('is-error', error);
    this.canvas.classList.toggle('is-unavailable', !this.ready);
    this.dialog.setAttribute('aria-busy', String(!error));
  }

  initialize() {
    if (this.program) return;
    const gl = this.gl || this.canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
    if (!gl) throw new Error('WebGL unavailable'); this.gl = gl;
    const precision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT).precision ? 'highp' : 'mediump';
    const vertexSource = 'attribute vec2 position; varying vec2 screen; void main(){screen=position;gl_Position=vec4(position,0.,1.);}';
    const fragmentSource = `precision ${precision} float;
      varying vec2 screen; uniform sampler2D panorama; uniform float aspect; uniform float tangentFov; uniform float yaw; uniform float pitch;
      const float PI=3.141592653589793;
      void main(){
        vec3 ray=normalize(vec3(screen.x*aspect*tangentFov,screen.y*tangentFov,-1.));
        float cp=cos(pitch),sp=sin(pitch),cy=cos(yaw),sy=sin(yaw);
        ray=vec3(ray.x,cp*ray.y-sp*ray.z,sp*ray.y+cp*ray.z);
        ray=vec3(cy*ray.x-sy*ray.z,ray.y,sy*ray.x+cy*ray.z);
        vec2 uv=vec2(fract(.5+atan(ray.x,-ray.z)/(2.*PI)),.5-asin(clamp(ray.y,-1.,1.))/PI);
        gl_FragColor=vec4(texture2D(panorama,uv).rgb,1.);
      }`;
    const shader = (type, source) => {
      const item = gl.createShader(type); gl.shaderSource(item, source); gl.compileShader(item);
      if (!gl.getShaderParameter(item, gl.COMPILE_STATUS)) { gl.deleteShader(item); throw new Error('Shader compilation failed'); }
      return item;
    };
    const vertex = shader(gl.VERTEX_SHADER, vertexSource), fragment = shader(gl.FRAGMENT_SHADER, fragmentSource);
    this.program = gl.createProgram(); gl.attachShader(this.program, vertex); gl.attachShader(this.program, fragment); gl.linkProgram(this.program);
    gl.deleteShader(vertex); gl.deleteShader(fragment);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) { gl.deleteProgram(this.program); this.program = null; throw new Error('Shader link failed'); }
    gl.useProgram(this.program);
    this.buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(this.program, 'position'); gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
    this.uniforms = Object.fromEntries(['aspect','tangentFov','yaw','pitch','panorama'].map(name => [name,gl.getUniformLocation(this.program,name)]));
    gl.uniform1i(this.uniforms.panorama,0); gl.disable(gl.DEPTH_TEST);
    this.maximumTexture = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  }

  releaseTexture() {
    if (this.texture && this.gl && !this.lost) this.gl.deleteTexture(this.texture);
    this.texture = null;
  }

  async imageTexture(capture, quality, signal) {
    let objectUrl, texture;
    try {
      const path = quality === '8k' ? capture.web_image : capture.web_image_4k;
      const fallback = `./panoramas/${capture.id}${quality === '8k' ? '' : '-4k'}.webp`;
      const response = await fetch(new URL(path || fallback, import.meta.url), { signal });
      if (!response.ok) throw new Error('Image unavailable');
      const blob = await response.blob(); signal.throwIfAborted();
      objectUrl = URL.createObjectURL(blob); const image = new Image();
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error('Image decode failed'));
        image.src = objectUrl;
      });
      signal.throwIfAborted();
      if (this.lost) throw new Error('Graphics context lost');
      if (image.naturalWidth !== image.naturalHeight * 2) throw new Error('Invalid panorama aspect ratio');
      let source = image;
      if (image.naturalWidth > this.maximumTexture) {
        source = document.createElement('canvas'); source.width = this.maximumTexture; source.height = this.maximumTexture / 2;
        const context = source.getContext('2d'); if (!context) throw new Error('Image resizing unavailable');
        context.drawImage(image, 0, 0, source.width, source.height);
      }
      const gl = this.gl;
      // Clear a previous failed upload before trying the smaller fallback texture.
      for (let i = 0; i < 8 && gl.getError() !== gl.NO_ERROR; i++) { /* Drain existing errors. */ }
      texture = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
      const isPowerOfTwo = value => (value & (value - 1)) === 0;
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,isPowerOfTwo(source.width) && isPowerOfTwo(source.height) ? gl.REPEAT : gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,source);
      if (gl.getError() !== gl.NO_ERROR) throw new Error('Texture upload failed');
      return { texture, quality, label: `${Math.round(source.width / 1024)}K` };
    } catch (error) {
      if (texture && !this.lost) this.gl.deleteTexture(texture);
      throw error;
    } finally { if (objectUrl) URL.revokeObjectURL(objectUrl); }
  }

  async load(captureId) {
    const capture = this.captures.find(item => item.id === captureId);
    if (!capture || this.destroyed || !this.dialog.open) return;
    this.abort?.abort(); this.abort = new AbortController(); const signal = this.abort.signal;
    const request = ++this.requestId;
    this.current = capture;
    this.title.textContent = this.captureLabel(capture);
    this.ready = false; this.releaseTexture(); this.quality = null;
    this.buildFindings(capture); this.notify(this.t.loading);
    try {
      if (this.lost) { this.notify(this.t.context); return; }
      this.initialize();
      const candidates = panoramaQualityCandidates(window.innerWidth, this.maximumTexture);
      let loaded;
      for (const quality of candidates) {
        try { loaded = await this.imageTexture(capture, quality, signal); break; }
        catch (error) {
          if (signal.aborted || this.lost || request !== this.requestId || quality === candidates.at(-1)) throw error;
        }
      }
      if (request !== this.requestId || signal.aborted || this.lost || !this.dialog.open) {
        if (loaded?.texture && !this.lost) this.gl.deleteTexture(loaded.texture);
        return;
      }
      this.texture = loaded.texture; this.ready = true; this.quality = loaded.quality;
      this.message.hidden = true; this.canvas.classList.remove('is-unavailable'); this.dialog.setAttribute('aria-busy','false');
      this.status.textContent = this.captureLabel(capture) + ' · ' + loaded.label;
      this.reset();
    } catch (error) {
      if (request !== this.requestId || signal.aborted || this.destroyed || this.lost) return;
      this.notify(this.gl ? this.t.error : this.t.unsupported, true);
    }
  }

  buildFindings(capture) {
    this.annotationLayer.replaceChildren();
    this.annotations = [];
    const ids = new Set();
    const points = (capture.points || []).filter(point => {
      if (!point.unique_instance || !point.title || !Number.isFinite(point.yaw_degrees) || !Number.isFinite(point.pitch_degrees) || ids.has(point.unique_instance)) return false;
      ids.add(point.unique_instance); return true;
    });
    for (const point of points) {
      const label = this.hazardLabel(point);
      const marker = this.button('', this.t.view + ': ' + label, event => this.activateHazard(point, capture, event.currentTarget), 'si-pano-marker');
      const link = this.element('span', 'si-pano-marker-link');
      const text = this.element('span','si-pano-marker-label',label);
      marker.append(link, this.element('span','si-pano-anchor'),text);
      marker.hidden = true; marker.dataset.kind = point.kind; this.annotationLayer.append(marker);
      this.annotations.push({ point, marker, text, link });
    }
  }

  reset() {
    const view = this.current?.initial_view || {};
    const aspect = Math.max(this.canvas.clientWidth,1) / Math.max(this.canvas.clientHeight,1);
    const horizontal = clamp(view.horizontal_fov_degrees || 80,30,140) * RAD;
    const vertical = 2 * Math.atan(Math.tan(horizontal / 2) / aspect) / RAD;
    this.setView((view.yaw_degrees || 0) * RAD,(view.pitch_degrees || 0) * RAD,vertical);
  }

  setView(yaw = this.yaw, pitch = this.pitch, fov = this.fov) {
    this.yaw = ((yaw + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
    this.pitch = clamp(pitch,-Math.PI / 2 + .001,Math.PI / 2 - .001);
    this.fov = clamp(fov,25,120);
    this.invalidate();
  }

  invalidate() {
    if (this.frame || this.destroyed || !this.dialog.open) return;
    this.frame = requestAnimationFrame(() => { this.frame = 0; this.render(); });
  }

  render() {
    if (!this.ready || this.lost || !this.dialog.open) return;
    const gl = this.gl, ratio = Math.min(window.devicePixelRatio || 1,2);
    const width = Math.max(1,Math.round(this.canvas.clientWidth * ratio)), height = Math.max(1,Math.round(this.canvas.clientHeight * ratio));
    if (this.canvas.width !== width || this.canvas.height !== height) { this.canvas.width = width; this.canvas.height = height; }
    const aspect = width / height;
    gl.viewport(0,0,width,height); gl.useProgram(this.program); gl.uniform1f(this.uniforms.aspect,aspect);
    gl.uniform1f(this.uniforms.tangentFov,Math.tan(this.fov * RAD / 2)); gl.uniform1f(this.uniforms.yaw,this.yaw); gl.uniform1f(this.uniforms.pitch,this.pitch);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,this.texture); gl.drawArrays(gl.TRIANGLES,0,6);
    const frame = this.viewportFrame.getBoundingClientRect();
    const localRect = element => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left - frame.left, top: rect.top - frame.top, width: rect.width, height: rect.height };
    };
    const closeRect = localRect(this.closeButton);
    const reserved = [closeRect, localRect(this.heading)];
    const visible = [];
    for (const annotation of this.annotations || []) {
      const { point, marker, text } = annotation;
      const projected = projectPanoramaPoint(point,this.yaw,this.pitch,this.fov,aspect);
      const x = (projected?.x || 0) * frame.width, y = (projected?.y || 0) * frame.height;
      const anchor = { left: x - 14, top: y - 14, width: 28, height: 28 };
      marker.hidden = !projected || x < 16 || x > frame.width - 16 || y < 16 || y > frame.height - 16 || overlaps(anchor, closeRect);
      if (marker.hidden) continue;
      marker.style.left = `${x}px`; marker.style.top = `${y}px`; text.hidden = false;
      visible.push({ ...annotation, id: point.unique_instance, x, y, width: text.offsetWidth, height: text.offsetHeight });
    }
    const layout = layoutPanoramaLabels(visible, frame.width, frame.height, reserved);
    for (const item of visible) {
      const rect = layout.get(item.id);
      item.text.hidden = item.link.hidden = !rect;
      if (!rect) continue;
      item.text.style.left = `${rect.left - item.x + 14}px`;
      item.text.style.top = `${rect.top - item.y + 14}px`;
      const endX = clamp(item.x, rect.left, rect.left + rect.width);
      const endY = clamp(item.y, rect.top, rect.top + rect.height);
      item.link.style.width = `${Math.hypot(endX - item.x, endY - item.y)}px`;
      item.link.style.transform = `rotate(${Math.atan2(endY - item.y, endX - item.x)}rad)`;
    }
  }

  dispose() {
    if (this.destroyed) return;
    this.close(); this.destroyed = true; ++this.requestId; this.abort?.abort();
    cancelAnimationFrame(this.frame); this.resizeObserver.disconnect();
    for (const cleanup of this.cleanups) cleanup();
    this.releaseTexture();
    if (this.gl && !this.lost) { if (this.buffer) this.gl.deleteBuffer(this.buffer); if (this.program) this.gl.deleteProgram(this.program); }
    this.dialog.remove(); this.captures = []; this.annotations = []; this.cleanups = [];
  }
}
