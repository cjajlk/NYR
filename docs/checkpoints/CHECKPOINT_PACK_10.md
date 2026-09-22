# Checkpoint — PACK 10

**Date :** 10 septembre 2026  
**Statut :** terminé et vérifié

## Fichiers créés

- `src/gameplay/nyrAbsorptionFeedback.js`
- `docs/checkpoints/CHECKPOINT_PACK_10.md`

## Fichiers modifiés

- `src/gameplay/nyrRenderer.js`
- `src/main.js`
- `README.md`

Tous les autres fichiers et acquis des PACKS 0 à 9 ont été conservés. Aucun asset n'a été ajouté, remplacé ou supprimé.

## Architecture du feedback

- `nyrAbsorptionFeedback.js` contient un état visuel unique, isolé et borné.
- Le callback d'absorption réel conserve son ordre : `+1 segment`, enregistrement de progression, puis un seul déclenchement visuel avec la forme désormais active.
- Une absorption produit exactement un appel à `trigger()` et incrémente uniquement le compteur technique de déclenchements du feedback.
- Plusieurs absorptions rapides réinitialisent le même flash au lieu d'empiler des effets ou des particules.
- La boucle active appelle `update(deltaSeconds)` avant le mouvement et la détection des absorptions ; un nouveau flash commence ainsi à zéro et garde toute sa durée logique.
- Le renderer reçoit un snapshot minimal et dessine l'effet autour de la pose réelle de la queue calculée depuis la trajectoire existante.
- Aucun état de gameplay, compteur de progression ou objet collectible n'est dupliqué.

## Valeurs visuelles provisoires

Toutes les valeurs suivantes sont regroupées dans `NYR_ABSORPTION_FEEDBACK_CONFIG` et marquées comme provisoires, non canoniques et non finales.

| Réglage | Valeur |
| --- | ---: |
| Durée active | `0,36 s` |
| Rayon initial | `7 px` |
| Rayon final | `25 px` |
| Alpha Éclat | `0,46` |
| Alpha Spectre | `0,72` |
| Trait Éclat | `1,6 px` |
| Trait Spectre | `2,3 px` |

- Éclat utilise un anneau violet-cyan doux et un halo discret.
- Spectre utilise le même langage visuel avec un alpha, un trait et un halo légèrement renforcés.
- L'anneau s'élargit et son intensité décroît au carré jusqu'à disparition.
- Le feedback reste localisé sur le nouveau segment et l'extrémité de queue : aucun flash plein écran, texte ou explosion.

## Absorptions et seuil

| Test | Segments | Déclenchements | Forme | Signal du seuil cumulé |
| --- | ---: | ---: | --- | ---: |
| État initial | 4 | 0 | Éclat | 0 |
| Première absorption | 5 | 1 | Éclat | 0 |
| Dix absorptions | 14 | 10 | Éclat | 0 |
| 19 absorptions | 23 | 19 | Éclat | 0 |
| 19 → 20 | 24 | 20 | Spectre | 1 |
| 20 → 21 | 25 | 21 | Spectre | 1 |

- Chaque absorption réelle ajoute toujours exactement un segment.
- La 20e absorption active Spectre avant de déclencher le feedback ; l'intensité Spectre est donc appliquée exactement au seuil.
- La 21e absorption déclenche un feedback normal sans second signal de seuil.
- Le feedback ne modifie ni le compteur canonique ni la forme.

## Tests 30 / 60 / 120 Hz

Après dix déclenchements successifs, un flash complet a été avancé avec trois fréquences fixes.

| Fréquence | Frames actives jusqu'à extinction | Temps logique final | Déclenchements |
| ---: | ---: | ---: | ---: |
| 30 Hz | 11 | `0,36 s` | 10 |
| 60 Hz | 22 | `0,36 s` | 10 |
| 120 Hz | 44 | `0,36 s` | 10 |

- La durée dépend uniquement de la somme des `deltaSeconds` actifs.
- Aucun usage de `Date.now()`, `performance.now()`, `setTimeout()` ou `setInterval()`.
- Le nombre de déclenchements et le résultat logique sont identiques aux trois fréquences.

## Desktop, mobile et DPR

- Desktop `1366 × 768` : feedback Spectre et corps organique à 50 segments validés.
- Mobile paysage `844 × 390` : feedback Spectre et corps organique à 50 segments validés.
- DPR 1 et DPR 2 : séquence d'opérations canvas strictement identique dans les coordonnées CSS normalisées.
- Éclat et Spectre produisent chacun exactement deux primitives de flash ; seule leur présentation visuelle diffère.
- Aucun nouveau canvas, overlay, HUD ou texte visible n'a été créé.

## Suspension portrait et reprise

- Deux cycles paysage → portrait → paysage ont été exécutés.
- Le premier passage en portrait survient pendant un flash Spectre actif.
- Tant que le runtime est suspendu, `update(deltaSeconds)` n'est jamais appelé : état actif, temps écoulé, progression et intensité restent strictement figés.
- La première frame après chaque retour paysage est neutre grâce à la remise à zéro du timestamp de boucle.
- Le flash reprend ensuite depuis son temps exact, sans saut, disparition prématurée ni nouveau déclenchement.
- Aucun mouvement, absorption, croissance, respawn ou incrément fantôme pendant la suspension.

## Non-régression PACKS 0 à 9

- Vitesse `95 px/s`, rotation `π × 0,9 rad/s` et espacement corporel `14 px` inchangés.
- Trajectoire, contrôles souris/tactile, virage progressif et suivi longue longueur inchangés.
- Corps organique, orientation locale, liaisons d'énergie et queue effilée du PACK 9 conservés.
- Six Fragments normaux de production, spawn, rayon d'absorption et respawn inchangés.
- Croissance `+1 segment`, compteur, seuil à 20 et transformation Spectre inchangés.
- Inventaire visuel présent et intact : 4 fonds de zones, 6 collectibles, 5 dangers, 4 couches parallaxe et 4 formes de Nyr.

## Chargement et robustesse

- Validation syntaxique de tous les modules JavaScript : réussie.
- Test fonctionnel déterministe complet : réussi.
- Serveur HTTP local temporaire : réussi.
- Chargement de `index.html`, du CSS et des seize modules JavaScript : `18/18` réponses HTTP 200.
- Aucune erreur JavaScript bloquante pendant les tests.
- Aucun chemin absolu dans le prototype, aucune ressource distante obligatoire et aucun CDN.

## Contrôle des interdictions

- Aucun score, `+100 points`, combo, multiplicateur ou HUD.
- Aucun son, vibration, haptique, particule lourde, explosion, cinématique ou freeze.
- Aucun changement de vitesse, virage, contrôle, trajectoire, collision, progression, spawn ou absorption.
- Aucun nouveau collectible, aucune Forme III/IV, aucun Dash, stabilité, dégâts, mort ou game over.
- Aucune caméra, zone, danger, événement, mini-carte, CJ, profil ou sauvegarde.
- Aucun réseau, multijoueur, Capacitor, npm, framework, GitHub, publication ou déploiement.
- Aucun autre projet CJAJLK modifié.

## Arrêt strict

Le PACK 10 est terminé. **PACK 11 NON COMMENCÉ.**
