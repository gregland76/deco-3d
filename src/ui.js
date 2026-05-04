import { rebalanceWeights } from "./weights.js";

// Définition des couches par type. Chaque entrée peut être:
// - une string simple => élément avec une key dérivée plus bas
// - un objet { label, key } => élément simple avec key explicite
// - un objet groupe { label, children: [{label, key}, ...] } => en-tête sans case et sous-éléments cochables
const LAYERS_BY_TYPE = {
  walls: [
    { label: "Silex", key: "w0" },
    { label: "Brique", key: "w1" },
    { label: "Pierre", children: [
      { label: "Pierre calcaire de taille", key: "w2" },
      { label: "Moellon calcaire", key: "w8" },
    ] },
    { label: "Bois", children: [
      { label: "Colombage", key: "w3" },
      { label: "Bardeaux", key: "w5" },
    ] },
  ],
  floors: [ { label: "Bois", key: "w3" } ],
  couverture: [
    { label: "Bois", key: "w3" },
    { label: "Bardeaux", key: "w5" },
    { label: "Tuile de pays", children: [
      { label: "Sablé champagne", key: "w6" },
      { label: "Brun vieilli", key: "w9" },
      { label: "Rouge vieilli", key: "w10" },
    ] },
    { label: "Chaume", key: "w7" },
    { label: "Ardoise", key: "w4" },
  ],
};

function makeRow({ label, key, value, checked, onCheck, onInput, showSlider }) {
  const row = document.createElement("div");
  row.className = "row";

  const left = document.createElement("div");

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
  if (showSlider) {
    slider = document.createElement("input");
    slider.className = "slider";
    slider.type = "range";
    slider.min = "0";
    slider.max = "100";
    slider.step = "1";
    slider.value = String(value || 0);
    slider.addEventListener("input", () => onInput(key, Number(slider.value)));
    left.appendChild(slider);
  }

  row.appendChild(left);
  return { row, slider, pct: null, checkbox };
}

