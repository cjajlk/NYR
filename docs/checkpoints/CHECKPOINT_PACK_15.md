# CHECKPOINT — PACK 15 — Parallaxe astéroïdes décoratifs

Date : 2026-09-10  
État : **TERMINÉ ET VALIDÉ**  
Pack suivant : **PACK 16 NON COMMENCÉ**

## Périmètre réalisé

- Intégration de `assets/images/parallax/NYR_PARALLAX_ASTEROIDS_DECOR_V1.png` comme quatrième couche de décor/parallaxe.
- Conservation sans modification du fond Zone 1, des étoiles lointaines, de la brume nébuleuse et des particules proches.
- Ordre de rendu confirmé : fond Zone 1, étoiles, nébuleuse, particules proches, astéroïdes décoratifs, six Fragments normaux, Nyr et flash d’absorption.
- Déplacement cyclique lent, légèrement plus perceptible que celui des particules : amplitude horizontale de 18 px, amplitude verticale de 10 px et cycle de 26 s.
- Opacité finale limitée à 0,10 après contrôle visuel afin de préserver une présence rare et discrète.
- La composition transparente de l’asset privilégie naturellement la périphérie de l’écran.
- Le temps des astéroïdes n’avance que par le `deltaSeconds` de la boucle de simulation active.
- En portrait mobile suspendu, les quatre couches restent exactement figées ; la première image après reprise ne reçoit aucun temps suspendu et ne produit aucun saut.
- Les astéroïdes sont une image décorative unique : aucune entité, aucun spawn, aucune collision, aucun dégât et aucune liaison avec la stabilité.
- Si l’image n’est pas prête ou si son chargement échoue, cette couche reste simplement masquée sans affecter les autres couches ni le gameplay.

## Fichiers

### Créés

- `src/core/decorativeAsteroidsParallax.js`
- `docs/checkpoints/CHECKPOINT_PACK_15.md`

### Modifiés

- `src/main.js`
- `README.md`

### Asset utilisé sans modification

- `assets/images/parallax/NYR_PARALLAX_ASTEROIDS_DECOR_V1.png`

## Validation fonctionnelle et visuelle

- Desktop paysage 1366 × 768 : **PASS**.
- Mobile paysage 844 × 390 : **PASS**.
- Mobile portrait 390 × 844 : **PASS**, runtime suspendu et quatre couches figées.
- DPR 1 et DPR 2 : **PASS**, géométrie CSS identique et canvas correctement redimensionné.
- 30, 60 et 120 Hz : **PASS**. Après 12 s actives, les trois simulations donnent exactement `x = 4,307682`, `y = 9,709418`.
- Deux cycles portrait/reprise : **PASS**, aucune avance pendant la suspension et aucun saut à la reprise.
- Rendu canvas réel contrôlé en 1366 × 768 et 844 × 390 : **PASS**.
- Priorité périphérique mesurée : somme alpha des bords égale à 4,746 fois celle de la zone centrale : **PASS**.
- Astéroïdes visibles mais discrets, principalement perceptibles aux bords : **PASS**.
- Fond Zone 1 et trois couches précédentes toujours visibles : **PASS**.
- Six Fragments normaux, Nyr Éclat/Spectre et flash d’absorption parfaitement lisibles : **PASS**.
- Seuil 19 → 20 : **PASS** ; 23 segments en Éclat puis 24 segments en Spectre.
- Flash d’absorption conservé à 0,36 s de temps actif : **PASS**.
- Chargement local HTTP : **28/28 ressources accessibles**, sans erreur.
- Syntaxe de tous les modules JavaScript : **PASS**.
- Aucun chemin absolu, aucune URL `file://`, aucun CDN : **PASS**.

## Non-régression

Les acquis des PACKS 0 à 14 restent inchangés : mouvement automatique, souris/tactile, virage progressif, six Fragments normaux, croissance exacte de +1 segment, suivi indépendant du FPS, compteur interne, Spectre à 20 absorptions, corps organique, flash de 0,36 s, suspension portrait réelle, fond Zone 1, étoiles, nébuleuse et particules proches à 7 % d’opacité.

Les constantes de gameplay existantes restent inchangées, notamment la vitesse de 95 px/s, la rotation progressive de `π × 0,9` rad/s et l’espacement de 14 px.

## Hors périmètre confirmé

Aucune autre zone, transition, obstacle réel, danger actif, collectible supplémentaire, score, HUD, record, combo, Dash, stabilité, dégâts, mort, game over, changement de vitesse/rotation/contrôles/croissance/seuil, audio, CJ, profil, sauvegarde, réseau, multijoueur, GitHub ou déploiement n’a été ajouté.

**Arrêt strict après PACK 15. PACK 16 non commencé.**
