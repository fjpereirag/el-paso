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
  const suez = seg(x, z, -3.2, -2.5, 0.8, 8) - (0.42 + wob * .25);
  const aqaba = seg(x, z, 4.2, 1.5, 2.6, 8.5) - (0.36 + wob * .2);
  const red = seg(x, z, 1.2, 9.2, 3.6, 13) - 1.4;
  const dead = (Math.hypot((x - 7.5) / .38, (z + 5) / .9) - 1) * .38;
  const gal = (Math.hypot((x - 7.2) / .28, (z + 9.5) / .36) - 1) * .28;
  const jordan = seg(x, z, 7.22, -9.1, 7.45, -5.9) - .06;
  const nile = Math.min(seg(x, z, -7.4, 11, -7.0, -5.2) - .1, seg(x, z, -7.0, -5.2, -8.6, -6.9) - .07, seg(x, z, -7.0, -5.2, -5.7, -6.8) - .07);
  return Math.min(med, suez, aqaba, red, dead, gal, jordan, nile);
}
function height(x, z) {
  const e = smooth(9.2, 11.8, Math.max(Math.abs(x - 1), Math.abs(z)));  // el mapa se hunde en el mar por los bordes
  return heightCore(x, z) * (1 - e) - e * .45;
}
function heightCore(x, z) {
  const l = land(x, z);
  if (l < 0) return -Math.min(.36, -l * .9);          // continuo en la costa: orilla suave
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
  return new THREE.Vector3(p.x, Math.max(h, -0.3) + .045, p.z);
});
const route = new THREE.CatmullRomCurve3(samples);
const stationU = STATIONS.map(s => {
  let best = 0, bd = 1e9;
  samples.forEach((p, k) => { const d = Math.hypot(p.x - s.xz[0], p.z - s.xz[1]); if (d < bd) { bd = d; best = k; } });
  return best / SAMPLES;
});

