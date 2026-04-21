import * as THREE from "three";

export function makeLayeredColorStandardMaterial({
  colors, // [4]
  roughness = 0.85,
  metalness = 0.0,
}) {
  const c = colors.map((x) => new THREE.Color(x));
  const mat = new THREE.MeshStandardMaterial({ roughness, metalness });

  mat.userData.uniforms = {
    w0: { value: 1.0 },
    w1: { value: 0.0 },
    w2: { value: 0.0 },
    w3: { value: 0.0 },
    c0: { value: c[0] },
    c1: { value: c[1] },
    c2: { value: c[2] },
    c3: { value: c[3] },
  };

  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, mat.userData.uniforms);

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
         uniform float w0; uniform float w1; uniform float w2; uniform float w3;
         uniform vec3 c0; uniform vec3 c1; uniform vec3 c2; uniform vec3 c3;`
      )
      .replace(
        "vec4 diffuseColor = vec4( diffuse, opacity );",
        `
          float sum = max(w0 + w1 + w2 + w3, 0.00001);
          vec3 mixed = (c0*(w0/sum) + c1*(w1/sum) + c2*(w2/sum) + c3*(w3/sum));
          vec4 diffuseColor = vec4(mixed, opacity);
        `
      );
  };

  return mat;
}