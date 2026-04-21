import * as THREE from "three";

export function createCourtyardHouse(matsByType) {
  const root = new THREE.Group();

  const width = 8.2;
  const depth = 6.4;
  const wallHeight = 2.9;
  const thickness = 0.16;
  const wingDepth = 2.4;
  const sideWingWidth = 2.2;
  const rearSpan = width - sideWingWidth * 2;

  root.add(box(width, 0.12, depth, matsByType.floors, 0, 0.06, 0));

  root.add(box(width, wallHeight, thickness, matsByType.walls, 0, wallHeight / 2, -depth / 2));
  root.add(box(thickness, wallHeight, depth, matsByType.walls, -width / 2, wallHeight / 2, 0));
  root.add(box(thickness, wallHeight, depth, matsByType.walls, width / 2, wallHeight / 2, 0));

  root.add(
    box(
      sideWingWidth,
      wallHeight,
      thickness,
      matsByType.walls,
      -(width / 2 - sideWingWidth / 2),
      wallHeight / 2,
      depth / 2
    )
  );
  root.add(
    box(
      sideWingWidth,
      wallHeight,
      thickness,
      matsByType.walls,
      width / 2 - sideWingWidth / 2,
      wallHeight / 2,
      depth / 2
    )
  );

  root.add(
    box(
      sideWingWidth + 0.18,
      0.16,
      wingDepth + 0.18,
      matsByType.roofs,
      -(width / 2 - sideWingWidth / 2),
      wallHeight + 0.08,
      depth / 2 - wingDepth / 2
    )
  );
  root.add(
    box(
      sideWingWidth + 0.18,
      0.16,
      wingDepth + 0.18,
      matsByType.roofs,
      width / 2 - sideWingWidth / 2,
      wallHeight + 0.08,
      depth / 2 - wingDepth / 2
    )
  );
  root.add(
    box(
      rearSpan + 0.24,
      0.16,
      depth - wingDepth + 0.18,
      matsByType.roofs,
      0,
      wallHeight + 0.08,
      -0.95
    )
  );

  const patioWidth = width - sideWingWidth * 2 - 0.5;
  const patioDepth = wingDepth - 0.45;
  root.add(box(patioWidth, 0.08, patioDepth, matsByType.floors, 0, 0.04, depth / 2 - patioDepth / 2));

  const pergolaHeight = wallHeight + 0.02;
  const pergolaDepth = 1.55;
  [-1, 1].forEach((direction) => {
    const x = direction * (patioWidth / 2 - 0.3);
    root.add(box(0.1, pergolaHeight, 0.1, matsByType.walls, x, pergolaHeight / 2, depth / 2 - 0.18));
  });

  root.add(box(patioWidth + 0.2, 0.08, 0.1, matsByType.roofs, 0, pergolaHeight, depth / 2 - 0.18));
  root.add(box(patioWidth + 0.2, 0.08, 0.1, matsByType.roofs, 0, pergolaHeight, depth / 2 - pergolaDepth));

  return root;
}

function box(width, height, depth, material, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  return mesh;
}