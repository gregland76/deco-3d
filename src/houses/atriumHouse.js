import * as THREE from "three";

export function createAtriumHouse(matsByType) {
  const root = new THREE.Group();
  const width = 7.8;
  const depth = 6.2;
  const height = 2.9;
  const thickness = 0.16;

  const floor = new THREE.Mesh(new THREE.BoxGeometry(width, 0.12, depth), matsByType.floors);
  floor.position.set(0, 0.06, 0);
  root.add(floor);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(width + 0.5, 0.14, depth + 0.5), matsByType.roofs);
  roof.position.set(0, height + 0.55, 0);
  root.add(roof);

  const northSectionWidth = (width - 2.2) / 2;
  const northLeft = new THREE.Mesh(new THREE.BoxGeometry(northSectionWidth, height, thickness), matsByType.walls);
  northLeft.position.set(-(width / 4 + 0.55), height / 2, -depth / 2);
  root.add(northLeft);

  const northRight = new THREE.Mesh(new THREE.BoxGeometry(northSectionWidth, height, thickness), matsByType.walls);
  northRight.position.set(width / 4 + 0.55, height / 2, -depth / 2);
  root.add(northRight);

  const northLintel = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.75, thickness), matsByType.walls);
  northLintel.position.set(0, height - 0.375, -depth / 2);
  root.add(northLintel);

  const eastWall = new THREE.Mesh(new THREE.BoxGeometry(thickness, height, depth), matsByType.walls);
  eastWall.position.set(width / 2, height / 2, 0);
  root.add(eastWall);

  const westWall = new THREE.Mesh(new THREE.BoxGeometry(thickness, height, depth), matsByType.walls);
  westWall.position.set(-width / 2, height / 2, 0);
  root.add(westWall);

  const southBand = new THREE.Mesh(new THREE.BoxGeometry(width, 1.25, thickness), matsByType.walls);
  southBand.position.set(0, height - 0.625, depth / 2);
  root.add(southBand);

  const sideWingDepth = depth * 0.44;
  const sideWingWidth = 2.2;
  [-1, 1].forEach((direction) => {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(sideWingWidth, height, thickness), matsByType.walls);
    wing.position.set(direction * (width / 2 - sideWingWidth / 2), height / 2, depth / 2 - sideWingDepth);
    root.add(wing);
  });

  const canopy = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.12, 1.9), matsByType.roofs);
  canopy.position.set(0, height + 0.08, depth / 2 - 0.85);
  root.add(canopy);

  return root;
}