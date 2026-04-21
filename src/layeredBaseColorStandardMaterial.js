import * as THREE from "three";

function setupColorMap(tex, tiling, anisotropy = 4) {
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(tiling, tiling);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  return tex;
}

export function makeLayeredBaseColorStandardMaterial({
  baseColorMaps,
  tiling = 2,
  roughness = 0.9,
  metalness = 0.0,
}) {
  baseColorMaps.forEach((map) => setupColorMap(map, tiling));

  const mixSize = baseColorMaps.length;
  const uniformDefs = [];
  const mixTerms = [];
  const sumTerms = [];
  const uniforms = {};

  for (let i = 0; i < mixSize; i++) {
    uniforms[`bc${i}`] = { value: baseColorMaps[i] };
    uniforms[`w${i}`] = { value: i === 0 ? 1.0 : 0.0 };
    uniformDefs.push(`uniform sampler2D bc${i};`);
    uniformDefs.push(`uniform float w${i};`);
    mixTerms.push(`texture2D(bc${i}, vMapUv) * ww[${i}]`);
    sumTerms.push(`w${i}`);
  }

  const mat = new THREE.MeshStandardMaterial({
    roughness,
    metalness,
    map: baseColorMaps[0], // dummy (sera remplacé dans le shader)
  });

  mat.userData.uniforms = uniforms;

  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, mat.userData.uniforms);

    // 1) déclarer nos uniforms
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <map_pars_fragment>",
      `
      #include <map_pars_fragment>
      ${uniformDefs.join("\n      ")}
      `
    );

    // 2) remplacer l'échantillonnage de map par notre mix
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <map_fragment>",
      `
      #ifdef USE_MAP
        float ww[${mixSize}];
        ${Array.from({ length: mixSize }, (_, i) => `ww[${i}] = w${i};`).join("\n        ")}
        float sum = max(${sumTerms.join(" + ")}, 0.00001);
        ${Array.from({ length: mixSize }, (_, i) => `ww[${i}] /= sum;`).join("\n        ")}

        vec4 c = ${mixTerms.join(" +\n          ")};

        // même logique que three: multiply diffuseColor by map
        diffuseColor *= c;
      #endif
      `
    );
  };

  return mat;
}