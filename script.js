/* ==========================================================================
   KANKI — Intro cinématique en 3D (Three.js)
   --------------------------------------------------------------------------
   Déroulé :
     1. Apparition    : le samouraï sort de la brume rouge, la caméra avance.
     2. Préparation   : il relève la tête (yeux rouges), se tourne, lève le
                        katana qui s'illumine de la garde jusqu'à la pointe.
     3. Tracé du K    : deux coups de lame dessinent un K de néon dans l'air.
     4. Révélation    : flash, onde de choc, gerbe d'étincelles.
     5. KANKI         : le K se solidifie et devient la 1re lettre de KANKI,
                        les autres lettres arrivent, puis la lame coupe le nom.
     6. Transition    : flash rouge/blanc, arrivée sur le site.

   Tout ce qui se règle facilement (couleurs, timings, position du K…) est
   regroupé dans REGLAGES, juste en dessous.
   ========================================================================== */
(function () {
'use strict';

/* ==========================================================================
   1. RÉGLAGES
   ========================================================================== */
const REGLAGES = {

  /* Couleurs de la scène (format CSS) */
  couleurs: {
    ciel:     '#0c0204',  // fond et brouillard lointain
    brume:    '#2a050a',  // teinte du brouillard
    brumeVive:'#6e0a14',  // brouillard éclairé par le soleil
    soleil:   '#ff2414',  // le grand soleil rouge derrière le samouraï
    neon:     '#ff1a2c',  // traînée du katana, contour des lettres
    blancChaud:'#ffd6cf', // cœur « chauffé à blanc » de la traînée
    braise:   '#ff5a28',  // braises qui montent
    contreJour:'#ff1e2e', // lumière rouge derrière le samouraï
    yeux:     '#ff1626'   // yeux du masque
  },

  /* Timeline en secondes (chaque étape démarre à ce moment-là) */
  temps: {
    apparition:     0.3,   // la brume se lève
    regard:         2.3,   // il relève la tête, les yeux s'allument
    preparation:    3.4,   // il se tourne et lève le katana
    lameIllumine:   3.9,   // le katana s'illumine (garde → pointe)
    trait1:         5.37,  // 1er coup : la barre verticale du K
    trait2:         6.35,  // 2e coup : le « < » du K
    revelationK:    7.0,   // flash + onde de choc + étincelles
    transformation: 7.75,  // le K devient la 1re lettre de KANKI
    lettres:        8.25,  // A, N, K, I arrivent une à une
    coupeFinale:    9.2,   // la lame coupe le nom en deux
    sortie:         10.9,  // flash rouge/blanc
    fin:            11.25  // arrivée sur le site
  },

  /* Durées des deux coups de lame (en secondes) */
  durees: { trait1: 0.25, trait2: 0.5, ecartLettres: 0.13 },

  /* Le K tracé dans l'air (coordonnées 3D, en mètres) */
  K: {
    centre:  [0.0, 1.47, 1.3],  // x (gauche/droite), y (hauteur), z (vers la caméra)
    hauteur: 1.5                // taille du K
  },

  /* Le titre KANKI une fois formé */
  titre: {
    centre:  [0.0, 1.45, 1.3],
    hauteur: 0.8,               // hauteur des lettres
    epaisseur: 0.14             // profondeur des lettres en 3D
  },

  /* Effets */
  effets: {
    bloom:        0.8,   // intensité du halo lumineux
    tremblement:  1.0,   // force des vibrations de caméra (0 = aucune)
    braises:      900,   // nombre de braises (divisé par ~3 sur mobile)
    reflets:      true   // reflets sur le sol mouillé (ordinateur uniquement)
  },

  /* Le samouraï : un vrai modèle 3D au format .glb */
  modele: {
    // ⚠️ CHEMIN VERS TON FICHIER .glb ICI (relatif à index.html)
    fichier: 'modeles/samourai.glb',
    hauteur: 2.05,          // taille du personnage en mètres, casque compris (même gabarit que l'ancien)
    rotationY: 0,           // en radians : mets Math.PI s'il tourne le dos à la caméra
    decalage: [0, 0, 0],    // petit ajustement de position [x, y, z] en mètres
    reflets: 0.7,           // force des reflets de la scène sur ses matériaux
    animations: {           // noms (ou morceaux de noms) des animations du .glb
      attente: 'idle|attente|stand|breath|ready',
      // CORRECTIF BUG 2 : l'attaque Mixamo (« Slash ») est désactivée. Elle a sa propre trajectoire
      // (le corps s'accroupit et frappe vers le bas) qui contredisait le tracé du K : les bras
      // étaient tirés dans deux directions et le katana sautait d'une position à l'autre.
      // Le coup est maintenant donné par le code (buste, élan, bras). Pour la réactiver : 'slash'.
      attaque: ''
    },
    vitesseAttaque: 1.0,    // vitesse de lecture de l'animation de coup
    avanceAttaque: 0.3,     // l'animation démarre ce nombre de secondes avant chaque coup du K
    katana: 'auto',         // 'auto' : le katana du modèle s'il en a un, sinon le mien · 'perso' : toujours le mien
    inverserKatana: false,  // si le katana du modèle se retrouve à l'envers, passe à true
    bras: true,             // les mains suivent le katana (si le modèle a un squelette)
    yeux: { afficher: true, hauteur: -0.07, avance: 0.15, ecart: 0.033 },  // yeux rouges, par rapport à l'os de la tête (réglés pour Death Samurai)
    // Crédit obligatoire pour un modèle sous licence CC BY (affiché en bas du site). Mets null si CC0.
    credit: { texte: 'Modèle 3D « Death Samurai Character » par Alexandru Jardan · CC BY 4.0', lien: 'https://sketchfab.com/3d-models/death-samurai-character-6e0a7667723747e0972488085f877bd6' }
  }
};

/* Formes des lettres KANKI (générées une fois, taillées « à la lame »).
   haut / bas : les deux moitiés de chaque lettre, séparées par la coupe finale.
   traceK : le chemin suivi par la pointe du katana pour dessiner le K. */
const GLYPHES = {"largeur":4.6274,"coupe":[[-0.3,0.18],[4.927415379351628,0.8]],"lettres":[{"n":"K","haut":[{"o":[[0.2828,0.3138],[0.2732,0.2661],[0.0479,0.2394],[0.2,1.0],[0.42,1.0],[0.3498,0.6492],[0.7103,1.0],[0.9959,1.0],[0.6111,0.6256],[0.7391,0.3214],[0.4925,0.2921],[0.4274,0.4468],[0.2867,0.3099]],"h":[]}],"bas":[{"o":[[0.0,0.0],[0.0405,0.2023],[0.2658,0.229],[0.22,0.0]],"h":[]},{"o":[[0.6154,0.0],[0.507,0.2576],[0.7536,0.2868],[0.8743,0.0]],"h":[]}],"cx":0.4401},{"n":"A","haut":[{"o":[[1.848,1.0],[1.9111,0.4604],[1.6835,0.4334],[1.6458,0.7559],[1.4657,0.4076],[1.2199,0.3784],[1.5412,1.0]],"h":[]}],"bas":[{"o":[[1.0243,0.0],[1.1999,0.3398],[1.4969,0.375],[1.6903,0.375],[1.6877,0.3976],[1.9153,0.4246],[1.9649,0.0],[1.7342,0.0],[1.7079,0.225],[1.3714,0.225],[1.2551,0.0]],"h":[]}],"cx":1.5889},{"n":"N","haut":[{"o":[[2.594,1.0],[2.5891,0.9755],[2.7768,0.5631],[2.5273,0.5335],[2.5088,0.574],[2.5001,0.5302],[2.2747,0.5035],[2.356,0.9098],[2.3149,1.0]],"h":[]},{"o":[[3.174,1.0],[3.0942,0.6007],[2.8688,0.574],[2.954,1.0]],"h":[]}],"bas":[{"o":[[2.8614,0.5368],[3.0867,0.5636],[2.9921,0.0902],[3.0331,0.0],[2.754,0.0],[2.7589,0.0245],[2.5429,0.4991],[2.7925,0.5287],[2.8392,0.426]],"h":[]},{"o":[[2.174,0.0],[2.2673,0.4664],[2.4926,0.4931],[2.394,0.0]],"h":[]}],"cx":2.6741},{"n":"K","haut":[{"o":[[3.6031,1.0],[3.5337,0.6528],[3.3083,0.6261],[3.3831,1.0]],"h":[]},{"o":[[4.179,1.0],[3.8623,0.6918],[3.5371,0.6532],[3.8934,1.0]],"h":[]}],"bas":[{"o":[[3.4659,0.3138],[3.4031,0.0],[3.1831,0.0],[3.3009,0.589],[3.8199,0.6505],[3.7942,0.6256],[4.0574,0.0],[3.7985,0.0],[3.6105,0.4468],[3.4698,0.3099]],"h":[]}],"cx":3.6238},{"n":"I","haut":[{"o":[[4.5829,0.7773],[4.3575,0.7505],[4.4074,1.0],[4.6274,1.0]],"h":[]}],"bas":[{"o":[[4.2074,0.0],[4.3501,0.7134],[4.5754,0.7401],[4.4274,0.0]],"h":[]}],"cx":4.4155}],"traceK":{"trait1":[[0.31,1.0],[0.11,0.0]],"trait2":[[0.8531,1.0],[0.441,0.555],[0.7448,0.0]]}};

/* ==========================================================================
   2. OUTILS
   ========================================================================== */
const $ = (s) => document.querySelector(s);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const plage = (t, a, b) => clamp((t - a) / (b - a));                 // 0→1 entre a et b
const lisse = (t) => t * t * (3 - 2 * t);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeIn = (t) => t * t * t;
const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const easeOutBack = (t) => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const sinus = (t) => 0.5 - 0.5 * Math.cos(Math.PI * t);

const MOBILE = Math.min(innerWidth, innerHeight) < 600 || matchMedia('(pointer: coarse)').matches;
const REDUIT = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* SVG du mot KANKI, tracé à partir des mêmes formes que la 3D (pour le site) */
function svgGlyphes(lettres, decalage, attrs = 'class="glyphe"') {
  const c = GLYPHES.coupe, dx = c[1][0] - c[0][0], dy = c[1][1] - c[0][1], n = Math.hypot(dx, dy);
  const ox = (dx / n) * decalage, oy = (dy / n) * decalage;
  let d = '', minX = Infinity, maxX = -Infinity;
  const chemin = (p, ex, ey) => {
    const anneau = (pts) => 'M' + pts.map(([x, y]) => { minX = Math.min(minX, x + ex); maxX = Math.max(maxX, x + ex); return (x + ex).toFixed(4) + ' ' + (1 - (y + ey)).toFixed(4); }).join('L') + 'Z';
    return anneau(p.o) + p.h.map(anneau).join('');
  };
  lettres.forEach((l) => {
    l.haut.forEach((p) => { d += chemin(p, ox, oy); });
    l.bas.forEach((p) => { d += chemin(p, 0, 0); });
  });
  const pad = 0.05;
  return `<svg viewBox="${(minX - pad).toFixed(3)} ${(-pad - 0.05).toFixed(3)} ${(maxX - minX + pad * 2).toFixed(3)} ${(1 + pad * 2 + 0.05).toFixed(3)}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMid meet"><path ${attrs} fill-rule="evenodd" d="${d}"/></svg>`;
}

/* ==========================================================================
   3. INTERFACE (fonctionne même sans 3D)
   ========================================================================== */
const corps = document.body;
const intro = $('#intro'), chargement = $('#chargement'), sousTitre = $('#sous-titre');
const flash = $('#flash'), progres = $('#progres'), btnPasser = $('#passer'), btnSon = $('#son');

$('#hero-kanki').innerHTML = svgGlyphes(GLYPHES.lettres, 0.045);
if (REGLAGES.modele.credit) {                            // crédit du modèle 3D (licence CC BY)
  const credit = document.createElement('a');
  credit.href = REGLAGES.modele.credit.lien; credit.target = '_blank'; credit.rel = 'noopener';
  credit.textContent = REGLAGES.modele.credit.texte;
  credit.style.cssText = 'letter-spacing:.04em;text-transform:none;opacity:.75';
  $('.pied-site').insertBefore(credit, $('.pied-site').lastElementChild);
}
$('#logo-k').innerHTML = svgGlyphes([GLYPHES.lettres[0]], 0.045, 'fill="#0d0306" stroke="#ff1f35" stroke-width=".05"');

/* ─── Sections du site ─── */
// Apparition au défilement
{
  let cibles = [...document.querySelectorAll('.apparait')];
  let attente = false;
  const reveler = () => {
    attente = false;
    cibles = cibles.filter((e) => { if (REDUIT || e.getBoundingClientRect().top < innerHeight * 0.92) { e.classList.add('vu'); return false; } return true; });
  };
  addEventListener('scroll', () => { if (!attente) { attente = true; requestAnimationFrame(reveler); } }, { passive: true });
  addEventListener('resize', reveler); reveler();
}
// En-tête foncé dès qu'on descend
{
  const entete = $('#entete');
  const maj = () => entete.classList.toggle('fonce', scrollY > 40);
  addEventListener('scroll', maj, { passive: true }); maj();
}
// Cartes des travaux qui s'inclinent sous la souris
if (!REDUIT && matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll('[data-incline]').forEach((c) => {
    c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.transition = 'transform .08s, box-shadow .5s';
      c.style.transform = `rotateY(${(x - 0.5) * 10}deg) rotateX(${(0.5 - y) * 8}deg)`;
      c.style.setProperty('--mx', x * 100 + '%'); c.style.setProperty('--my', y * 100 + '%');
    });
    c.addEventListener('pointerleave', () => { c.style.transition = ''; c.style.transform = ''; });
  });
}
// Copier l'adresse mail (méthode moderne, puis ancienne en secours pour les navigateurs intégrés)
{
  const btn = $('#copier'), mail = $('#email').textContent.trim();
  const dire = (t) => { btn.textContent = t; setTimeout(() => { btn.textContent = 'Copier'; }, 1800); };
  const ancien = () => {
    const t = document.createElement('textarea'); t.value = mail; t.setAttribute('readonly', '');
    t.style.cssText = 'position:fixed;top:0;opacity:0;font-size:16px'; document.body.appendChild(t);
    t.select(); t.setSelectionRange(0, mail.length); let ok = false; try { ok = document.execCommand('copy'); } catch (e) {} t.remove(); return ok;
  };
  btn.addEventListener('click', () => {
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(mail).then(() => dire('Copié ✓'), () => dire(ancien() ? 'Copié ✓' : 'Appui long'));
    else dire(ancien() ? 'Copié ✓' : 'Appui long');
  });
}

