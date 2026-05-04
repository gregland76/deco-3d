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
  linteau: [
    { label: "Bois", key: "w0" },
    { label: "Pierre", key: "w1" },
    { label: "Brique", key: "w2" },
    { label: "IPN (acier)", key: "w3" },
  ],
  menuiserie: [
    { label: "Bois", children: [
      { label: "Naturel", key: "w0" },
      { label: "Peint", children: [
        { label: "Bleu", key: "w1" },
        { label: "Rouge", key: "w2" },
        { label: "Vert", key: "w3" },
        { label: "Beige", key: "w4" },
      ] },
    ] },
    { label: "Aluminium", children: [
      { label: "Brut", key: "w5" },
      { label: "Teinté", children: [
        { label: "Bleu", key: "w6" },
        { label: "Rouge", key: "w7" },
        { label: "Vert", key: "w8" },
        { label: "Beige", key: "w9" },
      ] },
    ] },
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
      const childKeys = entry.children.map((c) => c.children ? `__group_${c.label.replace(/\s+/g, "_")}` : c.key);
      items.push({ label: entry.label, key: groupKey, isGroup: true, children: childKeys });
      for (const child of entry.children) {
        if (child.children) {
          const subGroupKey = `__group_${child.label.replace(/\s+/g, "_")}`;
          items.push({ label: child.label, key: subGroupKey, isGroup: true, isChild: true, children: child.children.map((c) => c.key) });
          for (const subChild of child.children) items.push({ label: subChild.label, key: subChild.key, isChild: true });
        } else {
          items.push({ label: child.label, key: child.key, isChild: true });
        }
      }
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
    // Met à jour l'état des groupes en fonction de l'état de leurs enfants (récursif)
    function anyLeafEnabled(children) {
      return (children || []).some((k) => {
        const it = itemByKey[k];
        if (it && it.isGroup) return anyLeafEnabled(it.children);
        return !!state.enabled[k];
      });
    }
    Object.values(itemByKey).forEach((it) => {
      if (it.isGroup) state.enabled[it.key] = anyLeafEnabled(it.children);
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

        container.appendChild(row);
        state.controls[key] = { slider, pct, checkbox };

        // append children only if group is open
        if (state.open[key]) {
          for (const childKey of it.children) {
            const childItem = items.find((x) => x.key === childKey);
            if (childItem.isGroup) {
              // sous-groupe : rendu avec indentation
              const { row: sgrow, checkbox: sgcb } = makeRow({ label: childItem.label, key: childKey, value: 0, checked: !!state.enabled[childKey], onCheck: setEnabled, onInput: setKey, showSlider: false });
              sgrow.style.marginLeft = '18px';
              container.appendChild(sgrow);
              state.controls[childKey] = { slider: null, pct: null, checkbox: sgcb };
              if (state.open[childKey]) {
                for (const subChildKey of childItem.children) {
                  const subChildItem = items.find((x) => x.key === subChildKey);
                  const { row: scrow, slider: scsl, pct: scpct, checkbox: sccb } = makeRow({ label: subChildItem.label, key: subChildKey, value: state.weights[subChildKey], checked: !!state.enabled[subChildKey], onCheck: setEnabled, onInput: setKey, showSlider: false });
                  scrow.style.marginLeft = '36px';
                  container.appendChild(scrow);
                  state.controls[subChildKey] = { slider: scsl, pct: scpct, checkbox: sccb };
                }
              }
            } else {
              const { row: crow, slider: cslider, pct: cpct, checkbox: ccheckbox } = makeRow({ label: childItem.label, key: childKey, value: state.weights[childKey], checked: !!state.enabled[childKey], onCheck: setEnabled, onInput: setKey, showSlider: state.enabled[childKey] && showSliders });
              crow.style.marginLeft = '18px';
              container.appendChild(crow);
              state.controls[childKey] = { slider: cslider, pct: cpct, checkbox: ccheckbox };
            }
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

  // close all groups except those listed in keepOpenKeys
  function collapseOtherGroups(keepOpenKeys) {
    const keep = Array.isArray(keepOpenKeys) ? keepOpenKeys : [keepOpenKeys];
    Object.values(itemByKey).forEach((it) => {
      if (it.isGroup && !keep.includes(it.key)) state.open[it.key] = false;
    });
  }

  function setEnabled(key, checked) {
    // Mutual exclusion: une seule option active par type
    const item = itemByKey[key];

    if (item && item.isGroup) {
      // trouver la première feuille récursivement
      function firstLeafKey(children) {
        for (const k of (children || [])) {
          const it = itemByKey[k];
          if (it && it.isGroup) { const r = firstLeafKey(it.children); if (r) return r; }
          else if (/^w\d+$/.test(k)) return k;
        }
        return null;
      }
      // collecter tous les ancêtres d'une clé
      function ancestorKeys(k) {
        const keys = []; let p = parentByChild[k];
        while (p) { keys.push(p); p = parentByChild[p]; }
        return keys;
      }
      const firstChild = firstLeafKey(item.children);
      if (checked) {
        flatKeys.forEach((k) => { state.enabled[k] = (k === firstChild); state.weights[k] = (k === firstChild) ? 100 : 0; });
        updateGroupStates();
        state.open[key] = true;
        const ancestors = ancestorKeys(firstChild || key);
        ancestors.forEach(k => { state.open[k] = true; });
        collapseOtherGroups([key, ...ancestors]);
        syncUI(); onWeightsChange(type, state.weights); return;
      } else {
        const allDescendantLeaves = flatKeys.filter((k) => {
          let p = parentByChild[k]; while (p) { if (p === key) return true; p = parentByChild[p]; } return false;
        });
        const fallback = flatKeys.find((k) => !allDescendantLeaves.includes(k)) || firstChild;
        flatKeys.forEach((k) => { state.enabled[k] = (k === fallback); state.weights[k] = (k === fallback) ? 100 : 0; });
        updateGroupStates();
        state.open[key] = false;
        const fallbackParent = parentByChild[fallback];
        if (fallbackParent) {
          const fpAncestors = [fallbackParent, ...ancestorKeys(fallbackParent)];
          fpAncestors.forEach(k => { state.open[k] = true; });
          collapseOtherGroups(fpAncestors);
        }
        syncUI(); onWeightsChange(type, state.weights); return;
      }
    }

    const parent = parentByChild[key];
    if (checked) {
      flatKeys.forEach((k) => { state.enabled[k] = (k === key); state.weights[k] = (k === key) ? 100 : 0; });
      updateGroupStates();
      // ouvrir tous les groupes ancêtres, fermer les autres
      const ancestors = []; let p = parent; while (p) { ancestors.push(p); p = parentByChild[p]; }
      ancestors.forEach(k => { state.open[k] = true; });
      collapseOtherGroups(ancestors);
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
