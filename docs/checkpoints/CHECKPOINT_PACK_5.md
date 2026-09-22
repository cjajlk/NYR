# Checkpoint — PACK 5

**Date :** 10 septembre 2026  
**Statut :** terminé et vérifié

## Fichier créé

- `docs/checkpoints/CHECKPOINT_PACK_5.md`

## Fichiers modifiés

- `src/gameplay/nyrPrototypeConfig.js`
- `src/gameplay/nyrMovement.js`
- `src/gameplay/nyrRenderer.js`
- `src/main.js`
- `README.md`

Tous les autres fichiers des PACKS 0 à 4 ont été conservés sans modification.

## Architecture retenue

- `nyrPrototypeConfig.js` conserve la valeur initiale provisoire de quatre segments.
- Le nombre courant de segments appartient maintenant à l'état interne de `nyrMovement.js` et apparaît dans son snapshot.
- La méthode neutre `addSegments(count)` ajoute un nombre entier positif de segments et retourne le nouveau total.
- `nyrRenderer.js` lit exclusivement `state.segmentCount` : le nombre de segments n'est plus codé en dur dans le renderer.
- Le callback d'absorption configuré dans `main.js` appelle uniquement `movement.addSegments(1)`.
- Le recentrage technique provisoire conserve le nombre de segments déjà acquis.

## Valeurs provisoires

- Segments visuels initiaux : `4`.
- Gain par Fragment normal absorbé : exactement `+1 segment`.
- Espacement conservé : `14 pixels`.
- Vitesse, virage, rayon de courbure, contrôles et paramètres des fragments : inchangés.

## Résultats des tests

### Chargement et syntaxe

- Serveur HTTP local temporaire : réussi.
- Chargement HTTP de `index.html`, du CSS et des treize modules JavaScript : `15/15` ressources en réponse 200.
- Validation syntaxique de tous les modules JavaScript : réussie.
- Exécution des systèmes : aucune erreur JavaScript bloquante.
- Aucun chemin absolu dans les fichiers du prototype.
- Aucune ressource distante obligatoire ou CDN.

### Croissance desktop — 1366 × 768

- État initial confirmé à quatre segments.
- Une absorption isolée ajoute exactement un segment.
- Dix absorptions successives : passage exact de `4` à `14` segments.
- Les six Fragments normaux restent actifs et continuent leur respawn sûr.
- Le renderer dessine les quatorze segments demandés depuis l'historique de trajectoire.
- Les points des segments supplémentaires sont répartis le long de la trajectoire et ne restent pas tous empilés sur la tête.

### Mobile paysage — 844 × 390

- Pilotage souris sans clic : conservé.
- Toucher/glisser : conservé.
- Cap conservé au relâchement tactile.
- Aucun demi-tour instantané à 180°.
- Croissance et nombre de fragments indépendants du format d'affichage.

### Mobile portrait — 390 × 844 et reprise

- Deux cycles paysage → portrait → paysage testés.
- Pendant la suspension, l'état complet de Nyr reste strictement inchangé, y compris le nombre de segments.
- Le total de segments est conservé au retour paysage.
- La première frame de reprise reste neutre : aucune croissance fantôme et aucun bond temporel.

### DPR et robustesse

- DPR 1 et DPR 2 : état logique de croissance identique.
- Le recentrage technique hors surface conserve le nombre de segments atteint.
- Après dix absorptions, le nombre de fragments reste strictement égal à six.

## Contrôle des interdictions

- Aucun point ni `+100 points` ajouté.
- Aucun score, record, combo, multiplicateur ou compteur visible.
- Aucune Forme II, III ou IV.
- Aucun changement de vitesse, virage, contrôle ou comportement des fragments.
- Aucun Dash, collision, stabilité, dégâts, mort ou game over.
- Aucun HUD gameplay, caméra, zone, danger, événement ou mini-carte.
- Aucun CJ, profil global, sauvegarde ou progression permanente.
- Aucun audio, vibration, réseau, serveur ou multijoueur.
- Aucun Capacitor, npm, framework, bundler ou CDN.
- Aucun GitHub, publication ou déploiement.
- Aucun autre projet CJAJLK modifié.

## Arrêt strict

Le PACK 5 est terminé. **PACK 6 NON COMMENCÉ.**
