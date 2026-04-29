import * as THREE from "three";

export function createClassicHouse(matsByType) {

  const root = new THREE.Group();

  const W = 6;
  const D = 5;
  const H = 2.8;
  const T = 0.15;
  const ROOF_H = 1.8;

  function generateUVs(geometry) {
    geometry.computeBoundingBox();
    const bbox = geometry.boundingBox;
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const pos = geometry.attributes.position;
    const uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const u = size.x > 0 ? (x - bbox.min.x) / size.x : 0;
      const v = size.y > 0 ? (y - bbox.min.y) / size.y : 0;
      uv[i * 2] = u;
      uv[i * 2 + 1] = v;
    }
    geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  }

  // Toit plat
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(W + 0.3, 0.18, D + 0.15),
    matsByType.couverture
  );
  roof.position.set(0, H + 0.09, 0);
  root.add(roof);

  // Sol
  const floor = new THREE.Mesh(new THREE.BoxGeometry(W, 0.12, D), matsByType.floors);
  floor.position.set(0, 0.06, 0);
  root.add(floor);


  // --- Murs porteurs avec trous pour fenêtres ---
  // Fenêtres standards
  const winW = 1.1, winH = 1.2, winY = 1.2;

  // Mur Nord (2 fenêtres)
  {
    const shape = new THREE.Shape();
    shape.moveTo(-W/2, 0);
    shape.lineTo(W/2, 0);
    shape.lineTo(W/2, H);
    shape.lineTo(-W/2, H);
    shape.closePath();
    // Trous fenêtres
    [-1, 1].forEach((side) => {
      const hole = new THREE.Path();
      hole.moveTo(side * (W/4) - winW/2, winY - winH/2);
      hole.lineTo(side * (W/4) + winW/2, winY - winH/2);
      hole.lineTo(side * (W/4) + winW/2, winY + winH/2);
      hole.lineTo(side * (W/4) - winW/2, winY + winH/2);
      hole.closePath();
      shape.holes.push(hole);
    });
    const geo = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false });
    generateUVs(geo);
    const mesh = new THREE.Mesh(geo, matsByType.walls);
    mesh.position.set(0, 0, -D/2 - T/2);
    root.add(mesh);
    // Pas de vitrage : la fenêtre est un vrai trou
  }

  // Mur Est (1 fenêtre)
  {
    const shape = new THREE.Shape();
    shape.moveTo(-D/2, 0);
    shape.lineTo(D/2, 0);
    shape.lineTo(D/2, H);
    shape.lineTo(-D/2, H);
    shape.closePath();
    // Trou fenêtre
    const hole = new THREE.Path();
    hole.moveTo(D/4 - 0.55, winY - winH/2);
    hole.lineTo(D/4 + 0.55, winY - winH/2);
    hole.lineTo(D/4 + 0.55, winY + winH/2);
    hole.lineTo(D/4 - 0.55, winY + winH/2);
    hole.closePath();
    shape.holes.push(hole);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false });
    generateUVs(geo);
    const mesh = new THREE.Mesh(geo, matsByType.walls);
    mesh.rotation.y = Math.PI/2;
    mesh.position.set(W/2 + T/2, 0, 0);
    root.add(mesh);
    // Pas de vitrage : la fenêtre est un vrai trou
  }

  // Mur Ouest (1 fenêtre)
  {
    const shape = new THREE.Shape();
    shape.moveTo(-D/2, 0);
    shape.lineTo(D/2, 0);
    shape.lineTo(D/2, H);
    shape.lineTo(-D/2, H);
    shape.closePath();
    // Trou fenêtre
    const hole = new THREE.Path();
    hole.moveTo(-D/4 - 0.55, winY - winH/2);
    hole.lineTo(-D/4 + 0.55, winY - winH/2);
    hole.lineTo(-D/4 + 0.55, winY + winH/2);
    hole.lineTo(-D/4 - 0.55, winY + winH/2);
    hole.closePath();
    shape.holes.push(hole);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false });
    generateUVs(geo);
    const mesh = new THREE.Mesh(geo, matsByType.walls);
    mesh.rotation.y = Math.PI/2;
    mesh.position.set(-W/2 - T/2, 0, 0);
    root.add(mesh);
    // Pas de vitrage : la fenêtre est un vrai trou
  }

  return root;
}