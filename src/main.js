import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";
import { mountTypeGroup } from "./ui.js";
import { createProceduralHouse } from "./houseProcedural.js";
import { loadPBRMaterial, buildLayeredSet } from "./materialLibrary.js";
import { makeLayeredBaseColorStandardMaterial } from "./layeredBaseColorStandardMaterial.js";

// Poids par défaut par type (ordre : paint/brick/stone/wood/ardoise)
const DEFAULT_WEIGHTS = {
  walls:  { w0: 0, w1: 0, w2: 100, w3: 0,   w4: 0   }, // pierre
  floors: { w0: 0, w1: 0, w2: 0,   w3: 100, w4: 0   }, // bois
  roofs:  { w0: 0, w1: 0, w2: 0,   w3: 0,   w4: 100 }, // ardoise
};
const searchParams = new URLSearchParams(window.location.search);
const forceShowUi = searchParams.get("showUi") === "1";
const embedMode = searchParams.get("embed") === "1";
const houseVariant = searchParams.get("variant") ?? "classic";
const captureMode = searchParams.get("capture") === "1";

// applyWeightsToMat will be defined later (after layeredSet is built)

const app = document.getElementById("app");
app.innerHTML = "";

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: captureMode });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

if (captureMode) {
  THREE.DefaultLoadingManager.onLoad = () => {
    requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => {
      try {
        const dataUrl = renderer.domElement.toDataURL("image/jpeg", 0.8);
        window.parent.postMessage(
          { type: "deco-3d:screenshot", variant: houseVariant, dataUrl },
          window.location.origin
        );
      } catch (_) {}
    })));
  };
}

// HDRI environment + background
const pmrem = new THREE.PMREMGenerator(renderer);
pmrem.compileEquirectangularShader();

new HDRLoader()
  .setPath("./hdr/OLD/")
  .load("outdoor.hdr", (hdrTex) => {
    const envMap = pmrem.fromEquirectangular(hdrTex).texture;

    scene.environment = envMap; // lighting/reflections
    scene.background = envMap;  // HDRI visible in background

    hdrTex.dispose();
    pmrem.dispose();
  });
app.appendChild(renderer.domElement);
console.log('Renderer DOM element appended', renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x20242a);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(6, 3.2, 6);


const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1.2, 0);
// Limiter la rotation verticale pour ne pas passer sous la terre
controls.minPolarAngle = Math.PI / 6; // 30° (optionnel, ajustable)
controls.maxPolarAngle = Math.PI / 2; // 90° (empêche d'aller sous la maison)

scene.add(new THREE.HemisphereLight(0xffffff, 0x1a1f2a, 0.9));
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(5, 8, 3);
scene.add(sun);

// Load textures
const tl = new THREE.TextureLoader();
const paint = loadPBRMaterial(tl, "paint");
const brick = loadPBRMaterial(tl, "brick");
const stone = loadPBRMaterial(tl, "stone");
const wood = loadPBRMaterial(tl, "wood");
const slate = loadPBRMaterial(tl, "ardoise");

// UI order: paint/brick/stone/wood/slate
const layeredSet = buildLayeredSet([paint, brick, stone, wood, slate]);

// Debug: inspect textures
console.log('layeredSet.baseColorMaps', layeredSet.baseColorMaps);
layeredSet.baseColorMaps.forEach((t, i) => {
  console.log(`tex[${i}]`, { width: t?.image?.width, height: t?.image?.height, colorSpace: t?.colorSpace, encoding: t?.encoding });
});

// Stable materials (MeshStandardMaterial + basecolor mix only)
const wallsMat = makeLayeredBaseColorStandardMaterial({
  baseColorMaps: layeredSet.baseColorMaps,
  tiling: 2,
  roughness: 0.9,
});
const floorsMat = makeLayeredBaseColorStandardMaterial({
  baseColorMaps: layeredSet.baseColorMaps,
  tiling: 3,
  roughness: 0.95,
});
const roofsMat = makeLayeredBaseColorStandardMaterial({
  baseColorMaps: layeredSet.baseColorMaps,
  tiling: 2,
  roughness: 1.0,
});

const matsByType = { walls: wallsMat, floors: floorsMat, roofs: roofsMat };

