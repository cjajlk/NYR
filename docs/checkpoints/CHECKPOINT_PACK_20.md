# CHECKPOINT — PACK 20 — Socle interne de Stabilité

Date : 2026-09-10  
État : **TERMINÉ ET VALIDÉ**  
Pack suivant : **PACK 21 NON COMMENCÉ**

## Périmètre réalisé

- Création du module isolé `src/gameplay/nyrStability.js`.
- Configuration centralisée et gelée : Stabilité initiale `100`, maximum `100`.
- Création de l’état de Stabilité au lancement du prototype.
- API publique minimale : uniquement `snapshot()`.
- Instantané exposé : `{ stability: 100 }`.
- Aucune méthode de perte, récupération, dégâts, soin, reset ou game over.
- Aucun système existant ne reçoit de référence permettant de modifier la Stabilité.
- Aucun affichage, style, texte, icône, barre ou pourcentage de Stabilité.

## Fichiers

### Créés

- `src/gameplay/nyrStability.js`
- `tests/automated/pack20Stability.test.mjs`
- `docs/checkpoints/CHECKPOINT_PACK_20.md`

### Modifiés

- `src/main.js`
- `README.md`

## Validation fonctionnelle

- Lancement : Stabilité = 100 — **PASS**.
- Après 1 absorption et croissance : 100 — **PASS**.
- Après 20 absorptions et passage Spectre : 100 — **PASS**.
- Après 24 absorptions : 100 — **PASS**.
- Pendant le fondu déclenché à la 25e absorption : 100 — **PASS**.
- Après la seconde complète de fondu et l’arrivée visuelle en Zone 2 : 100 — **PASS**.
- Après 26 absorptions : 100 — **PASS**.
- Score final de contrôle à 2600, sans effet sur la Stabilité — **PASS**.

## Fréquence, affichage et suspension

- 30, 60 et 120 Hz : Stabilité toujours égale à 100 — **PASS**.
- DPR 1 et DPR 2 : Stabilité toujours égale à 100 — **PASS**.
- Portrait simulé pendant le fondu : Stabilité et transition strictement figées — **PASS**.
- Reprise paysage et fin du fondu : Stabilité toujours égale à 100 — **PASS**.
- Resize sans voie de modification de Stabilité — **PASS**.
- Aucun élément contenant « Stabilité » dans `index.html`, le CSS ou les composants UI — **PASS**.
- Aucun changement visuel : fichiers de fond, parallaxe, rendu, CSS et HUD identiques au PACK 19 — **PASS**.

## Validation technique

- Configuration `NYR_STABILITY_CONFIG` gelée — **PASS**.
- L’objet de Stabilité n’expose que `snapshot` — **PASS**.
- Syntaxe de tous les modules JavaScript — **PASS**.
- Tests automatisés PACKS 17, 18, 19 et 20 — **PASS**.
- Chargement HTTP local de la page, du CSS, du module Stabilité, de la transition et des fonds Zone 1/2 : réponses 200 — **PASS**.
- Aucun chemin absolu, aucune URL `file://`, aucun CDN ajouté — **PASS**.

## Non-régression

Tous les acquis des PACKS 0 à 19 sont conservés : déplacement automatique, souris/tactile, virage progressif, six Fragments normaux et leur respawn, croissance exacte de +1 segment, score de +100 et son HUD, Spectre à 20, passage interne en Zone 2 à 25, fondu Zone 1 vers Zone 2 d’une seconde active, quatre couches de parallaxe, corps organique, flash de 0,36 s et suspension portrait réelle.

## Hors périmètre confirmé

Aucune perte ou récupération de Stabilité, collision obstacle/corps, corruption, Fragment pur, gros danger, dégâts, invulnérabilité, cooldown, mort, game over, reset, obstacle actif, collectible supplémentaire, danger, HUD supplémentaire, Zone 3/4, changement de fond/transition/vitesse/rotation/contrôles/croissance, record, combo, multiplicateur, Dash, audio, CJ, profil, sauvegarde, réseau, multijoueur, GitHub ou déploiement n’a été ajouté.

**Arrêt strict après PACK 20. PACK 21 non commencé.**
