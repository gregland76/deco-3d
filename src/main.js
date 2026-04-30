import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";
import { mountTypeGroup } from "./ui.js";
import { createProceduralHouse } from "./houseProcedural.js";
import { loadPBRMaterial, buildLayeredSet } from "./materialLibrary.js";
import { makeLayeredBaseColorStandardMaterial } from "./layeredBaseColorStandardMaterial.js";

// Poids par défaut par type (ordre : silex/brick/stone/wood/ardoise)
const DEFAULT_WEIGHTS = {
  walls:  { w0: 0, w1: 0, w2: 0, w3: 100,   w4: 0, w5:0, w6:0, w7:0, w8: 0 }, // par défaut Colombage (w3)
  floors: { w3: 100 }, // bois uniquement (w3 -> wood)
  couverture:  { w0: 0, w1: 0, w2: 0, w3: 0, w4: 100, w5: 0, w6: 0, w7: 0, w9: 0, w10: 0 }, // ardoise
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
  .load("sky.hdr", (hdrTex) => {
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
const silex = loadPBRMaterial(tl, "silex");
const brick = loadPBRMaterial(tl, "brick");
const stone = loadPBRMaterial(tl, "stone-Pierre-Calcaire");
// Variantes de bois par usage (utiliser explicitement les dossiers dédiés)
const wood_walls = loadPBRMaterial(tl, "wood-walls");
const wood_floors = loadPBRMaterial(tl, "wood-floors");
const wood_couverture = loadPBRMaterial(tl, "wood-couverture");
const ardoise = loadPBRMaterial(tl, "ardoise");
const bardeaux = loadPBRMaterial(tl, "bardeaux");
const tuile_sable = loadPBRMaterial(tl, "tuile-sable-champagne");
const tuile_rouge = loadPBRMaterial(tl, "tuile-rouge-vieilli");
const tuile_brun = loadPBRMaterial(tl, "tuile-brun-vieilli");
const chaume = loadPBRMaterial(tl, "chaume");
// Nouveau matériau pour la variante 'Moellon calcaire'
const stone_moellons = loadPBRMaterial(tl, "stone-moellons");

// layeredSet order keeps existing base materials first (indices 0..4)
// We'll build a master set, then create per-type maps replacing the wood slot
const masterMaterials = [silex, brick, stone, wood_walls, ardoise, bardeaux, tuile_sable, chaume, stone_moellons, tuile_brun, tuile_rouge];
const masterSet = buildLayeredSet(masterMaterials);

// Debug: inspect textures
console.log('masterSet.baseColorMaps', masterSet.baseColorMaps);
masterSet.baseColorMaps.forEach((t, i) => {
  console.log(`tex[${i}]`, { width: t?.image?.width, height: t?.image?.height, colorSpace: t?.colorSpace, encoding: t?.encoding });
});

// Stable materials (MeshStandardMaterial + basecolor mix only)
// Construire des jeux de maps par type en remplaçant l'index du bois (3)
const masterMaps = masterSet.baseColorMaps;
function mapsWithWoodVariant(woodTex) {
  const m = masterMaps.slice();
  if (woodTex && woodTex.baseColor) m[3] = woodTex.baseColor;
  return m;
}

const wallsMat = makeLayeredBaseColorStandardMaterial({
  baseColorMaps: mapsWithWoodVariant(wood_walls),
  tiling: 2,
  roughness: 0.9,
});
const floorsMat = makeLayeredBaseColorStandardMaterial({
  baseColorMaps: mapsWithWoodVariant(wood_floors),
  tiling: 3,
  roughness: 0.95,
});
const couvertureMat = makeLayeredBaseColorStandardMaterial({
  baseColorMaps: mapsWithWoodVariant(wood_couverture),
  tiling: 2,
  roughness: 1.0,
});

const matsByType = { walls: wallsMat, floors: floorsMat, couverture: couvertureMat };

// Safety fallback: for MeshStandardMaterial instances, assign an explicit `map`
// using the wood-floors variant to ensure the floor shows the expected texture
if (matsByType.floors && matsByType.floors.map === undefined) {
  const fm = mapsByType.floors && mapsByType.floors[3];
  if (fm) {
    matsByType.floors.map = fm;
    matsByType.floors.needsUpdate = true;
    console.log('Assigned explicit floor map from mapsByType.floors[3]');
  }
}

// Appliquer les textures de base dès le chargement
// La fonction applyWeightsToMat est définie ici pour avoir accès à `layeredSet`
// mat: THREE.Material, w: weights, maps: baseColorMaps array to use for fallback
function applyWeightsToMat(mat, w, maps = masterMaps) {
  if (!mat) return;

  // Si le matériau expose des uniforms (shader custom), on les met à jour
  if (mat.userData && mat.userData.uniforms) {
    // Réinitialiser toutes les uniforms wN à 0, puis appliquer les valeurs fournies
    Object.keys(mat.userData.uniforms).forEach((uk) => {
      if (/^w\d+$/.test(uk)) mat.userData.uniforms[uk].value = 0.0;
    });
    Object.entries(w).forEach(([key, value]) => {
      if (mat.userData.uniforms[key]) {
        mat.userData.uniforms[key].value = (Number(value) || 0) / 100;
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
  // maps param fournit l'ensemble de textures à utiliser pour le fallback
  if (Number.isFinite(idx) && maps && maps[idx]) {
    mat.map = maps[idx];
    mat.needsUpdate = true;
  }
}

// Appliquer les textures de base dès le chargement
// Appliquer les textures de base dès le chargement en passant les maps correspondant au type
const mapsByType = {
  walls: mapsWithWoodVariant(wood_walls),
  floors: mapsWithWoodVariant(wood_floors),
  couverture: mapsWithWoodVariant(wood_couverture),
};

Object.entries(matsByType).forEach(([type, mat]) => applyWeightsToMat(mat, DEFAULT_WEIGHTS[type], mapsByType[type]));

// Tooltip de debug supprimé (affiché précédemment en bas à droite)
// Si nécessaire, réactiver manuellement la fonction de debugFloorMap.

// DEBUG: temporaire — utiliser des MeshStandardMaterial simples pour vérifier les textures
// Désactive ceci quand le debug est terminé
// Mettre à `true` pour forcer un matériau simple durant le debug.
  if (false) {
  const tl = masterSet.baseColorMaps;
  const { MeshStandardMaterial } = THREE;
  matsByType.walls = new MeshStandardMaterial({ map: tl[1] });
  matsByType.floors = new MeshStandardMaterial({ map: tl[3] });
  matsByType.couverture = new MeshStandardMaterial({ map: tl[4] });
}

try {
  const house = createProceduralHouse({ matsByType, variant: houseVariant });
  // Aligner la maison sur le sol : déplacer pour que la Y minimale soit à 0
  try {
    const box = new THREE.Box3().setFromObject(house);
    console.log('house bbox before adjust', box.min, box.max);
    if (box && Number.isFinite(box.min.y)) {
      house.position.y = -box.min.y;
      console.log('house positioned to', house.position.y);
    } else {
      console.warn('Could not compute house bbox min.y', box);
    }
  } catch (e) {
    console.error('Error computing house bbox', e);
  }
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
      onWeightsChange: (type, w) => applyWeightsToMat(matsByType[type], w, mapsByType[type]),
  })
);
groups.push(
  mountTypeGroup({
    type: "floors",
    containerId: "group-floors",
    initialWeights: DEFAULT_WEIGHTS.floors,
      onWeightsChange: (type, w) => applyWeightsToMat(matsByType[type], w, mapsByType[type]),
  })
);
groups.push(
  mountTypeGroup({
    type: "couverture",
    containerId: "group-couverture",
    initialWeights: DEFAULT_WEIGHTS.couverture,
      onWeightsChange: (type, w) => applyWeightsToMat(matsByType[type], w, mapsByType[type]),
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