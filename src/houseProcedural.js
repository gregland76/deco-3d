import { createPavillonHouse }        from "./houses/pavillonHouse.js";
import { createMaisonDeMaitreHouse }  from "./houses/maisonDeMaitreHouse.js";
import { createObjHouse }             from "./houses/objHouse.js";

export function createProceduralHouse({ matsByType, variant = "pavillon" }) {
  if (variant === "maitre")  return createMaisonDeMaitreHouse(matsByType);
  if (variant === "custom")  return createObjHouse(matsByType); // retourne une Promise
  return createPavillonHouse(matsByType);
}