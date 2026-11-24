/** Image evidence derived from the same rendered panorama and physical asset. */
export class EvidenceViewer {
  constructor({ host, items, onClose, onOpenPanorama, lang = 'en' }) {
    this.host = host;
    this.items = new Map(items.map(item => [item.id, item]));
    this.onClose = onClose;
    this.onOpenPanorama = onOpenPanorama;
    this.lang = lang;
    this.sequence = 0;
    this.active = false;
    this.abort = new AbortController();
    this.labels = lang === 'zh'
      ? { evidence: '隱患影像', floor: '樓層', close: '關閉隱患影像', loading: '正在載入影像…', error: '未能載入影像。', retry: '重試', panorama: '查看 360° 全景', scene: '返回', demo: '模擬巡檢影像' }
      : { evidence: 'Inspection evidence', floor: 'Floor', close: 'Close evidence', loading: 'Loading evidence…', error: 'The image could not load.', retry: 'Try again', panorama: 'Open 360° view', scene: 'Back', demo: 'Simulated inspection' };
    const el = this.dialog = document.createElement('dialog');
    el.className = 'si-evidence';
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', this.labels.evidence);
    el.innerHTML = `
      <div class="si-evidence-stage">
        <figure class="si-evidence-frame">
          <img class="si-evidence-image" decoding="async" draggable="false" alt="">
          <div class="si-evidence-box" hidden><span></span></div>
        </figure>
      </div>
      <header class="si-evidence-header">
        <div><span class="si-evidence-kicker"></span><h2 class="si-evidence-title"></h2></div>
        <button type="button" class="si-evidence-button si-evidence-close" aria-label="${this.labels.close}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>
        </button>
      </header>
      <div class="si-evidence-status" role="status" aria-live="polite"><span class="si-evidence-spinner" aria-hidden="true"></span><p></p><button type="button" class="si-evidence-button si-evidence-retry" hidden>${this.labels.retry}</button></div>
      <footer class="si-evidence-footer">
        <span class="si-evidence-location"></span>
        <div class="si-evidence-actions">
          <button type="button" class="si-evidence-button si-evidence-back">${this.labels.scene}</button>
          <button type="button" class="si-evidence-button si-evidence-panorama">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="10" r="6"/><path d="M2 15c0 3 4.5 5 10 5s10-2 10-5M2 15l1 4M2 15l4 1M9 7l-2 3 2 3M15 7l2 3-2 3"/></svg>
            <span>${this.labels.panorama}</span>
          </button>
        </div>
      </footer>`;
    host.append(el);
    this.image = el.querySelector('.si-evidence-image');
    this.box = el.querySelector('.si-evidence-box');
    this.status = el.querySelector('.si-evidence-status');
    this.closeButton = el.querySelector('.si-evidence-close');
    this.retryButton = el.querySelector('.si-evidence-retry');
    this.panoButton = el.querySelector('.si-evidence-panorama');
    const listen = (target, type, callback) => target.addEventListener(type, callback, { signal: this.abort.signal });
    listen(this.closeButton, 'click', () => this.close());
    listen(el.querySelector('.si-evidence-back'), 'click', () => this.close());
    listen(this.retryButton, 'click', () => this.load(true));
    listen(this.panoButton, 'click', () => {
      const item = this.current;
      const trigger = this.trigger;
      this.close();
      if (item) this.onOpenPanorama?.(item.captureId, trigger);
    });
    listen(el, 'cancel', event => { event.preventDefault(); this.close(); });
    listen(el, 'close', () => { if (this.active) this.close(); });
    listen(el, 'keydown', event => {
      event.stopPropagation();
      if (event.key === 'Escape') { event.preventDefault(); this.close(); }
      if (event.key !== 'Tab') return;
      const buttons = [...el.querySelectorAll('button:not([disabled])')].filter(button => !button.hidden && button.getClientRects().length);
      const first = buttons[0], last = buttons.at(-1);
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || !el.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !el.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    });
    // Keep map wheel/pointer handlers from seeing evidence interactions.
    for (const type of ['pointerdown', 'pointermove', 'pointerup', 'wheel']) listen(el, type, event => event.stopPropagation());
  }

  open(id, trigger = document.activeElement) {
    const item = this.items.get(id);
    if (!item) return false;
    this.current = item;
    if (!this.active) this.trigger = trigger;
    this.active = true;
    const title = this.lang === 'zh' ? item.titleZh || item.title : item.title;
    this.dialog.querySelector('.si-evidence-title').textContent = title;
    this.dialog.querySelector('.si-evidence-kicker').textContent = this.labels.evidence;
    this.dialog.querySelector('.si-evidence-location').textContent = `${this.labels.floor} ${String(item.floor).padStart(2, '0')} · ${this.labels.demo}`;
    this.dialog.setAttribute('aria-label', `${title} · ${this.labels.evidence}`);
    this.image.alt = `${title} · ${this.labels.floor} ${item.floor}`;
    this.box.querySelector('span').textContent = title;
    this.box.dataset.kind = item.kind;
    const { left, top, width, height } = item.bbox;
    Object.assign(this.box.style, { left: `${left * 100}%`, top: `${top * 100}%`, width: `${width * 100}%`, height: `${height * 100}%` });
    if (!this.dialog.open) this.dialog.showModal();
    this.closeButton.focus({ preventScroll: true });
    this.load();
    return true;
  }

  load(retry = false) {
    const item = this.current;
    if (!item || !this.active) return;
    const sequence = ++this.sequence;
    this.status.hidden = false;
    this.status.classList.remove('is-error');
    this.status.querySelector('p').textContent = this.labels.loading;
    this.retryButton.hidden = true;
    this.image.classList.add('is-loading');
    this.image.removeAttribute('src');
    this.box.hidden = true;
    const request = new Image();
    request.decoding = 'async';
    request.onload = async () => {
      try { await request.decode(); } catch { /* onload confirms a decoded browser image */ }
      if (sequence !== this.sequence || !this.active) return;
      this.image.src = request.src;
      this.image.classList.remove('is-loading');
      this.box.hidden = false;
      this.status.hidden = true;
      request.onload = request.onerror = null;
    };
    request.onerror = () => {
      if (sequence !== this.sequence || !this.active) return;
      this.status.classList.add('is-error');
      this.status.querySelector('p').textContent = this.labels.error;
      this.retryButton.hidden = false;
      request.onload = request.onerror = null;
    };
    const url = new URL(item.image, import.meta.url);
    url.searchParams.set('revision', item.sourceSha256?.slice(0, 12) || 'v02');
    if (retry) url.searchParams.set('retry', Date.now().toString());
    request.src = url.href;
  }

  close() {
    if (!this.active) return;
    this.active = false;
    this.sequence++;
    if (this.dialog.open) this.dialog.close();
    this.image.removeAttribute('src');
    const trigger = this.trigger;
    this.current = null;
    this.onClose?.();
    if (trigger?.isConnected && !trigger.closest('[inert]')) trigger.focus({ preventScroll: true });
  }

  dispose() {
    this.close();
    this.abort.abort();
    this.dialog.remove();
    this.items.clear();
  }
}
