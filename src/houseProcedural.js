import { createClassicHouse } from "./houses/classicHouse.js";
import { createAtriumHouse } from "./houses/atriumHouse.js";
import { createShedHouse } from "./houses/shedHouse.js";
import { createLShapeHouse } from "./houses/lshapeHouse.js";
import { createCourtyardHouse } from "./houses/courtyardHouse.js";

export function createProceduralHouse({ matsByType, variant = "classic" }) {
  if (variant === "atrium") return createAtriumHouse(matsByType);
  if (variant === "shed") return createShedHouse(matsByType);
  if (variant === "lshape") return createLShapeHouse(matsByType);
  if (variant === "courtyard") return createCourtyardHouse(matsByType);
  return createClassicHouse(matsByType);
}