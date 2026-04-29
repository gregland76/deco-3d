import * as THREE from "three";

// charge un ensemble PBR (basecolor/normal/roughness) à partir d'un id de matériau
// `materialIdOrArray` peut être une string ou un tableau de candidiats
export function loadPBRMaterial(textureLoader, materialIdOrArray) {
  const candidates = Array.isArray(materialIdOrArray) ? materialIdOrArray : [materialIdOrArray];

  const baseColor = new THREE.Texture();
  const normal = new THREE.Texture();
  const roughness = new THREE.Texture();

  const exts = [".jpg", ".jpeg"];

  function tryLoadExts(baseUrl, name, tex, onAllFail) {
    let ei = 0;
    function tryNextExt() {
      if (ei >= exts.length) return onAllFail && onAllFail();
      const url = `${baseUrl}${name}${exts[ei]}`;
      textureLoader.load(url, (t) => {
        tex.image = t.image || t;
        tex.needsUpdate = true;
        console.log(`loadPBRMaterial: loaded ${url}`);
      }, undefined, () => {
        ei += 1;
        tryNextExt();
      });
    }
    tryNextExt();
  }

  function tryCandidate(ci) {
    if (ci >= candidates.length) return; // rien trouvé
    const baseUrl = `${import.meta.env.BASE_URL}materials/${candidates[ci]}/`;

    // tenter basecolor; si réussi => charger normal & roughness (avec fallback d'extensions)
    let gotBase = false;
    let ei = 0;
    function tryBaseExt() {
      if (ei >= exts.length) return tryCandidate(ci + 1);
      const url = `${baseUrl}basecolor${exts[ei]}`;
      textureLoader.load(url, (t) => {
        baseColor.image = t.image || t;
        baseColor.needsUpdate = true;
        gotBase = true;
        console.log(`loadPBRMaterial: found basecolor at ${url} for candidate ${candidates[ci]}`);
        // charger normal & roughness (essayer .jpg/.jpeg)
        tryLoadExts(baseUrl, "normal", normal);
        tryLoadExts(baseUrl, "roughness", roughness);
      }, undefined, () => {
        ei += 1;
        tryBaseExt();
      });
    }
    tryBaseExt();
  }

  tryCandidate(0);

  // color spaces (appliquées même si textures pas encore chargées)
  baseColor.colorSpace = THREE.SRGBColorSpace;
  normal.colorSpace = THREE.NoColorSpace;
  roughness.colorSpace = THREE.NoColorSpace;

  return { baseColor, normal, roughness };
}

export function buildLayeredSet(materials) {
  return {
    baseColorMaps: materials.map((m) => m.baseColor),
    normalMaps: materials.map((m) => m.normal),
    roughnessMaps: materials.map((m) => m.roughness),
  };
}