/* Treasure Hunt World: shared helpers for /play, /build and /host. */
(function () {
  const cfg = window.TH_CONFIG || {};
  const ID_RE = /^[A-Za-z0-9_-]{20,150}$/;

  /* ---------- themes ---------- */
  const THEMES = {
    bubblegum: { label: 'Bubblegum', blurb: 'Pink, banana-bright, sticker cards.', mode: 'light',
      bg: '#FFC9DF', card: '#FFFFFF', tint: '#FFF4F9', line: '#22101F', text: '#22101F', dim: '#5A3F55',
      accent: '#FF4F9A', accent2: '#FFD93B', onAccent: '#22101F', ok: '#1E9E5A', bad: '#E5484D', badBg: '#FFE1E1',
      display: "'Lilita One', 'Arial Rounded MT Bold', sans-serif", body: "'Space Grotesk', system-ui, sans-serif", mono: "'DM Mono', ui-monospace, monospace",
      bw: '3px', radius: '20px', shadow: '5px 5px 0 #22101F', shadowSm: '4px 4px 0 #22101F', upper: 'none' },
    poster: { label: 'Night Poster', blurb: 'London Fields after dark. Nettles, moon, crocodiles.', mode: 'dark',
      bg: '#0C1510', card: '#13241A', tint: '#0C1510', line: '#2F5A3B', text: '#EDE6D6', dim: '#C9C2B0',
      accent: '#FF8FC7', accent2: '#F5D63D', onAccent: '#0C1510', ok: '#7FC48E', bad: '#FF7A7A', badBg: '#2A1416',
      display: "'Bagel Fat One', 'Arial Rounded MT Bold', sans-serif", body: "'Fraunces', Georgia, serif", mono: "'IBM Plex Mono', ui-monospace, monospace",
      bw: '1.5px', radius: '22px', shadow: '0 18px 40px -20px rgba(0,0,0,.8)', shadowSm: 'none', upper: 'none' },
    noir: { label: 'Found Footage', blurb: 'Camcorder black, subtitle yellow, REC red.', mode: 'dark',
      bg: '#0B0B0C', card: '#141416', tint: '#0B0B0C', line: '#F4F1EA', text: '#F4F1EA', dim: '#B5B0A6',
      accent: '#E5322B', accent2: '#FFE14D', onAccent: '#FFFFFF', ok: '#7CFF9B', bad: '#FF6B6B', badBg: '#2A1111',
      display: "'Anton', Impact, sans-serif", body: "'IBM Plex Mono', ui-monospace, monospace", mono: "'IBM Plex Mono', ui-monospace, monospace",
      bw: '2px', radius: '0px', shadow: 'none', shadowSm: 'none', upper: 'uppercase' },
    neon: { label: 'Afterparty', blurb: 'Purple haze, pink glow, gradient buttons.', mode: 'dark',
      bg: '#0D0B14', card: '#1E1929', tint: '#15111E', line: '#332A44', text: '#F2EEFB', dim: '#A89FC2',
      accent: '#FF5FA2', accent2: '#7C5CFF', onAccent: '#FFFFFF', ok: '#4ADE80', bad: '#FB7185', badBg: '#2A1520',
      display: "'Space Grotesk', system-ui, sans-serif", body: "'Space Grotesk', system-ui, sans-serif", mono: "'JetBrains Mono', ui-monospace, monospace",
      bw: '1px', radius: '22px', shadow: '0 18px 40px -18px rgba(0,0,0,.7)', shadowSm: 'none', upper: 'none' },
    meadow: { label: 'Picnic', blurb: 'Daylight, park greens, marigold.', mode: 'light',
      bg: '#F4EFE3', card: '#FFFDF7', tint: '#F4EFE3', line: '#2E4A2E', text: '#1E2B1E', dim: '#5B6B57',
      accent: '#2E7D4F', accent2: '#F2B53A', onAccent: '#FFFFFF', ok: '#2E7D4F', bad: '#C0392B', badBg: '#FBE3DF',
      display: "'Fraunces', Georgia, serif", body: "'Space Grotesk', system-ui, sans-serif", mono: "'IBM Plex Mono', ui-monospace, monospace",
      bw: '2px', radius: '18px', shadow: '0 12px 28px -18px rgba(30,43,30,.5)', shadowSm: 'none', upper: 'none' }
  };

  function applyTheme(name) {
    const t = THEMES[name] || THEMES.bubblegum;
    const r = document.documentElement.style;
    ['bg', 'card', 'tint', 'line', 'text', 'dim', 'accent', 'accent2', 'onAccent', 'ok', 'bad', 'badBg', 'display', 'body', 'mono', 'bw', 'radius', 'shadow', 'shadowSm', 'upper']
      .forEach(function (k) { r.setProperty('--' + k, t[k]); });
    document.documentElement.dataset.mode = t.mode;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t.bg);
    return t;
  }

  /* ---------- API ----------
   * A hunt reference is { kind: 'cloud', id } for hunts on the shared engine (short ids, ?h=)
   * or { kind: 'gas', id } for hunts in someone's own Google account (long ids, ?g=).
   * Every API function accepts either a reference or a bare id string. */
  function ref(x) {
    if (x && typeof x === 'object') return x.kind ? x : ref(x.id);
    const id = String(x || '');
    return /^[a-z0-9]{6,12}$/.test(id) ? { kind: 'cloud', id: id } : { kind: 'gas', id: id };
  }
  function endpoint(r) {
    r = ref(r);
    if (r.kind === 'cloud') {
      if (!cfg.API || cfg.API.indexOf('PASTE_') === 0) throw new Error('The hunt engine is not connected yet (API missing in app/config.js).');
      return { url: cfg.API.replace(/\/$/, '') + '/api', extra: { h: r.id } };
    }
    return { url: apiUrl(r.id), extra: {} };
  }
  function apiUrl(id) {
    if (!ID_RE.test(String(id || ''))) throw new Error('This hunt link looks broken. Ask your host for a fresh one.');
    return 'https://script.google.com/macros/s/' + id + '/exec';
  }
  function idFromUrl(u) {
    const s = String(u || '').trim();
    const m = s.match(/\/macros\/s\/([A-Za-z0-9_-]+)\/exec/);
    if (m) return m[1];
    return ID_RE.test(s) ? s : null;
  }
  async function parse(res) {
    let data;
    try { data = await res.json(); } catch (e) {
      throw new Error("The hunt server didn't answer properly. Check it's deployed with access set to Anyone.");
    }
    if (!data.ok) throw new Error(data.error || 'Something went wrong.');
    return data;
  }
  async function get(r, action, params) {
    const ep = endpoint(r);
    const url = new URL(ep.url);
    url.searchParams.set('action', action);
    Object.keys(Object.assign({}, ep.extra, params)).forEach(function (k) { url.searchParams.set(k, Object.assign({}, ep.extra, params)[k]); });
    url.searchParams.set('_', Date.now());
    return parse(await fetch(url.toString(), { cache: 'no-store' }));
  }
  async function post(r, action, params) {
    const ep = endpoint(r);
    const all = Object.assign({ action: action }, ep.extra, params || {});
    let body;
    if (all.file instanceof Blob) {
      body = new FormData();
      Object.keys(all).forEach(function (k) { if (k !== 'file') body.append(k, all[k]); });
      body.append('file', all.file, all.fileName || 'upload');
    } else {
      body = new URLSearchParams(all);
    }
    return parse(await fetch(ep.url, { method: 'POST', body: body }));
  }

  /* ---------- storage ---------- */
  function lsGet(k, fallback) { try { const v = localStorage.getItem(k); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }

  /* ---------- links + QR ---------- */
  function site() { return (cfg.SITE || location.origin).replace(/\/$/, ''); }
  function playUrl(r, token) {
    r = ref(r);
    return site() + '/play/?' + (r.kind === 'cloud' ? 'h=' : 'g=') + encodeURIComponent(r.id) + (token ? '&c=' + encodeURIComponent(token) : '');
  }
  function hostLink(r, key) { r = ref(r); return site() + '/host/#h=' + r.id + '.' + key; }
  function qrSvg(text, cell) {
    if (!window.qrcode) return '';
    const q = window.qrcode(0, 'M');
    q.addData(text);
    q.make();
    return q.createSvgTag({ cellSize: cell || 4, margin: 2, scalable: true });
  }
  function templateCopyUrl() {
    return cfg.TEMPLATE_ID && cfg.TEMPLATE_ID.indexOf('PASTE_') !== 0
      ? 'https://docs.google.com/spreadsheets/d/' + cfg.TEMPLATE_ID + '/copy' : '';
  }

  /* ---------- DOM ---------- */
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      const v = attrs[k];
      if (v === false || v == null) return;
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k.indexOf('on') === 0) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? '' : v);
    });
    (children || []).forEach(function (c) { if (c) node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return node;
  }

  function renderDots(container, index, total, finished) {
    container.innerHTML = '';
    for (let i = 0; i < total; i++) {
      let cls = 'dot';
      if (finished || i < index) cls += ' done';
      else if (i === index) cls += ' current';
      if (i === total - 1) cls += ' final';
      container.appendChild(el('span', { class: cls }));
    }
    container.setAttribute('aria-label', (finished ? total : index) + ' of ' + total + ' stops cleared');
  }

  function fmtClock(ms) {
    if (ms == null || isNaN(ms)) return '0:00:00';
    const t = Math.max(0, Math.floor(ms / 1000));
    return Math.floor(t / 3600) + ':' + String(Math.floor((t % 3600) / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
  }
  let clockTimer = null;
  function runClock(node, startIso, serverNowIso) {
    clearInterval(clockTimer);
    if (!startIso) { node.textContent = '0:00:00'; return; }
    const skew = serverNowIso ? new Date(serverNowIso).getTime() - Date.now() : 0;
    const start = new Date(startIso).getTime();
    const tick = function () { node.textContent = fmtClock(Date.now() + skew - start); };
    tick();
    clockTimer = setInterval(tick, 1000);
  }
  function ordinal(n) { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }

  /* ---------- uploads ---------- */
  function readAsBase64(blob) {
    return new Promise(function (resolve, reject) {
      const r = new FileReader();
      r.onload = function () { resolve(String(r.result).split(',')[1] || ''); };
      r.onerror = function () { reject(new Error('Could not read that file.')); };
      r.readAsDataURL(blob);
    });
  }
  function compressImage(file) {
    return new Promise(function (resolve) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      const fallback = function () { URL.revokeObjectURL(url); resolve({ blob: file, type: file.type, name: file.name }); };
      img.onload = function () {
        try {
          const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
          const c = document.createElement('canvas');
          c.width = Math.round(img.naturalWidth * scale); c.height = Math.round(img.naturalHeight * scale);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          c.toBlob(function (b) {
            URL.revokeObjectURL(url);
            resolve(b && b.size < file.size ? { blob: b, type: 'image/jpeg', name: 'photo.jpg' } : { blob: file, type: file.type, name: file.name });
          }, 'image/jpeg', 0.82);
        } catch (e) { fallback(); }
      };
      img.onerror = fallback;
      img.src = url;
    });
  }
  async function prepareUpload(file, kind, r) {
    const maxMb = cfg.MAX_UPLOAD_MB || 30;
    let out = { blob: file, type: file.type || '', name: file.name || 'upload' };
    if (kind === 'video' && !/^video\//.test(out.type)) throw new Error('This one needs a video.');
    if (kind !== 'video' && !/^image\//.test(out.type)) throw new Error('This one needs a photo.');
    if (/^image\//.test(out.type)) out = await compressImage(file);
    if (out.blob.size > maxMb * 1048576) {
      throw new Error('That file is ' + Math.round(out.blob.size / 1048576) + 'MB; the limit is ' + maxMb + 'MB. Record something shorter.');
    }
    if (ref(r).kind === 'cloud') return { file: out.blob, mimeType: out.type, fileName: out.name };
    return { mimeType: out.type, fileName: out.name, data: await readAsBase64(out.blob) };
  }

  window.TH = {
    cfg: cfg, THEMES: THEMES, applyTheme: applyTheme,
    ref: ref, apiUrl: apiUrl, idFromUrl: idFromUrl, get: get, post: post, hostLink: hostLink,
    lsGet: lsGet, lsSet: lsSet, lsDel: lsDel,
    site: site, playUrl: playUrl, qrSvg: qrSvg, templateCopyUrl: templateCopyUrl,
    el: el, renderDots: renderDots, fmtClock: fmtClock, runClock: runClock, ordinal: ordinal,
    prepareUpload: prepareUpload
  };
})();
