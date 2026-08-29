import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { impliedVol } from "../math/blackScholes.js";

const STRIKE_MIN = 60;
const STRIKE_MAX = 160;
const MAT_MIN = 0.25;
const MAT_MAX = 5;
const IV_MIN = 0;
const IV_MAX = 0.8;

const NX = 56;
const NZ = 36;
const XW = 10;
const ZW = 8;
const YH = 4.2;

const vertexShader = /* glsl */ `
  varying float vH;
  void main() {
    vH = position.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying float vH;
  uniform float uMaxH;
  void main() {
    float t = clamp(vH / max(uMaxH, 0.0001), 0.0, 1.0);
    vec3 navy = vec3(0.035, 0.07, 0.16);
    vec3 teal = vec3(0.16, 0.78, 0.72);
    vec3 orange = vec3(0.93, 0.42, 0.12);
    vec3 col = mix(navy, teal, smoothstep(0.0, 0.42, t));
    col = mix(col, orange, smoothstep(0.40, 1.0, t));
    float rim = pow(t, 1.6);
    col += vec3(0.18, 0.06, 0.02) * rim;
    gl_FragColor = vec4(col, 0.94);
  }
`;

function mapX(strike) {
  return ((strike - STRIKE_MIN) / (STRIKE_MAX - STRIKE_MIN) - 0.5) * XW;
}

function mapZ(mat) {
  const u = (Math.log(mat) - Math.log(MAT_MIN)) / (Math.log(MAT_MAX) - Math.log(MAT_MIN));
  return (u - 0.5) * ZW;
}

function mapY(iv) {
  return ((iv - IV_MIN) / (IV_MAX - IV_MIN)) * YH;
}

function makeLabelSprite(text, size = 48) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const pad = 12;
  ctx.font = `500 ${size}px "IBM Plex Mono", ui-monospace, monospace`;
  const w = Math.ceil(ctx.measureText(text).width + pad * 2);
  const h = size + pad * 2;
  canvas.width = w * 2;
  canvas.height = h * 2;
  ctx.scale(2, 2);
  ctx.font = `500 ${size}px "IBM Plex Mono", ui-monospace, monospace`;
  ctx.fillStyle = "rgba(196, 163, 90, 0.92)";
  ctx.textBaseline = "middle";
  ctx.fillText(text, pad, h / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    }),
  );
  const scale = 0.012;
  sprite.scale.set(w * scale, h * scale, 1);
  return sprite;
}

export function createVolSurface(host, getParams) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x070a08, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 80);
  camera.position.set(8.6, 5.4, 9.4);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.55;
  controls.minDistance = 8;
  controls.maxDistance = 22;
  controls.minPolarAngle = 0.35;
  controls.maxPolarAngle = Math.PI / 2 - 0.12;
  controls.target.set(0, 1.55, 0);
  controls.update();

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.42, 0.55, 0.18);
  composer.addPass(bloom);

  const geo = new THREE.PlaneGeometry(XW, ZW, NX, NZ);
  geo.rotateX(-Math.PI / 2);

  const mat = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: { uMaxH: { value: YH } },
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: true,
  });

  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);

  const wireGeo = new THREE.WireframeGeometry(geo);
  const wire = new THREE.LineSegments(
    wireGeo,
    new THREE.LineBasicMaterial({
      color: 0xe8dcc4,
      transparent: true,
      opacity: 0.22,
    }),
  );
  scene.add(wire);

  const cage = new THREE.Group();
  scene.add(cage);

  function displace() {
    const p = getParams();
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const strike = STRIKE_MIN + ((x / XW + 0.5) * (STRIKE_MAX - STRIKE_MIN));
      const u = z / ZW + 0.5;
      const maty = Math.exp(
        Math.log(MAT_MIN) + u * (Math.log(MAT_MAX) - Math.log(MAT_MIN)),
      );
      pos.setY(i, mapY(impliedVol(strike, maty, p)));
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    wire.geometry.dispose();
    wire.geometry = new THREE.WireframeGeometry(geo);
  }

  function resize() {
    const w = Math.max(1, host.clientWidth);
    const h = Math.max(1, host.clientHeight);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, true);
    composer.setSize(w, h);
    bloom.setSize(w, h);
  }

  let raf = 0;
  let disposed = false;
  let lastSigma = NaN;

  function tick() {
    if (disposed) return;
    const sigma = getParams().sigma;
    if (sigma !== lastSigma) {
      lastSigma = sigma;
      displace();
    }
    controls.update();
    composer.render();
    raf = requestAnimationFrame(tick);
  }

  async function start() {
    resize();
    await document.fonts?.ready.catch(() => {});
    buildCage(cage);
    displace();
    tick();
  }

  function dispose() {
    disposed = true;
    cancelAnimationFrame(raf);
    controls.dispose();
    geo.dispose();
    mat.dispose();
    wire.geometry.dispose();
    renderer.dispose();
    composer.dispose();
    if (renderer.domElement.parentNode === host) {
      host.removeChild(renderer.domElement);
    }
  }

  return { start, resize, dispose, rebuild: displace };
}

