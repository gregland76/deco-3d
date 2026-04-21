import { rebalanceWeights } from "./weights.js";

const LAYERS = ["Peinture", "Brique", "Pierre", "Bois", "Ardoise"];
const KEYS = ["w0", "w1", "w2", "w3", "w4"];

function makeRow({ label, key, value, onInput }) {
  const row = document.createElement("div");
  row.className = "row";

  const left = document.createElement("div");

  const title = document.createElement("div");
  title.className = "label";
  title.textContent = label;

  const slider = document.createElement("input");
  slider.className = "slider";
  slider.type = "range";
  slider.min = "0";
  slider.max = "100";
  slider.step = "1";
  slider.value = String(value);

  left.appendChild(title);
  left.appendChild(slider);

  const pct = document.createElement("div");
  pct.className = "pct";
  pct.textContent = `${Math.round(value)}%`;

  row.appendChild(left);
  row.appendChild(pct);

  slider.addEventListener("input", () => onInput(key, Number(slider.value)));

  return { row, slider, pct };
}

export function mountTypeGroup({ type, containerId, initialWeights, onWeightsChange }) {
  const container = document.getElementById(containerId);
  if (!container) throw new Error(`Missing container ${containerId}`);

  const state = {
    type,
    weights: { ...initialWeights },
    controls: {},
  };

  function syncUI() {
    for (let i = 0; i < KEYS.length; i++) {
      const k = KEYS[i];
      const c = state.controls[k];
      const v = state.weights[k];
      c.slider.value = String(Math.round(v));
      c.pct.textContent = `${Math.round(v)}%`;
    }
  }

  function setKey(key, v) {
    state.weights = rebalanceWeights(state.weights, key, v);
    syncUI();
    onWeightsChange(type, state.weights);
  }

  for (let i = 0; i < KEYS.length; i++) {
    const k = KEYS[i];
    const { row, slider, pct } = makeRow({
      label: LAYERS[i],
      key: k,
      value: state.weights[k],
      onInput: setKey,
    });
    container.appendChild(row);
    state.controls[k] = { slider, pct };
  }

  syncUI();
  onWeightsChange(type, state.weights);

  return {
    reset() {
      state.weights = { w0: 100, w1: 0, w2: 0, w3: 0, w4: 0 };
      syncUI();
      onWeightsChange(type, state.weights);
    },
  };
}