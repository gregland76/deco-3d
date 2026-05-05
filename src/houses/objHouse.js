import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

/**
 * Maison chargée depuis des fichiers OBJ externes.
 *
 * Les 5 fichiers OBJ doivent être placés dans :
 *   public/models/custom/
 *     walls.obj        → Murs
 *     couverture.obj   → Toiture
 *     floors.obj       → Sols
 *     linteau.obj      → Linteaux
 *     menuiserie.obj   → Menuiseries / fenêtres
 *
 * Retourne une Promise<THREE.Group> résolue quand tous les OBJ sont chargés.
 */
export function createObjHouse(matsByType) {
  const base = import.meta.env.BASE_URL + "models/custom/";

  const PARTS = [
    { file: "walls.obj",      type: "walls" },
    { file: "couverture.obj", type: "couverture" },
    { file: "floors.obj",     type: "floors" },
    { file: "linteau.obj",    type: "linteau" },
    { file: "menuiserie.obj", type: "menuiserie" },
  ];

  const loader = new OBJLoader();
  const root = new THREE.Group();

  const promises = PARTS.map(({ file, type }) => {
    return new Promise((resolve, reject) => {
      loader.load(
        base + file,
        (obj) => {
          const mat = matsByType[type];
          obj.traverse((child) => {
            if (child.isMesh) {
              child.material = mat;
              // Activer la réception/projection d'ombres
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          root.add(obj);
          resolve();
        },
        undefined,
        (err) => {
          console.warn(`[objHouse] Impossible de charger ${file} :`, err);
          resolve(); // on ne bloque pas si un fichier est absent
        }
      );
    });
  });

  return Promise.all(promises).then(() => {
    // Centrer la maison sur le sol (Y minimum à 0)
    const box = new THREE.Box3().setFromObject(root);
    if (Number.isFinite(box.min.y)) {
      root.position.y = -box.min.y;
    }
    return root;
  });
}
