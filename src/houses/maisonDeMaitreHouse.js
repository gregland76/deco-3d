import * as THREE from "three";

/**
 * Maison de Maître réaliste :
 *  - 2 étages (RDC + R1) — hauteur totale 5.6 m
 *  - Toit à 4 pans (hip roof) avec géométrie custom
 *  - Bandeau de plancher intermédiaire + corniche sommitale
 *  - Balcon avec balustres au-dessus de la porte Sud
 *  - 3 marches de perron devant l'entrée
 *  - 2 cheminées le long de la faîtière
 *  - Nombreuses fenêtres sur les 4 façades (RDC + R1)
 *  - Linteaux et menuiseries sur toutes les ouvertures
 */
export function createMaisonDeMaitreHouse(matsByType) {
  const root = new THREE.Group();

  const W      = 9;     // largeur Est-Ouest
  const D      = 7;     // profondeur Nord-Sud
  const H      = 5.6;   // hauteur totale des murs
  const T      = 0.28;  // épaisseur des murs
  const FH     = 2.9;   // hauteur du plancher intermédiaire (R1)
  const ROOF_H = 2.2;   // hauteur de la faîtière au-dessus du sommet des murs
  const ovW    = 0.55;  // débord de toit Est/Ouest
  const ovD    = 0.45;  // débord de toit Nord/Sud
  const lintH  = 0.16;  // épaisseur des linteaux

  // Fenêtres RDC (hautes)
  const w1W = 1.2, w1H = 1.6, w1Y = 0.75;
  // Fenêtres R1
  const w2W = 1.0, w2H = 1.2, w2Y = FH + 0.72;
  // Porte double
  const doorW = 1.4, doorH = 2.5;

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

  // ── Ajoute un trou (fenêtre) + son linteau dans un Shape ────────────────
  function addHole(shape, cx, cy_bot, w, h) {
    const hole = new THREE.Path();
    hole.moveTo(cx - w / 2, cy_bot);
    hole.lineTo(cx + w / 2, cy_bot);
    hole.lineTo(cx + w / 2, cy_bot + h);
    hole.lineTo(cx - w / 2, cy_bot + h);
    hole.closePath();
    shape.holes.push(hole);

    const lw = w + 0.2;
    const lh = new THREE.Path();
    lh.moveTo(cx - lw / 2, cy_bot + h);
    lh.lineTo(cx + lw / 2, cy_bot + h);
    lh.lineTo(cx + lw / 2, cy_bot + h + lintH);
    lh.lineTo(cx - lw / 2, cy_bot + h + lintH);
    lh.closePath();
    shape.holes.push(lh);
  }

  // ── Habillage 3D (linteau + montants + appui) autour d'une fenêtre ───────
  function addDressing(wx, wz, cy_bot, wW, wH, isEW = false) {
    const fw = 0.06;
    const fd = T + 0.05;
    const cy = cy_bot + wH / 2;
    if (!isEW) {
      const l = new THREE.Mesh(new THREE.BoxGeometry(wW + 0.2, lintH, fd), matsByType.linteau);
      l.position.set(wx, cy_bot + wH + lintH / 2, wz);
      root.add(l);
      [-1, 1].forEach((s) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(fw, wH, fd), matsByType.menuiserie);
        m.position.set(wx + s * wW / 2, cy, wz);
        root.add(m);
      });
      const sill = new THREE.Mesh(new THREE.BoxGeometry(wW + fw, fw, fd), matsByType.menuiserie);
      sill.position.set(wx, cy_bot, wz);
      root.add(sill);
    } else {
      const l = new THREE.Mesh(new THREE.BoxGeometry(fd, lintH, wW + 0.2), matsByType.linteau);
      l.position.set(wx, cy_bot + wH + lintH / 2, wz);
      root.add(l);
      [-1, 1].forEach((s) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(fd, wH, fw), matsByType.menuiserie);
        m.position.set(wx, cy, wz + s * wW / 2);
        root.add(m);
      });
      const sill = new THREE.Mesh(new THREE.BoxGeometry(fd, fw, wW + fw), matsByType.menuiserie);
      sill.position.set(wx, cy_bot, wz);
      root.add(sill);
    }
  }

  // ── SOL ─────────────────────────────────────────────────────────────────
  const floor = new THREE.Mesh(new THREE.BoxGeometry(W, 0.15, D), matsByType.floors);
  floor.position.set(0, -0.075, 0);
  root.add(floor);

  // ── BANDEAU PLANCHER INTERMÉDIAIRE ─────────────────────────────────────
  // Légèrement plus large que les murs → effet de cordon saillant
  const bandeau = new THREE.Mesh(
    new THREE.BoxGeometry(W + 2 * T + 0.06, 0.20, D + 2 * T + 0.06),
    matsByType.linteau
  );
  bandeau.position.set(0, FH + 0.10, 0);
  root.add(bandeau);

  // ── CORNICHE AU SOMMET DES MURS ────────────────────────────────────────
  const corniche = new THREE.Mesh(
    new THREE.BoxGeometry(W + 2 * T + 0.18, 0.26, D + 2 * T + 0.18),
    matsByType.linteau
  );
  corniche.position.set(0, H + 0.13, 0);
  root.add(corniche);

  // ── TOIT À 4 PANS ───────────────────────────────────────────────────────
  {
    const RW     = W + 2 * ovW;   // 10.1
    const RD     = D + 2 * ovD;   // 7.9
    const eaveH  = H + 0.26;      // niveau de l'égout (dessus de corniche)
    const ridgeH = eaveH + ROOF_H;
    const hw = RW / 2, hd = RD / 2;
    const ridgeHL = (RW - RD) / 2; // demi-longueur de la faîtière = 1.1 m

    // 6 points clés
    const A  = [ hw,  eaveH,  hd]; // coin SE
    const B  = [-hw,  eaveH,  hd]; // coin SO
    const C  = [-hw,  eaveH, -hd]; // coin NO
    const Dv = [ hw,  eaveH, -hd]; // coin NE
    const E  = [ ridgeHL, ridgeH, 0]; // faîtière Est
    const F  = [-ridgeHL, ridgeH, 0]; // faîtière Ouest

    // Crée un panneau plan depuis un polygone (ventilation en éventail depuis v[0])
    function makePan(verts) {
      const geo = new THREE.BufferGeometry();
      const pos = [];
      const n = verts.length;
      for (let i = 1; i < n - 1; i++) {
        pos.push(...verts[0], ...verts[i], ...verts[i + 1]);
      }
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      geo.computeVertexNormals();
      // UV planaires sur XZ
      const pa = geo.attributes.position;
      const uv = new Float32Array(pa.count * 2);
      for (let i = 0; i < pa.count; i++) {
        uv[i * 2]     = (pa.getX(i) + hw) / RW;
        uv[i * 2 + 1] = (pa.getZ(i) + hd) / RD;
      }
      geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
      return geo;
    }

    // Pan Sud  (B→A→E→F) — normale vers le Sud + haut
    root.add(new THREE.Mesh(makePan([B, A, E, F]),  matsByType.couverture));
    // Pan Nord (Dv→C→F→E) — normale vers le Nord + haut
    root.add(new THREE.Mesh(makePan([Dv, C, F, E]), matsByType.couverture));
    // Pan Est  (A→Dv→E)  — normale vers l'Est + haut
    root.add(new THREE.Mesh(makePan([A, Dv, E]),    matsByType.couverture));
    // Pan Ouest(C→B→F)   — normale vers l'Ouest + haut
    root.add(new THREE.Mesh(makePan([C, B, F]),     matsByType.couverture));

    // Faîtière
    const ridge = new THREE.Mesh(
      new THREE.BoxGeometry(ridgeHL * 2 + 0.1, 0.14, 0.14),
      matsByType.linteau
    );
    ridge.position.set(0, ridgeH + 0.07, 0);
    root.add(ridge);

    // Gouttières — 4 côtés
    [
      [RW + 0.06, 0.09, 0.14,  0,      eaveH - 0.045,  hd],
      [RW + 0.06, 0.09, 0.14,  0,      eaveH - 0.045, -hd],
      [0.14,      0.09, RD + 0.06,  hw, eaveH - 0.045,  0 ],
      [0.14,      0.09, RD + 0.06, -hw, eaveH - 0.045,  0 ],
    ].forEach(([gw, gh, gd, gx, gy, gz]) => {
      const g = new THREE.Mesh(new THREE.BoxGeometry(gw, gh, gd), matsByType.linteau);
      g.position.set(gx, gy, gz);
      root.add(g);
    });
  }

  // ── MUR NORD (z = −D/2) — 2 fenêtres RDC + 2 fenêtres R1 ──────────────
  {
    const shape = new THREE.Shape();
    shape.moveTo(-W / 2, 0); shape.lineTo(W / 2, 0);
    shape.lineTo(W / 2, H);  shape.lineTo(-W / 2, H); shape.closePath();

    [-W / 3, W / 3].forEach((cx) => {
      addHole(shape, cx, w1Y, w1W, w1H);
      addHole(shape, cx, w2Y, w2W, w2H);
    });

    const geo = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false });
    generateUVs(geo);
    const mesh = new THREE.Mesh(geo, matsByType.walls);
    mesh.position.set(0, 0, -D / 2 - T / 2);
    root.add(mesh);

    [-W / 3, W / 3].forEach((cx) => {
      addDressing(cx, -D / 2, w1Y, w1W, w1H, false);
      addDressing(cx, -D / 2, w2Y, w2W, w2H, false);
    });
  }

  // ── MUR SUD (z = +D/2) — porte + 2 fen. RDC + 3 fen. R1 ───────────────
  // rotation.y = PI : local_x → −world_x
  {
    const shape = new THREE.Shape();
    shape.moveTo(-W / 2, 0); shape.lineTo(W / 2, 0);
    shape.lineTo(W / 2, H);  shape.lineTo(-W / 2, H); shape.closePath();

    // Porte centrale (miroir → local cx = 0)
    addHole(shape, 0, 0, doorW, doorH);
    // Fenêtres RDC (local = −world pour rotation.y=PI)
    [-W / 3, W / 3].forEach((cx) => addHole(shape, -cx, w1Y, w1W, w1H));
    // Fenêtres R1 : 3 fenêtres à 0, ±W/3
    [-W / 3, 0, W / 3].forEach((cx) => addHole(shape, -cx, w2Y, w2W, w2H));

    const geo = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false });
    generateUVs(geo);
    const mesh = new THREE.Mesh(geo, matsByType.walls);
    mesh.rotation.y = Math.PI;
    mesh.position.set(0, 0, D / 2 + T / 2);
    root.add(mesh);

    // Linteau porte (monde)
    const dl = new THREE.Mesh(
      new THREE.BoxGeometry(doorW + 0.2, lintH, T + 0.06),
      matsByType.linteau
    );
    dl.position.set(0, doorH + lintH / 2, D / 2);
    root.add(dl);
    // Montants porte
    [-1, 1].forEach((s) => {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(0.07, doorH, T + 0.05),
        matsByType.menuiserie
      );
      m.position.set(s * doorW / 2, doorH / 2, D / 2);
      root.add(m);
    });

    // Habillages fenêtres (positions monde)
    [-W / 3, W / 3].forEach((cx) => addDressing(cx, D / 2, w1Y, w1W, w1H, false));
    [-W / 3, 0, W / 3].forEach((cx) => addDressing(cx, D / 2, w2Y, w2W, w2H, false));
  }

  // ── MUR EST (x = +W/2) — 1 fen. RDC + 1 fen. R1 ───────────────────────
  // rotation.y = PI/2 : local_x → world_−z
  // Fenêtres à local_x = D/4 → world_z = −D/4
  {
    const shape = new THREE.Shape();
    shape.moveTo(-D / 2, 0); shape.lineTo(D / 2, 0);
    shape.lineTo(D / 2, H);  shape.lineTo(-D / 2, H); shape.closePath();

    addHole(shape,  D / 4, w1Y, w1W, w1H);
    addHole(shape,  D / 4, w2Y, w2W, w2H);

    const geo = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false });
    generateUVs(geo);
    const mesh = new THREE.Mesh(geo, matsByType.walls);
    mesh.rotation.y = Math.PI / 2;
    mesh.position.set(W / 2 + T / 2, 0, 0);
    root.add(mesh);

    addDressing(W / 2, -D / 4, w1Y, w1W, w1H, true);
    addDressing(W / 2, -D / 4, w2Y, w2W, w2H, true);
  }

  // ── MUR OUEST (x = −W/2) — 1 fen. RDC + 1 fen. R1 ────────────────────
  // Fenêtres à local_x = −D/4 → world_z = +D/4
  {
    const shape = new THREE.Shape();
    shape.moveTo(-D / 2, 0); shape.lineTo(D / 2, 0);
    shape.lineTo(D / 2, H);  shape.lineTo(-D / 2, H); shape.closePath();

    addHole(shape, -D / 4, w1Y, w1W, w1H);
    addHole(shape, -D / 4, w2Y, w2W, w2H);

    const geo = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false });
    generateUVs(geo);
    const mesh = new THREE.Mesh(geo, matsByType.walls);
    mesh.rotation.y = Math.PI / 2;
    mesh.position.set(-W / 2 - T / 2, 0, 0);
    root.add(mesh);

    addDressing(-W / 2, D / 4, w1Y, w1W, w1H, true);
    addDressing(-W / 2, D / 4, w2Y, w2W, w2H, true);
  }

  // ── CHEMINÉES (2, le long de la faîtière) ──────────────────────────────
  {
    const eaveH  = H + 0.26;
    const ridgeH = eaveH + ROOF_H;
    const chimTopY = ridgeH + 0.65; // dépasse de 0.65 m au-dessus de la faîtière

    [-1.6, 1.6].forEach((cx) => {
      const cW = 0.55, cD = 0.50;
      const ch = new THREE.Mesh(
        new THREE.BoxGeometry(cW, chimTopY, cD),
        matsByType.walls
      );
      ch.position.set(cx, chimTopY / 2, 0);
      root.add(ch);

      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(cW + 0.14, 0.07, cD + 0.14),
        matsByType.linteau
      );
      cap.position.set(cx, chimTopY + 0.035, 0);
      root.add(cap);

      const pot = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.26, 0.22),
        matsByType.linteau
      );
      pot.position.set(cx, chimTopY + 0.17, 0);
      root.add(pot);
    });
  }

  // ── BALCON SUD au-dessus de la porte ────────────────────────────────────
  {
    const bW      = doorW + 1.2; // 2.6 m
    const bD      = 0.90;        // profondeur
    const bBaseY  = FH + 0.20;   // dessus du bandeau = dessus de la dalle
    const railH   = 0.90;

    // Dalle
    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(bW, 0.12, bD),
      matsByType.linteau
    );
    slab.position.set(0, bBaseY + 0.06, D / 2 + bD / 2);
    root.add(slab);

    // Main courante avant
    const topRail = new THREE.Mesh(
      new THREE.BoxGeometry(bW, 0.06, 0.06),
      matsByType.menuiserie
    );
    topRail.position.set(0, bBaseY + 0.12 + railH, D / 2 + bD - 0.03);
    root.add(topRail);

    // Rails latéraux
    [-1, 1].forEach((s) => {
      const sr = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.06, bD),
        matsByType.menuiserie
      );
      sr.position.set(s * bW / 2, bBaseY + 0.12 + railH, D / 2 + bD / 2);
      root.add(sr);
    });

    // Balustres (7 poteaux)
    const nb = 6;
    for (let i = 0; i <= nb; i++) {
      const bx = -bW / 2 + i * (bW / nb);
      const bal = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, railH, 0.05),
        matsByType.menuiserie
      );
      bal.position.set(bx, bBaseY + 0.12 + railH / 2, D / 2 + bD - 0.03);
      root.add(bal);
    }

    // 2 consoles de support sous la dalle
    [-1, 1].forEach((s) => {
      const cons = new THREE.Mesh(
        new THREE.BoxGeometry(0.10, 0.10, bD),
        matsByType.linteau
      );
      cons.position.set(s * (bW / 2 - 0.10), bBaseY, D / 2 + bD / 2);
      root.add(cons);
    });
  }

  // ── PERRON D'ENTRÉE (3 marches) ─────────────────────────────────────────
  // Les marches descendent sous y=0 (le rez-de-chaussée est surélevé)
  {
    const sh = 0.15;  // hauteur d'une marche
    const sd = 0.32;  // profondeur d'une marche
    for (let i = 0; i < 3; i++) {
      const sw    = doorW + 0.6 + i * 0.38; // largueur croissante vers le bas
      const step  = new THREE.Mesh(new THREE.BoxGeometry(sw, sh, sd), matsByType.linteau);
      // marche 0 : top à y=0, marche i : top à y=−i*sh
      step.position.set(0, -(2 * i + 1) * sh / 2, D / 2 + T / 2 + (i + 0.5) * sd);
      root.add(step);
    }
  }

  return root;
}
