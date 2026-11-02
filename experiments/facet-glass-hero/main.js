// Facet — "Designed in glass" hero.
// A dark page shattered into thick smoked-glass shards. All content is drawn in code.

const DEG = Math.PI / 180;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const easeInCubic = (t) => t * t * t;
const easeOutBack = (t) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const $ = (id) => document.getElementById(id);
const FONT = '"Inter", system-ui, sans-serif';
const BASELINE = 0.864; // Inter: distance from top of a line-height:1 box to the baseline, in em.

// ---------------------------------------------------------------------------
// Layout (shared by the glass, the printed canvases and the DOM text layer)
// ---------------------------------------------------------------------------

function computeLayout() {
  const W = innerWidth, H = innerHeight;
  const portrait = H > W * 1.05;
  const phone = Math.min(W, H) < 600;
  const mx = phone ? 16 : 0.055 * W;
  const my = phone ? 16 : 0.085 * H;
  const bw = W - 2 * mx, bh = H - 2 * my;
  const S = bw / 1730;
  const Sg = Math.max(S, 0.42); // geometry scale (kept legible on phones)
  const navH = 0.108 * bh;
  const gap = 14;
  const nav = { x: mx, y: my, w: bw, h: navH };
  const panel = { x: mx, y: my + navH + gap, w: bw, h: bh - navH - gap };
  const T = portrait ? clamp(panel.w / 430, 0.62, 1.15) : Math.max(S, 0.6); // type scale
  return { W, H, portrait, phone, S, Sg, T, nav, panel };
}

let measureCtx;
function setFont(ctx, it) {
  ctx.font = `${it.weight} ${it.size}px ${FONT}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${(it.track || 0) * it.size}px`;
}
function measure(it, text = it.text) {
  measureCtx ||= document.createElement('canvas').getContext('2d');
  setFont(measureCtx, it);
  let w = measureCtx.measureText(text).width;
  if (!('letterSpacing' in measureCtx)) w += (it.track || 0) * it.size * text.length;
  return w;
}
function wrapText(it, text, maxW) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? cur + ' ' + w : w;
    if (cur && measure(it, next) > maxW) { lines.push(cur); cur = w; } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

const SUB_LINES = ['Author dispersion, transmission, and refraction in the browser. Live', 'previews, real materials.'];

function panelItems(L) {
  const { panel: P, portrait, T } = L;
  const pw = P.w, ph = P.h;
  const pad = portrait ? 0.07 * pw : 0.047 * pw;
  const items = {};
  const eyeY = portrait ? 0.075 * ph : 0.135 * ph;
  items.eyebrow = { text: 'REAL-TIME MATERIAL STUDIO', x: pad, y: eyeY, size: 11 * T, weight: 500, track: 0.2, color: 'rgba(255,255,255,.38)' };
  const hs = portrait ? Math.min(0.17 * pw, 0.085 * ph) : Math.min(0.078 * pw, 0.2 * ph);
  const b1 = eyeY + 26 * T + 0.73 * hs;
  const b2 = b1 + 0.97 * hs;
  items.h1a = { text: 'Designed', x: pad - 0.04 * hs, y: b1, size: hs, weight: 500, track: -0.045, grad: [b1 - 0.76 * hs, b2 + 0.22 * hs] };
  items.h1b = { text: 'in glass.', x: pad - 0.04 * hs, y: b2, size: hs, weight: 500, track: -0.045, grad: items.h1a.grad };
  const ss = portrait ? 15 * T : 18 * T;
  const sub = { size: ss, weight: 400, track: -0.005, color: 'rgba(255,255,255,.55)' };
  let lines = SUB_LINES;
  const maxW = pw - 2 * pad;
  if (SUB_LINES.some((l) => measure(sub, l) > maxW)) lines = wrapText(sub, SUB_LINES.join(' '), maxW);
  const sb = b2 + 0.28 * hs + 26 * T + ss * 0.8;
  items.sub = lines.map((text, i) => ({ ...sub, text, x: pad, y: sb + i * ss * 1.5 }));
  const lastSub = sb + (lines.length - 1) * ss * 1.5;
  const pillY = lastSub + ss * 0.4 + 30 * T;
  const bs = 13 * T;
  items.pill = { x: pad, y: pillY, w: 116 * T, h: 40 * T, r: 6 * T, text: 'Open studio', size: bs, weight: 500, track: -0.005 };
  items.read = { text: 'Read paper →', x: pad + 116 * T + 26 * T, y: pillY + 20 * T + 0.364 * bs, size: bs, weight: 500, track: -0.005 };
  const fy = ph - (portrait ? 22 : 30) * T;
  items.copy = { text: '© Facet Lab', x: pad, y: fy, size: 11 * T, weight: 400, track: 0.01, color: 'rgba(255,255,255,.34)' };
  const khr = { text: 'KHR_materials_dispersion', y: fy, size: 11 * T, weight: 400, track: 0.01, color: 'rgba(255,255,255,.34)' };
  khr.x = pw - pad - measure(khr);
  items.khr = khr;
  return items;
}