/* ─── Son (synthétisé en direct, aucun fichier) ─── */
const Son = {
  ctx: null, sortie: null, bruit: null, actif: false, nappe: null,
  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    this.ctx = new AC();
    const comp = this.ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    this.sortie = this.ctx.createGain(); this.sortie.gain.value = 0.0;
    this.sortie.connect(comp); comp.connect(this.ctx.destination);
    const n = this.ctx.sampleRate * 2, b = this.ctx.createBuffer(1, n, this.ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    this.bruit = b;
  },
  basculer() {
    this.init(); if (!this.ctx) return false;
    this.actif = !this.actif;
    this.ctx.resume();
    const now = this.ctx.currentTime;
    this.sortie.gain.cancelScheduledValues(now);
    this.sortie.gain.setTargetAtTime(this.actif ? 0.85 : 0, now, 0.15);
    if (this.actif && !this.nappe) this.lancerNappe();
    return this.actif;
  },
  /* Nappe grave continue */
  lancerNappe() {
    const c = this.ctx, g = c.createGain(), f = c.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 180; f.Q.value = 6;
    g.gain.value = 0.16;
    [55, 55.35, 82.4].forEach((hz, i) => {
      const o = c.createOscillator(); o.type = i === 2 ? 'sine' : 'sawtooth'; o.frequency.value = hz; o.connect(f); o.start();
    });
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 70; lfo.connect(lg); lg.connect(f.frequency); lfo.start();
    f.connect(g); g.connect(this.sortie); this.nappe = g;
  },
  pret() { return this.actif && this.ctx; },
  souffle(duree = 0.35, f0 = 300, f1 = 2600, vol = 0.55) {        // « fffshh » de la lame
    if (!this.pret()) return; const c = this.ctx, t = c.currentTime;
    const s = c.createBufferSource(); s.buffer = this.bruit;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(f0, t); bp.frequency.exponentialRampToValueAtTime(f1, t + duree * 0.55); bp.frequency.exponentialRampToValueAtTime(f0 * 1.5, t + duree);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + duree * 0.45); g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
    s.connect(bp); bp.connect(g); g.connect(this.sortie); s.start(t); s.stop(t + duree + 0.05);
  },
  tinte(vol = 0.18, base = 1960) {                                 // « shiiing » métallique
    if (!this.pret()) return; const c = this.ctx, t = c.currentTime;
    [1, 1.41, 2.0, 2.76, 3.9].forEach((r, i) => {
      const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = base * r * (1 + (Math.random() - 0.5) * 0.004);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol / (i + 1), t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8 - i * 0.25);
      o.connect(g); g.connect(this.sortie); o.start(t); o.stop(t + 2);
    });
  },
  impact(vol = 0.9) {                                              // « boum » grave
    if (!this.pret()) return; const c = this.ctx, t = c.currentTime;
    const o = c.createOscillator(), g = c.createGain(); o.type = 'sine';
    o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(30, t + 0.7);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    o.connect(g); g.connect(this.sortie); o.start(t); o.stop(t + 1.5);
    const s = c.createBufferSource(); s.buffer = this.bruit; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
    const g2 = c.createGain(); g2.gain.setValueAtTime(0.5, t); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    s.connect(lp); lp.connect(g2); g2.connect(this.sortie); s.start(t); s.stop(t + 0.6);
  }
};
btnSon.addEventListener('click', () => {
  const on = Son.basculer();
  btnSon.setAttribute('aria-pressed', on ? 'true' : 'false');
  btnSon.setAttribute('aria-label', on ? 'Couper le son' : 'Activer le son');
});

/* ─── Passer au site (sans 3D, ou si l'intro ne peut pas tourner) ─── */
let scene3D = null;                    // rempli quand Three.js est prêt
function afficherSiteDirect() {
  chargement.classList.add('fini');
  corps.classList.remove('en-intro'); corps.classList.add('en-site');
}

/* ==========================================================================
   4. SCÈNE 3D
   ========================================================================== */
