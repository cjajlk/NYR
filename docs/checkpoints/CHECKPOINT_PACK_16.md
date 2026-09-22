# CHECKPOINT — PACK 16 — Score interne des Fragments normaux

Date : 2026-09-10  
État : **TERMINÉ ET VALIDÉ**  
Pack suivant : **PACK 17 NON COMMENCÉ**

## Périmètre réalisé

- Création d’un module isolé `src/gameplay/nyrScore.js`.
- Score initial strictement égal à 0.
- Chaque absorption réelle d’un Fragment normal ajoute exactement 100 points.
- Le module ne conserve que le total de points : il ne duplique pas `normalFragmentsAbsorbed` et ne consulte jamais le nombre de segments.
- Le callback unique d’absorption déclenche, une seule fois et dans cet ordre : +1 segment, +1 absorption de progression, +100 points, puis le feedback visuel existant.
- Le score reste purement interne : aucun affichage, HUD, compteur visible, record, combo ou multiplicateur.
- Aucune mise à jour temporelle du score : une frame, un resize, un respawn, une suspension ou une reprise ne peuvent pas ajouter de points sans absorption réelle.

## Fichiers

### Créés

- `src/gameplay/nyrScore.js`
- `docs/checkpoints/CHECKPOINT_PACK_16.md`

### Modifiés

- `src/main.js`
- `README.md`

## Validation du score

- Score initial : `0` — **PASS**.
- 1 absorption : `100` — **PASS**.
- 10 absorptions : `1000` — **PASS**.
- 19 absorptions : `1900` et Éclat — **PASS**.
- 19 → 20 : `2000`, passage Spectre et un seul signal de seuil — **PASS**.
- 20 → 21 : `2100`, Spectre conservé et aucun second signal — **PASS**.
- Indépendance du nombre de segments : même score avec des corps de longueurs différentes — **PASS**.
- 30, 60 et 120 Hz : `2100` points après 21 absorptions dans les trois cas — **PASS**.
- DPR 1 et DPR 2 : `2100` points dans les deux cas — **PASS**.
- Portrait suspendu : score strictement figé — **PASS**.
- Reprise paysage : aucun +100 fantôme sur la reprise ni sur la frame suivante — **PASS**.
- Initialisation et respawn/revalidation d’un Fragment sans absorption : aucun point — **PASS**.
- Absorption réelle via le système de Fragments : un callback et exactement +100 — **PASS**.
- Aucun marquage ni style de score visible dans `index.html` ou le CSS — **PASS**.

## Validation technique

- Chargement local HTTP : **29/29 ressources accessibles**, sans erreur.
- Syntaxe de tous les modules JavaScript : **PASS**.
- Aucun chemin absolu, aucune URL `file://`, aucun CDN : **PASS**.
- Six Fragments normaux actifs : **PASS**.
- Flash d’absorption maintenu à 0,36 s : **PASS**.
- Vitesse maintenue à 95 px/s, rotation à `π × 0,9` rad/s et espacement du corps à 14 px : **PASS**.

## Non-régression

Tous les acquis des PACKS 0 à 15 sont conservés : déplacement automatique, souris/tactile, virage progressif, six Fragments normaux et leur respawn, croissance exacte de +1 segment, suivi du corps indépendant du FPS, compteur de progression existant, Spectre à 20 absorptions, corps organique, flash de 0,36 s, suspension portrait réelle, fond Zone 1 et quatre couches de décor/parallaxe.

## Hors périmètre confirmé

Aucun HUD, compteur visible, record, combo, multiplicateur, autre collectible actif, autre zone, transition, obstacle, danger, Dash, stabilité, dégâts, mort, game over, changement de vitesse/rotation/contrôles/croissance/seuil Spectre, audio, CJ, profil, sauvegarde, réseau, multijoueur, GitHub ou déploiement n’a été ajouté.

**Arrêt strict après PACK 16. PACK 17 non commencé.**
