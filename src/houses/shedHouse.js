import * as THREE from "three";

/**
 * Maison 3 — style "shed" / mono-pente
 * Volume rectangulaire avec un toit à une seule pente (plus haute au nord).
 * Pergola en façade sud, pignons trapézoïdaux.
 * Dimensions : W=7, D=5, H_FRONT=2.4, H_BACK=4.0
 */
export function createShedHouse(matsByType) {
  const root = new THREE.Group();

  const W = 7;
  const D = 5;
  const H_FRONT = 2.4; // hauteur côté sud (ouvert)
  const H_BACK = 4.0;  // hauteur côté nord
  const T = 0.15;

  // ── Sol ────────────────────────────────────────────────────────────────
  const floor = new THREE.Mesh(new THREE.BoxGeometry(W, 0.12, D), matsByType.floors);
  floor.position.set(0, 0.06, 0);
  root.add(floor);

  // ── Mur Nord (arrière — pleine hauteur H_BACK) ──────────────────────
  const wallN = new THREE.Mesh(new THREE.BoxGeometry(W, H_BACK, T), matsByType.walls);
  wallN.position.set(0, H_BACK / 2, -D / 2);
  root.add(wallN);

  // ── Pignons trapézoïdaux Est et Ouest ──────────────────────────────────
  // rotation.y = -π/2 → shape.x mappe sur world.z, shape.y sur world.y
  const buildGable = (directionX) => {
    const shape = new THREE.Shape();
    // sens anti-horaire vu de l'extérieur
    shape.moveTo(-D / 2, 0);       // nord bas
    shape.lineTo(D / 2, 0);        // sud bas
    shape.lineTo(D / 2, H_FRONT);  // sud haut
    shape.lineTo(-D / 2, H_BACK);  // nord haut
    shape.closePath();

    const geo = new THREE.ShapeGeometry(shape);
    const mesh = new THREE.Mesh(geo, matsByType.walls);
    mesh.rotation.y = directionX > 0 ? -Math.PI / 2 : Math.PI / 2;
    mesh.position.set(directionX * W / 2, 0, 0);
    root.add(mesh);
  };

  buildGable(+1); // Est
  buildGable(-1); // Ouest

  // ── Toit mono-pente ────────────────────────────────────────────────────
  const deltaH = H_BACK - H_FRONT;
  const roofLen = Math.sqrt(D * D + deltaH * deltaH);
  const roofAngle = Math.atan2(deltaH, D);

  const roofGeo = new THREE.BoxGeometry(W + 0.4, 0.15, roofLen + 0.2);
  const roof = new THREE.Mesh(roofGeo, matsByType.roofs);
  roof.rotation.x = roofAngle; // lève le côté -Z (nord)
  roof.position.set(0, (H_FRONT + H_BACK) / 2, 0);
  root.add(roof);

  // ── Terrasse ────────────────────────────────────────────────────────────
  const terrasseDepth = 1.8;
  const terrasse = new THREE.Mesh(
    new THREE.BoxGeometry(W + 0.6, 0.1, terrasseDepth),
    matsByType.floors
  );
  terrasse.position.set(0, 0.05, D / 2 + terrasseDepth / 2);
  root.add(terrasse);

  // ── Pergola ─────────────────────────────────────────────────────────────
  const postH = H_FRONT + 0.3;
  const postZ = D / 2 + terrasseDepth - 0.2;
  const postPositions = [-W / 2 + 0.25, 0, W / 2 - 0.25];

  postPositions.forEach((px) => {
    const post = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, postH, 0.1),
      matsByType.walls
    );
    post.position.set(px, postH / 2, postZ);
    root.add(post);
  });

  // Poutre longitudinale avant
  const beamFront = new THREE.Mesh(
    new THREE.BoxGeometry(W + 0.6, 0.1, 0.1),
    matsByType.roofs
  );
  beamFront.position.set(0, postH, postZ);
  root.add(beamFront);

  // Contre-poutres perpendiculaires (lames de pergola)
  const slats = 5;
  for (let i = 0; i < slats; i++) {
    const px = -W / 2 + (i + 0.5) * (W / slats);
    const slatMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.08, terrasseDepth + 0.1),
      matsByType.roofs
    );
    slatMesh.position.set(px, postH, D / 2 + terrasseDepth / 2);
    root.add(slatMesh);
  }

  return root;
}