function buildCage(group) {
  const gold = 0xc4a35a;
  const x0 = -XW / 2;
  const x1 = XW / 2;
  const z0 = -ZW / 2;
  const z1 = ZW / 2;
  const y0 = 0;
  const y1 = YH;

  const corners = [
    [x0, y0, z0],
    [x1, y0, z0],
    [x1, y0, z1],
    [x0, y0, z1],
    [x0, y1, z0],
    [x1, y1, z0],
    [x1, y1, z1],
    [x0, y1, z1],
  ];
  const edges = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ];
  const pts = [];
  for (const [a, b] of edges) {
    pts.push(...corners[a], ...corners[b]);
  }
  const box = new THREE.BufferGeometry();
  box.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  const boxLine = new THREE.LineSegments(
    box,
    new THREE.LineDashedMaterial({
      color: gold,
      dashSize: 0.12,
      gapSize: 0.08,
      transparent: true,
      opacity: 0.55,
    }),
  );
  boxLine.computeLineDistances();
  group.add(boxLine);

  const gridPts = [];
  for (let s = 60; s <= 160; s += 20) {
    const x = mapX(s);
    gridPts.push(x, y0, z0, x, y0, z1);
  }
  const mats = [0.25, 0.5, 1, 2, 5];
  for (const m of mats) {
    const z = mapZ(m);
    gridPts.push(x0, y0, z, x1, y0, z);
  }
  for (let iv = 0.2; iv <= 0.8; iv += 0.2) {
    const y = mapY(iv);
    gridPts.push(x0, y, z0, x1, y, z0);
    gridPts.push(x0, y, z0, x0, y, z1);
  }
  const grid = new THREE.BufferGeometry();
  grid.setAttribute("position", new THREE.Float32BufferAttribute(gridPts, 3));
  const gridLine = new THREE.LineSegments(
    grid,
    new THREE.LineDashedMaterial({
      color: gold,
      dashSize: 0.08,
      gapSize: 0.07,
      transparent: true,
      opacity: 0.28,
    }),
  );
  gridLine.computeLineDistances();
  group.add(gridLine);

  const ticks = [
    [mapX(60), 0, z0 - 0.35, "60"],
    [mapX(100), 0, z0 - 0.35, "100"],
    [mapX(140), 0, z0 - 0.35, "140"],
    [x1 + 0.4, 0, mapZ(0.25), "0.25"],
    [x1 + 0.4, 0, mapZ(1), "1.00"],
    [x1 + 0.4, 0, mapZ(5), "5.00"],
    [x0 - 0.45, mapY(0), z0, "0.00"],
    [x0 - 0.45, mapY(0.4), z0, "0.40"],
    [x0 - 0.45, mapY(0.8), z0, "0.80"],
  ];
  for (const [x, y, z, label] of ticks) {
    const spr = makeLabelSprite(label, 42);
    spr.position.set(x, y, z);
    group.add(spr);
  }

  const yTitle = makeLabelSprite("Implied Volatility", 40);
  yTitle.position.set(x0 - 1.15, YH * 0.55, z0);
  group.add(yTitle);

  const xTitle = makeLabelSprite("Strike", 40);
  xTitle.position.set(0, -0.35, z0 - 0.85);
  group.add(xTitle);

  const zTitle = makeLabelSprite("Maturity", 40);
  zTitle.position.set(x1 + 1.05, -0.2, 0);
  group.add(zTitle);
}
