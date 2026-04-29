import { rebalanceWeights } from "./weights.js";

// Définition des couches par type. Chaque entrée peut être:
// - une string simple => élément avec une key dérivée plus bas
// - un objet { label, key } => élément simple avec key explicite
// - un objet groupe { label, children: [{label, key}, ...] } => en-tête sans case et sous-éléments cochables
const LAYERS_BY_TYPE = {
  walls: [
    { label: "Silex", key: "w0" },
    { label: "Brique", key: "w1" },
    { label: "Pierre", key: "w2" },
    // 'Bois' devient un groupe sans case à cocher contenant deux sous-catégories
    { label: "Bois", children: [
      { label: "Colombage", key: "w3" },
      { label: "Bardeaux", key: "w5" },
    ] },
  ],
  floors: [ { label: "Bois", key: "w3" } ],
  // mapping to layeredSet indices: wood=w3, bardeaux=w5, tuile=w6, chaume=w7, ardoise=w4
  couverture: [
    { label: "Bois", key: "w3" },
    { label: "Bardeaux", key: "w5" },
    { label: "Tuile de pays", key: "w6" },
    { label: "Chaume", key: "w7" },
    { label: "Ardoise", key: "w4" },
  ],
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
  // On garde uniquement le slider graphique, sans champ numérique
  if (showSlider) {
    slider = document.createElement("input");
    slider.className = "slider";
    slider.type = "range";
    slider.min = "0";
    slider.max = "100";
    slider.step = "1";
    slider.value = String(value);
    slider.addEventListener("input", () => {
      onInput(key, Number(slider.value));
    });
    left.appendChild(slider);
    row.appendChild(left);
  } else {
    row.appendChild(left);
  }

  return { row, slider, pct: null, checkbox };
}

