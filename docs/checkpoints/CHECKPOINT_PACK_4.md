# Checkpoint — PACK 4

**Date :** 10 septembre 2026  
**Statut :** terminé et vérifié

## Fichiers créés

- `src/gameplay/fragmentPrototypeConfig.js`
- `src/gameplay/fragmentSystem.js`
- `src/gameplay/fragmentRenderer.js`
- `docs/checkpoints/CHECKPOINT_PACK_4.md`

## Fichiers modifiés

- `src/main.js`
- `README.md`

Tous les autres fichiers des PACKS 0 à 3 ont été conservés sans modification.

## Architecture retenue

- `fragmentPrototypeConfig.js` centralise uniquement les réglages provisoires du Fragment normal.
- `fragmentSystem.js` crée les six fragments, recherche des positions sûres, détecte l’absorption par la tête, replace le fragment absorbé et expose un callback interne neutre.
- `fragmentRenderer.js` dessine chaque Fragment normal sous forme d’un petit éclat cyan/violet avec des primitives canvas.
- `main.js` appelle le système de fragments uniquement depuis la mise à jour déjà conditionnée par l’état actif du runtime, puis les dessine avant Nyr.

## Réglages provisoires — non canoniques et non finaux

- Fragments actifs simultanés : `6`.
- Rayon visuel : `7 pixels`.
- Rayon d’absorption tête/fragment : `25 pixels`.
- Marge de spawn : `48 pixels`, réduite proportionnellement uniquement si la surface devient trop petite.
- Distance minimale avec la tête au spawn : `90 pixels`.
- Distance minimale avec les quatre premiers points du corps : `28 pixels`.
- Distance minimale entre fragments : `38 pixels`.
- Essais aléatoires maximum par placement : `24`.

## Spawn sûr et garantie anti-boucle

- Le générateur aléatoire est injectable afin de permettre des tests déterministes.
- Chaque candidat est vérifié contre les limites de la surface, la tête, les quatre premiers points du corps et les autres fragments.
- Après 24 candidats rejetés, le système cesse d’appeler le RNG et parcourt une grille bornée de 24 positions.
- Il choisit d’abord une position totalement sûre ; si une surface exceptionnellement petite empêche toutes les distances souhaitées, il choisit la position de la grille offrant le plus grand dégagement. Aucune boucle infinie n’est possible.
- Lors d’un redimensionnement actif, seuls les fragments devenus hors surface sont replacés ; l’ensemble n’est pas réinitialisé.

## Absorption sans récompense

- Seule la distance entre la tête de Nyr et un Fragment normal est vérifiée.
- À l’absorption, le fragment concerné est immédiatement replacé dans une nouvelle position sûre.
- Le nombre de fragments reste strictement égal à six.
- Un callback interne fournit seulement l’identifiant et les positions avant/après pour les tests.
- Aucun point, segment, compteur, croissance, combo, animation de récompense ou son n’est déclenché.

## Suspension et reprise

- Le système de fragments est mis à jour dans la même fonction que le mouvement de Nyr, elle-même appelée uniquement lorsque le runtime est actif.
- En portrait suspendu, aucune détection d’absorption, aucun respawn et aucune modification des positions n’est exécuté.
- Le redimensionnement en portrait ne revalide pas les fragments tant que le runtime est suspendu.
- Deux cycles paysage → portrait → paysage ont confirmé que Nyr et les six fragments restent strictement inchangés pendant la suspension et à la première frame de reprise.
- La collecte reprend normalement ensuite, sans absorption fantôme ni bond temporel.

## Résultats des tests

### Chargement et syntaxe

- Ouverture par serveur HTTP local temporaire : réussie.
- Chargement local de la page, du CSS et des quatorze modules/ressources JavaScript : réussi.
- Validation syntaxique de tous les modules ajoutés et modifiés : réussie.
- Exécution des systèmes : aucune erreur JavaScript bloquante.
- Ressource distante obligatoire ou CDN : aucun.
- Chemin absolu : aucun.
- Modification persistante hors de `NYR/` : aucune.

### Desktop 1366 × 768

- Nyr Forme I conserve son avance et son pilotage du PACK 3.
- Six fragments présents et rendus.
- Dix absorptions successives réalisées sans erreur.
- Chaque fragment absorbé a changé de position et respecté la marge ainsi que la distance de sécurité avec la tête.
- Le nombre de fragments est resté à six ; aucun point ni segment n’a été ajouté.

### Mobile paysage 844 × 390

- Souris et toucher/glisser du PACK 3 sans régression.
- Six fragments visibles par le moteur de rendu.
- Cinq absorptions successives réalisées sans erreur.
- Relâchement tactile conservant le cap et aucun conflit Pointer Events/collecte.

### Mobile portrait et reprise

- Runtime suspendu en portrait 390 × 844.
- Positions et direction de Nyr strictement stables.
- Positions des six fragments strictement stables et aucune absorption pendant la suspension.
- Deux cycles complets de suspension/reprise réussis, sans respawn spontané ni grand delta.
- Collecte normale après reprise.

### Spawn, resize et DPR

- RNG déterministe testé.
- Aucun fragment initial sur la tête.
- Cas de RNG retournant toujours une position rejetée : fallback terminé proprement, avec six fragments créés.
- Redimensionnement 1366 × 768 vers 844 × 390 : fragments invalides replacés dans la zone autorisée, sans erreur.
- DPR 1 et DPR 2 : résultats logiques identiques ; l’absorption ne dépend pas de la densité de pixels.

### Non-régression PACK 3

- Avance automatique : conservée.
- Souris sans clic : conservée.
- Tactile toucher/glisser : conservé.
- Cap conservé au relâchement : confirmé.
- Aucun demi-tour instantané à 180° : confirmé.
- Quatre segments visuels fixes : conservés.
- Suspension et reprise sans bond : confirmées.

## Contrôle des interdictions

- Aucun score, record, combo, multiplicateur ou compteur visible.
- Aucun `+100 points` et aucun `+1 segment`.
- Aucune croissance dynamique et aucune Forme II, III ou IV.
- Aucun autre collectible : Orbe rare, Énergie, Éclat rare, Fragment pur ou Corruption absents.
- Aucun Dash, danger, dégâts, stabilité, mort ou game over.
- Aucun HUD gameplay, caméra, zone, événement ou mini-carte.
- Aucun CJ, profil global ou stockage joueur.
- Aucun audio, vibration, réseau, serveur ou multijoueur.
- Aucun Capacitor, npm, framework, bundler ou CDN.
- Aucun GitHub, publication ou déploiement.
- Aucun autre projet CJAJLK modifié.

## Arrêt strict

Le PACK 4 est terminé. **PACK 5 NON COMMENCÉ.**