// Mapa SVG: misma ruta y estaciones
(function drawSvg() {
  const P = (x, z) => `${(x * 10 + 100).toFixed(1)} ${(z * 10 + 100).toFixed(1)}`;
  const d = 'M' + route2.getSpacedPoints(120).map(p => P(p.x, p.z)).join(' L');
  const path = document.getElementById('ruta-svg');
  if (path) path.setAttribute('d', d);
  // Relieve rasterizado con las mismas funciones del 3D
  const img = document.getElementById('mapa-img');
  if (img) {
    const N = 320, c = document.createElement('canvas'); c.width = c.height = N;
    const ctx = c.getContext('2d'), id = ctx.createImageData(N, N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const x = i / N * 20 - 10, z = j / N * 20 - 10, h = height(x, z), k = (j * N + i) * 4;
      let r, g2, b2;
      if (h < 0) { r = 15; g2 = 27; b2 = 32; }
      else {
        const sh = (height(x + .06, z + .06) - h) * -260;            // sombreado de ladera
        const t = Math.min(1, h / 1.3);
        r = 58 + t * 80 + sh; g2 = 46 + t * 62 + sh; b2 = 30 + t * 36 + sh * .7;
      }
      id.data[k] = r; id.data[k + 1] = g2; id.data[k + 2] = b2; id.data[k + 3] = 255;
    }
    ctx.putImageData(id, 0, 0);
    img.setAttribute('href', c.toDataURL('image/png'));
  }
  const g = document.getElementById('st-svg');
  if (g) g.innerHTML = STATIONS.map(s => {
    const cx = s.xz[0] * 10 + 100, cy = s.xz[1] * 10 + 100;
    return `<circle cx="${cx}" cy="${cy}" r="3.2" fill="#C9A35B"/><text x="${cx + s.lab[0]}" y="${cy + s.lab[1]}">${s.rn}</text>`;
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
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const BG = new THREE.Color('#0B0A08');
  scene.background = BG;
  scene.fog = new THREE.FogExp2(BG, .028);

  const camera = new THREE.PerspectiveCamera(40, 1, .05, 200);

  // Luces: luna cálida + cielo nocturno
  scene.add(new THREE.HemisphereLight('#3a3a52', '#1a120a', .9));
  const moon = new THREE.DirectionalLight('#f3d9a4', 2.4);
  moon.position.set(-6, 9, -4);
  scene.add(moon);
  const rim = new THREE.DirectionalLight('#7a8cb0', .5);
  rim.position.set(8, 4, 10);
  scene.add(rim);

  // Terreno
  const SEG = mobile ? 150 : 220, SIZE = 24;
  const WATER = 90;
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const cSand = new THREE.Color('#5a4527'), cHigh = new THREE.Color('#a4834f'), cGreen = new THREE.Color('#34401f'),
    cBed = new THREE.Color('#141c1c'), cShore = new THREE.Color('#2a2418'), tmp = new THREE.Color();
  for (let k = 0; k < pos.count; k++) {
    const x = pos.getX(k), z = pos.getZ(k);
    const h = height(x, z), l = land(x, z);
    pos.setY(k, h);
    if (l < 0 || h < -.02) tmp.copy(cBed);
    else {
      tmp.copy(cSand).lerp(cHigh, smooth(.15, 1.3, h));
      const nileD = Math.min(seg(x, z, -7.4, 11, -7.0, -5.2), seg(x, z, -7.0, -5.2, -8.6, -6.9), seg(x, z, -7.0, -5.2, -5.7, -6.8));
      const jorD = seg(x, z, 7.22, -9.1, 7.45, -5.9);
      tmp.lerp(cGreen, Math.max(1 - smooth(.1, .9, nileD), (1 - smooth(.05, .5, jorD)) * .8, smooth(-4, -9, z) * smooth(4.5, 6.5, x) * .5));
      tmp.lerp(cShore, 1 - smooth(0, .18, l));
      tmp.multiplyScalar(.9 + fbm(x * 3, z * 3) * .25);
    }
    colors.set([tmp.r, tmp.g, tmp.b], k * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const terrainGeo = geo.toNonIndexed();
  terrainGeo.computeVertexNormals();
  const terrain = new THREE.Mesh(terrainGeo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .95, metalness: 0 }));
  scene.add(terrain);

  // Agua con el paso abierto
  const uniforms = {
    uTime: { value: 0 }, uPart: { value: 0 },
    uC: { value: CROSS }, uD: { value: GULF_D }, uN: { value: GULF_N },
    uFog: { value: BG }, uFogD: { value: .028 },
  };
  const water = new THREE.Mesh(new THREE.PlaneGeometry(WATER, WATER, 1, 1).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false,
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `
      uniform float uTime,uPart,uFogD; uniform vec2 uC,uD,uN; uniform vec3 uFog; varying vec3 vW;
      float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
      void main(){
        vec2 p=vW.xz; vec2 q=p-uC;
        float s=dot(q,uD), a=dot(q,uN);
        if(abs(s)<uPart*.34 && abs(a)<.95) discard;
        float w=n(p*1.6+vec2(uTime*.12,uTime*.06))*.65+n(p*4.-uTime*.15)*.35;
        vec3 deep=vec3(.025,.05,.065), lite=vec3(.055,.11,.13);
        vec3 c=mix(deep,lite,w);
        c+=vec3(.79,.64,.36)*pow(w,6.)*.55;
        float d=length(cameraPosition-vW);
        c=mix(c,uFog,1.-exp(-uFogD*uFogD*d*d));
        gl_FragColor=vec4(c,.86);
        #include <colorspace_fragment>
      }`,
  }));
  water.position.y = 0.0;
  scene.add(water);

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
        vec3 c=mix(vec3(.012,.03,.042),vec3(.04,.09,.11),vUv.y*.8+flow*.35);
        c+=vec3(.10,.16,.17)*streak*vUv.y;
        float crest=smoothstep(.93,1.,vUv.y);
        c=mix(c,vec3(.79,.64,.36),crest*.6);
        float edge=smoothstep(0.,.12,vUv.x)*smoothstep(1.,.88,vUv.x);
        gl_FragColor=vec4(c,(.55+.35*vUv.y)*edge*smoothstep(0.,.15,uPart));
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
  const tube = new THREE.Mesh(tubeGeo, new THREE.MeshBasicMaterial({ color: '#e0b96a', fog: true }));
  scene.add(tube);
  const ghostGeo = new THREE.TubeGeometry(route, 300, .012, 4, false);
  const ghost = new THREE.Mesh(ghostGeo, new THREE.MeshBasicMaterial({ color: '#C9A35B', transparent: true, opacity: .22 }));
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
  const beamMat = new THREE.MeshBasicMaterial({ color: '#C9A35B', transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false });
  stationPts.forEach(p => {
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, 1.4, 6, 1, true), beamMat);
    beam.position.set(p.x, p.y + .7, p.z);
    scene.add(beam);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .8 }));
    halo.position.set(p.x, p.y + .05, p.z); halo.scale.setScalar(.55);
    scene.add(halo);
  });

  // Estrellas
  const starN = mobile ? 900 : 1600, sp = new Float32Array(starN * 3);
  for (let k = 0; k < starN; k++) {
    const th = Math.random() * Math.PI * 2, ph = Math.random() * Math.PI * .45;
    sp.set([Math.cos(th) * Math.sin(ph) * 70, Math.cos(ph) * 70 * .6 + 4, Math.sin(th) * Math.sin(ph) * 70], k * 3);
  }
  const starGeo = new THREE.BufferGeometry(); starGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: '#efe4c8', size: mobile ? .22 : .18, sizeAttenuation: true, fog: false, transparent: true, opacity: .8 })));

  // Etiquetas HTML proyectadas
  const labelsEl = document.getElementById('labels');
  const labels = STATIONS.map((s, k) => {
    const el = document.createElement('div'); el.className = 'lbl';
    el.innerHTML = `<b>${s.rn}</b><span>${s.name}</span>`;
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
    const hgt = 5.6 - 3.7 * nearII * cur.part, back = 3.4 - 0.4 * nearII * cur.part;
    const side = new THREE.Vector3(-vT.z, 0, vT.x);
    camFol.copy(vA).addScaledVector(vT, -back).addScaledVector(side, .9 * (1 - nearII)).add(vB.set(0, hgt, 0));
    if (!reduceMotion) camFol.y += Math.sin(t * .4) * .05;
    lookFol.copy(vA).addScaledVector(vT, 1.2);

    const w = smooth(0, 1, cur.w);
    camera.position.lerpVectors(camOver, camFol, w);
    look.lerpVectors(lookOver, lookFol, w);
    camera.lookAt(look);
    const fogD = THREE.MathUtils.lerp(.6 / dOver, .045, w);
    scene.fog.density = fogD; uniforms.uFogD.value = fogD;
    beamMat.opacity = .5 * (1 - w);

    // Ruta revelada hasta el punto actual
    tube.geometry.setDrawRange(0, Math.floor(u * TUBE_SEG) * RAD * 6);
    walker.position.copy(vA).add(vB.set(0, .12, 0));
    walker.material.opacity = smooth(.02, .2, w + (u > .001 ? .5 : 0)) * (u < .999 ? 1 : .5);
    walkerLight.position.copy(walker.position).add(vB.set(0, .3, 0));
    walker.scale.setScalar((.32 - .14 * nearII) + Math.sin(t * 2) * .02);

    // Murallas
    walls.forEach(m => {
      const off = cur.part * .34;
      m.position.set(CROSS.x + GULF_D.x * off * m.userData.sgn, -.32 + cur.part * 1.0 * .5, CROSS.y + GULF_D.y * off * m.userData.sgn);
      m.scale.y = Math.max(cur.part * 1.0, .001);
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
  }
  loop();
  requestAnimationFrame(() => stageEl.classList.add('is-ready'));
}