export function mountTypeGroup({ type, containerId, initialWeights = {}, onWeightsChange = () => {} }) {
  const container = document.getElementById(containerId);
  if (!container) throw new Error(`Missing container ${containerId}`);

  const rawDef = LAYERS_BY_TYPE[type] || [];

  // Aplatir la définition en une liste ordonnée d'items contrôlables
  // items: { label, key, isGroupHeader }
  const items = [];
  for (const entry of rawDef) {
    if (typeof entry === "string") {
      // pas utilisé aujourd'hui, mais support conservateur
      items.push({ label: entry, key: null });
    } else if (entry.children) {
      // groupe avec case à cocher qui contrôle les enfants
      const groupKey = `__group_${entry.label.replace(/\s+/g, "_")}`;
      items.push({ label: entry.label, key: groupKey, isGroup: true, children: entry.children.map((c) => c.key) });
      for (const child of entry.children) items.push({ label: child.label, key: child.key, isChild: true });
    } else {
      items.push({ label: entry.label, key: entry.key });
    }
  }

  // Nouvel état : suivi des cases cochées et des poids
  const state = {
    type,
    weights: { ...initialWeights },
    enabled: {},
    controls: {},
  };

  // initialiser enabled pour chaque clé présente
  items.forEach((it) => {
    if (it.key) state.enabled[it.key] = (initialWeights[it.key] > 0);
  });

  // initialiser l'état des groupes (un groupe activé si un de ses enfants est activé)
  const itemByKey = Object.fromEntries(items.filter((it) => it.key).map((it) => [it.key, it]));
  Object.values(itemByKey).forEach((it) => {
    if (it.isGroup) {
      const any = it.children.some((k) => state.enabled[k]);
      state.enabled[it.key] = any;
    }
  });

  // map enfant -> parent de groupe (utile pour logique d'exclusion mutuelle)
  const parentByChild = {};
  Object.values(itemByKey).forEach((it) => {
    if (it.isGroup) {
      (it.children || []).forEach((c) => { parentByChild[c] = it.key; });
    }
  });

  // liste ordonnée des clés contrôlables (utile pour logique et reset)
  // ne garder que les clés de la forme wN (évitant les clés de groupe comme __group_Bois)
  const flatKeys = items.map((it) => it.key).filter((k) => /^w\d+$/.test(k));

  function getEnabledKeys() {
    return Object.keys(state.enabled).filter((k) => state.enabled[k]);
  }

  function syncUI() {
    // Nettoyer le container
    container.innerHTML = "";
    const enabledKeys = getEnabledKeys();
    const showSliders = (type === "couverture") ? false : (enabledKeys.length > 1);

    for (const it of items) {
      // skip child-only entries (they're rendered within their group)
      if (it.isChild) continue;
      // groupe avec checkbox
      if (it.isGroup) {
        const key = it.key;
        const { row, slider, pct, checkbox } = makeRow({
          label: it.label,
          key,
          value: 0,
          checked: !!state.enabled[key],
          onCheck: setEnabled,
          onInput: setKey,
          showSlider: false,
        });
        container.appendChild(row);
        state.controls[key] = { slider, pct, checkbox };

        // render children indented
        for (const childKey of it.children) {
          const childItem = items.find((x) => x.key === childKey);
          const { row: crow, slider: cslider, pct: cpct, checkbox: ccheckbox } = makeRow({
            label: childItem.label,
            key: childKey,
            value: state.weights[childKey],
            checked: !!state.enabled[childKey],
            onCheck: setEnabled,
            onInput: setKey,
            showSlider: state.enabled[childKey] && showSliders,
          });
          crow.style.marginLeft = '18px';
          container.appendChild(crow);
          state.controls[childKey] = { slider: cslider, pct: cpct, checkbox: ccheckbox };
        }
        continue;
      }

      const key = it.key;
      const { row, slider, pct, checkbox } = makeRow({
        label: it.label,
        key,
        value: state.weights[key],
        checked: !!state.enabled[key],
        onCheck: setEnabled,
        onInput: setKey,
        showSlider: state.enabled[key] && showSliders,
      });
      container.appendChild(row);
      if (key) state.controls[key] = { slider, pct, checkbox };
    }
  }

  function setEnabled(key, checked) {
    // si clé de groupe
    const item = itemByKey[key];
    if (item && item.isGroup) {
      if (checked) {
        // cocher uniquement le premier enfant et décocher les autres
        item.children.forEach((k, i) => { state.enabled[k] = (i === 0); });
        state.enabled[key] = true;
      } else {
        // décocher tous les enfants
        item.children.forEach((k) => { state.enabled[k] = false; });
        state.enabled[key] = false;
      }
      // recompute weights: répartir selon enabled keys
      const ekeys = getEnabledKeys();
      if (ekeys.length === 0) {
        // si aucune clé activée, laisser les poids inchangés
      } else if (ekeys.length === 1) {
        flatKeys.forEach((k) => { state.weights[k] = (k === ekeys[0]) ? 100 : 0; });
      } else {
        const part = 100 / ekeys.length;
        flatKeys.forEach((k) => { state.weights[k] = ekeys.includes(k) ? part : 0; });
      }
      syncUI();
      onWeightsChange(type, state.weights);
      return;
    }

    // si clé d'enfant faisant partie d'un groupe, rendre mutual exclusive
    const parent = parentByChild[key];
    if (parent) {
      if (checked) {
        // décocher les frères
        const siblings = itemByKey[parent].children || [];
        siblings.forEach((k) => { state.enabled[k] = (k === key); });
        state.enabled[parent] = true;
      } else {
        // décocher cet enfant; laisser les autres inchangés
        state.enabled[key] = false;
        // si aucun enfant n'est coché, décocher le groupe
        const any = (itemByKey[parent].children || []).some((k) => state.enabled[k]);
        state.enabled[parent] = any;
      }
      // mettre à jour les poids
      const ekeys = getEnabledKeys();
      if (ekeys.length === 0) {
        // ne rien faire
      } else if (ekeys.length === 1) {
        flatKeys.forEach((k) => { state.weights[k] = (k === ekeys[0]) ? 100 : 0; });
      } else {
        const part = 100 / ekeys.length;
        flatKeys.forEach((k) => { state.weights[k] = ekeys.includes(k) ? part : 0; });
      }
      syncUI();
      onWeightsChange(type, state.weights);
      return;
    }
    // Pour 'couverture' : comportement mutuellement exclusif
    if (type === "couverture") {
      if (checked) {
        // cocher une option décoche toutes les autres
        flatKeys.forEach((k) => {
          state.enabled[k] = (k === key);
          state.weights[k] = (k === key) ? 100 : 0;
        });
      } else {
        // si on décoche la seule option, rétablir la première option
        state.enabled[key] = false;
        const enabledKeys = getEnabledKeys();
        if (enabledKeys.length === 0) {
          flatKeys.forEach((k, i) => {
            state.enabled[k] = (i === 0);
            state.weights[k] = (i === 0) ? 100 : 0;
          });
        }
      }
      syncUI();
      onWeightsChange(type, state.weights);
      return;
    }

    // Comportement par défaut pour les autres types
    state.enabled[key] = checked;
    const enabledKeys = getEnabledKeys();
    // Si aucune case cochée, on force la première
    if (enabledKeys.length === 0) {
      state.enabled[key] = true;
      return syncUI();
    }
    // Si une seule case cochée, 100% pour elle, 0% pour les autres
    if (enabledKeys.length === 1) {
      flatKeys.forEach((k) => {
        state.weights[k] = (k === enabledKeys[0]) ? 100 : 0;
      });
    } else {
      // Si plusieurs, répartir équitablement
      const part = 100 / enabledKeys.length;
      flatKeys.forEach((k) => {
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
      flatKeys.forEach((k, i) => {
        state.enabled[k] = (i === 0);
        state.weights[k] = (i === 0) ? 100 : 0;
      });
      syncUI();
      onWeightsChange(type, state.weights);
    },
  };
}
