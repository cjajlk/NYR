# Checkpoint — PACK 8

**Date :** 10 septembre 2026  
**Statut :** terminé et vérifié

## Fichier créé

- `docs/checkpoints/CHECKPOINT_PACK_8.md`

## Fichiers modifiés

- `src/gameplay/nyrProgression.js`
- `src/gameplay/nyrRenderer.js`
- `src/main.js`
- `README.md`

Tous les autres fichiers et acquis des PACKS 0 à 7 ont été conservés.

## Architecture de la forme

- `nyrProgression.js` reste l'unique source de vérité du compteur et du seuil canonique à 20 fragments.
- Le snapshot de progression dérive `currentForm` directement de `spectreThresholdReached` : `eclat` avant le seuil, `spectre` dès le seuil.
- Aucun second compteur et aucun état de forme parallèle n'ont été créés.
- `main.js` transmet seulement les snapshots du mouvement et de la progression au renderer.
- `nyrRenderer.js` choisit le rendu Éclat ou Spectre ; le mouvement reste totalement indépendant de la forme.
- La transformation est instantanée et purement visuelle.

## Différences visuelles Éclat / Spectre

Le rendu reste construit uniquement avec des primitives canvas.

- Tête : ellipse portée de `17 × 13 px` à `22 × 12,5 px`, légèrement décalée pour une silhouette plus allongée.
- Cornes : extension maximale portée de `20 px` à `25 px`, avec triangles fermés plus lisibles.
- Ailerons : deux petits ailerons latéraux violets ajoutés sur la tête Spectre.
- Corps : chaque segment reçoit une ligne cyan lumineuse supplémentaire.
- Traînée/aura : halo cyan renforcé sur les segments et flou lumineux de tête porté à `22 px`.
- L'Éclat conserve exactement son rendu antérieur et ne reçoit aucun attribut Spectre avant le seuil.
- Aucun nouvel asset n'a été créé ou importé.

## Résultats exacts 19 / 20 / 21

| Fragments absorbés | Forme rendue | Segments | Signaux de seuil cumulés |
| ---: | --- | ---: | ---: |
| 19 | Éclat | 23 | 0 |
| 20 | Spectre | 24 | 1 |
| 21 | Spectre | 25 | 1 |

- La 20e absorption active Spectre exactement au même moment que l'incrément du compteur.
- La transformation n'ajoute et ne retire aucun segment : seule la règle existante `+1 segment` par Fragment normal s'applique.
- À 21 et au-delà, Spectre reste actif sans second changement d'état ni second signal one-shot.

## Tests visuels logiques du renderer

- Différence de dimensions de tête confirmée.
- Cornes plus longues confirmées.
- Deux ailerons latéraux confirmés.
- Une ligne lumineuse ajoutée sur chaque segment Spectre.
- Aura Spectre renforcée confirmée.
- Les opérations canvas Éclat et Spectre sont distinctes et déterministes, sans texte, HUD ni animation complexe.

## Tests 30 / 60 / 120 Hz

- Un scénario identique de vingt-et-une absorptions a été exécuté à 30, 60 et 120 Hz.
- Résultat strictement identique aux trois fréquences : `spectre`, 25 segments, un seul déclenchement du seuil.
- La forme dépend uniquement du compteur réel, jamais du nombre de frames.
- Le suivi du corps indépendant du FPS du PACK 6 reste conservé.

## Desktop, mobile et DPR

- Desktop `1366 × 768` : seuil, croissance et rendu logique validés.
- Mobile paysage `844 × 390` : seuil, contrôles et rendu logique validés.
- Mobile portrait `390 × 844` : suspension réelle validée.
- DPR 1 et DPR 2 : forme et progression strictement identiques.
- Le rendu utilise les coordonnées CSS déjà normalisées par le gestionnaire DPR existant.

## Suspension et reprise

Scénario obligatoire validé :

1. 19 fragments atteints en paysage : Éclat, 23 segments.
2. Passage en portrait : progression, mouvement et fragments strictement figés.
3. Retour paysage : première frame neutre, toujours Éclat à 19.
4. Absorption réelle du 20e fragment : Spectre, 24 segments.

- Aucun changement de forme, incrément, mouvement ou timer fantôme en portrait.
- Aucun saut ni transformation prématurée à la reprise.

## Non-régression PACKS 0 à 7

- Surface responsive, DPR et suspension portrait conservés.
- Avance automatique, souris sans clic et toucher/glisser conservés.
- Cap conservé au relâchement tactile.
- Virage progressif sans demi-tour instantané conservé.
- Six Fragments normaux toujours actifs avec spawn/respawn sûr inchangé.
- Croissance exacte de `+1 segment` par absorption conservée.
- Compteur interne et seuil one-shot PACK 7 conservés.
- Suivi grande longueur et historique borné PACK 6 conservés jusqu'à 120 segments.
- Vitesse, vitesse angulaire et rayon de virage inchangés.

## Chargement et robustesse

- Serveur HTTP local temporaire : réussi.
- Chargement de `index.html`, du CSS et des quatorze modules JavaScript : `16/16` réponses HTTP 200.
- Validation syntaxique de tous les modules JavaScript : réussie.
- Aucune erreur JavaScript bloquante pendant les tests.
- Aucun chemin absolu dans le prototype.
- Aucune ressource distante obligatoire ou CDN.
- Aucune modification persistante hors de `/CJAJLK Games/NYR/`.

## Contrôle des interdictions

- Aucune Forme III — Nocturne ou Forme IV — Dévoreur.
- Aucune logique des seuils 50 ou 100.
- Aucun changement de vitesse ou de rayon de virage.
- Aucun score, `+100 points`, record, combo ou multiplicateur.
- Aucun HUD, compteur visible ou debug visible permanent.
- Aucun texte, flash plein écran, cinématique, freeze ou animation dédiée d'évolution.
- Aucun son d'évolution, audio ou vibration.
- Aucun Dash, collision, danger, stabilité, dégâts, mort ou game over.
- Aucune caméra, zone, événement, mini-carte ou autre collectible.
- Aucun CJ, profil, sauvegarde ou progression permanente.
- Aucun réseau, serveur ou multijoueur.
- Aucun Capacitor, npm, framework, bundler ou CDN.
- Aucun GitHub, publication ou déploiement.
- Aucun autre projet CJAJLK modifié.

## Arrêt strict

Le PACK 8 est terminé. **PACK 9 NON COMMENCÉ.**
