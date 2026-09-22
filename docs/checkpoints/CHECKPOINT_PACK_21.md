# CHECKPOINT — PACK 21 — Premier Astéroïde mobile de Zone 2

Date : 2026-09-10  
État : **TERMINÉ ET VALIDÉ**  
Pack suivant : **PACK 22 NON COMMENCÉ**

## Périmètre réalisé

- Création de `src/gameplay/mobileAsteroidSystem.js` pour l’activation, le déplacement, le respawn sûr et la détection de contact.
- Création de `src/gameplay/mobileAsteroidRenderer.js` pour un rendu canvas provisoire, explicitement non final.
- Aucun Astéroïde mobile actif en Zone 1.
- Activation d’un unique Astéroïde lorsque `currentZone` passe à `zone-2` à la 25e absorption.
- Déclenchement fondé exclusivement sur l’état de zone existant ; aucun accès au score ou au nombre de segments.
- Déplacement rectiligne lent, fondé uniquement sur le temps de simulation active.
- Respawn hors d’un autre bord après sortie complète, avec sélection du meilleur dégagement par rapport à la tête et aux Fragments.
- Détection séparée du rendu et limitée à la tête de Nyr.
- Signal unique à l’entrée en contact, verrouillé pendant le maintien, réarmé après séparation.
- Aucun effet associé au contact : Stabilité, score, mouvement et Astéroïde restent inchangés.

## Réglages provisoires centralisés

- Vitesse : `42 px/s`.
- Rayon visuel et hitbox Astéroïde : `24 px`.
- Marge de spawn hors écran : `36 px`.
- Rayon de hitbox de la tête : `17 px`.
- Distance minimale de spawn avec la tête : `120 px`.
- Distance minimale de spawn avec un Fragment : `64 px`.

## Fichiers

### Créés

- `src/gameplay/mobileAsteroidSystem.js`
- `src/gameplay/mobileAsteroidRenderer.js`
- `tests/automated/pack21MobileAsteroid.test.mjs`
- `docs/checkpoints/CHECKPOINT_PACK_21.md`

### Modifiés

- `src/main.js`
- `README.md`

## Validation d’activation et de mouvement

- 0 à 24 absorptions : aucun Astéroïde actif — **PASS**.
- 24 → 25 : premier et unique Astéroïde activé par la Zone 2 — **PASS**.
- 26 absorptions et au-delà : toujours un seul Astéroïde géré — **PASS**.
- Déplacement après une seconde active : exactement 42 px à 30, 60 et 120 Hz — **PASS**.
- DPR 1 et DPR 2 : logique et distance identiques — **PASS**.
- Spawn initial hors surface, éloigné de la tête et des Fragments — **PASS**.
- Aucun Astéroïde supplémentaire ni multiplication progressive — **PASS**.

## Validation des collisions

- Premier contact tête/Astéroïde : exactement 1 signal — **PASS**.
- Contact maintenu sur la frame suivante : toujours 1 signal — **PASS**.
- Séparation : verrou de contact réarmé — **PASS**.
- Second contact après séparation : exactement un deuxième signal — **PASS**.
- Point du corps posé sur l’Astéroïde avec tête éloignée : aucun signal — **PASS**.
- Collision : Stabilité strictement égale à 100 — **PASS**.
- Collision : score strictement inchangé — **PASS**.
- Aucun dégât, invulnérabilité, cooldown, flash, recul, destruction, mort ou game over — **PASS**.

## Suspension et formats

- Desktop 1366 × 768, DPR 1/2 : activation, mouvement et rendu — **PASS**.
- Mobile paysage 844 × 390, DPR 1/2 : activation, mouvement et rendu — **PASS**.
- Portrait 390 × 844, DPR 1/2 : position, collision et état strictement figés — **PASS**.
- Suspension portrait simulée pendant trois secondes : aucune avance, aucun respawn et aucun signal — **PASS**.
- Reprise : continuation depuis la position exacte, sans saut ni faux contact — **PASS**.

## Validation visuelle

- Rendu canvas provisoire : roche astrale sombre, forme irrégulière, contour cyan et lueur violette discrète — **PASS**.
- Contrôle réel avec Zone 2, quatre parallaxes, six Fragments, Nyr Spectre, flash et score sur desktop et mobile paysage — **PASS**.
- Taille lisible sans être dominante ; Nyr, Fragments et HUD restent lisibles — **PASS**.
- Aucun panneau, texte ou debug visible — **PASS**.
- `assets/images/hazards/NYR_HAZARD_ASTEROIDE_V1.png` non importé et non utilisé — **PASS**.

## Validation technique et non-régression

- Absorption de Fragment, croissance et score existants conservés — **PASS**.
- Spectre à 20, Zone 2 à 25 et fondu d’une seconde conservés — **PASS**.
- Stabilité interne toujours égale à 100 — **PASS**.
- Tests automatisés PACKS 17, 18, 19, 20 et 21 — **PASS**.
- Syntaxe de tous les modules JavaScript — **PASS**.
- Chargement HTTP local de la page, du CSS et de tous les modules nouveaux ou raccordés : réponses 200 — **PASS**.
- Aucun chemin absolu, aucune URL `file://`, aucun CDN ajouté — **PASS**.

Tous les acquis des PACKS 0 à 20 sont conservés. Aucune corruption, Fragment pur, autre danger, autre collectible, Zone 3/4, Dash, combo, record, multiplicateur, audio, CJ, profil, sauvegarde, réseau, multijoueur, GitHub ou déploiement n’a été ajouté.

**Arrêt strict après PACK 21. PACK 22 non commencé.**