function navItems(L) {
  const { nav: N, T, phone, portrait } = L;
  const pad = 32 * T;
  const cy = N.h / 2;
  const items = {};
  const ms = 18 * T;
  items.mark = { x: pad, y: cy - ms / 2, w: ms, h: ms };
  const brand = { text: 'Facet', size: 19 * T, weight: 600, track: -0.01 };
  items.brand = { ...brand, x: pad + ms + 11 * T, y: cy + 0.364 * brand.size };
  const ls = 14.5 * T;
  const link = { size: ls, weight: 450, track: 0 };
  const names = ['Studio', 'Materials', 'Pricing'];
  const gap = 38 * T;
  const ws = names.map((n) => measure(link, n));
  const total = ws.reduce((a, b) => a + b, 0) + gap * (names.length - 1);
  let x = N.w / 2 - total / 2;
  items.links = names.map((text, i) => {
    const it = { ...link, text, x, y: cy + 0.364 * ls };
    x += ws[i] + gap;
    return it;
  });
  items.showLinks = !(phone || portrait);
  const si = { text: 'Sign in', size: ls, weight: 500, track: 0 };
  si.x = N.w - pad - measure(si);
  si.y = cy + 0.364 * ls;
  items.signin = si;
  return items;
}

// Position the transparent DOM copy so it lines up with the printed text.
function placeText(el, it) {
  const s = el.style;
  s.left = `${it.x}px`;
  s.top = `${it.y - BASELINE * it.size}px`;
  s.fontSize = `${it.size}px`;
  s.fontWeight = it.weight;
  s.letterSpacing = `${it.track || 0}em`;
}

function placeDom(L, NI, PI) {
  const nav = $('navLayer'), panel = $('panelLayer');
  nav.style.width = `${L.nav.w}px`; nav.style.height = `${L.nav.h}px`;
  panel.style.width = `${L.panel.w}px`; panel.style.height = `${L.panel.h}px`;
  placeText($('brand'), NI.brand);
  NI.links.forEach((it, i) => { placeText($(`nl${i}`), it); $(`nl${i}`).style.display = NI.showLinks ? '' : 'none'; });
  placeText($('signin'), NI.signin);
  for (const k of ['eyebrow', 'h1a', 'h1b', 'read', 'copy', 'khr']) placeText($(k), PI[k]);
  const sub = $('sub');
  sub.textContent = '';
  PI.sub.forEach((it, i) => {
    const span = document.createElement('span');
    span.className = 't sl';
    span.textContent = it.text;
    placeText(span, it);
    if (i) sub.append(' ');
    sub.append(span);
  });
  const pill = $('pill'), p = PI.pill;
  Object.assign(pill.style, {
    left: `${p.x}px`, top: `${p.y}px`, width: `${p.w}px`, height: `${p.h}px`,
    borderRadius: `${p.r}px`, fontSize: `${p.size}px`, fontWeight: p.weight, letterSpacing: `${p.track}em`,
  });
}

// ---------------------------------------------------------------------------
// Printed content: canvases for the panel and the nav slab
// ---------------------------------------------------------------------------

const hover = new Set();

function fillText(ctx, it, text = it.text, x = it.x, y = it.y) {
  setFont(ctx, it);
  if ('letterSpacing' in ctx || !it.track) { ctx.fillText(text, x, y); return; }
  for (const ch of text) { ctx.fillText(ch, x, y); x += ctx.measureText(ch).width + it.track * it.size; }
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

function drawPanel(ctx, L, PI, dpr) {
  const { w, h } = L.panel;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = PI.eyebrow.color; fillText(ctx, PI.eyebrow);
  const [g0, g1] = PI.h1a.grad;
  const grad = ctx.createLinearGradient(0, g0, 0, g1);
  grad.addColorStop(0, '#dcdce0'); grad.addColorStop(1, '#bdbdc3');
  ctx.fillStyle = grad; fillText(ctx, PI.h1a); fillText(ctx, PI.h1b);
  for (const it of PI.sub) { ctx.fillStyle = it.color; fillText(ctx, it); }
  const p = PI.pill;
  roundRect(ctx, p.x, p.y, p.w, p.h, p.r);
  ctx.fillStyle = hover.has('pill') ? '#36d67e' : '#e8e8eb';
  ctx.fill();
  ctx.fillStyle = '#0a0a0c';
  const lw = measure(p);
  fillText(ctx, p, p.text, p.x + (p.w - lw) / 2, p.y + p.h / 2 + 0.364 * p.size);
  const r = PI.read, rh = hover.has('read');
  ctx.fillStyle = rh ? '#ffffff' : 'rgba(255,255,255,.82)';
  fillText(ctx, r);
  if (rh) ctx.fillRect(r.x, r.y + 0.28 * r.size, measure(r) - (r.track || 0) * r.size, Math.max(1, 0.08 * r.size));
  ctx.fillStyle = PI.copy.color; fillText(ctx, PI.copy); fillText(ctx, PI.khr);
}

function drawNav(ctx, L, NI, dpr) {
  const { w, h } = L.nav;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const m = NI.mark;
  // A plain square mark split by one diagonal facet.
  roundRect(ctx, m.x, m.y, m.w, m.h, m.w * 0.18);
  ctx.fillStyle = '#efeff2'; ctx.fill();
  ctx.save(); ctx.clip();
  ctx.beginPath(); ctx.moveTo(m.x + m.w, m.y); ctx.lineTo(m.x + m.w, m.y + m.h); ctx.lineTo(m.x, m.y + m.h); ctx.closePath();
  ctx.fillStyle = '#a6a6b0'; ctx.fill();
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,.93)'; fillText(ctx, NI.brand);
  if (NI.showLinks) NI.links.forEach((it, i) => {
    ctx.fillStyle = hover.has(`nl${i}`) ? 'rgba(255,255,255,.96)' : 'rgba(255,255,255,.6)';
    fillText(ctx, it);
  });
  ctx.fillStyle = hover.has('signin') ? '#ffffff' : 'rgba(255,255,255,.86)';
  fillText(ctx, NI.signin);
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && c.getContext('webgl2'));
  } catch { return false; }
}