// Appliquer les textures de base dès le chargement
// La fonction applyWeightsToMat est définie ici pour avoir accès à `layeredSet`
function applyWeightsToMat(mat, w) {
  if (!mat) return;

  // Si le matériau expose des uniforms (shader custom), on les met à jour
  if (mat.userData && mat.userData.uniforms) {
    Object.entries(w).forEach(([key, value]) => {
      if (mat.userData.uniforms[key]) {
        mat.userData.uniforms[key].value = value / 100;
      }
    });
    return;
  }

  // Fallback pour MeshStandardMaterial de debug : choisir la map ayant le plus haut poids
  const entries = Object.entries(w || {});
  if (entries.length === 0) return;
  let maxKey = entries[0][0];
  let maxVal = entries[0][1];
  for (const [k, v] of entries) {
    if (v > maxVal) { maxVal = v; maxKey = k; }
  }
  const idx = Number(maxKey.replace(/\D/g, ""));
  const maps = layeredSet.baseColorMaps;
  if (Number.isFinite(idx) && maps && maps[idx]) {
    mat.map = maps[idx];
    mat.needsUpdate = true;
  }
}

// Appliquer les textures de base dès le chargement
Object.entries(matsByType).forEach(([type, mat]) => applyWeightsToMat(mat, DEFAULT_WEIGHTS[type]));

// DEBUG: temporaire — utiliser des MeshStandardMaterial simples pour vérifier les textures
// Désactive ceci quand le debug est terminé
if (true) {
  const tl = layeredSet.baseColorMaps;
  const { MeshStandardMaterial } = THREE;
  matsByType.walls = new MeshStandardMaterial({ map: tl[1] });
  matsByType.floors = new MeshStandardMaterial({ map: tl[3] });
  matsByType.roofs = new MeshStandardMaterial({ map: tl[4] });
}

try {
  const house = createProceduralHouse({ matsByType, variant: houseVariant });
  scene.add(house);
  console.log('Procedural house added to scene', house);
} catch (err) {
  console.error('Error creating or adding procedural house', err);
}

// UI
const groups = [];
groups.push(
  mountTypeGroup({
    type: "walls",
    containerId: "group-walls",
    initialWeights: DEFAULT_WEIGHTS.walls,
    onWeightsChange: (type, w) => applyWeightsToMat(matsByType[type], w),
  })
);
groups.push(
  mountTypeGroup({
    type: "floors",
    containerId: "group-floors",
    initialWeights: DEFAULT_WEIGHTS.floors,
    onWeightsChange: (type, w) => applyWeightsToMat(matsByType[type], w),
  })
);
groups.push(
  mountTypeGroup({
    type: "roofs",
    containerId: "group-roofs",
    initialWeights: DEFAULT_WEIGHTS.roofs,
    onWeightsChange: (type, w) => applyWeightsToMat(matsByType[type], w),
  })
);

document.getElementById("resetBtn").addEventListener("click", () => groups.forEach((g) => g.reset()));

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const uiToggle = document.getElementById("uiToggle");
const panel = document.getElementById("panel");

function setEmbeddedUiHidden(hidden) {
  document.body.classList.toggle("embed-ui-hidden", hidden);
}

if (embedMode) {
  setEmbeddedUiHidden(true);
}

window.addEventListener("message", (event) => {
  if (event.origin !== window.location.origin) {
    return;
  }

  if (event.data?.type === "deco-3d:set-embed-ui-hidden") {
    setEmbeddedUiHidden(Boolean(event.data.hidden));
  }
});

// si ton panneau n'a pas id="panel", dis-moi l'id exact
if (uiToggle && panel) {
  uiToggle.addEventListener("click", () => {
    document.body.classList.toggle("ui-collapsed");
    const expanded = !document.body.classList.contains("ui-collapsed");
    uiToggle.setAttribute("aria-expanded", expanded ? "true" : "false");
  });

  // Sur mobile: on démarre caché (optionnel)
  if (!embedMode && !forceShowUi && window.matchMedia("(max-width: 520px)").matches) {
    document.body.classList.add("ui-collapsed");
    uiToggle.setAttribute("aria-expanded", "false");
  }
}

function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();