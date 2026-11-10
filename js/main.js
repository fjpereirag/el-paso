// El paso · De Egipto a la Tierra Prometida
// Mapa ilustrado 3D del Éxodo (Three.js local, sin claves ni servicios de pago).
// Coordenadas del mapa: x (oeste→este) y z (norte→sur) en [-10, 10].
import * as THREE from './three.module.min.js';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.classList.remove('no-js');

/* ------------------------------------------------------------------ */
/* Geografía estilizada                                                */
/* ------------------------------------------------------------------ */
const ROUTE_2D = [
  [-6.0, -4.5],  // I · Ramsés
  [-5.0, -3.9],  // Sucot
  [-4.2, -2.2],
  [-3.63, -1.38], // orilla oeste
  [-2.88, -1.66], // II · paso del mar
  [-2.13, -1.94], // orilla este
  [-1.6, 0.4],   // Mara
  [-0.8, 2.8],   // Elim
  [0.3, 4.6],    // Refidim
  [1.4, 5.6],    // III · Sinaí
  [2.3, 3.0],
  [2.4, 0.0],
  [2.6, -3.0],   // Cades
  [4.6, -2.3],
  [6.9, -2.9],
  [8.6, -4.0],   // Moab
  [8.45, -5.6],  // Nebo
  [7.6, -6.3],   // vado del Jordán
  [6.9, -6.35],  // IV · Jericó
];
// lab: desplazamiento de la etiqueta en el mapa SVG
const STATIONS = [
  { i: 0, xz: [-6.0, -4.5], rn: 'I', name: 'Egipto', lab: [0, -7] },
  { i: 4, xz: [-2.88, -1.66], rn: 'II', name: 'Mar Rojo', lab: [-10, 3] },
  { i: 6, xz: [-1.6, 0.4], rn: 'III', name: 'Mara', lab: [-11, 3] },
  { i: 7, xz: [-0.8, 2.8], rn: 'IV', name: 'Sin', lab: [-10, 3] },
  { i: 8, xz: [0.3, 4.6], rn: 'V', name: 'Refidim', lab: [-9, 4] },
  { i: 9, xz: [1.4, 5.6], rn: 'VI', name: 'Sinaí', lab: [0, 13] },
  { i: 14, xz: [6.9, -2.9], rn: 'VII', name: 'Edom', lab: [0, 13] },
  { i: 16, xz: [8.45, -5.6], rn: 'VIII', name: 'Nebo', lab: [1, 13] },
  { i: 18, xz: [6.9, -6.35], rn: 'IX', name: 'Jericó', lab: [-10, -3] },
];
const CROSS = new THREE.Vector2(-2.88, -1.66);
const GULF_D = new THREE.Vector2(4, 10.5).normalize();      // eje del golfo de Suez
const GULF_N = new THREE.Vector2(GULF_D.y, -GULF_D.x);       // dirección del paso (oeste→este)

function hash(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y) { let s = 0, a = .5, f = 1; for (let o = 0; o < 4; o++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= .5; } return s; }
function seg(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az; let t = ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz);
  t = Math.max(0, Math.min(1, t)); const ex = ax + dx * t - px, ez = az + dz * t - pz; return Math.hypot(ex, ez);
}
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const gauss = (x, z, cx, cz, s) => Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / (2 * s * s));

// > 0 tierra, < 0 agua
function land(x, z) {
  const coast = x < 3 ? -6.5 : -6.5 - (x - 3) * 1.0;
  const wob = (fbm(x * .9 + 3, z * .9) - .5) * .5;
  const med = z - coast + wob;
  const suez = seg(x, z, -3.2, -2.5, 0.8, 8) - (0.3 + wob * .2);
  const aqaba = seg(x, z, 4.2, 1.5, 2.6, 8.5) - (0.27 + wob * .15);
  const red = seg(x, z, 1.2, 9.2, 3.6, 13) - 1.4;
  const dead = (Math.hypot((x - 7.5) / .38, (z + 5) / .9) - 1) * .38;
  const gal = (Math.hypot((x - 7.2) / .28, (z + 9.5) / .36) - 1) * .28;
  const jordan = seg(x, z, 7.22, -9.1, 7.45, -5.9) - .06;
  const nile = Math.min(seg(x, z, -7.4, 11, -7.0, -5.2) - .1, seg(x, z, -7.0, -5.2, -8.6, -6.9) - .07, seg(x, z, -7.0, -5.2, -5.7, -6.8) - .07);
  return Math.min(med, suez, aqaba, red, dead, gal, jordan, nile);
}
// Extensión del mapa-bloque (como una lámina de atlas en relieve)
const MAP = { x0: -9, x1: 11, z0: -9.75, z1: 9.75 };
MAP.w = MAP.x1 - MAP.x0; MAP.d = MAP.z1 - MAP.z0;
function height(x, z) {
  const e = Math.min(x - MAP.x0, MAP.x1 - x, z - MAP.z0, MAP.z1 - z);   // a ras en los bordes del bloque
  return heightCore(x, z) * smooth(0, .7, e) * .75;
}
function heightCore(x, z) {
  const l = land(x, z);
  if (l < 0) return 0;                                  // el mar va pintado, plano
  const k = smooth(0, .5, l);
  const n = fbm(x * .7, z * .7);
  let h = Math.min(l, .25) * .3 + k * (.04 + n * .16);
  const ridge = 1 - Math.abs(fbm(x * 1.6 + 7, z * 1.6) * 2 - 1);
  h += k * gauss(x, z, 1.4, 5.8, 1.4) * (0.55 + ridge * .5);   // macizo del Sinaí
  h += k * gauss(x, z, 0.2, 3.2, 1.3) * .35;
  h += k * gauss(x, z, 6.2, -7.4, 1.1) * .55;                 // montes de Judá
  h += k * Math.exp(-((x - 8.9) ** 2) / .7) * smooth(-9, -6, z) * (1 - smooth(-1, 1, z)) * (.55 + ridge * .35); // Moab y Edom
  h += k * gauss(x, z, 3.5, -2, 2.4) * .18;                   // Négueb
  return h;
}

