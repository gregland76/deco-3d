import * as THREE from "three";

/**
 * Maison 4 — plan en L
 * Deux ailes rectangulaires à toit plat de hauteurs différentes,
 * réunies par un angle intérieur.
 * Aile principale : W=7, D=4.5, H=3.2
 * Aile secondaire : W=3.8, D=3.2, H=2.2 (perpendiculaire côté Est)
 */
export function createLShapeHouse(matsByType) {
  const root = new THREE.Group();
  const T = 0.15;

  // ── Aile principale (corps central, orienté N-S) ───────────────────────
  const AW = 7;   // largeur
  const AD = 4.5; // profondeur
  const AH = 3.2; // hauteur

  // Sol aile principale
  root.add(mesh(new THREE.BoxGeometry(AW, 0.12, AD), matsByType.floors, 0, 0.06, 0));

  // Toit plat aile principale
  root.add(mesh(new THREE.BoxGeometry(AW + 0.3, 0.18, AD + 0.15), matsByType.couverture, 0, AH + 0.09, 0));

  // Mur Nord (2 fenêtres)
  {
    const winW = 1.1, winH = 1.2, winY = 1.3;
    const shape = new THREE.Shape();
    shape.moveTo(-AW/2, 0);
    shape.lineTo(AW/2, 0);
    shape.lineTo(AW/2, AH);
    shape.lineTo(-AW/2, AH);
    shape.closePath();
    [-1, 1].forEach((side) => {
      const hole = new THREE.Path();
      hole.moveTo(side * (AW/4) - winW/2, winY - winH/2);
      hole.lineTo(side * (AW/4) + winW/2, winY - winH/2);
      hole.lineTo(side * (AW/4) + winW/2, winY + winH/2);
      hole.lineTo(side * (AW/4) - winW/2, winY + winH/2);
      hole.closePath();
      shape.holes.push(hole);
    });
    const geo = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false });
    const mesh = new THREE.Mesh(geo, matsByType.walls);
    mesh.position.set(0, 0, -AD/2 - T/2);
    root.add(mesh);
    // Vitres
    [-1, 1].forEach((side) => {
      const glass = new THREE.Mesh(
        new THREE.BoxGeometry(winW, winH, T * 0.5),
        matsByType.glass && matsByType.glass.baseColor ? new THREE.MeshStandardMaterial({
          map: matsByType.glass.baseColor,
          normalMap: matsByType.glass.normal,
          roughnessMap: matsByType.glass.roughness,
          transparent: true,
          opacity: 0.5,
          color: 0x99bbff,
          metalness: 0.1,
          roughness: 0.05,
          envMapIntensity: 1.2,
        }) : new THREE.MeshPhysicalMaterial({
          color: 0x99bbff,
          metalness: 0.1,
          roughness: 0.05,
          transmission: 0.92,
          thickness: 0.04,
          ior: 1.5,
          transparent: true,
          opacity: 0.5,
          reflectivity: 0.4,
          clearcoat: 0.5,
          clearcoatRoughness: 0.1,
        })
      );
      glass.position.set(side * (AW/4), winY, -AD/2 - T/4);
      root.add(glass);
    });
  }

  // Mur Sud (plein)
  root.add(mesh(new THREE.BoxGeometry(AW, AH, T), matsByType.walls, 0, AH/2, AD/2 + T/2));

  // Mur Ouest (plein)
  root.add(mesh(new THREE.BoxGeometry(T, AH, AD), matsByType.walls, -AW/2 - T/2, AH/2, 0));

  // Mur Est supprimé pour ouverture intérieure

  // ── Aile secondaire ──
  const BW = 3.8; // largeur aile secondaire (selon Z)
  const BD = 3.2; // profondeur aile secondaire (selon X)
  const BH = 2.2; // hauteur aile secondaire
  const bOffsetX = AW/2 - BD/2 + 0.09;
  const bOffsetZ = BW/2 + 0.09;

  // Sol aile secondaire
  root.add(mesh(new THREE.BoxGeometry(BD, 0.12, BW), matsByType.floors, bOffsetX, 0.06, bOffsetZ));

  // Toit aile secondaire
  root.add(mesh(new THREE.BoxGeometry(BD + 0.15, 0.18, BW + 0.15), matsByType.couverture, bOffsetX, BH + 0.09, bOffsetZ));

  // Mur Nord aile secondaire
  root.add(mesh(new THREE.BoxGeometry(BD, BH, T), matsByType.walls, bOffsetX, BH/2, bOffsetZ - BW/2 - T/2));

  // Mur Sud aile secondaire
  root.add(mesh(new THREE.BoxGeometry(BD, BH, T), matsByType.walls, bOffsetX, BH/2, bOffsetZ + BW/2 + T/2));

  // Mur Est aile secondaire
  root.add(mesh(new THREE.BoxGeometry(T, BH, BW), matsByType.walls, bOffsetX + BD/2 + T/2, BH/2, bOffsetZ));

  // ── Dalle de toiture entre les deux ailes (angle rentrant) ───────────────
  // Petite acrotère pour marquer l'angle
  root.add(mesh(new THREE.BoxGeometry(0.18, 0.38, BW + 0.15), matsByType.walls, AW / 2 + 0.09, AH + 0.09, bOffsetZ));
  // Fin de la fonction : retourne le groupe racine
  return root;
}

function mesh(geo, mat, x, y, z) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  return m;
}
