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

  const roof = new THREE.Mesh(new THREE.BoxGeometry(width + 0.5, 0.14, depth + 0.5), matsByType.couverture);
  roof.position.set(0, height + 0.55, 0);
  root.add(roof);


  // --- Mur Nord (2 sections, chacune avec une fenêtre)
  const winW = 0.9, winH = 1.1, winY = 1.3;
  const northSectionWidth = (width - 2.2) / 2;
  [-1, 1].forEach((side) => {
    const shape = new THREE.Shape();
    shape.moveTo(-northSectionWidth/2, 0);
    shape.lineTo(northSectionWidth/2, 0);
    shape.lineTo(northSectionWidth/2, height);
    shape.lineTo(-northSectionWidth/2, height);
    shape.closePath();
    // Trou fenêtre
    const hole = new THREE.Path();
    hole.moveTo(-winW/2, winY - winH/2);
    hole.lineTo(winW/2, winY - winH/2);
    hole.lineTo(winW/2, winY + winH/2);
    hole.lineTo(-winW/2, winY + winH/2);
    hole.closePath();
    shape.holes.push(hole);
    // Perçage linteau section Nord
    const lhN = new THREE.Path();
    lhN.moveTo(-(winW + 0.2) / 2, winY + winH/2);
    lhN.lineTo((winW + 0.2) / 2, winY + winH/2);
    lhN.lineTo((winW + 0.2) / 2, winY + winH/2 + 0.15);
    lhN.lineTo(-(winW + 0.2) / 2, winY + winH/2 + 0.15);
    lhN.closePath();
    shape.holes.push(lhN);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
    const mesh = new THREE.Mesh(geo, matsByType.walls);
    mesh.position.set(side * (width / 4 + 0.55), 0, -depth / 2 - thickness/2);
    root.add(mesh);
    // Pas de vitrage : la fenêtre est un vrai trou
  });
  // Linteau Nord (au-dessus de l'ouverture centrale) ← matériau linteau
  const northLintel = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.75, thickness), matsByType.linteau);
  northLintel.position.set(0, height - 0.375, -depth / 2);
  root.add(northLintel);
  // Linteaux au-dessus des deux fenêtres Nord
  [-1, 1].forEach((side) => {
    const lintelN = new THREE.Mesh(
      new THREE.BoxGeometry(winW + 0.2, 0.15, thickness + 0.08),
      matsByType.linteau
    );
    lintelN.position.set(side * (width / 4 + 0.55), winY + winH/2 + 0.075, -depth / 2);
    root.add(lintelN);
  });
  // Menuiseries fenêtres Nord
  { const fw = 0.07; const fd = thickness + 0.04;
    [-1, 1].forEach((side) => {
      const cx = side * (width / 4 + 0.55);
      [-1, 1].forEach((s) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(fw, winH, fd), matsByType.menuiserie);
        m.position.set(cx + s * winW/2, winY, -depth/2); root.add(m);
      });
      const sill = new THREE.Mesh(new THREE.BoxGeometry(winW + fw, fw, fd), matsByType.menuiserie);
      sill.position.set(cx, winY - winH/2, -depth/2); root.add(sill);
    });
  }


  // --- Mur Est (1 fenêtre)
  {
    const shape = new THREE.Shape();
    shape.moveTo(-depth/2, 0);
    shape.lineTo(depth/2, 0);
    shape.lineTo(depth/2, height);
    shape.lineTo(-depth/2, height);
    shape.closePath();
    // Trou fenêtre
    const hole = new THREE.Path();
    hole.moveTo(depth/4 - 0.55, winY - winH/2);
    hole.lineTo(depth/4 + 0.55, winY - winH/2);
    hole.lineTo(depth/4 + 0.55, winY + winH/2);
    hole.lineTo(depth/4 - 0.55, winY + winH/2);
    hole.closePath();
    shape.holes.push(hole);
    // Perçage linteau mur Est
    const lhE = new THREE.Path();
    lhE.moveTo(depth/4 - (winW + 0.2) / 2, winY + winH/2);
    lhE.lineTo(depth/4 + (winW + 0.2) / 2, winY + winH/2);
    lhE.lineTo(depth/4 + (winW + 0.2) / 2, winY + winH/2 + 0.15);
    lhE.lineTo(depth/4 - (winW + 0.2) / 2, winY + winH/2 + 0.15);
    lhE.closePath();
    shape.holes.push(lhE);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
    const mesh = new THREE.Mesh(geo, matsByType.walls);
    mesh.rotation.y = Math.PI/2;
    mesh.position.set(width/2 + thickness/2, 0, 0);
    root.add(mesh);
    // Linteau mur Est — centre en X = width/2+thickness, world Z = -depth/4
    const lintelE = new THREE.Mesh(
      new THREE.BoxGeometry(thickness + 0.08, 0.15, winW + 0.2),
      matsByType.linteau
    );
    lintelE.position.set(width/2 + thickness, winY + winH/2 + 0.075, -depth/4);
    root.add(lintelE);
    // Menuiserie fenêtre Est
    { const fw = 0.07; const fd = thickness + 0.04;
      [-1, 1].forEach((s) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(fd, winH, fw), matsByType.menuiserie);
        m.position.set(width/2 + thickness, winY, -depth/4 + s * winW/2); root.add(m);
      });
      const sill = new THREE.Mesh(new THREE.BoxGeometry(fd, fw, winW + fw), matsByType.menuiserie);
      sill.position.set(width/2 + thickness, winY - winH/2, -depth/4); root.add(sill);
    }
    // Pas de vitrage : la fenêtre est un vrai trou
  }


  // --- Mur Ouest (1 fenêtre)
  {
    const shape = new THREE.Shape();
    shape.moveTo(-depth/2, 0);
    shape.lineTo(depth/2, 0);
    shape.lineTo(depth/2, height);
    shape.lineTo(-depth/2, height);
    shape.closePath();
    // Trou fenêtre
    const hole = new THREE.Path();
    hole.moveTo(-depth/4 - 0.55, winY - winH/2);
    hole.lineTo(-depth/4 + 0.55, winY - winH/2);
    hole.lineTo(-depth/4 + 0.55, winY + winH/2);
    hole.lineTo(-depth/4 - 0.55, winY + winH/2);
    hole.closePath();
    shape.holes.push(hole);
    // Perçage linteau mur Ouest
    const lhW = new THREE.Path();
    lhW.moveTo(-depth/4 - (winW + 0.2) / 2, winY + winH/2);
    lhW.lineTo(-depth/4 + (winW + 0.2) / 2, winY + winH/2);
    lhW.lineTo(-depth/4 + (winW + 0.2) / 2, winY + winH/2 + 0.15);
    lhW.lineTo(-depth/4 - (winW + 0.2) / 2, winY + winH/2 + 0.15);
    lhW.closePath();
    shape.holes.push(lhW);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
    const mesh = new THREE.Mesh(geo, matsByType.walls);
    mesh.rotation.y = Math.PI/2;
    mesh.position.set(-width/2 - thickness/2, 0, 0);
    root.add(mesh);
    // Linteau mur Ouest — centre en X = -width/2, world Z = +depth/4
    const lintelW = new THREE.Mesh(
      new THREE.BoxGeometry(thickness + 0.08, 0.15, winW + 0.2),
      matsByType.linteau
    );
    lintelW.position.set(-width/2, winY + winH/2 + 0.075, depth/4);
    root.add(lintelW);
    // Menuiserie fenêtre Ouest
    { const fw = 0.07; const fd = thickness + 0.04;
      [-1, 1].forEach((s) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(fd, winH, fw), matsByType.menuiserie);
        m.position.set(-width/2, winY, depth/4 + s * winW/2); root.add(m);
      });
      const sill = new THREE.Mesh(new THREE.BoxGeometry(fd, fw, winW + fw), matsByType.menuiserie);
      sill.position.set(-width/2, winY - winH/2, depth/4); root.add(sill);
    }
    // Pas de vitrage : la fenêtre est un vrai trou
  }

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

  const canopy = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.12, 1.9), matsByType.couverture);
  canopy.position.set(0, height + 0.08, depth / 2 - 0.85);
  root.add(canopy);

  return root;
}