/* ------------------------------------------------------------------ */
/* Ruta (compartida por el 3D y el mapa SVG)                           */
/* ------------------------------------------------------------------ */
const route2 = new THREE.CatmullRomCurve3(ROUTE_2D.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
const SAMPLES = 420;
const samples = route2.getSpacedPoints(SAMPLES).map(p => {
  const h = height(p.x, p.z);
  return new THREE.Vector3(p.x, h + .035, p.z);
});
const route = new THREE.CatmullRomCurve3(samples);
const stationU = STATIONS.map(s => {
  let best = 0, bd = 1e9;
  samples.forEach((p, k) => { const d = Math.hypot(p.x - s.xz[0], p.z - s.xz[1]); if (d < bd) { bd = d; best = k; } });
  return best / SAMPLES;
});

/* ------------------------------------------------------------------ */
/* Lámina de atlas: relieve sombreado, tintas hipsométricas y rótulos  */
/* ------------------------------------------------------------------ */
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const HYPSO = [[0, hex('#d6cf9f')], [.1, hex('#dccb93')], [.28, hex('#d2b47e')], [.5, hex('#bf9967')], [.75, hex('#a37c55')], [1.1, hex('#86664a')]];
const C_SHALLOW = hex('#bcd2d3'), C_DEEP = hex('#93b3bc'), C_COAST = hex('#7b9da8'), C_GREEN = hex('#a7ad74');
let atlasBase = null;
function paintBase(G) {
  const W = MAP.w, D = MAP.d, Hh = new Float32Array((G + 1) * (G + 1)), Ll = new Float32Array((G + 1) * (G + 1));
  for (let j = 0; j <= G; j++) for (let i = 0; i <= G; i++) {
    const x = MAP.x0 + i / G * W, z = MAP.z0 + j / G * D, k = j * (G + 1) + i;
    Hh[k] = height(x, z); Ll[k] = land(x, z);
  }
  const c = document.createElement('canvas'); c.width = c.height = G;
  const ctx = c.getContext('2d'), id = ctx.createImageData(G, G), S = .2 / (W / G);
  for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
    const k = j * (G + 1) + i, x = MAP.x0 + i / G * W, z = MAP.z0 + j / G * D, l = Ll[k], h = Hh[k];
    let col;
    if (l < 0) {
      col = l > -.05 ? C_COAST : mix3(C_SHALLOW, C_DEEP, smooth(.05, .9, -l));
    } else {
      let q = 0; while (q < HYPSO.length - 2 && h > HYPSO[q + 1][0]) q++;
      col = mix3(HYPSO[q][1], HYPSO[q + 1][1], Math.min(1, (h - HYPSO[q][0]) / (HYPSO[q + 1][0] - HYPSO[q][0])));
      const nileD = Math.min(seg(x, z, -7.4, 11, -7.0, -5.2), seg(x, z, -7.0, -5.2, -8.6, -6.9), seg(x, z, -7.0, -5.2, -5.7, -6.8));
      const g = Math.max(1 - smooth(.1, .8, nileD), (1 - smooth(.05, .45, seg(x, z, 7.22, -9.1, 7.45, -5.9))) * .8, smooth(-5, -8.5, z) * smooth(4, 6, x) * .55);
      col = mix3(col, C_GREEN, g);
      // sombreado de laderas (luz del noroeste, como en los atlas)
      const dx = Hh[k + 1] - Hh[k], dz = Hh[k + G + 1] - Hh[k];
      const sh = Math.max(.55, Math.min(1.3, 1 + (-dx - dz) * S * 2.2));
      col = [col[0] * sh, col[1] * sh, col[2] * sh];
    }
    const grain = .96 + hash(i * .37, j * .91) * .07;
    const o = (j * G + i) * 4;
    id.data[o] = col[0] * grain; id.data[o + 1] = col[1] * grain; id.data[o + 2] = col[2] * grain; id.data[o + 3] = 255;
  }
  ctx.putImageData(id, 0, 0);
  return c;
}
function paintAtlas(N, G) {
  if (!atlasBase || atlasBase.width !== G) atlasBase = paintBase(G);
  const c = document.createElement('canvas'); c.width = c.height = N;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(atlasBase, 0, 0, N, N);
  const PX = x => (x - MAP.x0) / MAP.w * N, PZ = z => (z - MAP.z0) / MAP.d * N, U = N / MAP.w;
  // retícula
  ctx.strokeStyle = 'rgba(110,80,45,.13)'; ctx.lineWidth = N / 1400;
  for (let x = -8; x <= 10; x += 2) { ctx.beginPath(); ctx.moveTo(PX(x), 0); ctx.lineTo(PX(x), N); ctx.stroke(); }
  for (let z = -8; z <= 8; z += 2) { ctx.beginPath(); ctx.moveTo(0, PZ(z)); ctx.lineTo(N, PZ(z)); ctx.stroke(); }
  const serif = '"Cormorant Garamond", "EB Garamond", Georgia, serif';
  function txt(str, x, z, size, o = {}) {
    ctx.save();
    ctx.translate(PX(x), PZ(z)); if (o.rot) ctx.rotate(o.rot);
    ctx.font = `${o.italic ? 'italic ' : ''}${o.weight || 500} ${size * U}px ${serif}`;
    const sp = (o.spacing || 0) * size * U;
    const chars = [...str], widths = chars.map(ch => ctx.measureText(ch).width);
    const total = widths.reduce((a, b) => a + b, 0) + sp * (chars.length - 1);
    let cx = o.align === 'left' ? 0 : -total / 2;
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    chars.forEach((ch, k) => {
      if (o.halo) { ctx.strokeStyle = o.halo; ctx.lineWidth = size * U * .22; ctx.strokeText(ch, cx, 0); }
      ctx.fillStyle = o.color || 'rgba(92,62,36,.62)'; ctx.fillText(ch, cx, 0); cx += widths[k] + sp;
    });
    ctx.restore();
  }
  const SEA = 'rgba(62,98,114,.72)', REG = 'rgba(96,64,36,.5)', TOWN = 'rgba(58,38,22,.9)', HALO = 'rgba(232,222,190,.55)';
  // mares y ríos
  txt('MAR GRANDE', -2.6, -8.3, .5, { italic: true, spacing: .55, color: SEA });
  txt('(Mar Mediterráneo)', -2.6, -7.6, .3, { italic: true, color: SEA });
  txt('Golfo de Suez', -1.75, 1.6, .26, { italic: true, rot: Math.atan2(10.5, 4), color: SEA, spacing: .1 });
  txt('Golfo de Áqaba', 3.62, 4.6, .24, { italic: true, rot: Math.atan2(7, -1.6) + Math.PI, color: SEA, spacing: .1 });
  txt('MAR ROJO', 2.45, 9.25, .3, { italic: true, spacing: .4, color: SEA });
  txt('Mar Muerto', 7.95, -4.6, .2, { italic: true, rot: Math.PI / 2, color: SEA });
  txt('Nilo', -7.55, 2.5, .26, { italic: true, rot: Math.PI / 2 - .03, color: SEA, spacing: .2 });
  txt('Jordán', 7.62, -7.9, .18, { italic: true, rot: Math.PI / 2, color: SEA });
  // regiones
  txt('EGIPTO', -4.9, 4.2, .62, { spacing: .6, color: REG });
  txt('GOSÉN', -5.6, -2.7, .3, { spacing: .5, color: REG });
  txt('DESIERTO DE SUR', -.6, -2.9, .3, { spacing: .45, color: REG });
  txt('DESIERTO DE PARÁN', 3.4, -.6, .3, { spacing: .4, color: REG, rot: -.25 });
  txt('SINAÍ', 1.6, 7.6, .48, { spacing: .7, color: REG });
  txt('NÉGUEB', 4.6, -4.4, .36, { spacing: .55, color: REG });
  txt('EDOM', 8.4, -1.4, .36, { spacing: .55, color: REG, rot: Math.PI / 2 });
  txt('MOAB', 9.7, -5.4, .32, { spacing: .5, color: REG, rot: Math.PI / 2 });
  txt('CANAÁN', 5.2, -8.7, .4, { spacing: .6, color: REG });
  txt('ARABIA', 8.7, 5.5, .46, { spacing: .7, color: REG });
  // ciudades y lugares
  const towns = [
    ['Ramsés', -6.0, -4.5, 'r'], ['Sucot', -5.0, -3.9, 'r'], ['Menfis', -6.75, -3.2, 'l'], ['Mara', -1.6, .4, 'r'], ['Elim', -.8, 2.8, 'r'],
    ['Refidim', .3, 4.6, 'r'], ['Cades', 2.6, -3.0, 'r'], ['Punón', 6.9, -2.9, 'l'], ['Ezión-Guéber', 4.35, 1.2, 'r'],
    ['Gaza', 3.5, -6.55, 'r'], ['Jerusalén', 6.2, -6.0, 'l'], ['Jericó', 6.9, -6.35, 'l'], ['Monte Nebo', 8.45, -5.6, 'r'],
  ];
  towns.forEach(([n, x, z, side]) => {
    ctx.fillStyle = '#9b2a1c'; ctx.strokeStyle = 'rgba(240,230,200,.8)'; ctx.lineWidth = U * .02;
    ctx.beginPath(); ctx.arc(PX(x), PZ(z), U * .055, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    txt(n, x + (side === 'r' ? .12 : -.12), z - .16, .22, { italic: true, color: TOWN, align: 'left', halo: HALO, ...(side === 'l' ? {} : {}) });
    if (side === 'l') { /* rótulo a la izquierda */ }
  });
  // Monte Sinaí: triángulo
  ctx.fillStyle = '#7a2a1c'; ctx.beginPath();
  ctx.moveTo(PX(1.4), PZ(5.6) - U * .16); ctx.lineTo(PX(1.4) - U * .12, PZ(5.6) + U * .06); ctx.lineTo(PX(1.4) + U * .12, PZ(5.6) + U * .06); ctx.closePath(); ctx.fill();
  txt('Monte Sinaí', 1.6, 5.85, .24, { italic: true, color: TOWN, align: 'left', halo: HALO });
  // marco
  ctx.strokeStyle = 'rgba(80,52,28,.55)'; ctx.lineWidth = N / 500; ctx.strokeRect(N * .008, N * .008, N * .984, N * .984);
  ctx.lineWidth = N / 1400; ctx.strokeRect(N * .016, N * .016, N * .968, N * .968);
  return c;
}

// Mapa SVG de respaldo: la misma lámina, ruta y estaciones
(function drawSvg() {
  const P = (x, z) => `${(x * 10 + 100).toFixed(1)} ${(z * 10 + 100).toFixed(1)}`;
  const d = 'M' + route2.getSpacedPoints(120).map(p => P(p.x, p.z)).join(' L');
  const path = document.getElementById('ruta-svg');
  if (path) path.setAttribute('d', d);
  const img = document.getElementById('mapa-img');
  const fill = () => {
    if (!img) return;
    img.setAttribute('x', MAP.x0 * 10 + 100); img.setAttribute('y', MAP.z0 * 10 + 100);
    img.setAttribute('width', MAP.w * 10); img.setAttribute('height', MAP.d * 10);
    img.setAttribute('preserveAspectRatio', 'none');
    img.setAttribute('href', paintAtlas(900, 360).toDataURL('image/jpeg', .85));
  };
  const hasGL = (() => { try { const t = document.createElement('canvas'); return !!(t.getContext('webgl2') || t.getContext('webgl')); } catch (e) { return false; } })();
  if (!hasGL) { fill(); if (document.fonts) document.fonts.ready.then(fill); }
  const g = document.getElementById('st-svg');
  if (g) g.innerHTML = STATIONS.map(s => {
    const cx = s.xz[0] * 10 + 100, cy = s.xz[1] * 10 + 100;
    return `<circle cx="${cx}" cy="${cy}" r="3.2" fill="#C9A35B" stroke="#3a2614" stroke-width=".8"/><text x="${cx + s.lab[0]}" y="${cy + s.lab[1]}" stroke="#0B0A08" stroke-width="2.4" paint-order="stroke">${s.rn}</text>`;
  }).join('');
})();

/* ------------------------------------------------------------------ */
/* Interfaz: revelados, navegación, compartir                          */
/* ------------------------------------------------------------------ */
requestAnimationFrame(() => document.body.classList.add('is-loaded'));

const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// Menú de etapas
const menuBtn = document.querySelector('.top__btn'), menu = document.getElementById('menu-etapas'), curEl = document.getElementById('etapa-actual');
const setMenu = open => { menuBtn.setAttribute('aria-expanded', open); menu.hidden = !open; document.body.classList.toggle('menu-open', open); };
menuBtn.addEventListener('click', () => setMenu(menu.hidden));
menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); } });

