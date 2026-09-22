# Checkpoint — PACK 7

**Date :** 10 septembre 2026  
**Statut :** terminé et vérifié

## Fichiers créés

- `src/gameplay/nyrProgression.js`
- `docs/checkpoints/CHECKPOINT_PACK_7.md`

## Fichiers modifiés

- `src/main.js`
- `README.md`

Tous les autres fichiers et acquis des PACKS 0 à 6 ont été conservés.

## Architecture du compteur

- `nyrProgression.js` porte un état interne distinct du mouvement, du renderer et du système de fragments.
- `normalFragmentsAbsorbed` compte uniquement les absorptions réelles de Fragments normaux.
- Le nombre de segments reste un état séparé dans le mouvement : il n'est pas utilisé comme compteur de fragments.
- La constante canonique `spectreThresholdFragments: 20` est centralisée dans `NYR_PROGRESSION_CONFIG`.
- `recordNormalFragmentAbsorption()` incrémente le compteur de `+1`, détecte le premier franchissement du seuil et expose un snapshot minimal gelé.
- Le signal interne `onSpectreThresholdReached` est émis une seule fois.
- Le callback d'absorption dans `main.js` conserve le `+1 segment` du PACK 5, puis enregistre exactement une absorption dans la progression.

## Comportement 0 → 19 → 20 → 21

| État | Fragments absorbés | Seuil Spectre | Signaux cumulés |
| --- | ---: | --- | ---: |
| Initial | 0 | non atteint | 0 |
| Après 1 absorption | 1 | non atteint | 0 |
| Après 10 absorptions | 10 | non atteint | 0 |
| Après 19 absorptions | 19 | non atteint | 0 |
| 20e absorption | 20 | atteint | 1 |
| 21e absorption | 21 | toujours atteint | 1 |

- À 20, le seuil est détecté exactement au moment de l'incrément.
- À 21 et au-delà, l'état reste atteint sans second déclenchement one-shot.
- Les segments suivent simultanément la règle existante : 4 au départ, 5 après une absorption, 14 après dix et 25 après vingt-et-une.

## Suspension et reprise

- Deux cycles paysage → portrait → paysage ont été testés depuis un état à 19 absorptions.
- Compteur, segments, état du seuil, trajectoire, position, cap et fragments restent strictement figés pendant la suspension.
- La première frame de reprise est neutre.
- Aucun incrément, aucune absorption ni aucun signal de seuil fantôme après reprise.

## Tests 30 / 60 / 120 Hz et DPR

- Le même scénario de vingt-et-une absorptions a été exécuté à 30, 60 et 120 Hz.
- Résultat identique aux trois fréquences : compteur `21`, seuil atteint, un seul signal interne.
- DPR 1 et DPR 2 : états de progression strictement identiques.
- Le compteur dépend uniquement des callbacks d'absorption réels, jamais des frames, redimensionnements ou rendus.

## Non-régression PACKS 0 à 6

- Nyr commence toujours avec quatre segments.
- Chaque Fragment normal ajoute toujours exactement un segment.
- Six Fragments normaux restent actifs et leur respawn sûr est inchangé.
- Mouvement automatique, souris sans clic, toucher/glisser et virage progressif conservés.
- Aucun demi-tour instantané.
- Suivi du corps PACK 6 vérifié avec 120 segments et historique borné.
- Canvas responsive, portrait suspendu, reprise sans bond et DPR conservés.
- Formats couverts : desktop `1366 × 768`, mobile paysage `844 × 390`, portrait `390 × 844`.

## Chargement et robustesse

- Serveur HTTP local temporaire : réussi.
- Chargement de `index.html`, du CSS et des quatorze modules JavaScript : `16/16` réponses HTTP 200.
- Validation syntaxique de tous les modules JavaScript : réussie.
- Aucune erreur JavaScript bloquante pendant les tests.
- Aucun chemin absolu dans le prototype.
- Aucune ressource distante obligatoire ou CDN.
- Aucune modification persistante hors de `/CJAJLK Games/NYR/`.

## Systèmes explicitement non commencés

- Aucune apparence Forme II/Spectre et aucune Forme III ou IV.
- Aucun texte, flash ou animation d'évolution.
- Aucun HUD, compteur visible ou debug visible permanent.
- Aucun score, `+100 points`, record, combo ou multiplicateur.
- Aucun changement de vitesse.
- Aucun Dash, collision, danger, stabilité, dégâts, mort ou game over.
- Aucune caméra, zone, événement, mini-carte ou autre collectible.
- Aucun CJ, profil, sauvegarde ou progression permanente.
- Aucun audio, vibration, réseau, serveur ou multijoueur.
- Aucun Capacitor, npm, framework, bundler ou CDN.
- Aucun GitHub, publication ou déploiement.
- Aucun autre projet CJAJLK modifié.

## Arrêt strict

Le PACK 7 est terminé. **PACK 8 NON COMMENCÉ.**
