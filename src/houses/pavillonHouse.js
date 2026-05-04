import * as THREE from "three";

/**
 * Maison pavillonnaire réaliste :
 *  - Toit à 2 pans (pentes) avec débords
 *  - Pignons (murs triangulaires Est/Ouest jusqu'à la faîtière)
 *  - Cheminée
 *  - Porte d'entrée + auvent (mur Sud)
 *  - 4 façades : Nord 2 fenêtres, Sud 2 fenêtres + porte, Est 1 fenêtre, Ouest 1 fenêtre
 *  - Linteaux + menuiseries sur toutes les ouvertures
 */
export function createPavillonHouse(matsByType) {
  const root = new THREE.Group();

  const W      = 8;     // largeur Est-Ouest
  const D      = 6;     // profondeur Nord-Sud
  const H      = 2.9;   // hauteur des murs
  const T      = 0.15;  // épaisseur des murs
  const ROOF_H = 2.2;   // hauteur de la faîtière au-dessus des murs
  const ovW    = 0.5;   // débord de toit Est/Ouest
  const ovD    = 0.4;   // débord de toit Nord/Sud

  const winW = 1.1, winH = 1.2, winY = 1.2;
  const doorW = 0.9, doorH = 2.1;

  // ── Helper UV planaires ─────────────────────────────────────────────────
  function generateUVs(geo) {
    geo.computeBoundingBox();
    const bbox = geo.boundingBox;
    const size = new THREE.Vector3(); bbox.getSize(size);
    const pos = geo.attributes.position;
    const uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      uv[i * 2]     = size.x > 0 ? (pos.getX(i) - bbox.min.x) / size.x : 0;
      uv[i * 2 + 1] = size.y > 0 ? (pos.getY(i) - bbox.min.y) / size.y : 0;
    }
    geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  }

  // ── Helper ajout linteau + menuiserie autour d'une fenêtre ───────────────
  // wx, wz = position monde du centre du mur / fenêtre
  // isEW   = true pour murs Est/Ouest (boîtes orientées différemment)
  function addWindowDressing(wx, wz, isEW = false) {
    const fw = 0.07;
    const fd = T + 0.04;
    if (!isEW) {
      // Murs Nord/Sud : linteau et montants le long de Z
      const lintel = new THREE.Mesh(
        new THREE.BoxGeometry(winW + 0.2, 0.15, fd), matsByType.linteau);
      lintel.position.set(wx, winY + winH / 2 + 0.075, wz);
      root.add(lintel);
      [-1, 1].forEach((s) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(fw, winH, fd), matsByType.menuiserie);
        m.position.set(wx + s * winW / 2, winY, wz); root.add(m);
      });
      const sill = new THREE.Mesh(new THREE.BoxGeometry(winW + fw, fw, fd), matsByType.menuiserie);
      sill.position.set(wx, winY - winH / 2, wz); root.add(sill);
    } else {
      // Murs Est/Ouest : linteau et montants le long de X
      const lintel = new THREE.Mesh(
        new THREE.BoxGeometry(fd, 0.15, winW + 0.2), matsByType.linteau);
      lintel.position.set(wx, winY + winH / 2 + 0.075, wz);
      root.add(lintel);
      [-1, 1].forEach((s) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(fd, winH, fw), matsByType.menuiserie);
        m.position.set(wx, winY, wz + s * winW / 2); root.add(m);
      });
      const sill = new THREE.Mesh(new THREE.BoxGeometry(fd, fw, winW + fw), matsByType.menuiserie);
      sill.position.set(wx, winY - winH / 2, wz); root.add(sill);
    }
  }

  // ── SOL ─────────────────────────────────────────────────────────────────
  const floor = new THREE.Mesh(new THREE.BoxGeometry(W, 0.12, D), matsByType.floors);
  floor.position.set(0, -0.06, 0);
  root.add(floor);

  // ── TOIT À 2 PANS ───────────────────────────────────────────────────────
  // run = distance horizontale faîtière → égout (avec débord)
  const run      = D / 2 + ovD;
  const panelLen = Math.sqrt(ROOF_H * ROOF_H + run * run);
  const angle    = Math.atan2(ROOF_H, run);
  const roofW    = W + 2 * ovW;
  const roofThick = 0.22;

  // Pan Sud
  const roofS = new THREE.Mesh(new THREE.BoxGeometry(roofW, roofThick, panelLen), matsByType.couverture);
  roofS.rotation.x = angle;
  roofS.position.set(0, H + ROOF_H / 2, run / 2);
  root.add(roofS);

  // Pan Nord
  const roofN = new THREE.Mesh(new THREE.BoxGeometry(roofW, roofThick, panelLen), matsByType.couverture);
  roofN.rotation.x = -angle;
  roofN.position.set(0, H + ROOF_H / 2, -run / 2);
  root.add(roofN);

  // Faîtière
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(roofW + 0.1, 0.12, 0.14), matsByType.linteau);
  ridge.position.set(0, H + ROOF_H + 0.06, 0);
  root.add(ridge);

  // Chéneaux (gouttières) aux égouts
  [-1, 1].forEach((side) => {
    const gutter = new THREE.Mesh(new THREE.BoxGeometry(roofW + 0.06, 0.08, 0.12), matsByType.linteau);
    gutter.position.set(0, H - 0.04, side * run);
    root.add(gutter);
  });

  // ── MUR NORD (z = −D/2) — 2 fenêtres ───────────────────────────────────
  {
    const winPositions = [-W / 3, W / 3];
    const shape = new THREE.Shape();
    shape.moveTo(-W / 2, 0); shape.lineTo(W / 2, 0);
    shape.lineTo(W / 2, H);  shape.lineTo(-W / 2, H); shape.closePath();

    winPositions.forEach((cx) => {
      const hole = new THREE.Path();
      hole.moveTo(cx - winW / 2, winY - winH / 2); hole.lineTo(cx + winW / 2, winY - winH / 2);
      hole.lineTo(cx + winW / 2, winY + winH / 2); hole.lineTo(cx - winW / 2, winY + winH / 2);
      hole.closePath(); shape.holes.push(hole);
      const lh = new THREE.Path();
      lh.moveTo(cx - (winW + 0.2) / 2, winY + winH / 2); lh.lineTo(cx + (winW + 0.2) / 2, winY + winH / 2);
      lh.lineTo(cx + (winW + 0.2) / 2, winY + winH / 2 + 0.15); lh.lineTo(cx - (winW + 0.2) / 2, winY + winH / 2 + 0.15);
      lh.closePath(); shape.holes.push(lh);
    });
    const geo = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false });
    generateUVs(geo);
    const mesh = new THREE.Mesh(geo, matsByType.walls);
    mesh.position.set(0, 0, -D / 2 - T / 2);
    root.add(mesh);
    winPositions.forEach((cx) => addWindowDressing(cx, -D / 2, false));
  }

  // ── MUR SUD (z = +D/2) — 1 porte + 2 fenêtres ──────────────────────────
  // rotation.y = PI : local_x → world_−x (miroir X), local_z → world_−z (extrusion vers intérieur)
  {
    const win1X = -W / 3, win2X = W / 3; // positions monde (X)
    const shape = new THREE.Shape();
    shape.moveTo(-W / 2, 0); shape.lineTo(W / 2, 0);
    shape.lineTo(W / 2, H);  shape.lineTo(-W / 2, H); shape.closePath();

    // Porte centrée (local x=0 → world x=0)
    const dh = new THREE.Path();
    dh.moveTo(-doorW / 2, 0); dh.lineTo(doorW / 2, 0);
    dh.lineTo(doorW / 2, doorH); dh.lineTo(-doorW / 2, doorH);
    dh.closePath(); shape.holes.push(dh);
    const dlh = new THREE.Path();
    dlh.moveTo(-(doorW + 0.2) / 2, doorH); dlh.lineTo((doorW + 0.2) / 2, doorH);
    dlh.lineTo((doorW + 0.2) / 2, doorH + 0.15); dlh.lineTo(-(doorW + 0.2) / 2, doorH + 0.15);
    dlh.closePath(); shape.holes.push(dlh);

    // Fenêtres : négatif car miroir rotation.y=PI (local_x = −world_x)
    [-win1X, -win2X].forEach((cx) => {
      const hole = new THREE.Path();
      hole.moveTo(cx - winW / 2, winY - winH / 2); hole.lineTo(cx + winW / 2, winY - winH / 2);
      hole.lineTo(cx + winW / 2, winY + winH / 2); hole.lineTo(cx - winW / 2, winY + winH / 2);
      hole.closePath(); shape.holes.push(hole);
      const lh = new THREE.Path();
      lh.moveTo(cx - (winW + 0.2) / 2, winY + winH / 2); lh.lineTo(cx + (winW + 0.2) / 2, winY + winH / 2);
      lh.lineTo(cx + (winW + 0.2) / 2, winY + winH / 2 + 0.15); lh.lineTo(cx - (winW + 0.2) / 2, winY + winH / 2 + 0.15);
      lh.closePath(); shape.holes.push(lh);
    });

    const geo = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false });
    generateUVs(geo);
    const mesh = new THREE.Mesh(geo, matsByType.walls);
    mesh.rotation.y = Math.PI;
    mesh.position.set(0, 0, D / 2 + T / 2);
    root.add(mesh);

    // Linteau porte (monde)
    const doorLintel = new THREE.Mesh(new THREE.BoxGeometry(doorW + 0.2, 0.15, T + 0.08), matsByType.linteau);
    doorLintel.position.set(0, doorH + 0.075, D / 2);
    root.add(doorLintel);
    // Montants de porte
    { const fw = 0.07; const fd = T + 0.04;
      [-1, 1].forEach((s) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(fw, doorH, fd), matsByType.menuiserie);
        m.position.set(s * doorW / 2, doorH / 2, D / 2); root.add(m);
      });
    }
    // Fenêtres (positions monde)
    [win1X, win2X].forEach((wx) => addWindowDressing(wx, D / 2, false));
  }

  // ── MUR EST (x = +W/2) — pignon + 1 fenêtre ────────────────────────────
  // rotation.y=PI/2 : local_x → world_−z, local_z → world_+x
  // Fenêtre : local x=D/4 → world z=−D/4
  {
    const shape = new THREE.Shape();
    shape.moveTo(-D / 2, 0); shape.lineTo(D / 2, 0);
    shape.lineTo(D / 2, H); shape.lineTo(0, H + ROOF_H); shape.lineTo(-D / 2, H);
    shape.closePath();

    const hole = new THREE.Path();
    hole.moveTo(D / 4 - winW / 2, winY - winH / 2); hole.lineTo(D / 4 + winW / 2, winY - winH / 2);
    hole.lineTo(D / 4 + winW / 2, winY + winH / 2); hole.lineTo(D / 4 - winW / 2, winY + winH / 2);
    hole.closePath(); shape.holes.push(hole);
    const lhE = new THREE.Path();
    lhE.moveTo(D / 4 - (winW + 0.2) / 2, winY + winH / 2); lhE.lineTo(D / 4 + (winW + 0.2) / 2, winY + winH / 2);
    lhE.lineTo(D / 4 + (winW + 0.2) / 2, winY + winH / 2 + 0.15); lhE.lineTo(D / 4 - (winW + 0.2) / 2, winY + winH / 2 + 0.15);
    lhE.closePath(); shape.holes.push(lhE);

    const geo = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false });
    generateUVs(geo);
    const mesh = new THREE.Mesh(geo, matsByType.walls);
    mesh.rotation.y = Math.PI / 2;
    mesh.position.set(W / 2 + T / 2, 0, 0);
    root.add(mesh);
    addWindowDressing(W / 2 + T, -D / 4, true);
  }

  // ── MUR OUEST (x = −W/2) — pignon + 1 fenêtre ──────────────────────────
  // Fenêtre : local x=−D/4 → world z=+D/4
  {
    const shape = new THREE.Shape();
    shape.moveTo(-D / 2, 0); shape.lineTo(D / 2, 0);
    shape.lineTo(D / 2, H); shape.lineTo(0, H + ROOF_H); shape.lineTo(-D / 2, H);
    shape.closePath();

    const hole = new THREE.Path();
    hole.moveTo(-D / 4 - winW / 2, winY - winH / 2); hole.lineTo(-D / 4 + winW / 2, winY - winH / 2);
    hole.lineTo(-D / 4 + winW / 2, winY + winH / 2); hole.lineTo(-D / 4 - winW / 2, winY + winH / 2);
    hole.closePath(); shape.holes.push(hole);
    const lhW = new THREE.Path();
    lhW.moveTo(-D / 4 - (winW + 0.2) / 2, winY + winH / 2); lhW.lineTo(-D / 4 + (winW + 0.2) / 2, winY + winH / 2);
    lhW.lineTo(-D / 4 + (winW + 0.2) / 2, winY + winH / 2 + 0.15); lhW.lineTo(-D / 4 - (winW + 0.2) / 2, winY + winH / 2 + 0.15);
    lhW.closePath(); shape.holes.push(lhW);

    const geo = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false });
    generateUVs(geo);
    const mesh = new THREE.Mesh(geo, matsByType.walls);
    mesh.rotation.y = Math.PI / 2;
    mesh.position.set(-W / 2 - T / 2, 0, 0);
    root.add(mesh);
    addWindowDressing(-W / 2, D / 4, true);
  }

  // ── CHEMINÉE ─────────────────────────────────────────────────────────────
  {
    const cW = 0.5, cD = 0.48;
    const chimneyTop = H + ROOF_H + 0.65; // dépasse de 0.65 m au-dessus de la faîtière
    const chimneyH   = 1.4;
    const chimCenterY = chimneyTop - chimneyH / 2;

    const chimney = new THREE.Mesh(new THREE.BoxGeometry(cW, chimneyH, cD), matsByType.walls);
    chimney.position.set(W / 4, chimCenterY, -D / 5);
    root.add(chimney);

    const cap = new THREE.Mesh(new THREE.BoxGeometry(cW + 0.14, 0.06, cD + 0.14), matsByType.linteau);
    cap.position.set(W / 4, chimneyTop + 0.03, -D / 5);
    root.add(cap);

    // Pot de cheminée
    const pot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.22, 0.2), matsByType.linteau);
    pot.position.set(W / 4, chimneyTop + 0.17, -D / 5);
    root.add(pot);
  }

  // ── AUVENT au-dessus de la porte ─────────────────────────────────────────
  {
    const canopyW = doorW + 0.8;
    const canopyDepth = 0.7;

    const canopy = new THREE.Mesh(new THREE.BoxGeometry(canopyW, 0.08, canopyDepth), matsByType.couverture);
    canopy.position.set(0, doorH + 0.22, D / 2 + canopyDepth / 2);
    root.add(canopy);

    // Montants de l'auvent
    [-1, 1].forEach((s) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.55, 0.07), matsByType.linteau);
      post.position.set(s * (canopyW / 2 - 0.05), doorH - 0.06, D / 2 + canopyDepth - 0.05);
      root.add(post);
    });
  }

  return root;
}