const dots = [...document.querySelectorAll('[data-dot]')];
const etapas = [...document.querySelectorAll('.etapa')];
const markActive = n => {
  dots.forEach(a => a.classList.toggle('is-active', a.dataset.dot === n));
  if (n) { const e = etapas[+n - 1]; curEl.textContent = e.querySelector('.etapa__rn').textContent + ' · ' + dots[+n - 1].querySelector('.nm').textContent; }
  else curEl.textContent = 'Etapas';
};
const navIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) markActive(e.target.id.startsWith('etapa-') ? e.target.id.split('-')[1] : null); }), { rootMargin: '-45% 0px -45% 0px' });
etapas.forEach(s => navIO.observe(s));
['inicio', 'prologo', 'final'].forEach(id => { const el = document.getElementById(id); if (el) navIO.observe(el); });

// Compartir por WhatsApp (el texto sale del propio título de cada etapa)
document.querySelectorAll('[data-share]').forEach(b => b.addEventListener('click', () => {
  const n = +b.dataset.share;
  let txt = 'El paso · De Egipto a la Tierra Prometida. Un itinerario de fe en nueve etapas';
  if (n) { const e = etapas[n - 1]; txt = `El paso · ${e.querySelector('.etapa__rn').textContent}. ${e.querySelector('.etapa__lugar').textContent}: ${e.querySelector('.panel__title').textContent}`; }
  const url = location.href.split('#')[0] + (n ? '#etapa-' + n : '');
  window.open('https://wa.me/?text=' + encodeURIComponent(txt + '\n' + url), '_blank', 'noopener');
}));

