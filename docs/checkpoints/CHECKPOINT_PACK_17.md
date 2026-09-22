# CHECKPOINT — PACK 17 — Affichage discret du score

Date : 2026-09-10  
État : **TERMINÉ ET VALIDÉ**  
Pack suivant : **PACK 18 NON COMMENCÉ**

## Périmètre réalisé

- Création du composant isolé `src/ui/scoreDisplay.js`.
- Affichage centré en haut de l’écran sous la forme `SCORE 000000`.
- Style astral compact, translucide et non interactif, sans barre ni panneau opaque lourd.
- Initialisation par lecture de `score.snapshot()` : le lancement affiche `SCORE 000000`.
- Après une absorption réelle, le composant reçoit uniquement l’instantané retourné par l’attribution existante des 100 points.
- Le composant ne calcule aucune récompense, ne conserve aucun score parallèle et ne modifie ni progression ni gameplay.
- Affichage placé au-dessus du voile d’orientation : il reste visible et inchangé pendant la suspension portrait.

## Fichiers

### Créés

- `src/ui/scoreDisplay.js`
- `tests/automated/pack17ScoreDisplay.test.mjs`
- `docs/checkpoints/CHECKPOINT_PACK_17.md`

### Modifiés

- `src/main.js`
- `assets/css/main.css`
- `README.md`

## Validation fonctionnelle

- Lancement : `SCORE 000000` — **PASS**.
- 1 absorption : `SCORE 000100` — **PASS**.
- 10 absorptions : `SCORE 001000` — **PASS**.
- 19 absorptions : `SCORE 001900`, forme Éclat — **PASS**.
- 19 → 20 : `SCORE 002000`, forme Spectre et un seul signal de seuil — **PASS**.
- 20 → 21 : `SCORE 002100`, Spectre conservé sans second signal — **PASS**.
- Mise à jour directe depuis l’unique score existant ; aucune duplication d’état — **PASS**.
- Une seule occurrence de `score.awardNormalFragment()` dans l’intégration — **PASS**.
- Suspension portrait sur plusieurs secondes simulées : texte et score strictement figés — **PASS**.
- Reprise : aucun +100 fantôme — **PASS**.

## Validation d’affichage

- Desktop 1366 × 768, DPR 1 et 2 : contrat de taille et d’occupation compact vérifié — **PASS**.
- Mobile paysage 844 × 390, DPR 1 et 2 : score centré, compact et lisible — **PASS**.
- Portrait 390 × 844, DPR 1 et 2 : score visible au-dessus du voile et inchangé — **PASS**.
- Zone occupée inférieure à 2,5 % de chaque surface testée ; aucun recouvrement important imposé par le HUD — **PASS**.
- Chiffres tabulaires, contraste lumineux discret, ombre légère et aucune animation/clignotement — **PASS**.

## Validation technique

- 30, 60 et 120 Hz : mêmes valeurs affichées après les mêmes absorptions — **PASS**.
- Syntaxe de tous les modules JavaScript : **PASS**.
- Chargement HTTP local de la page, du CSS, du module UI, du fond Zone 1 et des quatre couches décoratives : réponses 200 — **PASS**.
- Aucun chemin absolu, aucune URL `file://`, aucun CDN ajouté — **PASS**.
- Test automatisé : `node tests/automated/pack17ScoreDisplay.test.mjs` — **PASS**.

## Non-régression

Tous les acquis des PACKS 0 à 16 sont conservés : fond Zone 1, étoiles, nébuleuse, particules proches, astéroïdes décoratifs, déplacement automatique, souris/tactile, virage progressif, six Fragments normaux et leur respawn, croissance exacte de +1 segment, suivi indépendant du FPS, Spectre à 20, corps organique, flash de 0,36 s, suspension portrait réelle et score interne de +100 par absorption.

## Hors périmètre confirmé

Aucun record, combo, multiplicateur, compteur de Fragments visible, jauge de stabilité, Dash, nouvelle zone, nouveau collectible, danger actif, changement de vitesse/rotation/contrôles/croissance/seuil, audio, CJ, profil, sauvegarde, réseau, multijoueur, GitHub ou déploiement n’a été ajouté.

**Arrêt strict après PACK 17. PACK 18 non commencé.**
