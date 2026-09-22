# CHECKPOINT — PACK 18 — Détection interne de la Zone 2

Date : 2026-09-10  
État : **TERMINÉ ET VALIDÉ**  
Pack suivant : **PACK 19 NON COMMENCÉ**

## Périmètre réalisé

- Création du module isolé `src/gameplay/nyrZoneProgression.js`.
- État initial strictement fixé à `zone-1`.
- Passage interne à `zone-2` lorsque le compteur existant atteint 25 Fragments normaux absorbés.
- Déclenchement unique du signal de passage vers la Zone 2.
- La logique reçoit l’instantané renvoyé par `nyrProgression.js` après l’absorption réelle : elle ne duplique ni ne recalcule `normalFragmentsAbsorbed`.
- Le score et le nombre de segments ne sont jamais consultés par la progression de zone.
- Le module expose uniquement `currentZone` dans son instantané public.
- Aucun appel depuis la boucle temporelle, le resize, la suspension ou la reprise : aucun passage fantôme possible par ces chemins.

## Fichiers

### Créés

- `src/gameplay/nyrZoneProgression.js`
- `tests/automated/pack18ZoneProgression.test.mjs`
- `docs/checkpoints/CHECKPOINT_PACK_18.md`

### Modifiés

- `src/main.js`
- `README.md`

## Validation des seuils

- 0 Fragment normal : Zone 1 — **PASS**.
- 24 absorptions : Zone 1 — **PASS**.
- 24 → 25 : passage à la Zone 2 — **PASS**.
- 26 absorptions : Zone 2 conservée — **PASS**.
- Signal de passage en Zone 2 déclenché exactement une fois — **PASS**.
- 24 absorptions : score interne et affiché à 2400 — **PASS**.
- 25 absorptions : score interne et affiché à 2500 — **PASS**.
- 26 absorptions : score interne et affiché à 2600 — **PASS**.
- Spectre actif dès 20 absorptions, donc avant le seuil de Zone 2 — **PASS**.
- Signal Spectre toujours unique — **PASS**.

## Suspension et indépendance d’affichage

- 30, 60 et 120 Hz : résultat identique — **PASS**.
- DPR 1 et DPR 2 : résultat identique — **PASS**.
- Portrait simulé pendant trois secondes à chaque fréquence : zone et score strictement figés — **PASS**.
- Reprise avec resynchronisation du même instantané : aucun nouveau signal ni changement fantôme — **PASS**.
- Le fond rendu reste `NYR_ZONE_01_ESPACE_NOCTURNE_V1.png` — **PASS**.
- Aucun import ni usage de `NYR_ZONE_02_NEBULEUSE_V1.png` — **PASS**.
- Aucun changement visuel, CSS, HUD, fond, parallaxe ou effet — **PASS**.

## Validation technique

- Syntaxe de tous les modules JavaScript : **PASS**.
- Non-régression du test automatisé PACK 17 : **PASS**.
- Test automatisé PACK 18 : `node tests/automated/pack18ZoneProgression.test.mjs` — **PASS**.
- Chargement HTTP local de la page, du CSS, des modules de progression/score/zone et du fond Zone 1 : réponses 200 — **PASS**.
- Aucun chemin absolu, aucune URL `file://`, aucun CDN ajouté — **PASS**.

## Non-régression

Tous les acquis des PACKS 0 à 17 sont conservés : déplacement automatique, souris/tactile, virage progressif, six Fragments normaux et leur respawn, croissance exacte de +1 segment, score de +100 et son HUD, Spectre à 20, corps organique, flash de 0,36 s, suspension portrait réelle, fond Zone 1 et quatre couches de parallaxe.

## Hors périmètre confirmé

Aucun changement de fond, transition visuelle, fondu, effet, obstacle, corruption, danger, collectible, vitesse, contrôle, croissance, HUD supplémentaire, record, combo, multiplicateur, Dash, stabilité, dégâts, mort, game over, Zone 3/4, audio, CJ, profil, sauvegarde, réseau, multijoueur, GitHub ou déploiement n’a été ajouté.

**Arrêt strict après PACK 18. PACK 19 non commencé.**
