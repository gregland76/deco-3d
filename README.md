# deco-3d

Un projet en cours de dev pour Manue.

Visualisateur 3D procédural de maisons avec matériaux PBR superposés (silex, brique, pierre, bois, ardoise).

## Démarrage

```bash
npm install
npm run dev
```

## Variantes de maisons

Paramètre d'URL `variant` :

| Valeur | Maison |
|--------|--------|
| `classic` | Maison classique (défaut) |
| `lshape` | Maison en L |
| `shed` | Maison avec appentis |
| `atrium` | Maison avec atrium |

## Paramètres d'URL

| Paramètre | Valeur | Description |
|-----------|--------|-------------|
| `variant` | `classic` \| `lshape` \| `shed` \| `atrium` | Choix de la maison |
| `showUi` | `1` | Affiche l'interface de contrôle |
| `embed` | `1` | Mode intégré (sans UI) |
| `capture` | `1` | Mode capture |

## Stack

- [Vite](https://vitejs.dev/)
- [Three.js](https://threejs.org/)
- Matériaux PBR superposés avec shaders GLSL personnalisés
