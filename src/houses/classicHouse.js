import * as THREE from "three";

export function createClassicHouse(matsByType) {
  const root = new THREE.Group();

  const W = 6;
  const D = 5;
  const H = 2.8;
  const T = 0.15;
  const ROOF_H = 1.8;

  // Sol
  const floor = new THREE.Mesh(new THREE.BoxGeometry(W, 0.12, D), matsByType.floors);
  floor.position.set(0, 0.06, 0);
  root.add(floor);

  // Murs — on retire le mur Sud (face caméra) pour voir l'intérieur
  const wallN = new THREE.Mesh(new THREE.BoxGeometry(W, H, T), matsByType.walls);
  wallN.position.set(0, H / 2, -D / 2);
  root.add(wallN);

  // wallS supprimé volontairement pour voir l'intérieur

  const wallE = new THREE.Mesh(new THREE.BoxGeometry(T, H, D), matsByType.walls);
  wallE.position.set(W / 2, H / 2, 0);
  root.add(wallE);

  const wallW = new THREE.Mesh(new THREE.BoxGeometry(T, H, D), matsByType.walls);
  wallW.position.set(-W / 2, H / 2, 0);
  root.add(wallW);

  // Pignons triangulaires (Est et Ouest)
  [-W / 2, W / 2].forEach((x) => {
    const shape = new THREE.Shape();
    shape.moveTo(-D / 2, 0);
    shape.lineTo(D / 2, 0);
    shape.lineTo(0, ROOF_H);
    shape.closePath();

    const geo = new THREE.ShapeGeometry(shape);
    const mesh = new THREE.Mesh(geo, matsByType.walls);
    mesh.rotation.y = Math.PI / 2;
    mesh.position.set(x, H, 0);
    root.add(mesh);
  });

  // Toit 2 pans — seulement la moitié arrière visible
  const panW = Math.sqrt((D / 2) ** 2 + ROOF_H ** 2);
  const angle = Math.atan2(ROOF_H, D / 2);

  // Pan côté -Z (arrière, visible)
  const roofGeoB = new THREE.BoxGeometry(W + 0.4, 0.15, panW + 0.1);
  const roofB = new THREE.Mesh(roofGeoB, matsByType.roofs);
  roofB.rotation.x = -angle;
  roofB.position.set(0, H + ROOF_H / 2 - 0.05, -D / 4);
  root.add(roofB);

  // Pan côté +Z supprimé pour voir l'intérieur

  return root;
}