async function boot() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !webglAvailable()) return; // static styled HTML version
  const root = document.documentElement;
  root.classList.add('booting');
  let THREE, RoomEnvironment;
  try {
    THREE = await import('three');
    ({ RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js'));
    await Promise.all([400, 500, 600, 650].map((w) => document.fonts.load(`${w} 20px Inter`)));
  } catch (err) {
    console.warn('Facet: falling back to the static page', err);
    root.classList.remove('booting');
    return;
  }
  try {
    startGL(THREE, RoomEnvironment);
  } catch (err) {
    console.warn('Facet: WebGL start failed, falling back to the static page', err);
    root.classList.remove('gl');
  }
  root.classList.remove('booting');
}

// ---------------------------------------------------------------------------
// Glass
// ---------------------------------------------------------------------------

// Cut pattern, panel-normalised (x right, y down), landscape orientation.
const BASE = {
  TL: [0, 0], TR: [1, 0], BR: [1, 1], BL: [0, 1],
  tAB: [0.22, 0], tBC: [0.515, 0], tCE: [0.84, 0],
  bAD: [0.34, 1], bDE: [0.865, 1],
  J0: [0.385, 0.72], J1: [0.48, 0.62], J2: [0.716, 0.49],
};
const MOVERS = { tAB: 'x', tBC: 'x', tCE: 'x', bAD: 'x', bDE: 'x', J0: 'xy', J1: 'xy', J2: 'xy' };
const CELLS = [
  ['TL', 'tAB', 'J0', 'bAD', 'BL'], // A (hero)
  ['tAB', 'tBC', 'J1', 'J0'], // B
  ['tBC', 'tCE', 'J2', 'J1'], // C
  ['J0', 'J1', 'J2', 'bDE', 'bAD'], // D
  ['tCE', 'TR', 'BR', 'bDE', 'J2'], // E
];
const FLY_ORDER = ['nav', 0, 1, 3, 2, 4];

function signedArea(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
}
function insetPolygon(pts, d) {
  const n = pts.length;
  const sgn = signedArea(pts) > 0 ? 1 : -1; // CCW => inward normal is the left normal
  const lines = [];
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n];
    let dx = q.x - p.x, dy = q.y - p.y;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;
    const nx = -dy * sgn, ny = dx * sgn;
    lines.push({ px: p.x + nx * d, py: p.y + ny * d, dx, dy });
  }
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = lines[(i - 1 + n) % n], b = lines[i];
    const den = a.dx * b.dy - a.dy * b.dx;
    if (Math.abs(den) < 1e-6) { out.push({ x: b.px, y: b.py }); continue; }
    const t = ((b.px - a.px) * b.dy - (b.py - a.py) * b.dx) / den;
    out.push({ x: a.px + a.dx * t, y: a.py + a.dy * t });
  }
  return out;
}
function roundedShape(THREE, pts, r) {
  const shape = new THREE.Shape();
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const p = pts[i], a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
    let ax = a.x - p.x, ay = a.y - p.y, bx = b.x - p.x, by = b.y - p.y;
    const la = Math.hypot(ax, ay), lb = Math.hypot(bx, by);
    ax /= la; ay /= la; bx /= lb; by /= lb;
    const ang = Math.acos(clamp(ax * bx + ay * by, -1, 1));
    const t = Math.min(r / Math.tan(ang / 2), 0.45 * la, 0.45 * lb);
    const p1x = p.x + ax * t, p1y = p.y + ay * t, p2x = p.x + bx * t, p2y = p.y + by * t;
    if (i === 0) shape.moveTo(p1x, p1y); else shape.lineTo(p1x, p1y);
    shape.quadraticCurveTo(p.x, p.y, p2x, p2y);
  }
  shape.closePath();
  return shape;
}
function pointInPolygon(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i], b = pts[j];
    if ((a.y > y) !== (b.y > y) && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

function startGL(THREE, RoomEnvironment) {
  const canvas = $('gl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  document.documentElement.classList.add('gl');
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x050507, 1);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050507);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.42;
  const key = new THREE.DirectionalLight(0xe6edff, 1.5);
  key.position.set(-0.75, 0.9, 0.85);
  scene.add(key);

  const camera = new THREE.PerspectiveCamera(30, 1, 10, 10000);
  const slab = new THREE.Group();
  scene.add(slab);
  slab.rotation.set(0.8 * DEG, -1.2 * DEG, 0);

  // Shared cursor-glow uniforms, injected into the glass shader.
  const glowU = {
    uPointer: { value: new THREE.Vector3(0, 0, 0) },
    uGlow: { value: 0 },
    uGlowR: { value: 300 },
  };
  function glassMaterial({ glow = true, iridescence = 0.55 } = {}) {
    const m = new THREE.MeshPhysicalMaterial({
      color: 0x17171b,
      roughness: 0.36,
      metalness: 0,
      clearcoat: 0.7,
      clearcoatRoughness: 0.12,
      specularIntensity: 0.7,
      iridescence,
      iridescenceIOR: 1.3,
      iridescenceThicknessRange: [250, 650],
      envMapIntensity: 1,
    });
    if (glow) {
      m.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, glowU);
        sh.vertexShader = 'varying vec3 vFacetWorld;\n' + sh.vertexShader.replace(
          '#include <project_vertex>',
          '#include <project_vertex>\n  vFacetWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;',
        );
        sh.fragmentShader = 'uniform vec3 uPointer;\nuniform float uGlow;\nuniform float uGlowR;\nvarying vec3 vFacetWorld;\n' +
          sh.fragmentShader.replace(
            '#include <emissivemap_fragment>',
            `#include <emissivemap_fragment>
  {
    float gd = distance(vFacetWorld, uPointer) / uGlowR;
    totalEmissiveRadiance += vec3(0.42, 0.37, 0.62) * 0.16 * uGlow * exp(-1.6 * gd * gd);
  }`,
          );
      };
      m.customProgramCacheKey = () => 'facet-glass-glow';
    }
    return m;
  }

  // Printed-content textures.
  const panelCanvas = document.createElement('canvas');
  const navCanvas = document.createElement('canvas');
  const panelCtx = panelCanvas.getContext('2d');
  const navCtx = navCanvas.getContext('2d');
  const makeTex = (c) => {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  };
  const panelTex = makeTex(panelCanvas);
  const navTex = makeTex(navCanvas);
  const printMat = (map) => new THREE.MeshBasicMaterial({
    map, transparent: true, depthWrite: false, toneMapped: false,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  });

  // Pieces: nav slab + five cells.
  const rand = mulberry32(7);
  function makePiece(kind, idx) {
    const g = new THREE.Group();
    const mat = glassMaterial();
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), mat);
    const print = new THREE.Mesh(new THREE.BufferGeometry(), printMat(kind === 'nav' ? navTex : panelTex));
    print.renderOrder = 2;
    g.add(mesh, print);
    slab.add(g);
    const axis = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize();
    return {
      kind, idx, g, mesh, print, mat,
      anchor: new THREE.Vector2(), hw: 1, hh: 1,
      poly: [],
      lift: 0, liftV: 0, tx: 0, txV: 0, ty: 0, tyV: 0, hv: 0,
      fly: { dir: new THREE.Vector3(), axis, spin: 2.0 + rand() * 1.6, out: rand(), vz: 420 + rand() * 380, down: rand() },
      delay: 0,
    };
  }
  const navPiece = makePiece('nav', -1);
  const cells = CELLS.map((_, i) => makePiece('cell', i));
  const pieces = [navPiece, ...cells];
  FLY_ORDER.forEach((k, order) => {
    const p = k === 'nav' ? navPiece : cells[k];
    p.delay = order * 0.03;
  });
  const maxDelay = (FLY_ORDER.length - 1) * 0.03;

  // Drift parameters: every moving point on its own slow sine.
  const drift = {};
  for (const k of Object.keys(MOVERS)) {
    drift[k] = {
      px: 10 + rand() * 10, fx: rand() * Math.PI * 2,
      py: 10 + rand() * 10, fy: rand() * Math.PI * 2,
    };
  }

  // Back sliver.
  const sliver = {
    g: new THREE.Group(),
    mat: glassMaterial({ glow: false, iridescence: 0.35 }),
    mesh: null, scale: 0, state: 'hidden', t0: 0,
    tx: 0, txV: 0, ty: 0, tyV: 0, hover: false,
    c: { x: 0, y: 0 }, half: { x: 1, y: 1 },
  };
  sliver.mat.envMapIntensity = 2.2;
  sliver.mat.clearcoat = 1;
  sliver.mesh = new THREE.Mesh(new THREE.BufferGeometry(), sliver.mat);
  sliver.g.add(sliver.mesh);
  sliver.g.visible = false;
  scene.add(sliver.g);

  // ------------------------------------------------------------------ state
  let L, NI, PI, Pe, cdpr = 1.5, depth = 13, bevel = 2.6;
  let mode = 'in';
  let modeT0 = 0.15;
  let time = 0;
  let geoClock = 1;
  const ptr = { sx: -1, sy: -1, inside: false, nx: 0, ny: 0, local: new THREE.Vector2(9e9, 9e9), world: new THREE.Vector3() };
  const pushPt = { u: 0.5, v: 0.5, k: 0 };
  let hoverPiece = null;

  const toWorld = (sx, sy) => ({ x: sx - L.W / 2, y: L.H / 2 - sy });

  function layout() {
    L = computeLayout();
    NI = navItems(L);
    PI = panelItems(L);
    renderer.setSize(L.W, L.H, false);
    camera.aspect = L.W / L.H;
    const D = (L.H / 2) / Math.tan(15 * DEG);
    camera.position.set(0, 0, D);
    camera.near = D * 0.05; camera.far = D * 4;
    camera.updateProjectionMatrix();
    glowU.uGlowR.value = 300 * L.Sg;
    depth = 13 * L.Sg; bevel = 2.6 * L.Sg;

    // Printed canvases.
    cdpr = Math.max(1.5, Math.min(devicePixelRatio || 1, 2));
    panelCanvas.width = Math.round(L.panel.w * cdpr); panelCanvas.height = Math.round(L.panel.h * cdpr);
    navCanvas.width = Math.round(L.nav.w * cdpr); navCanvas.height = Math.round(L.nav.h * cdpr);
    panelTex.dispose(); navTex.dispose();
    redraw();
    placeDom(L, NI, PI);

    // Extended panel rect: cells are inset by half the gap, so the outer edges
    // sit on the block margins.
    const half = 7 * L.Sg;
    Pe = { x: L.panel.x - half, y: L.panel.y - half, w: L.panel.w + 2 * half, h: L.panel.h + 2 * half };

    // Nav slab (static geometry).
    const nw = toWorld(L.nav.x, L.nav.y + L.nav.h);
    const navRect = [
      { x: nw.x, y: nw.y }, { x: nw.x + L.nav.w, y: nw.y },
      { x: nw.x + L.nav.w, y: nw.y + L.nav.h }, { x: nw.x, y: nw.y + L.nav.h },
    ];
    navPiece.poly = navRect;
    navPiece.anchor.set(nw.x + L.nav.w / 2, nw.y + L.nav.h / 2);
    navPiece.hw = L.nav.w / 2; navPiece.hh = L.nav.h / 2;
    buildPiece(navPiece, insetPolygon(navRect, bevel));

    // Cell anchors from the rest pattern.
    const rest = patternPoints(0, false);
    cells.forEach((p, i) => {
      const poly = CELLS[i].map((k) => rest[k]);
      let cx = 0, cy = 0, minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
      for (const q of poly) {
        cx += q.x; cy += q.y;
        minx = Math.min(minx, q.x); maxx = Math.max(maxx, q.x); miny = Math.min(miny, q.y); maxy = Math.max(maxy, q.y);
      }
      p.anchor.set(cx / poly.length, cy / poly.length);
      p.hw = (maxx - minx) / 2; p.hh = (maxy - miny) / 2;
    });
    // Flight directions: outward from the block centre and a little down.
    for (const p of pieces) {
      const d = new THREE.Vector2(p.anchor.x, p.anchor.y);
      if (d.length() < 1) d.set(0, 1);
      d.normalize();
      const out = (620 + p.fly.out * 420) * L.Sg;
      p.fly.dir.set(d.x * out, d.y * out - (180 + p.fly.down * 220) * L.Sg, p.fly.vz * L.Sg);
    }
    rebuildCells(true);
    layoutSliver();
  }

  function redraw() {
    drawPanel(panelCtx, L, PI, cdpr);
    drawNav(navCtx, L, NI, cdpr);
    panelTex.needsUpdate = true;
    navTex.needsUpdate = true;
  }

  // Pattern points in slab-local world coordinates.
  function patternPoints(t, live) {
    const out = {};
    for (const [k, [bu, bv]] of Object.entries(BASE)) {
      let u = bu, v = bv;
      const m = MOVERS[k];
      if (m && live) {
        const d = drift[k];
        u += 0.03 * Math.sin((2 * Math.PI * t) / d.px + d.fx);
        if (m === 'xy') v += 0.05 * Math.sin((2 * Math.PI * t) / d.py + d.fy);
        if (pushPt.k > 0.001) {
          const dx = u - pushPt.u, dy = v - pushPt.v;
          const dist = Math.hypot(dx, dy);
          if (dist < 0.6 && dist > 1e-4) {
            const f = 0.05 * Math.pow(1 - dist / 0.6, 2) * pushPt.k;
            u += (dx / dist) * f;
            if (m === 'xy') v += (dy / dist) * f;
          }
        }
        u = clamp(u, 0.05, 0.95);
        if (m === 'xy') v = clamp(v, 0.05, 0.95);
      }
      const [x, y] = L.portrait ? [v, u] : [u, v];
      const w = toWorld(Pe.x + x * Pe.w, Pe.y + y * Pe.h);
      out[k] = w;
    }
    return out;
  }

  function buildPiece(p, inset) {
    const local = inset.map((q) => ({ x: q.x - p.anchor.x, y: q.y - p.anchor.y }));
    const shape = roundedShape(THREE, local, 20 * L.Sg);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3,
      curveSegments: 5, steps: 1,
    });
    const face = new THREE.ShapeGeometry(shape, 5);
    // UVs: the slice of the page this outline covers at its original position.
    const rect = p.kind === 'nav' ? L.nav : L.panel;
    const pos = face.attributes.position;
    const uv = face.attributes.uv;
    const left = rect.x - L.W / 2, bottom = L.H / 2 - rect.y - rect.h;
    for (let i = 0; i < pos.count; i++) {
      uv.setXY(i, (pos.getX(i) + p.anchor.x - left) / rect.w, (pos.getY(i) + p.anchor.y - bottom) / rect.h);
    }
    uv.needsUpdate = true;
    p.mesh.geometry.dispose(); p.print.geometry.dispose();
    p.mesh.geometry = geo; p.print.geometry = face;
    p.mesh.position.z = -(depth + bevel);
    p.print.position.z = 0.35;
  }

  function rebuildCells() {
    const pts = patternPoints(time, true);
    cells.forEach((p, i) => {
      p.poly = CELLS[i].map((k) => pts[k]);
      buildPiece(p, insetPolygon(p.poly, 7 * L.Sg + bevel));
    });
  }

  function layoutSliver() {
    const { W, H } = L;
    const wide = W >= 900;
    const kx = wide ? W / 1918 : 900 / 1918;
    const ky = wide ? H / 1080 : 900 / 1918;
    const k = wide ? W / 1918 : 900 / 1918;
    const frac = [[0.147, 0.243], [0.252, 0.169], [0.287, 0.277], [0.151, 0.258]];
    // Offsets from the label centre (.219 W, .238 H) in reference px.
    const off = frac.map(([fx, fy]) => [(fx - 0.219) * 1918 * kx, (fy - 0.238) * 1080 * ky]);
    const minX = Math.min(...off.map((o) => o[0]));
    const lx = wide ? 0.219 * W : Math.max(0.219 * W, 18 - minX);
    const ly = 0.238 * H;
    const pts = off.map(([ox, oy]) => toWorld(lx + ox, ly + oy));
    let cx = 0, cy = 0;
    for (const q of pts) { cx += q.x; cy += q.y; }
    cx /= 4; cy /= 4;
    const local = pts.map((q) => ({ x: q.x - cx, y: q.y - cy }));
    const sd = 11 * k, sb = 2.4 * k;
    const shape = roundedShape(THREE, local, 9 * k);
    sliver.mesh.geometry.dispose();
    sliver.mesh.geometry = new THREE.ExtrudeGeometry(shape, {
      depth: sd, bevelEnabled: true, bevelThickness: sb, bevelSize: sb, bevelSegments: 3, curveSegments: 6,
    });
    sliver.mesh.position.z = -(sd + sb);
    sliver.g.position.set(cx, cy, 0);
    sliver.c = { x: cx + L.W / 2, y: L.H / 2 - cy };
    // Hit area for the back button: the sliver's screen bounding box.
    const sx = off.map((o) => lx + o[0]), sy = off.map((o) => ly + o[1]);
    const bx0 = Math.min(...sx), bx1 = Math.max(...sx), by0 = Math.min(...sy), by1 = Math.max(...sy);
    sliver.half = { x: (bx1 - bx0) / 2, y: (by1 - by0) / 2 };
    const back = $('back');
    Object.assign(back.style, { left: `${bx0}px`, top: `${by0}px`, width: `${bx1 - bx0}px`, height: `${by1 - by0}px` });
    Object.assign(back.firstElementChild.style, { left: `${lx - bx0}px`, top: `${ly - by0}px` });
  }

  // ---------------------------------------------------------------- events
  addEventListener('pointermove', (e) => {
    ptr.sx = e.clientX; ptr.sy = e.clientY; ptr.inside = true;
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { ptr.inside = false; });
  document.addEventListener('mouseout', (e) => { if (!e.relatedTarget) ptr.inside = false; });
  addEventListener('blur', () => { ptr.inside = false; });
  addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') { ptr.sx = e.clientX; ptr.sy = e.clientY; ptr.inside = true; } });

  const setHover = (id, on) => {
    if (on === hover.has(id)) return;
    on ? hover.add(id) : hover.delete(id);
    redraw();
  };
  for (const id of ['pill', 'read', 'nl0', 'nl1', 'nl2', 'signin']) {
    const el = $(id);
    el.addEventListener('pointerenter', () => setHover(id, true));
    el.addEventListener('pointerleave', () => setHover(id, false));
    el.addEventListener('focus', () => setHover(id, true));
    el.addEventListener('blur', () => setHover(id, false));
    if (id !== 'read') el.addEventListener('click', (e) => e.preventDefault());
  }
  $('read').addEventListener('click', (e) => { e.preventDefault(); shatter(); });
  const back = $('back');
  back.addEventListener('click', (e) => { e.preventDefault(); reassemble(); });
  back.addEventListener('pointerenter', () => { sliver.hover = true; });
  back.addEventListener('pointerleave', () => { sliver.hover = false; });
  back.addEventListener('focus', () => { sliver.hover = true; });
  back.addEventListener('blur', () => { sliver.hover = false; });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && mode === 'defs') reassemble(); });
  let resizeRaf = 0;
  addEventListener('resize', () => { cancelAnimationFrame(resizeRaf); resizeRaf = requestAnimationFrame(layout); });

  const navLayer = $('navLayer'), panelLayer = $('panelLayer'), paper = $('paper');

  function shatter() {
    if (mode !== 'page') return;
    hover.clear(); redraw();
    window.getSelection()?.removeAllRanges();
    mode = 'out'; modeT0 = time;
    paper.classList.add('show');
    sliver.state = 'grow'; sliver.t0 = time;
  }
  function reassemble() {
    if (mode !== 'defs' && mode !== 'out') return;
    paper.classList.remove('show');
    sliver.state = 'shrink'; sliver.t0 = time; sliver.hover = false; sliver.s0 = sliver.scale;
    mode = 'in'; modeT0 = time + 0.18;
    back.blur();
  }

  // ------------------------------------------------------------------ loop
  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane();
  const tmpV = new THREE.Vector3(), tmpN = new THREE.Vector3(), tmpQ = new THREE.Quaternion(), tmpE = new THREE.Euler();
  const ndc = new THREE.Vector2();
  const corners = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];

  function spring(o, key, vkey, target, dt) {
    const k = 170, c = 19;
    let x = o[key], v = o[vkey];
    const steps = Math.ceil(dt / (1 / 120));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) { v += (k * (target - x) - c * v) * h; x += v * h; }
    o[key] = x; o[vkey] = v;
  }

  function flyS(p) {
    if (mode === 'page') return 0;
    const q = clamp((time - modeT0 - p.delay) / 0.72, 0, 1);
    return mode === 'in' ? 1 - easeOutBack(q) : easeInCubic(q);
  }

  function screenQuad(rect, out) {
    const a = toWorld(rect.x, rect.y), b = toWorld(rect.x + rect.w, rect.y + rect.h);
    corners[0].set(a.x, a.y, 0); corners[1].set(b.x, a.y, 0); corners[2].set(b.x, b.y, 0); corners[3].set(a.x, b.y, 0);
    for (let i = 0; i < 4; i++) {
      const v = corners[i].applyMatrix4(slab.matrixWorld).project(camera);
      out[i] = [(v.x + 1) / 2 * L.W, (1 - v.y) / 2 * L.H];
    }
    return out;
  }
  function quadMatrix(w, h, q) {
    const [x0, y0] = q[0], [x1, y1] = q[1], [x2, y2] = q[2], [x3, y3] = q[3];
    const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
    const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
    const den = dx1 * dy2 - dx2 * dy1;
    const g = (dx3 * dy2 - dx2 * dy3) / den, hh = (dx1 * dy3 - dx3 * dy1) / den;
    const a = x1 - x0 + g * x1, b = x3 - x0 + hh * x3, d = y1 - y0 + g * y1, e = y3 - y0 + hh * y3;
    return `matrix3d(${a / w},${d / w},0,${g / w},${b / h},${e / h},0,${hh / h},0,0,1,0,${x0},${y0},0,1)`;
  }
  const quadBuf = [[], [], [], []];

  let last = performance.now();
  layout();

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 1 / 20);
    last = now;
    time += dt;

    // Global tilt, as if the block were pressed at the pointer.
    if (ptr.inside) {
      ptr.nx = clamp((ptr.sx / L.W) * 2 - 1, -1, 1);
      ptr.ny = clamp(-((ptr.sy / L.H) * 2 - 1), -1, 1);
    }
    const tx = ptr.inside ? ptr.nx : 0, ty = ptr.inside ? ptr.ny : 0;
    const ks = 1 - Math.exp(-dt / 0.3);
    slab.rotation.y += ((tx * 7 - 1.2) * DEG - slab.rotation.y) * ks;
    slab.rotation.x += ((-ty * 5.5 + 0.8) * DEG - slab.rotation.x) * ks;
    slab.updateMatrixWorld(true);

    // Pointer on the slab plane.
    let onSlab = false;
    if (ptr.inside) {
      ndc.set((ptr.sx / L.W) * 2 - 1, -(ptr.sy / L.H) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      tmpN.set(0, 0, 1).applyQuaternion(slab.quaternion);
      plane.setFromNormalAndCoplanarPoint(tmpN, tmpV.set(0, 0, 0));
      if (raycaster.ray.intersectPlane(plane, ptr.world)) {
        tmpV.copy(ptr.world);
        slab.worldToLocal(tmpV);
        ptr.local.set(tmpV.x, tmpV.y);
        onSlab = true;
      }
    }
    const live = mode === 'page';
    const glowTarget = ptr.inside && onSlab && live ? 1 : 0;
    glowU.uGlow.value += (glowTarget - glowU.uGlow.value) * (1 - Math.exp(-dt / 0.25));
    if (onSlab) glowU.uPointer.value.copy(ptr.world);

    // Cursor push, in pattern coordinates.
    if (onSlab) {
      const x = (ptr.local.x + L.W / 2 - Pe.x) / Pe.w;
      const y = (L.H / 2 - ptr.local.y - Pe.y) / Pe.h;
      const [u, v] = L.portrait ? [y, x] : [x, y];
      const kp = 1 - Math.exp(-dt / 0.12);
      pushPt.u += (u - pushPt.u) * kp; pushPt.v += (v - pushPt.v) * kp;
    }
    const pushTarget = onSlab && live ? 1 : 0;
    pushPt.k += (pushTarget - pushPt.k) * (1 - Math.exp(-dt / 0.35));

    // Rebuild the live cut pattern ~45x/s.
    geoClock += dt;
    if (geoClock >= 1 / 45) { geoClock = 0; rebuildCells(); }

    // Pick the piece under the pointer.
    hoverPiece = null;
    if (onSlab && live) {
      const { x, y } = ptr.local;
      if (pointInPolygon(x, y, navPiece.poly)) hoverPiece = navPiece;
      else hoverPiece = cells.find((p) => pointInPolygon(x, y, p.poly)) || null;
    }

    // Pieces.
    let allDone = true;
    for (const p of pieces) {
      const hovered = p === hoverPiece;
      const isNav = p.kind === 'nav';
      spring(p, 'lift', 'liftV', hovered ? (isNav ? 32 : 50) * L.Sg : 0, dt);
      let ttx = 0, tty = 0;
      if (hovered) {
        const nx = clamp((ptr.local.x - p.anchor.x) / p.hw, -1, 1);
        const ny = clamp((ptr.local.y - p.anchor.y) / p.hh, -1, 1);
        // The edge nearest the pointer dips away from the camera.
        tty = nx * 0.24 * (isNav ? Math.min(1, 160 / p.hw) : 1);
        ttx = -ny * 0.24;
      }
      spring(p, 'tx', 'txV', ttx, dt);
      spring(p, 'ty', 'tyV', tty, dt);
      p.hv += ((hovered ? 1 : 0) - p.hv) * (1 - Math.exp(-dt / 0.2));
      p.mat.iridescence = 0.55 + 0.45 * p.hv;
      p.mat.envMapIntensity = 1 + 0.9 * p.hv;

      const s = flyS(p);
      if (mode !== 'page') {
        const q = (time - modeT0 - p.delay) / 0.72;
        if (q < 1) allDone = false;
      }
      p.g.visible = s < 0.999;
      const f = p.fly.dir;
      p.g.position.set(
        p.anchor.x + f.x * s,
        p.anchor.y + f.y * s - 520 * L.Sg * s * s,
        p.lift + f.z * s,
      );
      tmpE.set(p.tx, p.ty, 0);
      p.g.quaternion.setFromEuler(tmpE);
      if (s !== 0) {
        tmpQ.setFromAxisAngle(p.fly.axis, p.fly.spin * s);
        p.g.quaternion.premultiply(tmpQ);
      }
    }
    if (allDone && mode === 'out') mode = 'defs';
    if (allDone && mode === 'in') mode = 'page';

    // DOM text layer: map onto the tilted panel and nav with a homography.
    const showText = mode === 'page';
    navLayer.classList.toggle('off', !showText);
    panelLayer.classList.toggle('off', !showText);
    if (showText) {
      navLayer.style.transform = quadMatrix(L.nav.w, L.nav.h, screenQuad(L.nav, quadBuf));
      panelLayer.style.transform = quadMatrix(L.panel.w, L.panel.h, screenQuad(L.panel, quadBuf));
    }

    // Back sliver.
    if (sliver.state === 'grow') {
      const q = clamp((time - sliver.t0 - 0.3) / 0.55, 0, 1);
      sliver.scale = q <= 0 ? 0 : easeOutBack(q);
    } else if (sliver.state === 'shrink') {
      const q = clamp((time - sliver.t0) / 0.3, 0, 1);
      sliver.scale = (1 - easeInCubic(q)) * sliver.s0;
      if (q >= 1) { sliver.state = 'hidden'; sliver.scale = 0; }
    }
    sliver.g.visible = sliver.scale > 0.001;
    if (sliver.g.visible) {
      let stx = 0, sty = 0;
      if (sliver.hover && ptr.inside) {
        const nx = clamp((ptr.sx - sliver.c.x) / sliver.half.x, -1, 1);
        const ny = clamp(-(ptr.sy - sliver.c.y) / sliver.half.y, -1, 1);
        sty = nx * 0.14; stx = -ny * 0.14;
      }
      spring(sliver, 'tx', 'txV', stx, dt);
      spring(sliver, 'ty', 'tyV', sty, dt);
      const wob = Math.PI * 2;
      sliver.g.rotation.set(
        0.08 + 0.03 * Math.sin(wob * 1.0 * time) + sliver.tx,
        -0.16 + 0.04 * Math.sin(wob * 0.87 * time + 1.3) + sliver.ty,
        0.012 * Math.sin(wob * 0.6 * time + 0.4),
      );
      sliver.g.scale.setScalar(Math.max(sliver.scale, 0.0001));
      sliver.mat.iridescence = 0.35 + 0.25 * (sliver.hover ? 1 : 0);
    }

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame((now) => { last = now; frame(now); });
}

boot();