export function mountTypeGroup({ type, containerId, initialWeights = {}, onWeightsChange = () => {} }) {
  const container = document.getElementById(containerId);
  if (!container) throw new Error(`Missing container ${containerId}`);

  const rawDef = LAYERS_BY_TYPE[type] || [];

  const items = [];
  for (const entry of rawDef) {
    if (typeof entry === "string") {
      items.push({ label: entry, key: null });
    } else if (entry.children) {
      const groupKey = `__group_${entry.label.replace(/\s+/g, "_")}`;
      items.push({ label: entry.label, key: groupKey, isGroup: true, children: entry.children.map((c) => c.key) });
      for (const child of entry.children) items.push({ label: child.label, key: child.key, isChild: true });
    } else {
      items.push({ label: entry.label, key: entry.key });
    }
  }

  const state = { type, weights: { ...initialWeights }, enabled: {}, controls: {} };
  // track which groups are expanded (showing their children)
  state.open = {};

  items.forEach((it) => { if (it.key) state.enabled[it.key] = (initialWeights[it.key] > 0); });

  const itemByKey = Object.fromEntries(items.filter((it) => it.key).map((it) => [it.key, it]));

  Object.values(itemByKey).forEach((it) => {
    if (it.isGroup) {
      const any = (it.children || []).some((k) => state.enabled[k]);
      state.enabled[it.key] = any;
      // groups always start collapsed
      state.open[it.key] = false;
    }
  });

  const parentByChild = {};
  Object.values(itemByKey).forEach((it) => {
    if (it.isGroup) (it.children || []).forEach((c) => { parentByChild[c] = it.key; });
  });

  const flatKeys = items.map((it) => it.key).filter((k) => /^w\d+$/.test(k));

  function getEnabledKeys() { return Object.keys(state.enabled).filter((k) => state.enabled[k]); }

  function updateGroupStates() {
    // Met à jour l'état des groupes en fonction de l'état de leurs enfants
    Object.values(itemByKey).forEach((it) => {
      if (it.isGroup) {
        state.enabled[it.key] = (it.children || []).some((k) => !!state.enabled[k]);
      }
    });
  }

  // Appliquer des sélections par défaut au démarrage
  const DEFAULT_SELECTIONS = { walls: 'w2', floors: 'w3', couverture: 'w4' };
  // initialiser tous à false/0
  flatKeys.forEach((k) => { state.enabled[k] = false; state.weights[k] = 0; });
  const defaultKey = DEFAULT_SELECTIONS[type];
  if (defaultKey && flatKeys.includes(defaultKey)) {
    state.enabled[defaultKey] = true;
    state.weights[defaultKey] = 100;
  } else if (flatKeys.length) {
    state.enabled[flatKeys[0]] = true;
    state.weights[flatKeys[0]] = 100;
  }
  updateGroupStates();
  // open any group whose child is active by default
  Object.values(itemByKey).forEach((it) => {
    if (it.isGroup && (it.children || []).some((k) => state.enabled[k])) {
      state.open[it.key] = true;
    }
  });

  function syncUI() {
    container.innerHTML = "";
    const enabledKeys = getEnabledKeys();
    // Ne jamais afficher les sliders : uniquement cases à cocher
    const showSliders = false;

    for (const it of items) {
      if (it.isChild) continue;
      if (it.isGroup) {
        const key = it.key;
        const { row, slider, pct, checkbox } = makeRow({ label: it.label, key, value: 0, checked: !!state.enabled[key], onCheck: setEnabled, onInput: setKey, showSlider: false });

        // disclosure toggle to show/hide children
        const left = row.firstChild;
        const title = left.querySelector('.label');
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.setAttribute('aria-expanded', state.open[key] ? 'true' : 'false');
        toggle.textContent = state.open[key] ? '▾' : '▸';
        toggle.style.marginRight = '8px';
        toggle.style.background = 'transparent';
        toggle.style.border = 'none';
        toggle.style.color = 'inherit';
        toggle.style.cursor = 'pointer';
        toggle.addEventListener('click', (e) => { e.stopPropagation(); state.open[key] = !state.open[key]; syncUI(); });

        // insert toggle before the label (after checkbox)
        if (title && title.parentNode) title.parentNode.insertBefore(toggle, title);

        container.appendChild(row);
        state.controls[key] = { slider, pct, checkbox };

        // append children only if group is open
        if (state.open[key]) {
          for (const childKey of it.children) {
            const childItem = items.find((x) => x.key === childKey);
            const { row: crow, slider: cslider, pct: cpct, checkbox: ccheckbox } = makeRow({ label: childItem.label, key: childKey, value: state.weights[childKey], checked: !!state.enabled[childKey], onCheck: setEnabled, onInput: setKey, showSlider: state.enabled[childKey] && showSliders });
            crow.style.marginLeft = '18px';
            container.appendChild(crow);
            state.controls[childKey] = { slider: cslider, pct: cpct, checkbox: ccheckbox };
          }
        }
        continue;
      }

      const key = it.key;
      const { row, slider, pct, checkbox } = makeRow({ label: it.label, key, value: state.weights[key], checked: !!state.enabled[key], onCheck: setEnabled, onInput: setKey, showSlider: state.enabled[key] && showSliders });
      container.appendChild(row);
      if (key) state.controls[key] = { slider, pct, checkbox };
    }
  }

  // close all groups except the one identified by keepOpenKey
  function collapseOtherGroups(keepOpenKey) {
    Object.values(itemByKey).forEach((it) => {
      if (it.isGroup && it.key !== keepOpenKey) state.open[it.key] = false;
    });
  }

  function setEnabled(key, checked) {
    // Mutual exclusion: une seule option active par type
    const item = itemByKey[key];

    if (item && item.isGroup) {
      const firstChild = (item.children && item.children[0]);
      if (checked) {
        flatKeys.forEach((k) => { state.enabled[k] = (k === firstChild); state.weights[k] = (k === firstChild) ? 100 : 0; });
        updateGroupStates();
        // expand this group, collapse all others
        state.open[key] = true;
        collapseOtherGroups(key);
        syncUI(); onWeightsChange(type, state.weights); return;
      } else {
        // on uncheck, pick a fallback option outside this group if possible
        const fallback = flatKeys.find((k) => !(item.children || []).includes(k)) || firstChild;
        flatKeys.forEach((k) => { state.enabled[k] = (k === fallback); state.weights[k] = (k === fallback) ? 100 : 0; });
        updateGroupStates();
        // collapse this group; open the group of the fallback if applicable
        state.open[key] = false;
        const fallbackParent = parentByChild[fallback];
        if (fallbackParent) { state.open[fallbackParent] = true; collapseOtherGroups(fallbackParent); }
        syncUI(); onWeightsChange(type, state.weights); return;
      }
    }

    const parent = parentByChild[key];
    if (checked) {
      flatKeys.forEach((k) => { state.enabled[k] = (k === key); state.weights[k] = (k === key) ? 100 : 0; });
      updateGroupStates();
      // expand parent group, collapse all others
      if (parent) { state.open[parent] = true; collapseOtherGroups(parent); }
      else collapseOtherGroups(null);
      syncUI(); onWeightsChange(type, state.weights); return;
    }

    // empêcher qu'aucune option ne reste sélectionnée
    const enabledBefore = getEnabledKeys();
    if (enabledBefore.length === 1 && enabledBefore[0] === key) { state.enabled[key] = true; return syncUI(); }

    state.enabled[key] = false;
    let ekeys = getEnabledKeys();
    if (ekeys.length === 0) {
      flatKeys.forEach((k, i) => { state.enabled[k] = (i === 0); state.weights[k] = (i === 0) ? 100 : 0; });
    } else {
      const pick = ekeys[0];
      flatKeys.forEach((k) => { state.enabled[k] = (k === pick); state.weights[k] = (k === pick) ? 100 : 0; });
    }
    updateGroupStates();
    // if a child was unchecked and its parent has no enabled children, collapse that parent
    if (parent) {
      const p = itemByKey[parent];
      if (p && p.children) {
        const any = p.children.some((c) => state.enabled[c]);
        state.open[parent] = !!any;
      }
    }
    syncUI(); onWeightsChange(type, state.weights);
  }

  function setKey(key, v) { state.weights[key] = v; syncUI(); onWeightsChange(type, state.weights); }

  syncUI(); onWeightsChange(type, state.weights);

  return {
    reset() {
      // Appliquer les sélections par défaut lors de la réinitialisation
      const DEFAULT_SELECTIONS = { walls: 'w2', floors: 'w3', couverture: 'w4' };
      flatKeys.forEach((k) => { state.enabled[k] = false; state.weights[k] = 0; });
      const def = DEFAULT_SELECTIONS[type];
      if (def && flatKeys.includes(def)) {
        state.enabled[def] = true;
        state.weights[def] = 100;
      } else if (flatKeys.length) {
        state.enabled[flatKeys[0]] = true;
        state.weights[flatKeys[0]] = 100;
      }
      updateGroupStates();
      syncUI(); onWeightsChange(type, state.weights);
    },
  };
}
