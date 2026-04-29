import { rebalanceWeights } from "./weights.js";

const LAYERS_BY_TYPE = {
  walls: ["Peinture", "Brique", "Pierre", "Bois"],
  floors: ["Peinture", "Brique", "Pierre", "Bois", "Ardoise"],
  roofs: ["Peinture", "Brique", "Pierre", "Bois", "Ardoise"],
};
const KEYS_BY_TYPE = {
  walls: ["w0", "w1", "w2", "w3"],
  floors: ["w0", "w1", "w2", "w3", "w4"],
  roofs: ["w0", "w1", "w2", "w3", "w4"],
};

function makeRow({ label, key, value, checked, onCheck, onInput, showSlider }) {
  const row = document.createElement("div");
  row.className = "row";

  const left = document.createElement("div");

  // Checkbox pour activer/désactiver le matériau
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = checked;
  checkbox.style.marginRight = "8px";
  checkbox.addEventListener("change", () => onCheck(key, checkbox.checked));

  const title = document.createElement("div");
  title.className = "label";
  title.textContent = label;
  title.style.display = "inline";

  left.appendChild(checkbox);
  left.appendChild(title);

  let slider = null;
  let pct = null;
  if (showSlider) {
    slider = document.createElement("input");
    slider.className = "slider";
    slider.type = "range";
    slider.min = "0";
    slider.max = "100";
    slider.step = "1";
    slider.value = String(value);
    slider.addEventListener("input", () => onInput(key, Number(slider.value)));
    left.appendChild(slider);

    pct = document.createElement("div");
    pct.className = "pct";
    pct.textContent = `${Math.round(value)}%`;
    row.appendChild(left);
    row.appendChild(pct);
  } else {
    row.appendChild(left);
  }

  return { row, slider, pct, checkbox };
}

export function mountTypeGroup({ type, containerId, initialWeights = {}, onWeightsChange = () => {} }) {
  const container = document.getElementById(containerId);
  if (!container) throw new Error(`Missing container ${containerId}`);

  const LAYERS = LAYERS_BY_TYPE[type];
  const KEYS = KEYS_BY_TYPE[type];

  // Nouvel état : suivi des cases cochées et des poids
  const state = {
    type,
    weights: { ...initialWeights },
    enabled: Object.fromEntries(KEYS.map((k, i) => [k, initialWeights[k] > 0])),
    controls: {},
  };

  function getEnabledKeys() {
    return KEYS.filter((k) => state.enabled[k]);
  }

  function syncUI() {
    // Nettoyer le container
    container.innerHTML = "";
    const enabledKeys = getEnabledKeys();
    const showSliders = enabledKeys.length > 1;
    for (let i = 0; i < KEYS.length; i++) {
      const k = KEYS[i];
      const { row, slider, pct, checkbox } = makeRow({
        label: LAYERS[i],
        key: k,
        value: state.weights[k],
        checked: state.enabled[k],
        onCheck: setEnabled,
        onInput: setKey,
        showSlider: state.enabled[k] && showSliders,
      });
      container.appendChild(row);
      state.controls[k] = { slider, pct, checkbox };
    }
  }

  function setEnabled(key, checked) {
    state.enabled[key] = checked;
    const enabledKeys = getEnabledKeys();
    // Si aucune case cochée, on force la première
    if (enabledKeys.length === 0) {
      state.enabled[key] = true;
      return syncUI();
    }
    // Si une seule case cochée, 100% pour elle, 0% pour les autres
    if (enabledKeys.length === 1) {
      KEYS.forEach((k) => {
        state.weights[k] = (k === enabledKeys[0]) ? 100 : 0;
      });
    } else {
      // Si plusieurs, répartir équitablement
      const part = 100 / enabledKeys.length;
      KEYS.forEach((k) => {
        state.weights[k] = state.enabled[k] ? part : 0;
      });
    }
    syncUI();
    onWeightsChange(type, state.weights);
  }

  function setKey(key, v) {
    state.weights[key] = v;
    syncUI();
    onWeightsChange(type, state.weights);
  }

  syncUI();
  onWeightsChange(type, state.weights);

  return {
    reset() {
      // Par défaut : premier matériau activé à 100%, les autres à 0
      KEYS.forEach((k, i) => {
        state.enabled[k] = (i === 0);
        state.weights[k] = (i === 0) ? 100 : 0;
      });
      syncUI();
      onWeightsChange(type, state.weights);
    },
  };
}
