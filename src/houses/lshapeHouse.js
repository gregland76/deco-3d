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
  root.add(mesh(new THREE.BoxGeometry(AW, 0.12, AD), matsByType.floors,
    0, 0.06, 0));

  // Toit plat aile principale
  root.add(mesh(new THREE.BoxGeometry(AW + 0.3, 0.18, AD + 0.15), matsByType.roofs,
    0, AH + 0.09, 0));

  // Mur Nord
  root.add(mesh(new THREE.BoxGeometry(AW, AH, T), matsByType.walls,
    0, AH / 2, -AD / 2));

  // Mur Ouest
  root.add(mesh(new THREE.BoxGeometry(T, AH, AD), matsByType.walls,
    -AW / 2, AH / 2, 0));

  // Mur Sud supprimé — ouverture vers la caméra pour voir l'intérieur

  // Mur Est partiel (uniquement la partie haute de l'aile principale
  // au-dessus de l'aile secondaire, sur la partie restante)
  // L'aile secondaire s'accroche côté Est, z positif → la jonction coupe l'aile principale
  // On pose deux segments : Nord (plein) + voile au-dessus de la jonction
  const BW = 3.8; // largeur aile secondaire (selon Z)
  const BD = 3.2; // profondeur aile secondaire (selon X)
  const BH = 2.2;

  const eastTopH = AH - BH; // hauteur du morceau de mur au-dessus de la jonction
  const junctionDepth = BW;  // la partie du mur Est masquée par l'aile secondaire

  // Segment Est au-dessus de l'aile secondaire (bande haute)
  root.add(mesh(new THREE.BoxGeometry(T, eastTopH, junctionDepth), matsByType.walls,
    AW / 2, BH + eastTopH / 2, AD / 2 - junctionDepth / 2));

  // Segment Est au nord de l'aile secondaire (pleine hauteur)
  const northPartDepth = AD - junctionDepth;
  root.add(mesh(new THREE.BoxGeometry(T, AH, northPartDepth), matsByType.walls,
    AW / 2, AH / 2, -AD / 2 + northPartDepth / 2));

  // ── Aile secondaire (s'étend vers l'Est depuis le coin SE) ───────────────
  const bOffsetX = AW / 2 + BD / 2; // centre X de l'aile
  const bOffsetZ = AD / 2 - BW / 2; // centre Z aligné sur la façade Sud

  // Sol aile secondaire
  root.add(mesh(new THREE.BoxGeometry(BD, 0.12, BW), matsByType.floors,
    bOffsetX, 0.06, bOffsetZ));

  // Toit plat aile secondaire (plus bas)
  root.add(mesh(new THREE.BoxGeometry(BD + 0.15, 0.18, BW + 0.15), matsByType.roofs,
    bOffsetX, BH + 0.09, bOffsetZ));

  // Mur Est aile secondaire — supprimé (côté caméra, pour voir l'intérieur)

  // Mur Sud aile secondaire
  root.add(mesh(new THREE.BoxGeometry(BD, BH, T), matsByType.walls,
    bOffsetX, BH / 2, bOffsetZ + BW / 2));

  // Mur Nord aile secondaire (joint avec le mur Est de l'aile principale)
  root.add(mesh(new THREE.BoxGeometry(BD, BH, T), matsByType.walls,
    bOffsetX, BH / 2, bOffsetZ - BW / 2));

  // ── Dalle de toiture entre les deux ailes (angle rentrant) ───────────────
  // Petite acrotère pour marquer l'angle
  root.add(mesh(new THREE.BoxGeometry(0.18, 0.38, BW + 0.15), matsByType.walls,
    AW / 2 + 0.09, AH + 0.09, bOffsetZ));

  return root;
}

/** Raccourci mesh + position */
function mesh(geo, mat, x, y, z) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  return m;
}