/* ------------------------------------------------------------------ */
/* Escena 3D                                                           */
/* ------------------------------------------------------------------ */
const stageEl = document.querySelector('.stage');
const canvas = document.getElementById('mapa3d');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'low-power' });
} catch (e) { renderer = null; }
if (!renderer) {
  document.documentElement.classList.add('no-webgl');
} else {
  initScene();
}

function initScene() {
  const mobile = innerWidth < 760;
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .95;

  const scene = new THREE.Scene();
  const BG = new THREE.Color('#0B0A08');
  scene.background = BG;
  scene.fog = new THREE.FogExp2(BG, .028);

  const camera = new THREE.PerspectiveCamera(40, 1, .05, 200);

  // Luces: luna cálida + cielo nocturno
  scene.add(new THREE.HemisphereLight('#fff2dc', '#3c2e1e', 1.25));
  const moon = new THREE.DirectionalLight('#ffe7c2', 1.7);
  moon.position.set(-6, 9, -6);
  scene.add(moon);
  const rim = new THREE.DirectionalLight('#c9a35b', .35);
  rim.position.set(8, 4, 10);
  scene.add(rim);

  // Terreno: lámina de atlas en relieve
  const SEGX = mobile ? 170 : 240, SEGZ = Math.round(SEGX * MAP.d / MAP.w);
  const geo = new THREE.PlaneGeometry(MAP.w, MAP.d, SEGX, SEGZ);
  geo.rotateX(-Math.PI / 2);
  geo.translate((MAP.x0 + MAP.x1) / 2, 0, (MAP.z0 + MAP.z1) / 2);
  const pos = geo.attributes.position;
  for (let k = 0; k < pos.count; k++) pos.setY(k, height(pos.getX(k), pos.getZ(k)));
  geo.computeVertexNormals();
  const TEX_N = mobile ? 2048 : 3072, TEX_G = mobile ? 400 : 520;
  const atlasTex = new THREE.CanvasTexture(paintAtlas(TEX_N, TEX_G));
  atlasTex.colorSpace = THREE.SRGBColorSpace;
  atlasTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  if (document.fonts) document.fonts.ready.then(() => { atlasTex.image = paintAtlas(TEX_N, TEX_G); atlasTex.needsUpdate = true; });
  const terrain = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: atlasTex, roughness: 1, metalness: 0 }));
  scene.add(terrain);
  // grosor del bloque
  const slab = new THREE.Mesh(new THREE.BoxGeometry(MAP.w, .55, MAP.d), new THREE.MeshStandardMaterial({ color: '#3a2a1b', roughness: 1 }));
  slab.position.set((MAP.x0 + MAP.x1) / 2, -.285, (MAP.z0 + MAP.z1) / 2);
  scene.add(slab);

  // Agua con el paso abierto
  const uniforms = {
    uTime: { value: 0 }, uPart: { value: 0 },
    uC: { value: CROSS }, uD: { value: GULF_D }, uN: { value: GULF_N },
    uFog: { value: BG }, uFogD: { value: .028 },
  };
  // Lecho seco que aparece al abrirse el mar
  const bed = new THREE.Mesh(new THREE.PlaneGeometry(1.9, .68).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: '#d4bb86', roughness: 1, transparent: true, opacity: 0, depthWrite: false }));
  bed.rotation.y = -Math.atan2(GULF_N.y, GULF_N.x);
  bed.position.set(CROSS.x, .006, CROSS.y);
  scene.add(bed);

  // Murallas de agua (momento firma)
  const wallMat = new THREE.ShaderMaterial({
    uniforms, transparent: true, side: THREE.DoubleSide, depthWrite: false,
    vertexShader: `varying vec2 vUv; varying vec3 vW; void main(){ vUv=uv; vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `
      uniform float uTime,uPart; varying vec2 vUv; varying vec3 vW;
      float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
      void main(){
        float flow=n(vec2(vUv.x*14.,vUv.y*3.-uTime*.7));
        float streak=smoothstep(.55,1.,n(vec2(vUv.x*40.,vUv.y*1.5-uTime*1.2)));
        vec3 c=mix(vec3(.30,.45,.50),vec3(.58,.72,.75),vUv.y*.8+flow*.3);
        c+=vec3(.16,.16,.15)*streak*vUv.y;
        float crest=smoothstep(.9,1.,vUv.y);
        c=mix(c,vec3(.95,.96,.93),crest*.75);
        float edge=smoothstep(0.,.12,vUv.x)*smoothstep(1.,.88,vUv.x);
        gl_FragColor=vec4(c,(.72+.25*vUv.y)*edge*smoothstep(0.,.15,uPart));
        #include <colorspace_fragment>
      }`,
  });
  const walls = [-1, 1].map(sgn => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1, 24, 1), wallMat);
    m.userData.sgn = sgn;
    // el plano mira en la dirección del eje del golfo; su largo sigue el paso
    m.rotation.y = -Math.atan2(GULF_N.y, GULF_N.x);
    scene.add(m);
    return m;
  });

  // Ruta dorada
  const TUBE_SEG = 700, RAD = 6;
  const tubeGeo = new THREE.TubeGeometry(route, TUBE_SEG, mobile ? .04 : .032, RAD, false);
  const tube = new THREE.Mesh(tubeGeo, new THREE.MeshBasicMaterial({ color: '#9b2a1c', fog: true }));
  scene.add(tube);
  const ghostGeo = new THREE.TubeGeometry(route, 300, .012, 4, false);
  const ghost = new THREE.Mesh(ghostGeo, new THREE.MeshBasicMaterial({ color: '#9b2a1c', transparent: true, opacity: .3 }));
  scene.add(ghost);

  // Destello (el peregrino) y marcas de estación
  const glowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'); const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, 'rgba(255,240,200,1)'); r.addColorStop(.25, 'rgba(232,190,110,.6)'); r.addColorStop(1, 'rgba(201,163,91,0)');
    g.fillStyle = r; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const walker = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  walker.scale.setScalar(.32);
  scene.add(walker);
  const walkerLight = new THREE.PointLight('#f0c47a', 1.6, 3, 2);
  scene.add(walkerLight);

  const stationPts = stationU.map(u => route.getPointAt(u));
  const beamMat = new THREE.MeshBasicMaterial({ color: '#f0cf8a', transparent: true, opacity: .5, depthWrite: false });
  stationPts.forEach(p => {
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, 1.4, 6, 1, true), beamMat);
    beam.position.set(p.x, p.y + .7, p.z);
    scene.add(beam);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .8 }));
    halo.position.set(p.x, p.y + .08, p.z); halo.scale.setScalar(.42);
    scene.add(halo);
  });

  // Etiquetas HTML proyectadas
  const labelsEl = document.getElementById('labels');
  const labels = STATIONS.map((s, k) => {
    const el = document.createElement('div'); el.className = 'lbl';
    el.innerHTML = `<b>${s.rn}</b>`;
    labelsEl.appendChild(el); return { el, p: stationPts[k].clone().add(new THREE.Vector3(0, 1.45, 0)) };
  });

  /* ---------- Cámara guiada por el scroll ---------- */
  let keys = [], partStart = 0, partEnd = 1, vh = innerHeight;
  function buildKeys() {
    vh = innerHeight; keys = [];
    const y0 = scrollY;
    document.querySelectorAll('[data-cam]').forEach(el => {
      const type = el.dataset.cam; if (type === 'travel') return;
      const r = el.getBoundingClientRect(), top = r.top + y0, bot = r.bottom + y0;
      let st;
      if (type === 'overview') st = { u: 0, w: 0 };
      else if (type === 'end') st = { u: 1, w: 0 };
      else st = { u: stationU[+el.dataset.station], w: 1 };
      const a = top - vh * .1, b = Math.max(a, bot - vh * .9);
      keys.push([a, st], [b, st]);
    });
    keys.sort((p, q) => p[0] - q[0]);
    const e2 = document.getElementById('etapa-2').getBoundingClientRect();
    partStart = e2.top + y0 - vh * .1; partEnd = partStart + vh * .9;
  }
  function targetAt(y) {
    if (y <= keys[0][0]) return { ...keys[0][1] };
    for (let k = 0; k < keys.length - 1; k++) {
      const [ya, a] = keys[k], [yb, b] = keys[k + 1];
      if (y <= yb) { const t = yb > ya ? smooth(0, 1, (y - ya) / (yb - ya)) : 1; return { u: a.u + (b.u - a.u) * t, w: a.w + (b.w - a.w) * t }; }
    }
    return { ...keys[keys.length - 1][1] };
  }

  const cur = { u: 0, w: 0, part: 0 };
  const vA = new THREE.Vector3(), vB = new THREE.Vector3(), vT = new THREE.Vector3(), look = new THREE.Vector3(),
    camOver = new THREE.Vector3(), lookOver = new THREE.Vector3(), camFol = new THREE.Vector3(), lookFol = new THREE.Vector3(), proj = new THREE.Vector3();

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    buildKeys();
  }
  addEventListener('resize', resize);
  addEventListener('load', buildKeys);
  resize();

  const clock = new THREE.Clock();
  let running = true;
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) { clock.getDelta(); loop(); } });

  function loop() {
    if (!running) return;
    requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
    const y = scrollY, tgt = targetAt(y);
    const tgtPart = smooth(0, 1, (y - partStart) / (partEnd - partStart));
    const k = reduceMotion ? 1 : 1 - Math.exp(-dt * 3.2);
    cur.u += (tgt.u - cur.u) * k; cur.w += (tgt.w - cur.w) * k; cur.part += (tgtPart - cur.part) * (reduceMotion ? 1 : 1 - Math.exp(-dt * 2.2));
    uniforms.uTime.value = t; uniforms.uPart.value = cur.part;

    // Vista general (encuadre adaptado al formato vertical)
    const aspect = camera.aspect;
    const dOver = Math.max(20, 8 / (Math.tan(THREE.MathUtils.degToRad(20)) * aspect));
    lookOver.set(1.3, 0, aspect < 1 ? 3.2 : -.2);
    camOver.copy(lookOver).add(vB.set(0, 17, 10.5).normalize().multiplyScalar(dOver));
    if (!reduceMotion) camOver.x += Math.sin(t * .12) * .6;

    // Vista de seguimiento
    const u = Math.min(Math.max(cur.u, 0), 1);
    route.getPointAt(u, vA);
    route.getTangentAt(Math.min(u + .001, 1), vT); vT.y = 0; vT.normalize();
    const nearII = Math.exp(-((u - stationU[1]) ** 2) / (2 * .02 ** 2));
    const port = aspect < 1 ? 1.45 : 1;
    const hgt = (7.2 - 5.0 * nearII * cur.part) * port, back = (4.6 - 1.4 * nearII * cur.part) * port;
    const side = new THREE.Vector3(-vT.z, 0, vT.x);
    camFol.copy(vA).addScaledVector(vT, -back).addScaledVector(side, .9 * (1 - nearII)).add(vB.set(0, hgt, 0));
    if (!reduceMotion) camFol.y += Math.sin(t * .4) * .05;
    lookFol.copy(vA).addScaledVector(vT, 1.2);

    const w = smooth(0, 1, cur.w);
    camera.position.lerpVectors(camOver, camFol, w);
    look.lerpVectors(lookOver, lookFol, w);
    camera.lookAt(look);
    const fogD = THREE.MathUtils.lerp(.42 / dOver, .03, w);
    scene.fog.density = fogD; uniforms.uFogD.value = fogD;
    beamMat.opacity = .5 * (1 - w);

    // Ruta revelada hasta el punto actual
    tube.geometry.setDrawRange(0, Math.floor(u * TUBE_SEG) * RAD * 6);
    walker.position.copy(vA).add(vB.set(0, .12, 0));
    walker.material.opacity = smooth(.02, .2, w + (u > .001 ? .5 : 0)) * (u < .999 ? 1 : .5);
    walkerLight.position.copy(walker.position).add(vB.set(0, .3, 0));
    walker.scale.setScalar((.32 - .14 * nearII) + Math.sin(t * 2) * .02);

    // Murallas y lecho seco
    bed.material.opacity = cur.part; bed.scale.z = Math.max(cur.part, .001);
    walls.forEach(m => {
      const off = cur.part * .34;
      m.position.set(CROSS.x + GULF_D.x * off * m.userData.sgn, cur.part * .4, CROSS.y + GULF_D.y * off * m.userData.sgn);
      m.scale.y = Math.max(cur.part * .8, .001);
      m.visible = cur.part > .01;
    });

    // Etiquetas
    labels.forEach((L, i) => {
      proj.copy(L.p).project(camera);
      const vis = proj.z < 1 && Math.abs(proj.x) < 1.1 && Math.abs(proj.y) < 1.1;
      const near = Math.abs(u - stationU[i]) < .05;
      const op = vis && u < .02 ? Math.max(0, 1 - w * 2) : 0;
      L.el.style.opacity = op.toFixed(2);
      L.el.style.transform = `translate(${((proj.x + 1) / 2 * innerWidth).toFixed(1)}px,${((1 - proj.y) / 2 * innerHeight).toFixed(1)}px) translate(-50%,-100%)`;
    });

    renderer.render(scene, camera);
    if (renderMini) renderMini(t, dt);
  }
  /* ---------- Mapa 3D del final (segunda vista de la misma escena) ---------- */
  let renderMini = null;
  (function initMini() {
    const wrap = document.getElementById('mapa3d-wrap'), cv = document.getElementById('mapa3d-final');
    if (!wrap || !cv) return;
    let r2;
    try { r2 = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'low-power' }); } catch (e) { return; }
    r2.setPixelRatio(Math.min(devicePixelRatio, 2));
    r2.outputColorSpace = THREE.SRGBColorSpace; r2.toneMapping = THREE.ACESFilmicToneMapping; r2.toneMappingExposure = 1.1;
    const cam = new THREE.PerspectiveCamera(38, 1, .05, 200);
    const target = new THREE.Vector3(1.3, 0, -.3);
    let az = 0, el = .95, dist = 24, visible = false, dragging = false, lastX = 0, idle = 0;
    const size = () => { const w = wrap.clientWidth, h = wrap.clientHeight; dist = w < 480 ? 27 : 24; r2.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
    size(); addEventListener('resize', size);
    new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(wrap);

    // Arrastrar para girar (el desplazamiento vertical sigue funcionando)
    cv.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; wrap.classList.add('is-drag'); cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', e => { if (!dragging) return; az -= (e.clientX - lastX) * .009; lastX = e.clientX; idle = 0; });
    const up = () => { dragging = false; wrap.classList.remove('is-drag'); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);

    // Etiquetas pulsables (llevan a cada etapa)
    const box = document.getElementById('mapa3d-labels');
    const tags = STATIONS.map((st, k) => {
      const a = document.createElement('a'); a.className = 'm3l'; a.href = '#etapa-' + (k + 1);
      a.setAttribute('aria-label', 'Etapa ' + st.rn + ': ' + st.name);
      a.innerHTML = '<span>' + st.rn + '</span>'; box.appendChild(a);
      return { a, p: stationPts[k].clone().add(new THREE.Vector3(0, k === 7 ? 1.9 : .9, 0)) };
    });
    const pv = new THREE.Vector3();

    renderMini = (t, dt) => {
      if (!visible) return;
      idle += dt;
      if (!reduceMotion && !dragging && idle > 2.5) az += dt * .06;
      cam.position.set(target.x + Math.sin(az) * Math.cos(el) * dist, Math.sin(el) * dist, target.z + Math.cos(az) * Math.cos(el) * dist);
      cam.lookAt(target);
      // la escena compartida: ruta completa y mar abierto
      const keepBed = bed.material.opacity, keepBedS = bed.scale.z; bed.material.opacity = 1; bed.scale.z = 1;
      const keepRange = tube.geometry.drawRange.count, keepFog = scene.fog.density, keepPart = uniforms.uPart.value, keepFogU = uniforms.uFogD.value;
      tube.geometry.setDrawRange(0, Infinity); scene.fog.density = .012; uniforms.uFogD.value = .012; uniforms.uPart.value = 1;
      walls.forEach(m => { m.userData.keep = [m.position.clone(), m.scale.y, m.visible]; m.position.set(CROSS.x + GULF_D.x * .34 * m.userData.sgn, .4, CROSS.y + GULF_D.y * .34 * m.userData.sgn); m.scale.y = .8; m.visible = true; });
      beamMat.opacity = .5; walker.visible = false; walkerLight.visible = false;
      r2.render(scene, cam);
      walls.forEach(m => { const [p, sy, v] = m.userData.keep; m.position.copy(p); m.scale.y = sy; m.visible = v; });
      tube.geometry.setDrawRange(0, keepRange); scene.fog.density = keepFog; uniforms.uFogD.value = keepFogU; uniforms.uPart.value = keepPart;
      walker.visible = true; walkerLight.visible = true; bed.material.opacity = keepBed; bed.scale.z = keepBedS;
      const W = wrap.clientWidth, H = wrap.clientHeight;
      tags.forEach(tg => {
        pv.copy(tg.p).project(cam);
        const vis = pv.z < 1 && Math.abs(pv.x) < 1 && Math.abs(pv.y) < 1;
        tg.a.style.opacity = vis ? 1 : 0; tg.a.tabIndex = vis ? 0 : -1;
        tg.a.style.transform = `translate(${((pv.x + 1) / 2 * W).toFixed(1)}px,${((1 - pv.y) / 2 * H).toFixed(1)}px)`;
      });
    };
  })();

  loop();
  requestAnimationFrame(() => stageEl.classList.add('is-ready'));
}
