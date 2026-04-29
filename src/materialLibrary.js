import * as THREE from "three";

export function loadPBRMaterial(textureLoader, materialId) {
  // Construire l'URL vers `public/materials` en respectant `import.meta.env.BASE_URL`
  const baseUrl = `${import.meta.env.BASE_URL}materials/${materialId}/`;

  const baseColor = textureLoader.load(`${baseUrl}basecolor.jpg`);
  const normal = textureLoader.load(`${baseUrl}normal.jpg`);
  const roughness = textureLoader.load(`${baseUrl}roughness.jpg`);

  // color spaces
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