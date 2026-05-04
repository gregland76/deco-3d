import { createPavillonHouse }        from "./houses/pavillonHouse.js";
import { createMaisonDeMaitreHouse }  from "./houses/maisonDeMaitreHouse.js";

export function createProceduralHouse({ matsByType, variant = "pavillon" }) {
  if (variant === "maitre") return createMaisonDeMaitreHouse(matsByType);
  return createPavillonHouse(matsByType);
}