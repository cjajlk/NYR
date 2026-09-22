# Checkpoint — PACK 3

**Date :** 10 septembre 2026  
**Statut :** terminé et vérifié

## Fichiers créés

- `src/core/gameLoop.js`
- `src/gameplay/nyrPrototypeConfig.js`
- `src/gameplay/nyrMovement.js`
- `src/gameplay/nyrRenderer.js`
- `src/systems/pointerInput.js`
- `docs/checkpoints/CHECKPOINT_PACK_3.md`

## Fichiers modifiés

- `src/core/displayManager.js`
- `src/main.js`
- `assets/css/main.css`
- `README.md`

`index.html`, `src/core/appConfig.js`, `src/core/runtimeState.js` et `src/ui/orientationOverlay.js` ont été conservés sans modification.

## Architecture retenue

- `gameLoop.js` contient uniquement la boucle temporelle minimale du prototype. La simulation est conditionnée par `isRuntimeActive()` et le delta est plafonné à 0,05 seconde.
- `nyrPrototypeConfig.js` centralise les réglages provisoires et non canoniques du PACK 3.
- `nyrMovement.js` gère la position, le cap courant, le cap désiré, le virage progressif et un historique borné à 180 points.
- `nyrRenderer.js` dessine Nyr Forme I avec des primitives canvas : tête astrale, deux mini-cornes, deux yeux lumineux, quatre segments visuels fixes et une petite queue visuelle.
- `pointerInput.js` traduit la souris et les Pointer Events tactiles en direction cible.
- `main.js` assemble ces modules avec le canvas et le runtime des packs précédents.

## Réglages provisoires — non finaux

- Vitesse : `95 pixels/seconde`.
- Vitesse angulaire : `0,9 × π radians/seconde`, soit environ `162°/seconde`.
- Segments visuels fixes : `4`.
- Espacement visuel : `14 pixels`.
- Historique maximal : `180 points`.
- Marge technique de surveillance : `42 pixels`.

Ces valeurs servent uniquement à tester le ressenti du premier déplacement. Elles ne sont ni canoniques ni définitives.

## Contrôles

- PC : chaque mouvement de souris au-dessus de la surface actualise la direction désirée, sans clic obligatoire.
- Mobile : toucher puis glisser actualise la direction avec des Pointer Events.
- Au relâchement tactile, la direction désirée est alignée sur le cap courant : Nyr continue d’avancer sans revenir vers une ancienne cible.
- Aucun clavier, joystick visible ou bouton Dash n’a été ajouté.
- Le virage est plafonné à chaque pas de simulation : une cible placée derrière Nyr ne produit aucun demi-tour instantané à 180°.

## Suspension et reprise

- Quand le runtime est suspendu en portrait, aucune mise à jour de position, de direction, d’interpolation ou de temps de simulation n’est exécutée.
- La référence temporelle de la boucle est effacée pendant la suspension.
- La première frame après reprise réinitialise uniquement cette référence et n’avance pas la simulation.
- Deux cycles paysage → portrait → paysage ont confirmé une reprise depuis l’état exact suspendu, puis un déplacement normal inférieur à 2 pixels au pas suivant, sans bond ni grand delta.

## Comportement technique provisoire aux bords

Pour que le prototype reste observable, Nyr est recentré uniquement s’il sort entièrement de la surface au-delà d’une marge technique de 42 pixels. Ce recentrage est isolé dans `nyrMovement.js`, clairement provisoire, sans dégâts, collision, mort, mur, frontière ou règle canonique de gameplay.

## Tests réalisés

- Ouverture par serveur HTTP local temporaire : réussie.
- Chargement local de la page, du CSS et des onze modules/ressources JavaScript : réussi.
- Validation syntaxique de tous les modules : réussie.
- Exécution des modules de mouvement, rendu, entrée, affichage et boucle : aucune erreur JavaScript bloquante.
- Desktop 1366 × 768 : Forme I rendue, avance automatique confirmée, orientation souris confirmée et virage derrière limité.
- Paysage mobile 844 × 390 : Forme I rendue, toucher/glisser confirmé, relâchement conservant le cap et Pointer Events sans erreur.
- Portrait mobile 390 × 844 : état de position, direction et temps strictement inchangé pendant la suspension.
- Reprise paysage : état exact conservé à la première frame, puis reprise normale sans bond.
- Deux cycles complets de suspension/reprise : réussis.
- Redimensionnements successifs : aucune erreur.
- DPR 1 et DPR 2 : taille interne du canvas adaptée ; mouvement logique identique et indépendant du DPR.
- Historique de trajectoire borné et nombre de segments visuels fixe.
- Chemin absolu : aucun.
- Ressource distante obligatoire ou CDN : aucun.
- Modification persistante hors de `NYR/` : aucune.

La simulation mobile ne remplace pas un futur test sur téléphone réel.

## Contrôle détaillé des interdictions

- Aucun fragment, collectible ou spawn.
- Aucun score ou combo.
- Aucune croissance dynamique, aucun ajout de segment et aucune Forme II, III ou IV.
- Aucun Dash.
- Aucune collision, stabilité, dégâts, mort ou game over.
- Aucun HUD gameplay, caméra, zone, danger, événement ou mini-carte.
- Aucun profil CJ, gain CJ ou stockage joueur.
- Aucun audio ou vibration.
- Aucun réseau, serveur ou multijoueur.
- Aucun Capacitor, npm, framework, bundler ou CDN.
- Aucun GitHub, publication ou déploiement.
- Aucun autre projet CJAJLK modifié.

## Arrêt strict

Le PACK 3 est terminé. **PACK 4 NON COMMENCÉ.**
