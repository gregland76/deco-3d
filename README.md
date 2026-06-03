# deco-3d — Projet Manue

Visualisateur 3D procédural de maisons en bardage normand. Permet de changer en temps réel les matériaux (murs, sols, couverture, linteaux, menuiseries) via un panneau de textures PBR.

## Démarrage

```bash
npm install
npm run dev
```

## Pages

| Fichier | Rôle |
|---------|------|
| `index.html` | Galerie de vignettes — affiche les maisons disponibles, chaque vignette est agrandissable à la demande |
| `3D.html` | Scène 3D principale — rendu Three.js + panneau de sélection de textures |

## Maisons disponibles

Paramètre d'URL `variant` sur `3D.html` :

| Valeur | Maison |
|--------|--------|
| `pavillon` | Maison pavillonnaire — toit 2 pans, 4 façades avec fenêtres et porte, cheminée, chéneaux |
| `maitre` | Maison de Maître — 2 étages, toit 4 pans, balcon, perron, 2 cheminées |

## Paramètres d'URL (`3D.html`)

### Généraux

| Paramètre | Valeur | Description |
|-----------|--------|-------------|
| `variant` | `pavillon` \| `maitre` | Choix de la maison (défaut : `classic`) |
| `showUi` | `1` | Force l'affichage du panneau de textures (utile en mode embed) |
| `embed` | `1` | Mode intégré — masque l'UI au démarrage |
| `capture` | `1` | Mode capture — envoie un screenshot JPEG via `postMessage` après chargement |

### Matériaux

Chaque surface peut être pré-sélectionnée via un paramètre d'URL. Le format est :

```
?<surface>=<clé>            # sélection simple  (poids 100%)
?<surface>=<clé>:<poids>,...  # multi-sélection avec pondération (murs uniquement)
```

| Paramètre | Clés disponibles | Description |
|-----------|-----------------|-------------|
| `walls` | `w0` Silex · `w1` Brique · `w2` Pierre calcaire taillée · `w3` Colombage · `w5` Bardeaux · `w6` Tuile sable · `w8` Moellon calcaire · `w9` Tuile brun · `w10` Tuile rouge | Murs (multi-sélection possible) |
| `floors` | `w3` Parquet bois | Sol |
| `couverture` | `w3` Bois · `w4` Ardoise · `w5` Bardeaux · `w6` Tuile sable · `w7` Chaume · `w9` Tuile brun · `w10` Tuile rouge | Toiture |
| `linteau` | `w0` Bois · `w1` Pierre · `w2` Brique · `w3` IPN | Linteaux |
| `menuiserie` | `w0` Bois naturel · `w1-w4` Bois peint (bleu/rouge/vert/beige) · `w5` Alu brut · `w6-w9` Alu teinté (bleu/rouge/vert/beige) | Menuiseries |

**Exemples :**

```
3D.html?variant=maitre&couverture=w7&menuiserie=w6
3D.html?walls=w1:30,w2:70&linteau=w1
3D.html?walls=w0&couverture=w4&linteau=w2&menuiserie=w5
```

## Matériaux

Chaque surface accepte une sélection parmi plusieurs textures PBR :

| Surface | Textures disponibles |
|---------|----------------------|
| **Murs** | Silex, Briques, Pierre calcaire taillée, Moellon calcaire, Colombage, Bardeaux, Tuile de pays (sable/rouge/brun), Chaume, Ardoise |
| **Sols** | Parquet bois |
| **Couverture** | Ardoise, Tuile de pays (sable/rouge/brun), Chaume, Bois couverture |
| **Linteaux** | Bois, Pierre, Brique, IPN |
| **Menuiseries** | Bois naturel, Bois peint (bleu/rouge/vert/beige), Aluminium brut, Aluminium teinté (bleu/rouge/vert/beige) |

## Structure du projet

```
index.html          # Galerie de vignettes
3D.html             # Scène 3D + UI textures
src/
  main.js           # Point d'entrée : Three.js, matériaux, UI
  houseProcedural.js # Routeur de variantes de maisons
  materialLibrary.js # Chargement des textures PBR
  layeredBaseColorStandardMaterial.js # Matériau à couches (base color mix)
  ui.js             # Panneau de sélection de textures
  weights.js        # Utilitaires de pondération
  houses/
    pavillonHouse.js      # Maison pavillonnaire
    maisonDeMaitreHouse.js # Maison de Maître
public/
  materials/        # Textures PBR (color, normal, roughness…)
  hdr/              # Environnement HDR
```

## Stack

- [Vite](https://vitejs.dev/) ^8
- [Three.js](https://threejs.org/) ^0.184
- `OrbitControls` pour la navigation 3D
- Matériaux PBR (`MeshStandardMaterial`) avec mélange de couleurs de base par couche
- Rendu ACES Filmic, espace colorimétrique sRGB
