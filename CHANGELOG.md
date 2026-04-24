# Historique des modifications

## 2026-04-24
- Ajout de captures d'écran automatiques des maisons dans les vignettes : chaque vignette charge une iframe cachée (300×300) en mode `capture=1`, Three.js prend un screenshot via `toDataURL` après chargement complet et l'envoie au parent via `postMessage`. Les captures sont persistées dans `localStorage` pour éviter de recharger les scènes à chaque visite.

## 2026-04-21
- Mise en ligne du dépôt deco-3d sur GitHub (gregland76/deco-3d).
- Ajustement UI de 3D.html: panneau de contrôle réduit en largeur sur desktop et mobile.
- Ajustement UI de 3D.html: largeur des lignes de sliders remise à 100% du panneau pour améliorer la lisibilité.

## 2026-04-20
- Ajout de la page frame avec une vignette 200x200 embarquant index.html et un bouton SVG pour agrandir ou réduire la vue.
- Ajout du paramètre d’URL showUi pour conserver l’interface visible dans l’iframe même quand la largeur de vue est réduite.
- Ajout d’une configuration Vite multipage pour générer frame.html dans dist au build.
- Ajustement de frame: l’UI interne est masquée dans la vignette et réaffichée automatiquement en mode agrandi.
- Renommage des pages: frame devient index.html et la scène 3D principale devient 3D.html.
- Mise à jour de l’index: suppression du texte Frame, titre remplacé par Projet Manue, ajout d’une seconde vignette avec une maison différente et le même comportement d’agrandissement.
- Correctif de chargement: initialisation des paramètres d’URL déplacée avant la création de la maison pour éviter une erreur runtime sur la variante.
- Déplacement du crédit auteur: retiré de 3D.html et ajouté en bas de la page index.
- Refactor structure: séparation des deux maisons dans des fichiers dédiés src/houses/classicHouse.js et src/houses/atriumHouse.js, avec houseProcedural.js comme routeur de variantes.
- Ajout d'une 3e maison (variant "shed"): toit mono-pente, pignons trapézoïdaux, terrasse et pergola en façade sud — fichier src/houses/shedHouse.js. Grille index.html passée à 3 colonnes.
- Responsive index: grille des vignettes rendue fluide avec auto-fit, largeur max élargie et miniatures carrées adaptatives selon la largeur disponible.
- Ajustement responsive index: suppression du bandeau horizontal scrollable, retour à une grille auto-fit pour que chaque vignette passe à la ligne dès qu'elle manque de place.
- Taille des vignettes index: passage du format de base à 100x100.
- Ajustement mise en page index: les vignettes occupent désormais la largeur via une grille 4 colonnes sur grand écran, 2 colonnes sur tablette et 1 colonne sur mobile.
- Ajout d'une 5e maison (variant "courtyard"): maison patio en U avec cour ouverte et pergola légère. La page index conserve 4 vignettes par ligne sur grand écran ; la 5e passe sur la ligne suivante.
