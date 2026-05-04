import * as THREE from "three";

// charge uniquement la basecolor à partir d'un id de matériau
// `materialIdOrArray` peut être une string ou un tableau de candidats
export function loadPBRMaterial(textureLoader, materialIdOrArray) {
  const candidates = Array.isArray(materialIdOrArray) ? materialIdOrArray : [materialIdOrArray];

  const baseColor = new THREE.Texture();
  baseColor.colorSpace = THREE.SRGBColorSpace;

  const exts = [".jpg", ".jpeg"];

  function tryCandidate(ci) {
    if (ci >= candidates.length) return; // rien trouvé
    const baseUrl = `${import.meta.env.BASE_URL}materials/${candidates[ci]}/`;

    let ei = 0;
    function tryBaseExt() {
      if (ei >= exts.length) return tryCandidate(ci + 1);
      const url = `${baseUrl}basecolor${exts[ei]}`;
      textureLoader.load(url, (t) => {
        baseColor.image = t.image || t;
        baseColor.needsUpdate = true;
        console.log(`loadPBRMaterial: loaded ${url}`);
      }, undefined, () => {
        ei += 1;
        tryBaseExt();
      });
    }
    tryBaseExt();
  }

  tryCandidate(0);

  return { baseColor };
}

export function buildLayeredSet(materials) {
  return {
    baseColorMaps: materials.map((m) => m.baseColor),
  };
}