async function demarrer3D() {
  const THREE = await import('three');
  const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }, { ShaderPass }, { Reflector }, { GLTFLoader }, { DRACOLoader }, { MeshoptDecoder }] = await Promise.all([
    import('three/addons/postprocessing/EffectComposer.js'),
    import('three/addons/postprocessing/RenderPass.js'),
    import('three/addons/postprocessing/UnrealBloomPass.js'),
    import('three/addons/postprocessing/OutputPass.js'),
    import('three/addons/postprocessing/ShaderPass.js'),
    import('three/addons/objects/Reflector.js'),
    import('three/addons/loaders/GLTFLoader.js'),
    import('three/addons/loaders/DRACOLoader.js'),
    import('three/addons/libs/meshopt_decoder.module.js')
  ]);

  const V3 = THREE.Vector3;
  const v = (a) => new V3(a[0], a[1], a[2]);
  const C = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);
  const COUL = REGLAGES.couleurs, T = REGLAGES.temps;

  /* ─── Moteur de rendu ─── */
  const canvas = $('#scene');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
  const PR = Math.min(devicePixelRatio, MOBILE ? 1.3 : 1.75);
  renderer.setPixelRatio(PR);
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COUL.ciel);
  const brouillard = new THREE.FogExp2(new THREE.Color(COUL.ciel), 0.075);
  scene.fog = brouillard;

  const camera = new THREE.PerspectiveCamera(34, innerWidth / innerHeight, 0.05, 80);

  /* ─── Environnement pour les reflets du métal et de la laque ─── */
  {
    const env = new THREE.Scene();
    const panneau = (w, h, couleur, k, pos, rotY = 0, rotX = 0) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: C(couleur, k), side: THREE.DoubleSide }));
      m.position.set(...pos); m.rotation.set(rotX, rotY, 0); env.add(m);
    };
    panneau(14, 6, '#ff1f2a', 3.0, [0, 2, -6]);                   // grand rouge derrière
    panneau(4, 10, '#ff3020', 1.6, [-6, 2, -1], Math.PI / 2);     // bandes latérales
    panneau(4, 10, '#ff3020', 1.2, [6, 2, -1], -Math.PI / 2);
    panneau(10, 3, '#ffd8cc', 0.35, [0, 6, 2], 0, Math.PI / 2);   // léger plafond chaud
    panneau(2.5, 0.6, '#ffffff', 2.0, [3, 2.5, 5], Math.PI);       // reflet net sur l'avant
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(env, 0.035).texture;
  }

  /* ─── Matériaux du katana ─── */
  const MAT = {
    laqueRouge: new THREE.MeshPhysicalMaterial({ color: 0x2c0408, roughness: 0.38, metalness: 0.2, clearcoat: 0.9, clearcoatRoughness: 0.2, envMapIntensity: 0.9, side: THREE.DoubleSide }),
    or: new THREE.MeshStandardMaterial({ color: 0xa47a3a, roughness: 0.26, metalness: 1, envMapIntensity: 1.25, side: THREE.DoubleSide }),
    noir: new THREE.MeshBasicMaterial({ color: 0x000000 })
  };
  const piece = (geo, mat, parent, pos = [0, 0, 0], rot = [0, 0, 0], sc = [1, 1, 1]) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...pos); m.rotation.set(...rot); m.scale.set(...sc);
    m.castShadow = true; m.receiveShadow = true;
    parent.add(m); return m;
  };

  /* ==========================================================================
     5. LE SAMOURAÏ : modèle 3D .glb chargé avec GLTFLoader
     --------------------------------------------------------------------------
     « samourai » est le point d'ancrage dans la scène (au sol, face à la
     caméra). Le modèle y est placé, mis à l'échelle et posé au sol tout seul.
     ========================================================================== */
  const samourai = new THREE.Group();
  scene.add(samourai);
  const mouvement = new THREE.Group();      // petits mouvements ajoutés par le code (balancement, élan)
  samourai.add(mouvement);
  const MODELE = REGLAGES.modele;

  // Tout ce qu'on sait du personnage une fois chargé
  const perso = {
    charge: false,        // le .glb est chargé
    rig: false,           // il a un squelette avec des bras exploitables
    os: {},               // os retrouvés : tête, buste, bras droit / gauche…
    repos: new Map(),     // orientation de repos des os qu'on modifie
    mixer: null, actions: {},
    tientKatana: false    // les mains tiennent le katana (cinématique inverse)
  };

  /* Les yeux rouges (posés sur la tête du modèle) */
  const yeuxGroupe = new THREE.Group();
  samourai.add(yeuxGroupe);
  const yeux = [];
  {
    const geoOeil = new THREE.BoxGeometry(0.038, 0.008, 0.008);
    [-1, 1].forEach((s) => {
      const o = new THREE.Mesh(geoOeil, new THREE.MeshBasicMaterial({ color: C(COUL.yeux, 0), toneMapped: false }));
      o.position.set(s * MODELE.yeux.ecart, 0, 0); o.rotation.set(0, s * 0.35, s * 0.3);
      yeuxGroupe.add(o); yeux.push(o);
    });
  }

  /* Chargement du .glb (avec prise en charge des fichiers compressés Draco / Meshopt) */
  const texteChargement = document.querySelector('.chargement-texte');
  async function chargerModele() {
    // ⚠️ CHEMIN VERS TON FICHIER .glb ICI  →  REGLAGES.modele.fichier (tout en haut du fichier)
    const chemin = MODELE.fichier;
    const loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/gltf/');
    loader.setDRACOLoader(draco);
    loader.setMeshoptDecoder(MeshoptDecoder);
    try {
      const gltf = await loader.loadAsync(chemin, (e) => {
        if (e.lengthComputable && texteChargement) texteChargement.textContent = 'Chargement ' + Math.round((e.loaded / e.total) * 100) + ' %';
      });
      if (texteChargement) texteChargement.textContent = 'Chargement';
      return gltf;
    } catch (err) {
      const adresse = new URL(chemin, location.href).href;
      console.error(
        '%c KANKI · le modèle du samouraï n\'a pas pu être chargé %c\n\n' +
        'Fichier cherché : ' + adresse + '\n\n' +
        'À vérifier :\n' +
        '  1. le fichier existe bien à cet endroit (REGLAGES.modele.fichier, en haut de script.js) ;\n' +
        '  2. le site est ouvert avec lancer.bat (http://localhost:3000) : en double-cliquant index.html,\n' +
        '     le navigateur bloque le chargement des fichiers .glb ;\n' +
        '  3. le fichier est bien un .glb (glTF binaire), pas un .fbx ou un .blend.\n\n' +
        'L\'intro continue sans personnage (le K se trace quand même).',
        'background:#ff1f35;color:#fff;font-weight:700;padding:3px 8px;border-radius:3px', '', err);
      if (texteChargement) texteChargement.textContent = 'Chargement';
      return null;
    }
  }

  /* Outils pour retrouver les os, quel que soit le logiciel d'origine
     (Mixamo « mixamorig:RightArm », Blender « upper_arm.R », 3ds Max « Bip001 R UpperArm »…) */
  const normaliser = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const NOMS_OS = (cote) => {
    const c = cote === 'd' ? ['right', 'r'] : ['left', 'l'];
    const [mot, l] = c;
    return {
      avant: [mot + 'forearm', 'forearm' + l, l + 'forearm', 'lowerarm' + l, mot + 'lowerarm', l + 'lowerarm', 'forearm' + mot, 'lowarm' + l, 'elbow' + l, mot + 'elbow'],
      haut: [mot + 'arm', mot + 'upperarm', 'upperarm' + l, l + 'upperarm', 'uparm' + l, 'upperarm' + mot, 'arm' + l, l + 'arm'],
      main: [mot + 'hand', 'hand' + l, l + 'hand', 'hand' + mot, 'wrist' + l, mot + 'wrist']
    };
  };
  function trouverTous(objets, fins, exclure = []) {
    const res = [];
    fins.forEach((f) => objets.forEach((x) => {
      const n = normaliser(x.name);
      if (n.endsWith(f) && !exclure.some((e) => n.endsWith(e)) && !res.includes(x)) res.push(x);
    }));
    return res;
  }
  const trouverOs = (objets, fins, exclure = []) => trouverTous(objets, fins, exclure)[0] || null;
  const descendDe = (enfant, parent) => { for (let o = enfant.parent; o; o = o.parent) if (o === parent) return true; return false; };

  /* Bloque le déplacement au sol des animations (sinon le personnage « glisse » hors de sa place) */
  function figerDeplacement(clip) {
    clip.tracks.forEach((piste) => {
      const [noeud, prop] = piste.name.split('.');
      if (prop !== 'position' || !/(hips|pelvis|root)$/.test(normaliser(noeud))) return;
      const v = piste.values;
      for (let i = 3; i < v.length; i += 3) { v[i] = v[0]; v[i + 2] = v[2]; }
    });
    return clip;
  }

  /* Le katana du modèle (s'il en a un) : repéré par son nom */
  const NOM_KATANA = /katana|sword|blade|weapon|tachi|uchigatana|epee|tsurugi/i;
  const PAS_KATANA = /saya|scabbard|sheath|fourreau|holster|belt|obi/i;
  const nomComplet = (o) => [o.name, ...(Array.isArray(o.material) ? o.material : [o.material]).map((m) => m && m.name)].join(' ');

  /* Récupère la géométrie du katana du modèle et l'aligne sur le mien :
     garde (tsuba) à l'origine de la poignée, lame vers +Y, même longueur. */
  function adopterKatana(mesh) {
    mesh.updateWorldMatrix(true, false);
    const geo = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
    geo.applyMatrix4(new THREE.Matrix4().copy(samourai.matrixWorld).invert());
    const p = geo.attributes.position, n = p.count, c = new V3();
    for (let i = 0; i < n; i++) c.add(new V3().fromBufferAttribute(p, i));
    c.divideScalar(n);
    // Axe principal (la longueur de la lame) par itération de puissance sur la covariance
    const cov = [0, 0, 0, 0, 0, 0, 0, 0, 0], q = new V3();
    for (let i = 0; i < n; i++) {
      q.fromBufferAttribute(p, i).sub(c);
      cov[0] += q.x * q.x; cov[1] += q.x * q.y; cov[2] += q.x * q.z; cov[4] += q.y * q.y; cov[5] += q.y * q.z; cov[8] += q.z * q.z;
    }
    cov[3] = cov[1]; cov[6] = cov[2]; cov[7] = cov[5];
    const M3 = new THREE.Matrix3().fromArray(cov);
    const axe = new V3(1, 0.3, 0.2).normalize();
    for (let k = 0; k < 40; k++) axe.applyMatrix3(M3).normalize();
    // Tranches le long de l'axe : la plus large = la garde, côté poignée
    const NB = 32; let tMin = Infinity, tMax = -Infinity;
    const ts = new Float32Array(n);
    for (let i = 0; i < n; i++) { ts[i] = q.fromBufferAttribute(p, i).sub(c).dot(axe); tMin = Math.min(tMin, ts[i]); tMax = Math.max(tMax, ts[i]); }
    const largeurs = new Float32Array(NB);
    for (let i = 0; i < n; i++) {
      const b = Math.min(NB - 1, Math.floor(((ts[i] - tMin) / (tMax - tMin)) * NB));
      const d = q.fromBufferAttribute(p, i).sub(c).addScaledVector(axe, -ts[i]).length();
      largeurs[b] = Math.max(largeurs[b], d);
    }
    let bGarde = 0; for (let b = 1; b < NB; b++) if (largeurs[b] > largeurs[bGarde]) bGarde = b;
    let gardeT = tMin + ((bGarde + 0.5) / NB) * (tMax - tMin);
    let pointeT = bGarde < NB / 2 ? tMax : tMin;                 // la pointe est du côté opposé à la garde
    if (MODELE.inverserKatana) { pointeT = pointeT === tMax ? tMin : tMax; }
    const Y = axe.clone().multiplyScalar(Math.sign(pointeT - gardeT));
    const X = new V3(0, 1, 0).cross(Y); if (X.lengthSq() < 1e-4) X.set(1, 0, 0); X.normalize();
    const Z = new V3().crossVectors(X, Y).normalize();
    const versLocal = new THREE.Matrix4().makeBasis(X, Y, Z).transpose();
    const garde = c.clone().addScaledVector(axe, gardeT);
    const echelle = (LAME.base + LAME.longueur - 0.026) / Math.abs(pointeT - gardeT);
    geo.translate(-garde.x, -garde.y, -garde.z);
    geo.applyMatrix4(versLocal);
    geo.scale(echelle, echelle, echelle);
    geo.translate(0, 0.026, 0);
    const matieres = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).map((m) => {
      const m2 = m.clone();
      if (m2.isMeshStandardMaterial) brancherLueur(m2, true);
      return m2;
    });
    katana.children.forEach((enfant) => { enfant.visible = false; });   // on range mon katana
    const nouveau = new THREE.Mesh(geo, matieres.length > 1 ? matieres : matieres[0]);
    nouveau.castShadow = true; katana.add(nouveau);
    mesh.visible = false;                                                // et on retire celui de la main du modèle
    POINTE_LOCALE.set(0, LAME.base + LAME.longueur, 0);
  }

  /* Installe le modèle dans la scène */
  function installerModele(gltf) {
    const racine = gltf.scene;
    const ajusteur = new THREE.Group();
    ajusteur.add(racine);
    ajusteur.rotation.y = MODELE.rotationY;
    mouvement.add(ajusteur);
    samourai.rotation.set(0, 0, 0); samourai.updateMatrixWorld(true);

    // Matériaux : ombres, reflets de la scène
    racine.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true; o.receiveShadow = true;
      if (o.isSkinnedMesh) o.frustumCulled = false;                    // les bras bougent loin de la pose d'origine
      (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (m && 'envMapIntensity' in m) m.envMapIntensity = MODELE.reflets; });
    });

    // Mise à l'échelle : la même taille que l'ancien samouraï, pieds au sol, centré
    const boite = new THREE.Box3().setFromObject(racine, true);
    const taille = boite.getSize(new V3());
    ajusteur.scale.setScalar(MODELE.hauteur / (taille.y || 1));
    ajusteur.updateMatrixWorld(true);
    boite.setFromObject(racine, true);
    const centre = boite.getCenter(new V3());
    ajusteur.position.set(-centre.x + MODELE.decalage[0], -boite.min.y + MODELE.decalage[1], -centre.z + MODELE.decalage[2]);
    ajusteur.updateMatrixWorld(true);

    // Squelette
    const objets = []; racine.traverse((o) => objets.push(o));
    objets.sort((a, b) => (b.isBone ? 1 : 0) - (a.isBone ? 1 : 0));        // les os d'abord
    ['d', 'g'].forEach((cote) => {
      const noms = NOMS_OS(cote);
      // On garde la première chaîne bras → avant-bras → main réellement reliée dans le squelette
      for (const avant of trouverTous(objets, noms.avant)) {
        const haut = trouverTous(objets, noms.haut, noms.avant).find((o) => descendDe(avant, o));
        const main = trouverTous(objets, noms.main).find((o) => descendDe(o, avant)) || avant.children.find((o) => o.isBone || o.children.length);
        if (haut && main) { perso.os[cote] = { haut, avant, main }; break; }
      }
    });
    perso.os.tete = trouverOs(objets, ['head']);
    perso.os.buste = trouverOs(objets, ['spine2', 'spine02', 'upperchest', 'chest', 'spine1', 'spine01', 'spine']);
    perso.rig = !!(perso.os.d && perso.os.g);
    [perso.os.tete, perso.os.buste, ...['d', 'g'].flatMap((c) => perso.os[c] ? [perso.os[c].haut, perso.os[c].avant] : [])]
      .filter(Boolean).forEach((os) => perso.repos.set(os, os.quaternion.clone()));

    // Animations intégrées
    const clips = gltf.animations.map(figerDeplacement);
    const cherche = (motif, sauf) => motif ? clips.find((c) => c !== sauf && new RegExp(motif, 'i').test(c.name)) : null;
    const attente = cherche(MODELE.animations.attente);
    let attaque = cherche(MODELE.animations.attaque, attente);
    if (!attaque && clips.length === 1 && !attente) attaque = clips[0];   // un seul clip (export Mixamo) : c'est l'attaque
    if (attente || attaque) {
      perso.mixer = new THREE.AnimationMixer(racine);
      const action = (clip) => { const a = perso.mixer.clipAction(clip); a.play(); a.setEffectiveWeight(0); return a; };
      if (attente) perso.actions.attente = action(attente);
      if (attaque) {
        perso.actions.attaque1 = action(attaque);
        perso.actions.attaque2 = action(attaque.clone());               // 2e coup : sa propre copie, pour pouvoir fondre les deux
        if (!attente) perso.actions.garde = action(attaque.clone());    // pas d'animation de repos : 1re image de l'attaque = garde
      }
    }

    // Katana : celui du modèle s'il en a un, sinon le mien, tenu par ses mains
    const sabres = objets.filter((o) => o.isMesh && NOM_KATANA.test(nomComplet(o)) && !PAS_KATANA.test(nomComplet(o)));
    perso.tientKatana = perso.rig && MODELE.bras;
    let infoKatana = 'le mien (katana procédural)';
    if (perso.tientKatana && MODELE.katana === 'auto' && sabres.length) {
      const sabre = sabres.find((s) => !s.isSkinnedMesh);
      if (sabre) { adopterKatana(sabre); infoKatana = 'celui du modèle (« ' + sabre.name + ' »)'; }
      else { sabres.forEach((s) => { s.visible = false; }); infoKatana = 'le mien (celui du modèle est soudé au squelette, il est masqué)'; }
    }
    if (!perso.tientKatana) { katana.visible = false; infoKatana = 'aucun (pas de bras exploitables : le modèle garde le sien s\'il en a un)'; }

    perso.charge = true;
    console.info(
      '%c KANKI · samouraï chargé %c\n' +
      '  Animations trouvées : ' + (clips.map((c) => '« ' + c.name + ' » (' + c.duration.toFixed(1) + ' s)').join(', ') || 'aucune') + '\n' +
      '  → repos : ' + (attente ? attente.name : (attaque ? '1re image de l\'attaque' : 'pose d\'origine')) + '   → coup de katana : ' + (attaque ? attaque.name : 'aucune, mouvement généré par le code') + '\n' +
      '  Squelette : ' + (perso.rig ? 'oui (bras ' + perso.os.d.haut.name + ', tête ' + (perso.os.tete ? perso.os.tete.name : '?') + ')' : 'non trouvé') + '\n' +
      '  Katana : ' + infoKatana,
      'background:#ff1f35;color:#fff;font-weight:700;padding:3px 8px;border-radius:3px', '');
  }

  /* Le katana */
  const katana = new THREE.Group();
  samourai.add(katana);
  const LAME = { longueur: 0.92, sori: 0.032, base: 0.03 };
  const uniformsLame = { uBalayage: { value: 0 }, uLueur: { value: 0 }, uLongueur: { value: LAME.longueur }, uCouleur: { value: C(COUL.neon, 1) } };
  {
    // Lame courbée (sori) avec pointe kissaki
    const L = LAME.longueur, c = (y) => LAME.sori * Math.pow(y / L, 2), w = (y) => 0.031 - 0.006 * (y / L);
    const forme = new THREE.Shape();
    forme.moveTo(c(0) - w(0) / 2, 0);
    for (let i = 1; i <= 14; i++) { const y = (L - 0.075) * (i / 14); forme.lineTo(c(y) - w(y) / 2, y); }
    forme.quadraticCurveTo(c(L) - w(L) * 0.2, L - 0.012, c(L) + w(L) * 0.5, L);
    for (let i = 14; i >= 0; i--) { const y = (L - 0.005) * (i / 14); forme.lineTo(c(y) + w(y) / 2, y); }
    forme.closePath();
    const geoLame = new THREE.ExtrudeGeometry(forme, { depth: 0.004, bevelEnabled: true, bevelThickness: 0.0025, bevelSize: 0.0025, bevelSegments: 1, curveSegments: 8 });
    geoLame.translate(0, LAME.base, -0.002);
    const matLame = new THREE.MeshPhysicalMaterial({ color: 0xd9dade, metalness: 1, roughness: 0.12, envMapIntensity: 1.6, emissive: 0x000000 });
    brancherLueur(matLame, false);
    piece(geoLame, matLame, katana);
    piece(new THREE.BoxGeometry(0.036, 0.026, 0.012), MAT.or, katana, [LAME.sori * 0, 0.042, 0]);                          // habaki
    piece(new THREE.CylinderGeometry(0.046, 0.046, 0.008, 8), MAT.or, katana, [0, 0.026, 0], [0, Math.PI / 8, 0]);          // tsuba
    piece(new THREE.CylinderGeometry(0.0175, 0.0165, 0.27, 10), MAT.laqueRouge, katana, [0, -0.115, 0]);                     // tsuka
    for (let i = 0; i < 7; i++) piece(new THREE.BoxGeometry(0.037, 0.008, 0.037), MAT.noir, katana, [0, -0.02 - i * 0.034, 0], [0, Math.PI / 4, 0.5]); // tressage
    piece(new THREE.CylinderGeometry(0.02, 0.019, 0.02, 10), MAT.or, katana, [0, -0.255, 0]);                               // kashira
  }
  /* Le katana s'illumine progressivement, de la garde vers la pointe (aussi utilisé pour le katana du modèle) */
  function brancherLueur(mat, lameSeule) {
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, uniformsLame);
      sh.vertexShader = 'varying float vLameY;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vLameY = position.y;');
      sh.fragmentShader = 'uniform float uBalayage; uniform float uLueur; uniform float uLongueur; uniform vec3 uCouleur; varying float vLameY;\n' +
        sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          float front = uBalayage * (uLongueur + 0.1);
          float allume = 1.0 - smoothstep(front - 0.08, front, vLameY);
          float lisere = smoothstep(front - 0.1, front, vLameY) * (1.0 - smoothstep(front, front + 0.02, vLameY));
          totalEmissiveRadiance += uCouleur * uLueur * (allume * 2.2 + lisere * 6.0) * ${lameSeule ? 'step(0.05, vLameY)' : '1.0'};`);
    };
    mat.customProgramCacheKey = () => 'lame-kanki-' + lameSeule;
  }
  const POINTE_LOCALE = new V3(LAME.sori + 0.008, LAME.base + LAME.longueur, 0);
  // CORRECTIF BUG 1 : la traînée de vitesse part du tiers extérieur de la lame (0,62 au lieu de 0,3).
  // Partie trop près des mains, elle balayait une grande surface plate qui s'affichait en bloc blanc.
  const BASE_SWOOSH = new V3(0.005, 0.62, 0);
  const MAIN_AVANT = new V3(0, -0.035, 0), MAIN_ARRIERE = new V3(0, -0.205, 0);

  /* Chargement du samouraï (.glb). En cas d'échec : message clair dans la console, l'intro continue. */
  {
    const gltf = await chargerModele();
    let ok = false;
    if (gltf) {
      try { installerModele(gltf); ok = true; }
      catch (err) {
        console.error('%c KANKI · le modèle est chargé mais n\'a pas pu être installé %c L\'intro continue sans personnage.', 'background:#ff1f35;color:#fff;font-weight:700;padding:3px 8px;border-radius:3px', '', err);
        mouvement.clear(); perso.charge = perso.rig = perso.tientKatana = false; perso.mixer = null; perso.repos.clear();
      }
    }
    if (!ok) { katana.visible = false; yeuxGroupe.visible = false; }
  }

  /* ==========================================================================
     6. DÉCOR : sol mouillé, soleil rouge, brume, lumières
     ========================================================================== */
  /* Sol : miroir + couche de pierre mouillée avec des flaques */
  let miroir = null;
  if (!MOBILE && REGLAGES.effets.reflets) {
    miroir = new Reflector(new THREE.PlaneGeometry(90, 90), {
      clipBias: 0.003, color: 0x9a9a9a,
      textureWidth: Math.round(innerWidth * PR * 0.5), textureHeight: Math.round(innerHeight * PR * 0.5), multisample: 0
    });
    miroir.rotation.x = -Math.PI / 2;
    scene.add(miroir);
    // Le reflet est calculé AVANT le rendu principal (voir rendre()) : le faire au milieu
    // du rendu efface, sur certaines cartes graphiques, ce qui a déjà été dessiné.
    miroir.majReflet = miroir.onBeforeRender;
    miroir.onBeforeRender = () => {};
  }
  {
    const cv = document.createElement('canvas'); cv.width = cv.height = 256;
    const ctx = cv.getContext('2d'), img = ctx.createImageData(256, 256);
    const h = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
    const bruit = (x, y) => {
      const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), w = yf * yf * (3 - 2 * yf);
      const m = (a, b) => ((a % 8) + 8) % 8 + (((b % 8) + 8) % 8) * 8;   // motif qui boucle
      const p = (a, b) => h(m(a, b), 0.5);
      return lerp(lerp(p(xi, yi), p(xi + 1, yi), u), lerp(p(xi, yi + 1), p(xi + 1, yi + 1), u), w);
    };
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
      let n = 0, a = 0.5, f = 8 / 256;
      for (let o = 0; o < 4; o++) { n += a * bruit(x * f * Math.pow(2, o), y * f * Math.pow(2, o)); a *= 0.5; }
      const flaque = lisse(clamp((n - 0.42) * 4));                   // 0 = flaque (reflet), 1 = pierre
      const val = Math.round(255 * lerp(0.42, 0.93, flaque));
      const i = (y * 256 + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = val; img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(cv); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(9, 9);
    const sol = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.MeshStandardMaterial({
      color: miroir ? 0x0a0607 : 0x060304, roughness: miroir ? 0.6 : 0.42, metalness: miroir ? 0.1 : 0.25, envMapIntensity: miroir ? 0.25 : 0.18,
      transparent: !!miroir, alphaMap: miroir ? tex : null, roughnessMap: miroir ? null : tex
    }));
    sol.rotation.x = -Math.PI / 2; sol.position.y = 0.003; sol.receiveShadow = true;
    scene.add(sol);
  }

  /* Bruit procédural partagé par les shaders (brume, soleil) */
  const GLSL_BRUIT = `
    float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
    float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return v; }`;

  /* Le grand soleil rouge (disque + halo + filaments de brume qui le traversent) */
  const SOLEIL = { pos: new V3(0.4, 3.35, -17), rayon: 4.2 };
  const uSoleil = { uI: { value: 0 }, uTemps: { value: 0 }, uCouleur: { value: C(COUL.soleil, 1) } };
  {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(SOLEIL.rayon * 3.2, SOLEIL.rayon * 3.2), new THREE.ShaderMaterial({
      uniforms: uSoleil, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: GLSL_BRUIT + `
        uniform float uI; uniform float uTemps; uniform vec3 uCouleur; varying vec2 vUv;
        void main(){
          vec2 p = (vUv * 2.0 - 1.0) * 1.6;
          float r = length(p);
          float disque = 1.0 - smoothstep(0.985, 1.0, r);
          float halo = exp(-max(r - 1.0, 0.0) * 3.4) * (1.0 - disque) * 0.38;
          float bandes = fbm(vec2(p.x * 1.2 + uTemps * 0.025, p.y * 7.0 - uTemps * 0.01));
          float voile = smoothstep(0.42, 0.78, bandes);
          vec3 c = uCouleur * mix(1.25, 0.62, smoothstep(0.0, 1.0, r));
          c = c * disque * (1.0 - voile * 0.6) + uCouleur * 0.55 * halo;
          vec2 q = abs(vUv * 2.0 - 1.0);
          c *= 1.0 - smoothstep(0.7, 1.0, max(q.x, q.y));       // aucun bord visible
          gl_FragColor = vec4(c * uI, 1.0);
        }`
    }));
    m.position.copy(SOLEIL.pos); m.renderOrder = -2;
    scene.add(m);
  }

  /* Brume : plusieurs voiles de brouillard animés, à différentes profondeurs */
  const voiles = [];
  const creerVoile = (w, h, pos, opts = {}) => {
    const u = {
      uTemps: { value: 0 }, uOpacite: { value: opts.opacite ?? 0.5 }, uEchelle: { value: opts.echelle ?? 1.6 },
      uVitesse: { value: opts.vitesse ?? 0.02 }, uGraine: { value: Math.random() * 50 },
      uCouleur: { value: C(COUL.brume, opts.k ?? 1.0) }, uLueur: { value: C(COUL.brumeVive, 1) },
      uSoleil: { value: new THREE.Vector2(SOLEIL.pos.x, SOLEIL.pos.y) }, uSol: { value: opts.sol ?? 1 }
    };
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.ShaderMaterial({
      uniforms: u, transparent: true, depthWrite: false,
      vertexShader: 'varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: GLSL_BRUIT + `
        uniform float uTemps, uOpacite, uEchelle, uVitesse, uGraine, uSol; uniform vec3 uCouleur, uLueur; uniform vec2 uSoleil;
        varying vec2 vUv; varying vec3 vW;
        void main(){
          vec2 p = vUv * vec2(uEchelle * 2.6, uEchelle) + vec2(uTemps * uVitesse + uGraine, uGraine * 0.37);
          float n = fbm(p + fbm(p * 0.6 + uTemps * 0.03) * 1.3);
          float a = smoothstep(0.36, 0.86, n);
          a *= smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x) * smoothstep(1.0, 0.5, vUv.y) * mix(smoothstep(0.0, 0.3, vUv.y), 1.0, uSol);
          a *= mix(1.0, smoothstep(0.0, 0.7, vW.y), uSol);
          float s = exp(-length(vW.xy - uSoleil) * 0.22);
          vec3 c = mix(uCouleur, uLueur, s * 0.85) * (0.5 + 0.7 * n);
          gl_FragColor = vec4(c, a * uOpacite);
        }`
    }));
    m.position.set(...pos); if (opts.rotX) m.rotation.x = opts.rotX;
    scene.add(m); voiles.push(u); return u;
  };
  const NB_VOILES = MOBILE ? 4 : 7;
  [[-12, 0.55], [-8.5, 0.5], [-5.5, 0.42], [-3, 0.32], [-1.3, 0.22], [2.4, 0.16], [3.6, 0.12]].slice(0, NB_VOILES)
    .forEach(([z, o], i) => { const u = creerVoile(34, 9, [(Math.random() - 0.5) * 3, 3.2, z], { opacite: o, echelle: 1.3 + i * 0.15, vitesse: 0.012 + i * 0.004 }); u.base = o; u.devant = z > 2; });
  // Brume rasante au sol
  creerVoile(30, 18, [0, 0.12, -2], { opacite: 0.55, rotX: -Math.PI / 2, echelle: 2.2, vitesse: 0.015, sol: 0, k: 1.2 });
  creerVoile(30, 18, [0, 0.38, -1], { opacite: 0.3, rotX: -Math.PI / 2, echelle: 3.0, vitesse: 0.022, sol: 0, k: 1.3 });
  // Rideau de brume devant le samouraï : il se dissipe à l'apparition
  const rideau = creerVoile(14, 7, [0, 2.2, 1.0], { opacite: 1, echelle: 1.1, vitesse: 0.05, k: 1.6 });

  /* Lumières */
  scene.add(new THREE.HemisphereLight(0x5a1a20, 0x000000, 0.5));
  const contreG = new THREE.SpotLight(C(COUL.contreJour, 1), 0, 0, 0.55, 0.85, 2);
  contreG.position.set(-2.4, 3.4, -3.2); contreG.target.position.set(0, 1.3, 0);
  const contreD = new THREE.SpotLight(C(COUL.contreJour, 1), 0, 0, 0.5, 0.85, 2);
  contreD.position.set(2.6, 2.6, -2.8); contreD.target.position.set(0, 1.4, 0);
  contreD.castShadow = true; contreD.shadow.mapSize.set(MOBILE ? 512 : 1024, MOBILE ? 512 : 1024); contreD.shadow.bias = -0.0004; contreD.shadow.normalBias = 0.02;
  contreD.shadow.camera.near = 1; contreD.shadow.camera.far = 12;
  const face = new THREE.SpotLight(0xffd9cf, 0, 0, 0.6, 1, 2);
  face.position.set(1.8, 4.2, 4.5); face.target.position.set(0, 1.3, 0);
  scene.add(contreG, contreG.target, contreD, contreD.target, face, face.target);
  const lumYeux = new THREE.PointLight(C(COUL.yeux, 1), 0, 0.9, 2); yeuxGroupe.add(lumYeux); lumYeux.position.set(0, 0.03, 0.1);
  const lumLame = new THREE.PointLight(C(COUL.neon, 1), 0, 4.5, 2); scene.add(lumLame);
  const lumK = new THREE.PointLight(C(COUL.neon, 1), 0, 7, 2); scene.add(lumK);

  /* ==========================================================================
     7. PARTICULES : braises, poussière, étincelles
     ========================================================================== */
  const uParticules = { uTemps: { value: 0 }, uPR: { value: PR }, uEchelle: { value: 1 }, uI: { value: 0 }, uDensite: { value: brouillard.density } };
  const creerNuage = (nb, opts) => {
    const pos = new Float32Array(nb * 3), graine = new Float32Array(nb * 4);
    for (let i = 0; i < nb; i++) {
      pos[i * 3] = (Math.random() - 0.5) * opts.l; pos[i * 3 + 1] = Math.random() * opts.h; pos[i * 3 + 2] = opts.z0 + Math.random() * opts.p;
      graine[i * 4] = 0.25 + Math.random() * 0.75; graine[i * 4 + 1] = Math.random(); graine[i * 4 + 2] = 0.4 + Math.random() * 0.9; graine[i * 4 + 3] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aGraine', new THREE.BufferAttribute(graine, 4));
    const u = Object.assign({}, uParticules, { uTaille: { value: opts.taille }, uHaut: { value: opts.h }, uVitesse: { value: opts.vitesse }, uA: { value: C(opts.a, 1) }, uB: { value: C(opts.b, 1) }, uForce: { value: opts.force } });
    const pts = new THREE.Points(g, new THREE.ShaderMaterial({
      uniforms: u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute vec4 aGraine; uniform float uTemps, uPR, uEchelle, uTaille, uHaut, uVitesse, uDensite;
        varying float vA; varying float vT;
        void main(){
          vec3 p = position; float t = uTemps * aGraine.x * uVitesse;
          p.y = mod(p.y + t, uHaut);
          p.x += sin(t * 0.9 + aGraine.y * 6.28) * 0.35 + sin(t * 2.7 + aGraine.y * 3.0) * 0.06;
          p.z += cos(t * 0.7 + aGraine.y * 4.0) * 0.3;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = uTaille * aGraine.z * uPR * uEchelle / -mv.z;
          gl_Position = projectionMatrix * mv;
          float scint = 0.5 + 0.5 * sin(uTemps * (2.0 + aGraine.y * 6.0) + aGraine.y * 40.0);
          float brume = exp(-pow(uDensite * -mv.z, 2.0));
          vA = (0.35 + 0.65 * scint) * smoothstep(0.0, 0.5, p.y) * (1.0 - smoothstep(uHaut * 0.65, uHaut, p.y)) * (0.25 + 0.75 * brume);
          vT = aGraine.w;
        }`,
      fragmentShader: `
        uniform float uI, uForce; uniform vec3 uA, uB; varying float vA; varying float vT;
        void main(){
          float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d); a *= a;
          gl_FragColor = vec4(mix(uA, uB, vT) * uForce, a * vA * uI);
        }`
    }));
    pts.frustumCulled = false; scene.add(pts);
    return pts;
  };
  const nbBraises = Math.round(REGLAGES.effets.braises * (MOBILE ? 0.35 : 1));
  creerNuage(nbBraises, { l: 14, h: 5.5, z0: -9, p: 13, taille: 0.05, vitesse: 0.32, a: COUL.neon, b: COUL.braise, force: 2.6 });
  creerNuage(Math.round(nbBraises * 0.7), { l: 12, h: 4.5, z0: -6, p: 10, taille: 0.025, vitesse: 0.08, a: '#8a6a6a', b: '#ff9d8a', force: 0.7 });

  /* Étincelles : simulées image par image (gerbes lors des flashs) */
  const ETINC = 1800;
  const etinc = {
    pos: new Float32Array(ETINC * 3), vit: new Float32Array(ETINC * 3), vie: new Float32Array(ETINC), vieMax: new Float32Array(ETINC), taille: new Float32Array(ETINC), i: 0
  };
  const geoEtinc = new THREE.BufferGeometry();
  geoEtinc.setAttribute('position', new THREE.BufferAttribute(etinc.pos, 3).setUsage(THREE.DynamicDrawUsage));
  const attrVie = new THREE.BufferAttribute(new Float32Array(ETINC), 1).setUsage(THREE.DynamicDrawUsage);
  geoEtinc.setAttribute('aVie', attrVie);
  geoEtinc.setAttribute('aTaille', new THREE.BufferAttribute(etinc.taille, 1).setUsage(THREE.DynamicDrawUsage));
  const ptsEtinc = new THREE.Points(geoEtinc, new THREE.ShaderMaterial({
    uniforms: Object.assign({}, uParticules, { uChaud: { value: C(COUL.blancChaud, 4) }, uRouge: { value: C(COUL.neon, 3) } }),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float aVie; attribute float aTaille; uniform float uPR, uEchelle; varying float vVie;
      void main(){ vVie = aVie; vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aVie > 0.0 ? aTaille * uPR * uEchelle / -mv.z * (0.35 + 0.65 * aVie) : 0.0; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uChaud, uRouge; varying float vVie;
      void main(){ if (vVie <= 0.0) discard; float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.05, d);
        gl_FragColor = vec4(mix(uRouge, uChaud, vVie * vVie), a * clamp(vVie * 1.4, 0.0, 1.0)); }`
  }));
  ptsEtinc.frustumCulled = false; scene.add(ptsEtinc);
  const emettre = (p, vel, vie, taille) => {
    const i = etinc.i; etinc.i = (i + 1) % ETINC;
    etinc.pos[i * 3] = p.x; etinc.pos[i * 3 + 1] = p.y; etinc.pos[i * 3 + 2] = p.z;
    etinc.vit[i * 3] = vel.x; etinc.vit[i * 3 + 1] = vel.y; etinc.vit[i * 3 + 2] = vel.z;
    etinc.vie[i] = etinc.vieMax[i] = vie; etinc.taille[i] = taille;
  };
  const tmpV = new V3(), tmpW = new V3();
  /* Gerbe d'étincelles le long d'une liste de points */
  const gerbe = (points, nb, force = 1, depuis = null) => {
    if (MOBILE) nb = Math.round(nb * 0.5);
    for (let k = 0; k < nb; k++) {
      const p = points[Math.floor(Math.random() * points.length)];
      tmpV.set(Math.random() - 0.5, Math.random() - 0.35, Math.random() - 0.5).normalize().multiplyScalar((0.6 + Math.random() * 2.6) * force);
      if (depuis) { tmpW.copy(p).sub(depuis).normalize().multiplyScalar(1.4 * force); tmpV.add(tmpW); }
      emettre(p, tmpV, 0.5 + Math.random() * 1.1, 0.02 + Math.random() * 0.05);
    }
  };
  const majEtincelles = (dt) => {
    const amort = Math.exp(-2.4 * dt);
    for (let i = 0; i < ETINC; i++) {
      if (etinc.vie[i] <= 0) { attrVie.array[i] = 0; continue; }
      etinc.vie[i] -= dt;
      etinc.vit[i * 3 + 1] -= 2.2 * dt;
      etinc.vit[i * 3] *= amort; etinc.vit[i * 3 + 1] *= amort; etinc.vit[i * 3 + 2] *= amort;
      etinc.pos[i * 3] += etinc.vit[i * 3] * dt; etinc.pos[i * 3 + 1] += etinc.vit[i * 3 + 1] * dt; etinc.pos[i * 3 + 2] += etinc.vit[i * 3 + 2] * dt;
      if (etinc.pos[i * 3 + 1] < 0.01) { etinc.pos[i * 3 + 1] = 0.01; etinc.vit[i * 3 + 1] *= -0.35; }
      attrVie.array[i] = Math.max(0, etinc.vie[i] / etinc.vieMax[i]);
    }
    geoEtinc.attributes.position.needsUpdate = true; attrVie.needsUpdate = true; geoEtinc.attributes.aTaille.needsUpdate = true;
  };

  /* ==========================================================================
     8. LE K DE NÉON ET LE TITRE KANKI
     ========================================================================== */
  const LARG = GLYPHES.largeur;
  const cxK = GLYPHES.lettres[0].cx;
  // Le titre commence superposé au K tracé, puis glisse à sa place finale
  const titreDebut = { pos: v(REGLAGES.K.centre).sub(new V3((cxK - LARG / 2) * REGLAGES.K.hauteur, 0, 0)), echelle: REGLAGES.K.hauteur };
  const titreFin = { pos: v(REGLAGES.titre.centre), echelle: REGLAGES.titre.hauteur };
  const pointK = (g) => new V3((g[0] - LARG / 2) * titreDebut.echelle, (g[1] - 0.5) * titreDebut.echelle, 0).add(titreDebut.pos);

  /* Les deux tracés du K */
  const tr = GLYPHES.traceK;
  const courbe1 = new THREE.LineCurve3(pointK(tr.trait1[0]), pointK(tr.trait1[1]));
  const [hd, jn, bd] = tr.trait2.map(pointK);
  const courbe2 = new THREE.CatmullRomCurve3([
    hd, hd.clone().lerp(jn, 0.5), hd.clone().lerp(jn, 0.93), jn, jn.clone().lerp(bd, 0.07), jn.clone().lerp(bd, 0.5), bd
  ], false, 'centripetal');
  const RAYON = 0.017;
  const uTrace = (halo) => ({
    uProg: { value: 0 }, uI: { value: 1 }, uAlpha: { value: halo ? 0.3 : 1 }, uHalo: { value: halo ? 1 : 0 },
    uR: { value: RAYON }, uEchelle: { value: halo ? 3.4 : 1 }, uEffile: { value: 0.12 },
    uCouleur: { value: C(COUL.neon, 1.8) }, uChaud: { value: C(COUL.blancChaud, 3.2) }
  });
  const traces = [];
  [[courbe1, 70], [courbe2, 180]].forEach(([courbe, seg]) => {
    const geo = new THREE.TubeGeometry(courbe, seg, RAYON, 10, false);
    const paire = [false, true].map((halo) => {
      const u = uTrace(halo);
      const m = new THREE.Mesh(geo, new THREE.ShaderMaterial({
        uniforms: u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: `
          uniform float uR, uEchelle, uEffile; varying float vU; varying vec3 vN; varying vec3 vV;
          void main(){
            vU = uv.x;
            vec3 c = position - normal * uR;
            float e = smoothstep(0.0, uEffile, uv.x) * smoothstep(1.0, 1.0 - uEffile, uv.x);
            vec3 p = c + normal * uR * uEchelle * (0.2 + 0.8 * e);
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: `
          uniform float uProg, uI, uAlpha, uHalo; uniform vec3 uCouleur, uChaud; varying float vU; varying vec3 vN; varying vec3 vV;
          void main(){
            if (vU > uProg) discard;
            float tete = smoothstep(uProg - 0.22, uProg, vU);
            float f = abs(dot(normalize(vN), normalize(vV)));
            vec3 c = mix(uCouleur, uChaud, tete * 0.8);
            float a = uAlpha;
            if (uHalo > 0.5) a *= pow(f, 2.2); else c = mix(c, uChaud, pow(f, 4.0) * 0.55);
            gl_FragColor = vec4(c * uI, a);
          }`
      }));
      m.renderOrder = 5; m.visible = false; scene.add(m);
      return { mesh: m, u };
    });
    traces.push(paire);
  });
  // Points le long du K (pour les étincelles)
  const pointsDuK = [...courbe1.getSpacedPoints(30), ...courbe2.getSpacedPoints(60)];
  const centreK = v(REGLAGES.K.centre);

  /* Traînée de vitesse derrière la lame (« swoosh ») */
  const SW = 22;
  const swoosh = { base: Array.from({ length: SW }, () => new V3()), pointe: Array.from({ length: SW }, () => new V3()), pret: false };
  const geoSw = new THREE.BufferGeometry();
  const posSw = new Float32Array(SW * 2 * 3), ageSw = new Float32Array(SW * 2), coteSw = new Float32Array(SW * 2), idxSw = [];
  for (let i = 0; i < SW; i++) { ageSw[i * 2] = ageSw[i * 2 + 1] = i / (SW - 1); coteSw[i * 2] = 0; coteSw[i * 2 + 1] = 1; }
  for (let i = 0; i < SW - 1; i++) { const a = i * 2; idxSw.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  geoSw.setIndex(idxSw);
  geoSw.setAttribute('position', new THREE.BufferAttribute(posSw, 3).setUsage(THREE.DynamicDrawUsage));
  geoSw.setAttribute('aAge', new THREE.BufferAttribute(ageSw, 1)); geoSw.setAttribute('aCote', new THREE.BufferAttribute(coteSw, 1));
  const uSw = { uI: { value: 0 }, uCouleur: { value: C(COUL.neon, 2.2) }, uChaud: { value: C(COUL.blancChaud, 3) } };
  const meshSw = new THREE.Mesh(geoSw, new THREE.ShaderMaterial({
    uniforms: uSw, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    vertexShader: 'attribute float aAge; attribute float aCote; varying float vAge; varying float vCote; void main(){ vAge = aAge; vCote = aCote; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uI; uniform vec3 uCouleur, uChaud; varying float vAge; varying float vCote;
      void main(){ float c = smoothstep(0.0, 1.0, vCote); float a = pow(1.0 - vAge, 3.0) * c * c * uI;   // CORRECTIF BUG 1 : plus fin, plus rouge
        gl_FragColor = vec4(mix(uCouleur, uChaud, vCote * (1.0 - vAge) * 0.3), a); }`
  }));
  meshSw.frustumCulled = false; meshSw.renderOrder = 6; scene.add(meshSw);

  /* Le titre KANKI en 3D : lettres de métal noir, tranches de néon rouge */
  const titre = new THREE.Group(); titre.visible = false; scene.add(titre);
  // Faces avant : métal noir laqué, avec un reflet qui balaie les lettres
  const uReflet = { value: -3 };
  const capot = new THREE.ShaderMaterial({
    uniforms: { uReflet, uFlash: { value: 0 }, uChaud: { value: C(COUL.blancChaud, 1.4) }, uRouge: { value: C(COUL.neon, 0.1) }, uTranche: { value: C(COUL.neon, 3) } },
    vertexShader: 'varying vec3 vP; varying vec3 vN; void main(){ vP = position; vN = normal; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uReflet, uFlash; uniform vec3 uChaud, uRouge, uTranche; varying vec3 vP; varying vec3 vN;
      void main(){
        float g = clamp(vP.y + 0.5, 0.0, 1.0);
        vec3 c = mix(vec3(0.008, 0.004, 0.005), uRouge, g * g);           // dégradé noir → rouge sombre
        float d = vP.x * 0.42 + vP.y * 0.9 - uReflet;
        c += uChaud * exp(-d * d * 90.0) * 0.55 + uChaud * exp(-d * d * 6.0) * 0.06;   // reflet
        c += uChaud * uFlash * 0.16;                                      // flash à l'arrivée
        c *= 0.6 + 0.4 * step(0.5, vN.z);
        float cote = 1.0 - smoothstep(0.6, 0.92, abs(vN.z));             // tranches et biseaux : néon
        gl_FragColor = vec4(mix(c, uTranche, cote), 1.0);
      }`
  });
  const lettres = GLYPHES.lettres.map((l, i) => {
    const groupe = new THREE.Group(); titre.add(groupe);
    const capotL = capot.clone(); capotL.uniforms.uReflet = uReflet;
    const moities = {};
    ['haut', 'bas'].forEach((partie) => {
      const g = new THREE.Group(); groupe.add(g); moities[partie] = g;
      l[partie].forEach((poly) => {
        const forme = new THREE.Shape(poly.o.map(([x, y]) => new THREE.Vector2(x - LARG / 2, y - 0.5)));
        poly.h.forEach((trou) => forme.holes.push(new THREE.Path(trou.map(([x, y]) => new THREE.Vector2(x - LARG / 2, y - 0.5)))));
        const geo = new THREE.ExtrudeGeometry(forme, { depth: REGLAGES.titre.epaisseur / REGLAGES.titre.hauteur, bevelEnabled: true, bevelThickness: 0.018, bevelSize: 0.016, bevelSegments: 2, curveSegments: 4 });
        geo.translate(0, 0, -REGLAGES.titre.epaisseur / REGLAGES.titre.hauteur);
        const m = new THREE.Mesh(geo, capotL); g.add(m);
      });
    });
    return { groupe, moities, capot: capotL, cx: l.cx - LARG / 2, visible: false };
  });
  // La ligne de coupe finale (un trait de lumière qui traverse le nom)
  const coupe = GLYPHES.coupe;
  const cp0 = new V3(coupe[0][0] - LARG / 2, coupe[0][1] - 0.5, 0.02), cp1 = new V3(coupe[1][0] - LARG / 2, coupe[1][1] - 0.5, 0.02);
  const dirCoupe = cp1.clone().sub(cp0).normalize();
  const uCoupe = { uI: { value: 0 }, uProg: { value: 0 }, uCouleur: { value: C(COUL.neon, 3) }, uChaud: { value: C(COUL.blancChaud, 6) } };
  const ligneCoupe = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
    uniforms: uCoupe, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uI, uProg; uniform vec3 uCouleur, uChaud; varying vec2 vUv;
      void main(){ if (vUv.x > uProg) discard; float y = abs(vUv.y - 0.5) * 2.0;
        float coeur = exp(-y * 26.0), halo = exp(-y * 5.0) * 0.35;
        float tete = smoothstep(uProg - 0.25, uProg, vUv.x);
        vec3 c = mix(uCouleur, uChaud, coeur * 0.8 + tete * 0.4);
        gl_FragColor = vec4(c * uI, (coeur + halo) * smoothstep(0.0, 0.04, vUv.x)); }`
  }));
  {
    const L = cp1.distanceTo(cp0) + 0.6;
    ligneCoupe.scale.set(L, 0.16, 1);
    ligneCoupe.position.copy(cp0).add(cp1).multiplyScalar(0.5).setZ(0.03);
    ligneCoupe.rotation.z = Math.atan2(dirCoupe.y, dirCoupe.x);
    ligneCoupe.renderOrder = 8; titre.add(ligneCoupe);
  }

  /* ==========================================================================
     9. POST-TRAITEMENT : bloom + onde de choc + aberration + vignette
     ========================================================================== */
  const cible = new THREE.WebGLRenderTarget(innerWidth * PR, innerHeight * PR, { type: THREE.HalfFloatType, samples: MOBILE ? 0 : 4 });
  const composer = new EffectComposer(renderer, cible);
  composer.setPixelRatio(PR); composer.setSize(innerWidth, innerHeight);
  composer.addPass(new RenderPass(scene, camera));
  /* CORRECTIF BUG 1 (« blocs carrés ») : la lame du katana est un métal presque miroir. À certains angles,
     elle renvoie le contre-jour vers la caméra avec une intensité énorme (plusieurs milliers). Le bloom
     étale ces pixels sur ses niveaux basse résolution, ce qui donne des carrés lumineux qui recouvrent l'image.
     On plafonne la lumière à 16 avant le bloom (l'image ne change pas : tout ce qui dépasse 16 était déjà
     blanc pur) et on neutralise les pixels invalides (NaN) qui produisent le même effet. */
  composer.addPass(new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uMax: { value: 16.0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uMax; varying vec2 vUv;
      void main(){
        vec4 c = texture2D(tDiffuse, vUv);
        if (c.r != c.r || c.g != c.g || c.b != c.b) c.rgb = vec3(0.0);
        gl_FragColor = vec4(min(c.rgb, vec3(uMax)), 1.0);
      }`
  }));
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), REGLAGES.effets.bloom, 0.55, 0.86);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const cinema = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null }, uTemps: { value: 0 }, uAspect: { value: innerWidth / innerHeight },
      uChoc: { value: new THREE.Vector2(0.5, 0.5) }, uChocT: { value: -1 }, uChocF: { value: 0 },
      uAberration: { value: 0.0015 }, uFlash: { value: 0 }, uFlashCouleur: { value: new THREE.Color(1, 0.86, 0.84) },
      uFondu: { value: 0 }, uVignette: { value: 1 }
    },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform sampler2D tDiffuse; uniform float uTemps, uAspect, uChocT, uChocF, uAberration, uFlash, uFondu, uVignette;
      uniform vec2 uChoc; uniform vec3 uFlashCouleur; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main(){
        vec2 uv = vUv; float ab = uAberration;
        if (uChocT >= 0.0) {                                  // onde de choc
          vec2 d = uv - uChoc; d.x *= uAspect; float r = length(d);
          float rayon = uChocT * 1.35, w = 0.09;
          float k = smoothstep(w, 0.0, abs(r - rayon)) * uChocF * (1.0 - clamp(uChocT / 1.0, 0.0, 1.0));
          uv -= normalize(d + 1e-5) / vec2(uAspect, 1.0) * k * 0.04;
          ab += k * 0.012;
        }
        vec2 dir = uv - 0.5;
        vec3 c;
        c.r = texture2D(tDiffuse, uv + dir * ab).r;
        c.g = texture2D(tDiffuse, uv).g;
        c.b = texture2D(tDiffuse, uv - dir * ab).b;
        float vig = smoothstep(1.25, 0.32, length(dir * vec2(uAspect * 0.75, 1.0)));
        c *= mix(1.0, vig, uVignette);
        c += (h(vUv * 1000.0 + uTemps) - 0.5) * 0.035;
        c = mix(c, uFlashCouleur, clamp(uFlash, 0.0, 1.0));
        gl_FragColor = vec4(c * uFondu, 1.0);
      }`
  });
  composer.addPass(cinema);

  /* ==========================================================================
     10. CAMÉRA : trajectoire cinématique (images clés lissées)
     ========================================================================== */
  // t = moment, p = position, c = point regardé, f = champ de vision
  const CLES = [
    { t: 0.0,  p: [0.35, 0.72, 12.5], c: [0, 1.3, 0],   f: 30 },
    { t: 3.4,  p: [1.65, 1.22, 6.8],  c: [0, 1.52, 0.3], f: 33 },
    { t: 5.1,  p: [1.3, 1.42, 5.75],  c: [0, 1.46, 0.8], f: 34 },
    { t: 6.9,  p: [1.0, 1.5, 5.4],    c: [0, 1.46, 1.0], f: 34 },
    { t: 7.7,  p: [0.55, 1.52, 4.85], c: [0, 1.46, 1.2], f: 34 },
    { t: 8.7,  p: [0.0, 1.5, 6.3],    c: [0, 1.45, 1.3], f: 34 },
    { t: 10.9, p: [0.0, 1.47, 5.85],  c: [0, 1.45, 1.3], f: 33 }
  ];
  const interp = (cles, t, cle) => {
    const n = cles.length, dim = Array.isArray(cles[0][cle]) ? 3 : 1, val = (k) => (dim === 3 ? cles[k][cle] : [cles[k][cle]]);
    if (t <= cles[0].t) return val(0).slice();
    if (t >= cles[n - 1].t) return val(n - 1).slice();
    let i = 0; while (t > cles[i + 1].t) i++;
    const t0 = cles[i].t, t1 = cles[i + 1].t, dt = t1 - t0, u = (t - t0) / dt;
    const tangente = (k) => {
      if (k === 0 || k === n - 1) return [0, 0, 0];
      const a = val(k - 1), b = val(k + 1), d = cles[k + 1].t - cles[k - 1].t;
      return a.map((x, j) => (b[j] - x) / d);
    };
    const m0 = tangente(i), m1 = tangente(i + 1), p0 = val(i), p1 = val(i + 1);
    const u2 = u * u, u3 = u2 * u, h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
    return p0.map((x, j) => h00 * x + h10 * m0[j] * dt + h01 * p1[j] + h11 * m1[j] * dt);
  };
  // Cadrage : on recule la caméra quand l'écran est en portrait
  const recul = () => { const a = innerWidth / innerHeight; return a >= 1.2 ? 1 : lerp(1, 1.62, clamp((1.2 - a) / 0.75)); };
  const echelleTitre = () => {
    const a = innerWidth / innerHeight, dist = 4.55 * recul();
    const largeurVisible = 2 * dist * Math.tan(THREE.MathUtils.degToRad(34) / 2) * a;
    return Math.min(REGLAGES.titre.hauteur, (largeurVisible * 0.84) / (LARG + 0.25));
  };

  /* Tremblement de caméra */
  let trauma = 0;
  const secouer = (k) => { trauma = Math.min(1.2, trauma + k * REGLAGES.effets.tremblement); };

  /* ==========================================================================
     11. CHORÉGRAPHIE DU SAMOURAÏ
     ========================================================================== */
  const D = REGLAGES.durees;
  const TPS = {
    leve: [T.preparation, T.preparation + 1.2],              // lève le katana
    elan: T.trait1 - 0.22,                                    // petit recul avant le coup
    approche1: T.trait1 - 0.12,
    fin1: T.trait1 + D.trait1,
    suite1: T.trait1 + D.trait1 + 0.23,
    approche2: T.trait2 - 0.1,
    fin2: T.trait2 + D.trait2,
    suite2: T.trait2 + D.trait2 + 0.3,
    garde: T.trait2 + D.trait2 + 1.05
  };
  const REPOS = new V3(-0.42, 0.24, 1.12);      // pointe basse, devant (repère du samouraï)
  const FIN = new V3(-0.82, 0.26, 0.72);        // garde finale, lame basse sur le côté
  const enLocal = (p) => samourai.worldToLocal(p.clone());
  const arcEntre = (a, b, u, levee) => a.clone().lerp(b, u).add(new V3(0, Math.sin(Math.PI * u) * levee, -Math.sin(Math.PI * u) * levee * 0.4));

  /* Où se trouve la pointe du katana à l'instant t (repère du samouraï) */
  function pointeA(t) {
    const k1a = enLocal(courbe1.getPointAt(0)), k1b = enLocal(courbe1.getPointAt(1));
    const k2a = enLocal(courbe2.getPointAt(0)), k2b = enLocal(courbe2.getPointAt(1));
    const armee = k1a.clone().add(new V3(-0.12, 0.42, -0.55));
    const recul1 = armee.clone().add(new V3(0, 0.07, -0.09));
    const apres1 = k1b.clone().add(new V3(0.18, -0.3, -0.38));
    const avant2 = k2a.clone().add(new V3(0.28, 0.32, -0.48));
    const apres2 = k2b.clone().add(new V3(0.28, -0.12, -0.32));
    if (t < TPS.leve[0]) return REPOS.clone();
    if (t < TPS.leve[1]) return arcEntre(REPOS, armee, easeInOut(plage(t, ...TPS.leve)), 0.35);
    if (t < TPS.elan) return armee.clone().add(new V3(0, Math.sin(t * 9) * 0.004, 0));
    if (t < TPS.approche1) return armee.clone().lerp(recul1, sinus(plage(t, TPS.elan, TPS.approche1)));
    if (t < T.trait1) return recul1.clone().lerp(k1a, easeIn(plage(t, TPS.approche1, T.trait1)));
    if (t < TPS.fin1) return enLocal(courbe1.getPointAt(progTrait1(t)));
    if (t < TPS.suite1) return k1b.clone().lerp(apres1, easeOut(plage(t, TPS.fin1, TPS.suite1)));
    if (t < TPS.approche2) return arcEntre(apres1, avant2, easeInOut(plage(t, TPS.suite1, TPS.approche2)), 0.25);
    if (t < T.trait2) return avant2.clone().lerp(k2a, easeIn(plage(t, TPS.approche2, T.trait2)));
    if (t < TPS.fin2) return enLocal(courbe2.getPointAt(progTrait2(t)));
    if (t < TPS.suite2) return k2b.clone().lerp(apres2, easeOut(plage(t, TPS.fin2, TPS.suite2)));
    if (t < TPS.garde) return arcEntre(apres2, FIN, easeInOut(plage(t, TPS.suite2, TPS.garde)), 0.12);
    return FIN.clone();
  }
  const progTrait1 = (t) => { const u = plage(t, T.trait1, TPS.fin1); return 1 - Math.pow(1 - u, 1.8); };
  const progTrait2 = (t) => { const u = plage(t, T.trait2, TPS.fin2); return 0.75 * sinus(u) + 0.25 * u; };

  /* Cinématique inverse à deux os (épaule → coude → main) */
  const ik = (epaule, cible, a, b, pole) => {
    const d = cible.clone().sub(epaule); const dist = clamp(d.length(), 0.05, a + b - 0.002); d.normalize();
    const main = epaule.clone().addScaledVector(d, dist);
    const cosA = clamp((a * a + dist * dist - b * b) / (2 * a * dist), -1, 1), sinA = Math.sqrt(1 - cosA * cosA);
    const perp = pole.clone().addScaledVector(d, -pole.dot(d)).normalize();
    const coude = epaule.clone().addScaledVector(d, a * cosA).addScaledVector(perp, a * sinA);
    return { coude, main };
  };
  let tranchant = new V3(0, 0, 1), pointePrec = null;
  const decalagePrise = new V3();      // décalage lissé du katana vers la main (voir CORRECTIF BUG 1 + 2)
  const mBase = new THREE.Matrix4();
  const _a = new V3(), _b = new V3(), _q = new THREE.Quaternion(), _qp = new THREE.Quaternion(), _qw = new THREE.Quaternion();
  const AXE_X = new V3(1, 0, 0), AXE_Y = new V3(0, 1, 0);
  const enveloppe = (t, a, b) => Math.sin(Math.PI * plage(t, a, b));

  /* Tourne un os autour d'un axe exprimé dans le monde (fonctionne quel que soit le logiciel d'origine du rig) */
  function tournerOs(os, axeMonde, angle) {
    if (!os || !angle) return;
    _q.setFromAxisAngle(axeMonde, angle);
    os.getWorldQuaternion(_qw); _q.multiply(_qw);
    os.parent.getWorldQuaternion(_qp).invert();
    os.quaternion.copy(_qp.multiply(_q));
    os.updateMatrixWorld(true);
  }
  /* Oriente un os pour que l'os suivant (son enfant) passe par un point donné.
     CORRECTIF BUG 2 : on repart de la solution de l'image précédente (et pas de la pose de l'animation).
     Avant, quand le bras devait tourner de presque 180° (katana levé au-dessus de la tête), le calcul
     « plus court chemin » choisissait un axe différent d'une image à l'autre : le bras et l'épaulière
     vrillaient d'un coup puis revenaient. Un léger rappel (8 %) vers la pose animée évite toute dérive. */
  const ikPrec = new Map();
  function viser(os, enfant, cibleMonde) {
    const prec = ikPrec.get(os);
    if (prec) { os.quaternion.slerp(prec, 0.92); os.updateMatrixWorld(true); }
    os.getWorldPosition(_a); enfant.getWorldPosition(_b);
    const v1 = _b.sub(_a).normalize(), v2 = cibleMonde.clone().sub(_a).normalize();
    _q.setFromUnitVectors(v1, v2);
    os.getWorldQuaternion(_qw); _q.multiply(_qw);
    os.parent.getWorldQuaternion(_qp).invert();
    os.quaternion.copy(_qp.multiply(_q));
    os.updateMatrixWorld(true);
    ikPrec.set(os, os.quaternion.clone());
  }

  /* Animations du .glb, pilotées par la timeline (fonctionne aussi quand on saute ou rejoue l'intro) */
  function animer(t, temps) {
    perso.repos.forEach((q, os) => os.quaternion.copy(q));       // on repart de la pose de repos à chaque image
    if (!perso.mixer) return;
    const A = perso.actions;
    let poidsAttaque = 0;
    if (A.attaque1) {
      const duree = A.attaque1.getClip().duration / MODELE.vitesseAttaque;
      // CORRECTIF BUG 2 : un seul coup joué à la fois. Le 2e coup coupe le 1er (fondu de 0,15 s)
      // au lieu de se superposer à lui ; chaque coup est joué une fois, sans boucle (équivalent LoopOnce + clamp).
      const debut1 = T.trait1 - MODELE.avanceAttaque, debut2 = T.trait2 - MODELE.avanceAttaque;
      [[A.attaque1, debut1, Math.min(debut1 + duree, debut2 + 0.15)], [A.attaque2, debut2, debut2 + duree]].forEach(([action, debut, fin]) => {
        const u = t - debut;
        const w = t < debut || t > fin ? 0 : clamp(Math.min(u / 0.15, (fin - t) / 0.15));
        action.setEffectiveWeight(w); action.time = clamp(u, 0, duree) * MODELE.vitesseAttaque;
        poidsAttaque += w;
      });
    }
    const poidsRepos = Math.max(0.0001, 1 - poidsAttaque);
    if (A.attente) { A.attente.setEffectiveWeight(poidsRepos); A.attente.time = temps % A.attente.getClip().duration; }
    if (A.garde) { A.garde.setEffectiveWeight(poidsRepos); A.garde.time = 0; }
    perso.mixer.update(0);
  }

  /* Oriente le katana : la lame pointe vers « dir », le tranchant suit le mouvement */
  function orienterKatana(dir) {
    tranchant.addScaledVector(dir, -tranchant.dot(dir));
    // CORRECTIF : si le tranchant devient parallèle à la lame, on en reprend un perpendiculaire stable
    if (tranchant.lengthSq() < 1e-6) tranchant.crossVectors(dir, AXE_X).lengthSq() > 1e-6 ? tranchant.crossVectors(dir, AXE_X) : tranchant.crossVectors(dir, AXE_Y);
    tranchant.normalize();
    const ax = tranchant.clone().negate(), az = new V3().crossVectors(ax, dir).normalize();
    ax.crossVectors(dir, az).normalize();
    mBase.makeBasis(ax, dir, az);
    katana.quaternion.setFromRotationMatrix(mBase);
  }

  function poserSamourai(t, dt, temps) {
    const kH = MODELE.hauteur / 2.05;
    // Rotation du corps : de trois quarts, puis face à nous
    samourai.rotation.y = lerp(0.55, 0.06, easeInOut(plage(t, T.preparation, T.preparation + 1.1)));
    samourai.updateMatrixWorld(true);
    const pointe = pointeA(t);

    // Mouvements ajoutés par le code : respiration, élan vers l'avant à chaque coup, buste qui suit la lame
    const souffle = Math.sin(temps * 1.7);
    const elan = Math.max(enveloppe(t, T.trait1 - 0.18, TPS.suite1), enveloppe(t, T.trait2 - 0.15, TPS.suite2));
    mouvement.position.set(0, -elan * 0.04 * kH + souffle * 0.004, elan * 0.2 * kH);
    const torsion = clamp(pointe.x * -0.32, -0.35, 0.35) * plage(t, T.preparation, T.preparation + 0.6);
    const penche = lerp(0.05, clamp((1.35 - pointe.y) * 0.1, -0.08, 0.16), plage(t, T.preparation, T.preparation + 0.8)) + elan * 0.08;
    const releve = easeInOut(plage(t, T.regard - 0.1, T.regard + 0.75));
    mouvement.rotation.set(0, 0, 0);

    if (perso.charge) {
      animer(t, temps);
      mouvement.updateMatrixWorld(true);
      const droite = AXE_X.clone().applyQuaternion(samourai.quaternion);
      if (perso.rig) {
        // Le buste suit la lame, la tête se relève au moment où les yeux s'allument
        tournerOs(perso.os.buste, AXE_Y, torsion * 0.8);
        tournerOs(perso.os.buste, droite, penche + souffle * 0.012);
        tournerOs(perso.os.tete, droite, lerp(0.42, -0.06, releve) - penche * 0.5);
        tournerOs(perso.os.tete, AXE_Y, -torsion * 0.4 + Math.sin(temps * 0.5) * 0.02);
      } else {
        // Pas de squelette : tout le corps accompagne le tracé du K, en douceur
        mouvement.rotation.set(penche * 0.5 + (1 - releve) * 0.06, torsion * 0.6, Math.sin(temps * 0.6) * 0.008);
      }
    }
    samourai.updateMatrixWorld(true);

    // Point d'appui des mains : devant la poitrine, entre les épaules
    const pivot = new V3(0, 1.38 * kH, 0.44);
    if (perso.tientKatana) {
      perso.os.d.haut.getWorldPosition(_a); perso.os.g.haut.getWorldPosition(_b);
      pivot.copy(samourai.worldToLocal(_a.add(_b).multiplyScalar(0.5))).add(new V3(0, -0.22 * kH, 0.26 * kH));
    }
    const dir = pointe.clone().sub(pivot).normalize();
    // Le tranchant suit le mouvement (la lame coupe dans le bon sens)
    if (pointePrec) {
      const vit = pointe.clone().sub(pointePrec);
      const perp = vit.addScaledVector(dir, -vit.dot(dir));
      if (perp.lengthSq() > 1e-7) tranchant.lerp(perp.normalize(), 0.35);
    }
    pointePrec = pointe.clone();
    orienterKatana(dir);
    katana.position.copy(pointe).sub(POINTE_LOCALE.clone().applyQuaternion(katana.quaternion));

    // Les yeux, posés sur l'os de la tête
    yeuxGroupe.visible = perso.charge && MODELE.yeux.afficher;
    if (perso.os.tete) { perso.os.tete.getWorldPosition(_a); yeuxGroupe.position.copy(samourai.worldToLocal(_a)); }
    else yeuxGroupe.position.set(0, MODELE.hauteur * 0.87, 0);
    yeuxGroupe.position.y += MODELE.yeux.hauteur; yeuxGroupe.position.z += MODELE.yeux.avance;

    // Les mains tiennent la poignée (cinématique inverse sur les os du modèle)
    if (perso.tientKatana) {
      const tenir = (cote, prise) => {
        const s = cote === 'd' ? -1 : 1, o = perso.os[cote];
        const S = o.haut.getWorldPosition(new V3()), E = o.avant.getWorldPosition(new V3()), H = o.main.getWorldPosition(new V3());
        const cible = katana.localToWorld(prise.clone());
        cible.addScaledVector(S.clone().sub(cible).normalize(), 0.07 * kH);      // le poignet est un peu avant la prise
        const pole = new V3(s * 0.75, -1, -0.35).applyQuaternion(samourai.quaternion);
        const r = ik(S, cible, S.distanceTo(E), E.distanceTo(H), pole);
        viser(o.haut, o.avant, r.coude);
        viser(o.avant, o.main, r.main);
        return o.main.getWorldPosition(new V3()).sub(cible);                   // écart restant si le bras est trop court
      };
      // CORRECTIF BUG 1 + 2 : quand le bras est trop court pour la poignée, le katana se rapproche
      // de la main EN DOUCEUR (lissage ~0,1 s, 25 cm max). Avant, il s'y collait instantanément :
      // la lame sautait d'un coup, ce qui faisait vriller les bras et dessinait de grands blocs blancs.
      const ecart = samourai.worldToLocal(tenir('d', MAIN_AVANT).add(samourai.getWorldPosition(new V3())));
      decalagePrise.lerp(ecart, 1 - Math.exp(-dt / 0.1));
      if (decalagePrise.length() > 0.25 * kH) decalagePrise.setLength(0.25 * kH);
      if (decalagePrise.lengthSq() > 1e-8) {
        const prise = samourai.worldToLocal(katana.localToWorld(MAIN_AVANT.clone())).add(decalagePrise);
        orienterKatana(pointe.clone().sub(prise).normalize());
        katana.position.copy(prise).sub(MAIN_AVANT.clone().applyQuaternion(katana.quaternion));
        tenir('d', MAIN_AVANT);
      }
      tenir('g', MAIN_ARRIERE);
    }
  }

  /* ==========================================================================
     12. TIMELINE : événements ponctuels (flashs, étincelles, sons)
     ========================================================================== */
  const projeter = (p) => { const s = p.clone().project(camera); return new THREE.Vector2(s.x * 0.5 + 0.5, s.y * 0.5 + 0.5); };
  let chocDebut = -10;
  const choc = (pointMonde, force) => { cinema.uniforms.uChoc.value.copy(projeter(pointMonde)); cinema.uniforms.uChocF.value = force; chocDebut = horloge; };
  let flashScene = 0;
  const lettreMonde = (i) => titre.localToWorld(new V3(lettres[i].cx, 0, 0));

  const EVENEMENTS = [
    { t: T.regard + 0.15, f: () => { Son.tinte(0.07, 3100); } },
    { t: T.lameIllumine, f: () => { Son.tinte(0.2, 1960); Son.souffle(1.2, 200, 900, 0.18); } },
    { t: T.trait1 - 0.05, f: () => { Son.souffle(0.38, 380, 3200, 0.7); } },
    { t: T.trait1 + D.trait1 * 0.6, f: () => { secouer(0.42); gerbe(courbe1.getSpacedPoints(12), 40, 0.6); } },
    { t: T.trait2 - 0.05, f: () => { Son.souffle(0.6, 320, 2800, 0.75); } },
    { t: T.trait2 + D.trait2 * 0.45, f: () => { secouer(0.3); } },
    { t: T.trait2 + D.trait2 * 0.95, f: () => { secouer(0.35); gerbe(courbe2.getSpacedPoints(16), 50, 0.6); } },
    { t: T.revelationK, f: () => { secouer(0.75); flashScene = 0.45; choc(centreK, 1); gerbe(pointsDuK, 520, 1.25, centreK); Son.impact(0.9); Son.tinte(0.22, 1480); } },
    { t: T.transformation, f: () => { flashScene = 0.3; choc(centreK, 0.6); secouer(0.3); Son.souffle(0.5, 600, 4000, 0.4); } },
    ...[1, 2, 3, 4].map((i) => ({ t: T.lettres + (i - 1) * D.ecartLettres, f: () => {
      secouer(0.14); const p = lettreMonde(i); gerbe([p], 45, 0.7); Son.souffle(0.16, 900, 4500, 0.32);
    } })),
    { t: T.coupeFinale, f: () => { Son.souffle(0.3, 500, 5000, 0.7); } },
    { t: T.coupeFinale + 0.16, f: () => {
      secouer(0.62); flashScene = 0.35; choc(titre.localToWorld(new V3(0, 0, 0)), 0.9); Son.impact(0.75); Son.tinte(0.25, 2350);
      const pts = []; for (let i = 0; i <= 40; i++) pts.push(titre.localToWorld(cp0.clone().lerp(cp1, i / 40)));
      gerbe(pts, 380, 1.0);
    } },
    { t: T.coupeFinale + 0.4, f: () => { placerSousTitre(); sousTitre.classList.add('visible'); } },
    { t: T.sortie, f: () => { Son.souffle(0.5, 300, 6000, 0.5); } },
    { t: T.sortie + 0.3, f: () => { Son.impact(1); } }
  ];

  /* Place le sous-titre juste sous le titre KANKI */
  function placerSousTitre() {
    const bas = titre.localToWorld(new V3(0, -0.62, 0)).project(camera);
    document.documentElement.style.setProperty('--sous-titre-y', ((1 - (bas.y * 0.5 + 0.5)) * 100).toFixed(2) + '%');
  }

  /* ==========================================================================
     13. BOUCLE PRINCIPALE
     ========================================================================== */
  let mode = 'intro';            // 'intro' ou 'site'
  let t = 0;                     // temps de l'intro
  let horloge = 0;               // temps global (animations d'ambiance)
  let dernier = performance.now();
  let pause = false;
  const souris = { x: 0, y: 0, lx: 0, ly: 0 };
  addEventListener('pointermove', (e) => { souris.x = e.clientX / innerWidth - 0.5; souris.y = e.clientY / innerHeight - 0.5; }, { passive: true });

  const camPos = new V3(), camVise = new V3();

  function mettreAJour(dt) {
    horloge += dt;
    if (mode === 'intro' && !pause) {
      const avant = t; t += dt;
      EVENEMENTS.forEach((e) => { if (!e.fait && avant < e.t && t >= e.t) { e.fait = true; e.f(); } });
      progres.style.transform = `scaleX(${clamp(t / T.sortie)})`;
      if (t >= T.sortie && !sortieLancee) lancerSortie();
    }
    const ti = mode === 'site' ? T.fin + 2 : t;     // temps « figé » de la chorégraphie une fois sur le site

    /* — Apparition : fondu depuis le noir, la brume s'ouvre — */
    const app = plage(ti, T.apparition, T.apparition + 2.6);
    cinema.uniforms.uFondu.value = mode === 'site' ? 1 : lisse(plage(ti, 0, 1.6));
    rideau.uOpacite.value = (1 - easeOut(app)) * 1.1;
    const lumiere = lisse(plage(ti, T.apparition, T.apparition + 2.4));
    // Pendant le titre, le décor s'efface un peu pour que KANKI ressorte
    const effaceDecor = mode === 'intro' ? easeInOut(plage(ti, T.transformation, T.transformation + 1)) : 0;
    contreG.intensity = 95 * lumiere * (1 - effaceDecor * 0.45); contreD.intensity = 75 * lumiere * (1 - effaceDecor * 0.45); face.intensity = 7 * lumiere;
    voiles.forEach((u) => { if (u.devant) u.uOpacite.value = u.base * (1 - effaceDecor * 0.9); });
    uSoleil.uI.value = lerp(0.12, 1, lumiere) * (1 + flashScene * 0.6) * (mode === 'site' ? 1.05 : 1) * (1 - effaceDecor * 0.3);
    brouillard.density = lerp(0.12, 0.072, app);
    uParticules.uDensite.value = brouillard.density;
    uParticules.uI.value = lerp(0.2, 1, lumiere);

    /* — Les yeux s'allument — */
    const oeil = plage(ti, T.regard, T.regard + 0.5);
    const intensYeux = oeil <= 0 ? 0 : (oeil < 0.25 ? oeil * 4 * 5 : lerp(5, 2.4, plage(oeil, 0.25, 1))) * (0.92 + Math.sin(horloge * 13) * 0.04 + Math.sin(horloge * 31) * 0.04);
    yeux.forEach((o) => o.material.color.copy(C(COUL.yeux, intensYeux)));
    lumYeux.intensity = intensYeux * 0.008;

    /* — Le katana s'illumine — */
    uniformsLame.uBalayage.value = easeInOut(plage(ti, T.lameIllumine, T.lameIllumine + 0.9));
    const lueurLame = plage(ti, T.lameIllumine, T.lameIllumine + 0.3) * (ti > TPS.garde + 0.6 ? lerp(1, 0.45, plage(ti, TPS.garde + 0.6, TPS.garde + 2)) : 1);
    uniformsLame.uLueur.value = lueurLame * (1 + Math.sin(horloge * 7) * 0.08);

    /* — Pose du samouraï — */
    poserSamourai(ti, dt, horloge);

    /* — Lumière portée par la lame — */
    const milieuLame = katana.localToWorld(new V3(0, 0.5, 0));
    lumLame.position.copy(milieuLame); lumLame.intensity = lueurLame * 2.2 * (katana.visible ? 1 : 0);

    /* — Swoosh : traînée qui suit la lame quand elle va vite — */
    const pW = katana.localToWorld(POINTE_LOCALE.clone()), bW = katana.localToWorld(BASE_SWOOSH.clone());
    if (!swoosh.pret) { swoosh.base.forEach((x) => x.copy(bW)); swoosh.pointe.forEach((x) => x.copy(pW)); swoosh.pret = true; }
    const vitesse = pW.distanceTo(swoosh.pointe[0]) / Math.max(dt, 1e-3);
    // CORRECTIF BUG 1 : si la lame se déplace d'un coup (saut d'image, retour en arrière, « Passer »),
    // on efface l'historique au lieu de relier l'ancienne et la nouvelle position par un grand polygone.
    const saut = 0.25 + 9 * Math.max(dt, 1 / 60);
    if (pW.distanceTo(swoosh.pointe[0]) > saut || bW.distanceTo(swoosh.base[0]) > saut) { swoosh.base.forEach((x) => x.copy(bW)); swoosh.pointe.forEach((x) => x.copy(pW)); }
    swoosh.base.pop(); swoosh.pointe.pop(); swoosh.base.unshift(bW.clone()); swoosh.pointe.unshift(pW.clone());
    for (let i = 0; i < SW; i++) { swoosh.base[i].toArray(posSw, i * 6); swoosh.pointe[i].toArray(posSw, i * 6 + 3); }
    geoSw.attributes.position.needsUpdate = true;
    uSw.uI.value = lerp(uSw.uI.value, smoothstep(1.5, 7.0, vitesse) * lueurLame * 0.4 * (katana.visible ? 1 : 0), 0.5);   // CORRECTIF BUG 1 : moins intense

    /* — Le K de néon — */
    const p1 = progTrait1(ti), p2 = progTrait2(ti);
    const rev = plage(ti, T.revelationK, T.revelationK + 0.12);
    const apresRev = plage(ti, T.revelationK + 0.12, T.transformation);
    const fondK = 1 - plage(ti, T.transformation, T.transformation + 0.45);
    const iK = (ti < T.revelationK ? 1 : lerp(1, 2.2, rev) * (rev >= 1 ? lerp(1, 0.7, easeOut(apresRev)) : 1)) * fondK * (1 + Math.sin(horloge * 23) * 0.03);
    [p1, p2].forEach((p, k) => traces[k].forEach(({ mesh, u }) => {
      mesh.visible = mode === 'intro' && p > 0 && fondK > 0; u.uProg.value = p; u.uI.value = iK;
      u.uEchelle.value = u.uHalo.value > 0.5 ? 3.4 + rev * 1.6 * fondK : 1 + rev * 0.4;
    }));
    lumK.position.copy(centreK).add(new V3(0, 0, 0.3));
    lumK.intensity = mode === 'intro' ? (ti > T.trait1 ? (0.6 + 3 * Math.max(0, iK - 1)) * fondK * (p1 > 0 ? 1 : 0) * 3 : 0) : 0;

    /* — Le titre KANKI — */
    const morph = easeInOut(plage(ti, T.transformation + 0.2, T.lettres + 0.65));
    titre.visible = mode === 'intro' && ti >= T.transformation;
    const eFin = echelleTitre();
    titre.position.copy(titreDebut.pos).lerp(titreFin.pos, morph);
    titre.scale.setScalar(lerp(titreDebut.echelle, eFin, morph));
    lettres.forEach((l, i) => {
      const debut = i === 0 ? T.transformation : T.lettres + (i - 1) * D.ecartLettres;
      const u = plage(ti, debut, debut + 0.42);
      l.groupe.visible = ti >= debut;
      if (i > 0) {                                                    // arrivée tranchante depuis la droite
        const e = easeOutExpo(u);
        l.groupe.position.set((1 - e) * 0.55, (1 - e) * -0.08, (1 - e) * -0.6);
        l.groupe.scale.setScalar(lerp(1.18, 1, e));
      }
      const chaud = 1 - plage(ti, debut, debut + 0.4);                // flash blanc → rouge
      const pulse = 1 + Math.sin(horloge * 2.2 + i) * 0.08;
      const coupeFlash = Math.max(0, 1 - Math.abs(ti - T.coupeFinale - 0.2) * 3);
      l.capot.uniforms.uTranche.value.copy(C(COUL.neon, 2.5 * pulse + coupeFlash * 2)).lerp(C(COUL.blancChaud, 4), chaud * 0.55);
      l.capot.uniforms.uFlash.value = i === 0 ? 0 : chaud * chaud;      // le K, lui, sort du néon déjà noir
      // La coupe : la moitié haute glisse le long de la ligne
      const g = easeOutBack(plage(ti, T.coupeFinale + 0.16, T.coupeFinale + 0.65)) * 0.045;
      l.moities.haut.position.copy(dirCoupe).multiplyScalar(g);
    });
    uReflet.value = ti < T.coupeFinale ? lerp(-3, 3, easeInOut(plage(ti, T.lettres + 0.75, T.lettres + 1.65)))
                                       : lerp(-3, 3, easeInOut(plage(ti, T.coupeFinale + 0.7, T.coupeFinale + 1.7)));
    uCoupe.uProg.value = easeOut(plage(ti, T.coupeFinale, T.coupeFinale + 0.18));
    uCoupe.uI.value = ti < T.coupeFinale ? 0 : 1 - plage(ti, T.coupeFinale + 0.3, T.coupeFinale + 1.0);

    /* — Caméra — */
    const k = recul();
    const pc = interp(CLES, ti, 'p'), vc = interp(CLES, ti, 'c');
    camVise.set(vc[0], vc[1], vc[2]);
    camPos.set(pc[0], pc[1], pc[2]).sub(camVise).multiplyScalar(k).add(camVise);
    camera.fov = interp(CLES, ti, 'f')[0];
    if (mode === 'site') {                                            // cadrage du site : samouraï à droite
      const portrait = innerWidth / innerHeight < 1;
      camVise.set(portrait ? 0.05 : -1.05, 1.42, 0.2);
      camPos.set(portrait ? 0.35 : -0.55, 1.36, portrait ? 7.4 : 6.1);
      camera.fov = 34;
    }
    // Petit mouvement « caméra à l'épaule » + parallaxe souris
    souris.lx += (souris.x - souris.lx) * 0.04; souris.ly += (souris.y - souris.ly) * 0.04;
    camPos.x += Math.sin(horloge * 0.31) * 0.03 + souris.lx * (mode === 'site' ? 0.5 : 0.15);
    camPos.y += Math.sin(horloge * 0.43) * 0.02 - souris.ly * (mode === 'site' ? 0.25 : 0.08);
    // Tremblement
    trauma = Math.max(0, trauma - dt * 1.7);
    const s = trauma * trauma;
    camPos.x += s * 0.07 * (Math.sin(horloge * 71.3) + Math.sin(horloge * 43.7) * 0.6);
    camPos.y += s * 0.06 * (Math.sin(horloge * 63.1 + 1.3) + Math.sin(horloge * 37.9) * 0.6);
    camera.position.copy(camPos);
    camera.lookAt(camVise);
    camera.rotation.z += s * 0.012 * Math.sin(horloge * 55.0);
    camera.updateProjectionMatrix();

    /* — Post-traitement — */
    flashScene = Math.max(0, flashScene - dt * 2.6);
    cinema.uniforms.uFlash.value = flashScene * flashScene;
    const ageChoc = horloge - chocDebut;
    cinema.uniforms.uChocT.value = ageChoc < 1 ? ageChoc : -1;
    cinema.uniforms.uAberration.value = 0.0014 + s * 0.006 + flashScene * 0.004;
    cinema.uniforms.uTemps.value = horloge % 100;
    bloom.strength = REGLAGES.effets.bloom * (1 + flashScene * 0.8);

    /* — Ambiance — */
    voiles.forEach((u) => { u.uTemps.value = horloge; });
    uSoleil.uTemps.value = horloge;
    uParticules.uTemps.value = horloge;
    majEtincelles(dt);
  }

  function rendre() {
    if (miroir) { scene.updateMatrixWorld(); camera.updateMatrixWorld(); miroir.majReflet(renderer, scene, camera); }
    composer.render();
  }

  function boucle(maintenant) {
    requestAnimationFrame(boucle);
    if (document.hidden) { dernier = maintenant; return; }
    // Sur le site, quand la scène 3D est cachée sous les sections, on arrête de la calculer (économie de batterie)
    if (mode === 'site' && scrollY > innerHeight * 1.6) { dernier = maintenant; return; }
    const dt = Math.min(0.05, (maintenant - dernier) / 1000); dernier = maintenant;
    mettreAJour(REDUIT && mode === 'site' ? 0 : dt);
    rendre();
  }

  /* ==========================================================================
     14. SORTIE DE L'INTRO, PASSER, REVOIR
     ========================================================================== */
  let sortieLancee = false;
  function lancerSortie() {
    sortieLancee = true;
    const debut = performance.now(), monte = 330, descend = 900;
    const anim = (now) => {
      const e = now - debut;
      if (e < monte) { flash.style.opacity = easeIn(e / monte).toFixed(3); requestAnimationFrame(anim); return; }
      if (mode !== 'site') basculerSurSite();
      const u = clamp((e - monte) / descend);
      flash.style.opacity = (1 - easeOut(u)).toFixed(3);
      if (u < 1) requestAnimationFrame(anim);
    };
    requestAnimationFrame(anim);
  }
  function basculerSurSite() {
    mode = 'site'; t = T.fin;
    intro.classList.remove('cinema'); sousTitre.classList.remove('visible');
    corps.classList.remove('en-intro'); corps.classList.add('en-site');
    trauma = 0.5; flashScene = 0;
    for (let i = 0; i < ETINC; i++) etinc.vie[i] = 0;
  }
  function passer() {
    if (mode !== 'intro' || sortieLancee) return;
    // On saute directement au flash de sortie, sans déclencher les événements sautés
    EVENEMENTS.forEach((e) => { if (e.t < T.sortie) e.fait = true; });
    t = T.sortie;
    lancerSortie();
  }
  function rejouer() {
    if (mode !== 'site') return;
    EVENEMENTS.forEach((e) => { e.fait = false; });
    t = 0; mode = 'intro'; sortieLancee = false; pointePrec = null; swoosh.pret = false;
    corps.classList.remove('en-site'); corps.classList.add('en-intro');
    intro.classList.add('cinema');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  btnPasser.addEventListener('click', passer);
  addEventListener('keydown', (e) => {
    if ((e.code === 'Space' || e.key === ' ') && mode === 'intro') { e.preventDefault(); passer(); }
  });
  document.querySelectorAll('[data-rejouer]').forEach((b) => b.addEventListener('click', rejouer));

  /* ─── Redimensionnement ─── */
  const redimensionner = () => {
    const w = innerWidth, h = innerHeight;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.setSize(w, h, false); composer.setSize(w, h);
    if (miroir) miroir.getRenderTarget().setSize(Math.round(w * PR * 0.5), Math.round(h * PR * 0.5));
    cinema.uniforms.uAspect.value = w / h;
    uParticules.uEchelle.value = (h * 0.5) / Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    if (sousTitre.classList.contains('visible')) placerSousTitre();
  };
  addEventListener('resize', redimensionner);
  redimensionner();

  /* ─── Préchauffage : on compile tout avant de lancer, pour éviter les saccades ─── */
  mettreAJour(0);
  titre.visible = true; lettres.forEach((l) => { l.groupe.visible = true; }); traces.forEach((p) => p.forEach(({ mesh }) => { mesh.visible = true; }));
  renderer.compile(scene, camera);
  rendre();
  mettreAJour(0);

  // Outils de test : window.kanki.aller(5.4) fige l'intro à 5,4 s
  window.kanki = {
    aller(sec) { EVENEMENTS.forEach((e) => { e.fait = e.t < sec; }); t = sec; pause = true; swoosh.pret = false; pointePrec = null; mettreAJour(0); swoosh.pret = false; mettreAJour(0); rendre(); },
    reprendre() { pause = false; }, passer, rejouer
  };

  return {
    lancer() {
      if (REDUIT) { EVENEMENTS.forEach((e) => { e.fait = true; }); basculerSurSite(); }
      else intro.classList.add('cinema');
      requestAnimationFrame((n) => { dernier = n; boucle(n); });
    }
  };
}

function smoothstep(a, b, x) { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); }

/* ==========================================================================
   15. DÉMARRAGE
   ========================================================================== */
const secours = setTimeout(() => { if (!scene3D) { document.documentElement.classList.add('sans-3d'); afficherSiteDirect(); } }, 15000);
demarrer3D()
  .then((s) => {
    clearTimeout(secours);
    if (corps.classList.contains('en-site')) return;    // le secours est déjà passé
    scene3D = s;
    chargement.classList.add('fini');
    s.lancer();
  })
  .catch((err) => {
    console.warn('KANKI : 3D indisponible, affichage du site directement.', err);
    clearTimeout(secours);
    document.documentElement.classList.add('sans-3d');
    afficherSiteDirect();
  });

})();
