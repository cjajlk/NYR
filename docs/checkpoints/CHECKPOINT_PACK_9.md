# Checkpoint — PACK 9

**Date :** 10 septembre 2026  
**Statut :** terminé et vérifié

## Fichier créé

- `docs/checkpoints/CHECKPOINT_PACK_9.md`

## Fichiers modifiés

- `src/gameplay/nyrRenderer.js`
- `README.md`

Tous les autres fichiers et acquis des PACKS 0 à 8 ont été conservés. Aucun module de mouvement, de fragments, de progression, de runtime ou de contrôle n'a été modifié.

## Corps organique visuel

- Les billes circulaires sont remplacées par des ellipses légèrement allongées et progressivement affinées vers la queue.
- Chaque pièce est orientée selon la tangente locale de la trajectoire existante.
- L'espacement logique existant reste strictement fixé à `14 px`; le diamètre longitudinal maximal de `12,4 px` conserve un interstice léger.
- Une liaison lumineuse fine est dessinée sous les pièces, sans devenir une ligne continue dominante.
- La dernière pièce devient une terminaison effilée fermée, orientée selon la fin de la trajectoire.
- Éclat emploie des liaisons alternées et une aura douce (`alpha 0,24`).
- Spectre emploie chaque liaison, des lignes internes cyan et une aura renforcée (`alpha 0,58`).
- Les valeurs visuelles sont regroupées dans `NYR_BODY_VISUAL_CONFIG` et clairement signalées comme provisoires et non canoniques.

## Tests des longueurs obligatoires

| Segments | Situation | Forme | Résultat |
| ---: | --- | --- | --- |
| 4 | départ | Éclat | corps court lisible, tête reliée, queue distincte |
| 23 | 19 absorptions | Éclat | longueur distribuée sans empilement visuel |
| 24 | 20 absorptions | Spectre | transformation exacte, corps énergétique complet |
| 50 | test artificiel | Spectre | courbes et orientations locales conservées |
| 120 | test artificiel | Spectre | rendu complet et historique suffisant |

- Le renderer produit exactement `segments - 1` ellipses corporelles et une terminaison de queue.
- Chaque ellipse corporelle et la tête reçoivent une rotation issue de la trajectoire.
- Sur le scénario courbe à 50 segments, au moins cinq orientations locales distinctes sont constatées.
- Aucun grand vide entre la tête et le premier segment; l'espacement logique du PACK 6 reste inchangé.

## Seuil et croissance conservés

| Fragments absorbés | Segments | Forme |
| ---: | ---: | --- |
| 19 | 23 | Éclat |
| 20 | 24 | Spectre |
| 21 | 25 | Spectre |

- Le compteur commence toujours à 0.
- Chaque Fragment normal ajoute toujours exactement `+1 segment`.
- Le seuil Spectre reste exactement 20, sans second déclenchement à 21.
- Les six Fragments normaux restent actifs; spawn, absorption et réapparition sont inchangés.

## Tests 30 / 60 / 120 Hz

- Un scénario courbe identique de neuf secondes avec 120 segments a été exécuté à 30, 60 et 120 Hz.
- Les trois exécutions terminent avec 120 segments et rendent 119 ellipses corporelles plus la queue.
- Écart maximal constaté entre positions finales de tête : `0,671 px`.
- Aucun changement de forme, de longueur, de vitesse, de virage ou de distribution corporelle dépendant du FPS.

## Desktop, mobile et DPR

- Desktop `1366 × 768` : rendu organique à 50 segments validé.
- Mobile paysage `844 × 390` : rendu organique à 50 segments validé.
- DPR 1 et DPR 2 : séquence d'opérations canvas identique dans les coordonnées CSS normalisées.
- Aucun canvas, overlay, HUD ou texte supplémentaire n'a été créé.

## Suspension portrait et reprise

- Deux cycles paysage → portrait → paysage ont été testés.
- En portrait, mouvement, progression, fragments et nombre de mises à jour restent strictement figés.
- La première frame après chaque reprise est neutre.
- La frame suivante reprend normalement, sans bond, incrément fantôme ni changement visuel prématuré.

## Non-régression logique

- Vitesse `95 px/s`, rotation `π × 0,9 rad/s` et espacement `14 px` inchangés.
- Avance automatique, direction souris, toucher/glisser et interdiction du demi-tour instantané inchangés.
- Trajectoire, échantillonnage, suivi longue longueur et historique borné inchangés.
- Collisions d'absorption et rayon d'absorption inchangés.
- Compteur interne, croissance et seuil Spectre inchangés.
- Aucun score, combo, bonus, nouvelle progression ou autre système ajouté.

## Chargement et robustesse

- Validation syntaxique de tous les modules JavaScript : réussie.
- Test fonctionnel déterministe complet : réussi.
- Serveur HTTP local temporaire : réussi.
- Chargement de `index.html`, du CSS et des quinze modules JavaScript : `17/17` réponses HTTP 200.
- Aucune erreur JavaScript bloquante pendant les tests.
- Aucun chemin absolu dans le prototype, aucune ressource distante obligatoire et aucun CDN.

## Contrôle des interdictions

- Aucun changement de vitesse, contrôle, collision, Fragment ou progression.
- Aucun score, combo, HUD, caméra, zone, danger, événement, audio, vibration, CJ, réseau ou multijoueur.
- Aucune Forme III/IV, aucun Dash, stabilité, dégâts, mort ou game over.
- Aucun Capacitor, framework, npm, GitHub, publication ou déploiement.
- Aucun autre projet CJAJLK modifié.

## Arrêt strict

Le PACK 9 est terminé. **PACK 10 NON COMMENCÉ.**
