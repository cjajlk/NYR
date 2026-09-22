# CHECKPOINT — PACK 19 — Transition visuelle vers la Zone 2

Date : 2026-09-10  
État : **TERMINÉ ET VALIDÉ**  
Pack suivant : **PACK 20 NON COMMENCÉ**

## Périmètre réalisé

- Création du module isolé `src/core/zoneBackgroundTransition.js`.
- Préchargement immédiat du fond `assets/images/zones/NYR_ZONE_02_NEBULEUSE_V1.png` au démarrage.
- Zone 1 affichée de 0 à 24 absorptions.
- Le signal interne unique de Zone 2 validé au PACK 18 déclenche le fondu à la 25e absorption réelle.
- Fondu croisé sans écran noir : Zone 1 reste la base opaque tandis que Zone 2 apparaît progressivement.
- Durée provisoire centralisée à `1` seconde dans `ZONE_BACKGROUND_TRANSITION_CONFIG`.
- À la fin du fondu, Zone 2 est opaque et reste active à 26 absorptions et au-delà.
- Aucun accès au score, au nombre de segments ou au compteur d’absorptions dans le module visuel.
- Les quatre parallaxes, les Fragments, Nyr et le flash restent rendus après les fonds ; le score DOM reste au-dessus du canvas.

## Fichiers

### Créés

- `src/core/zoneBackgroundTransition.js`
- `tests/automated/pack19ZoneBackgroundTransition.test.mjs`
- `docs/checkpoints/CHECKPOINT_PACK_19.md`

### Modifiés

- `src/main.js`
- `README.md`

## Validation fonctionnelle

- 24 absorptions : Zone 1 visible et aucune transition — **PASS**.
- 24 → 25 : transition déclenchée exactement une fois — **PASS**.
- Fin du fondu : Zone 2 visible à 100 % — **PASS**.
- 26 absorptions : Zone 2 conservée, aucun second déclenchement — **PASS**.
- Scores 2400, 2500 et 2600 inchangés — **PASS**.
- Spectre déjà actif au déclenchement et conservé — **PASS**.
- Déclenchement exclusivement reçu depuis l’état Zone 2 du PACK 18 — **PASS**.

## Temps actif et suspension

- Durée logique : exactement 1 seconde de simulation active à 30, 60 et 120 Hz — **PASS**.
- Portrait engagé à 40 % du fondu et maintenu trois secondes : temps et progression visuelle strictement figés — **PASS**.
- Reprise paysage : continuation au même point jusqu’à 100 %, sans saut — **PASS**.
- Aucun appel de mise à jour du fondu lorsque la boucle est suspendue — **PASS**.
- DPR 1 et DPR 2 : mêmes seuil, progression et durée logique — **PASS**.

## Validation visuelle

- Desktop 1366 × 768 : contrôle du fondu à 50 % avec fonds réels et décor complet — **PASS**.
- Mobile paysage 844 × 390, DPR 2 : contrôle du fondu à 50 % — **PASS**.
- Zone 2 en `cover` centré, sans déformation ; largeur et hauteur couvrent toujours la surface — **PASS**.
- Sources Zone 1 et Zone 2 vérifiées : 1672 × 941 chacune — **PASS**.
- Nyr Spectre, six Fragments, flash et score restent lisibles pendant le fondu — **PASS**.
- Ordre conservé : fonds, étoiles, nébuleuse, particules, astéroïdes décoratifs, Fragments, Nyr/flash, score — **PASS**.
- Aucun nouveau réglage de parallaxe — **PASS**.

## Repli et chargement

- Échec simulé du chargement Zone 2 : Zone 1 reste affichée et jouable — **PASS**.
- Dans ce repli, la progression interne demeure Zone 2 et le fondu visuel reste à 0 — **PASS**.
- Aucun blocage, aucune coupure noire et aucun rendu partiel de l’image absente — **PASS**.
- Chargement HTTP local de la page, des modules, des deux fonds et du CSS : réponses 200 — **PASS**.
- Syntaxe de tous les modules JavaScript : **PASS**.
- Tests automatisés PACKS 17, 18 et 19 : **PASS**.
- Aucun chemin absolu, aucune URL `file://`, aucun CDN ajouté — **PASS**.

## Non-régression

Tous les acquis des PACKS 0 à 18 sont conservés : déplacement automatique, souris/tactile, virage progressif, six Fragments normaux et leur respawn, croissance exacte de +1 segment, score de +100 et son HUD, Spectre à 20, passage interne en Zone 2 à 25, corps organique, flash de 0,36 s, suspension portrait réelle, fond Zone 1 et quatre couches de parallaxe.

## Hors périmètre confirmé

Aucun obstacle Zone 2, corruption, danger, collectible, Zone 3/4, changement de vitesse/contrôle/rotation/croissance, HUD supplémentaire, record, combo, multiplicateur, Dash, stabilité, dégâts, mort, game over, audio, CJ, profil, sauvegarde, réseau, multijoueur, GitHub, déploiement ou refonte d’architecture n’a été ajouté.

**Arrêt strict après PACK 19. PACK 20 non commencé.**
