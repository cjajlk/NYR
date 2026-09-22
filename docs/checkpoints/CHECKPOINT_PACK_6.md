# Checkpoint — PACK 6

**Date :** 10 septembre 2026  
**Statut :** terminé et vérifié

## Fichier créé

- `docs/checkpoints/CHECKPOINT_PACK_6.md`

## Fichiers modifiés

- `src/gameplay/nyrPrototypeConfig.js`
- `src/gameplay/nyrMovement.js`
- `README.md`

Tous les autres fichiers et acquis des PACKS 0 à 5 ont été conservés.

## Suivi du corps indépendant du FPS

- L'ancien historique limité à un nombre fixe de points par frame a été supprimé.
- La trajectoire est maintenant échantillonnée tous les `4 pixels` réellement parcourus.
- Lorsqu'une frame couvre plus de 4 pixels, le mouvement insère tous les échantillons intermédiaires nécessaires par interpolation.
- Le snapshot expose toujours la position exacte courante de la tête comme premier point, devant les échantillons de trajectoire.
- Le renderer conserve son interpolation par distance et l'espacement visuel existant de `14 pixels`.
- Vitesse, vitesse angulaire, rayon de virage et contrôles sont inchangés.

## Bornage mémoire

- Distance utile conservée : `segmentCount × 14 px + 56 px` de marge de sécurité.
- La polyligne est tronquée dès qu'elle couvre cette distance utile ; elle ne grandit donc pas avec la durée de la partie ni avec le FPS.
- La marge de 56 px conserve quatre espacements supplémentaires pour permettre les prochaines croissances sans trou brutal.
- Aucun plafond de gameplay à 120 segments n'a été ajouté.

## Résultats des tests 30 / 60 / 120 Hz

Une même trajectoire déterministe de 28 secondes avec 120 segments a été exécutée aux trois fréquences. Les positions de tous les segments ont été comparées à la référence 120 Hz.

| Fréquence | Écart maximal | Écart moyen |
| --- | ---: | ---: |
| 30 Hz | 1,327 px | 1,122 px |
| 60 Hz | 0,400 px | 0,371 px |
| 120 Hz | référence | référence |

- Tous les écarts restent sous 1,4 px.
- Aucune différence de forme perceptible ni empilement lié au FPS.

## Résultats grande longueur

| Segments | Points de trajectoire conservés | Paires empilées sous 2 px | Renderer |
| ---: | ---: | ---: | --- |
| 20 | 87 | 0 | stable, 20 segments rendus |
| 50 | 192 | 0 | stable, 50 segments rendus |
| 120 | 437 | 0 | stable, 120 segments rendus |

- Tous les segments sont distribués sur la trajectoire.
- Aucun paquet de segments n'est regroupé au dernier point mémorisé.
- L'historique reste proportionnel à la distance utile et borné.
- Aucun accroissement mémoire dépendant de la durée ou du nombre de frames.

## Suspension et reprise

- Deux cycles paysage → portrait → paysage testés.
- Position, cap, trajectoire et `segmentCount` restent strictement figés pendant la suspension.
- La première frame de reprise est neutre.
- Aucun ajout de distance fantôme, trou ou saut dans la trajectoire.
- Le corps reste intact après la reprise.
- Le recentrage technique conserve le nombre de segments et repart avec une trajectoire propre.

## Non-régression PACKS 0 à 5

- Canvas responsive et DPR : conservés.
- Formats testés : desktop `1366 × 768`, mobile paysage `844 × 390`, portrait `390 × 844`.
- DPR 1 et DPR 2 : logique identique.
- Nyr reste en Forme I.
- Avance automatique, souris sans clic et toucher/glisser : conservés.
- Virage progressif sans demi-tour instantané : conservé.
- État initial : `4 segments`.
- Une absorption : `5 segments`.
- Dix absorptions : `14 segments`.
- Six Fragments normaux toujours actifs avec spawn/respawn inchangé.
- Une absorption ajoute toujours exactement `+1 segment` et aucune autre récompense.

## Chargement et robustesse générale

- Serveur HTTP local temporaire : réussi.
- Chargement de `index.html`, du CSS et des treize modules JavaScript : `15/15` réponses HTTP 200.
- Validation syntaxique de tous les modules JavaScript : réussie.
- Aucune erreur JavaScript bloquante pendant les tests.
- Aucun chemin absolu dans le prototype.
- Aucune ressource distante obligatoire ou CDN.
- Aucune modification persistante hors de `/CJAJLK Games/NYR/`.

## Contrôle des interdictions

- Aucun score ni `+100 points`.
- Aucun combo, multiplicateur ou compteur visible.
- Aucune Forme II, III ou IV.
- Aucun changement de vitesse.
- Aucun Dash, collision, stabilité, dégâts, mort ou game over.
- Aucun HUD gameplay, caméra, zone, danger, événement ou autre collectible.
- Aucun CJ, profil, sauvegarde ou progression permanente.
- Aucun audio, vibration, réseau, serveur ou multijoueur.
- Aucun Capacitor, npm, framework, bundler ou CDN.
- Aucun GitHub, publication ou déploiement.
- Aucun autre projet CJAJLK modifié.

## Arrêt strict

Le PACK 6 est terminé. **PACK 7 NON COMMENCÉ.**
