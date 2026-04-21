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

function setupDataMap(tex, tiling, anisotropy = 4) {
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(tiling, tiling);
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = anisotropy;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  return tex;
}

export function makeLayeredPBRMaterial({
  baseColorMaps, // [4]
  normalMaps, // [4] (chargées mais non utilisées ici)
  roughnessMaps, // [4]
  tiling = 2,
}) {
  for (let i = 0; i < 4; i++) {
    setupColorMap(baseColorMaps[i], tiling);
    setupDataMap(normalMaps[i], tiling);
    setupDataMap(roughnessMaps[i], tiling);
  }

  const mat = new THREE.ShaderMaterial({
    // IMPORTANT: on ne dépend pas de THREE.UniformsLib.lights ici
    lights: false,
    uniforms: {
      bc0: { value: baseColorMaps[0] },
      bc1: { value: baseColorMaps[1] },
      bc2: { value: baseColorMaps[2] },
      bc3: { value: baseColorMaps[3] },

      r0: { value: roughnessMaps[0] },
      r1: { value: roughnessMaps[1] },
      r2: { value: roughnessMaps[2] },
      r3: { value: roughnessMaps[3] },

      w0: { value: 1.0 },
      w1: { value: 0.0 },
      w2: { value: 0.0 },
      w3: { value: 0.0 },

      // “fake outdoor-ish lighting”
      ambientColor: { value: new THREE.Color(0.55, 0.60, 0.70) }, // bleu/gris
      sunColor: { value: new THREE.Color(1.0, 0.98, 0.92) },
      sunDir: { value: new THREE.Vector3(0.5, 1.0, 0.35).normalize() },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormalW;
      varying vec3 vPosW;

      void main() {
        vUv = uv;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vPosW = worldPos.xyz;

        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      precision highp float;

      varying vec2 vUv;
      varying vec3 vNormalW;
      varying vec3 vPosW;

      uniform sampler2D bc0; uniform sampler2D bc1; uniform sampler2D bc2; uniform sampler2D bc3;
      uniform sampler2D r0;  uniform sampler2D r1;  uniform sampler2D r2;  uniform sampler2D r3;

      uniform float w0; uniform float w1; uniform float w2; uniform float w3;

      uniform vec3 ambientColor;
      uniform vec3 sunColor;
      uniform vec3 sunDir;

      float saturate(float x) { return clamp(x, 0.0, 1.0); }

      void main() {
        vec4 ww = vec4(w0, w1, w2, w3);
        float sum = max(ww.x + ww.y + ww.z + ww.w, 0.00001);
        ww /= sum;

        vec3 baseColor =
          texture2D(bc0, vUv).rgb * ww.x +
          texture2D(bc1, vUv).rgb * ww.y +
          texture2D(bc2, vUv).rgb * ww.z +
          texture2D(bc3, vUv).rgb * ww.w;

        float roughness =
          texture2D(r0, vUv).r * ww.x +
          texture2D(r1, vUv).r * ww.y +
          texture2D(r2, vUv).r * ww.z +
          texture2D(r3, vUv).r * ww.w;
        roughness = saturate(roughness);

        vec3 N = normalize(vNormalW);
        vec3 L = normalize(sunDir);

        float NoL = saturate(dot(N, L));

        // petite spec simple (pas PBR strict, mais stable)
        float shininess = mix(220.0, 8.0, roughness);
        vec3 V = normalize(cameraPosition - vPosW);
        vec3 H = normalize(L + V);
        float NoH = saturate(dot(N, H));
        float spec = pow(NoH, shininess) * NoL;

        vec3 color = baseColor * (ambientColor + sunColor * NoL) + vec3(0.04) * spec;
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });

  return mat;
}