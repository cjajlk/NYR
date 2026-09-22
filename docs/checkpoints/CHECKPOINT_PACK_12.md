# CHECKPOINT — PACK 12 — Parallaxe étoiles lointaines

Date : 2026-09-10  
État : **TERMINÉ ET VALIDÉ**  
Pack suivant : **PACK 13 NON COMMENCÉ**

## Périmètre réalisé

- Intégration de `assets/images/parallax/NYR_PARALLAX_STARS_FAR_V1.png` comme première et unique couche de parallaxe.
- Ordre de rendu confirmé : fond réel Zone 1, étoiles lointaines, six Fragments normaux, Nyr et flash d’absorption.
- Déplacement cyclique volontairement discret : amplitude horizontale de 8 px, amplitude verticale de 4 px, cycle de 40 s et opacité de 0,30.
- Le temps du parallaxe n’avance que par le `deltaSeconds` de la boucle de simulation active.
- En portrait mobile suspendu, la couche reste exactement figée ; la première image après reprise ne reçoit aucun temps suspendu et ne produit aucun saut.
- Le rendu utilise le même calcul `cover` centré que le fond Zone 1, sans déformation.
- Tant que l’image n’est pas prête, ou si son chargement échoue, la couche reste simplement masquée : le fond Zone 1 et le gameplay continuent de fonctionner.

## Fichiers

### Créés

- `src/core/farStarsParallax.js`
- `docs/checkpoints/CHECKPOINT_PACK_12.md`

### Modifiés

- `src/main.js`
- `README.md`

### Asset utilisé sans modification

- `assets/images/parallax/NYR_PARALLAX_STARS_FAR_V1.png`

## Validation fonctionnelle et visuelle

- Desktop paysage 1366 × 768 : **PASS**.
- Mobile paysage 844 × 390 : **PASS**.
- Mobile portrait 390 × 844 : **PASS**, runtime suspendu et parallaxe figé.
- DPR 1 et DPR 2 : **PASS**, géométrie CSS identique et canvas correctement redimensionné.
- 30, 60 et 120 Hz : **PASS**. Après 12 s actives, les trois simulations donnent exactement `x = 7,608452`, `y = -1,236068`.
- Deux cycles portrait/reprise : **PASS**, aucune avance pendant la suspension et aucun saut à la reprise.
- Rendu canvas réel contrôlé en 1366 × 768 et 844 × 390 : **PASS**.
- Fond réel Zone 1 toujours visible, en cover centré et sans déformation : **PASS**.
- Six Fragments normaux, Nyr Éclat/Spectre et flash d’absorption toujours lisibles : **PASS**.
- Seuil 19 → 20 : **PASS** ; 23 segments en Éclat puis 24 segments en Spectre.
- Flash d’absorption conservé à 0,36 s de temps actif : **PASS**.
- Chargement local HTTP : **22/22 ressources accessibles**, sans erreur.
- Syntaxe de tous les modules JavaScript : **PASS**.
- Aucun chemin absolu, aucune URL `file://`, aucun CDN : **PASS**.

## Non-régression

Les acquis des PACKS 0 à 11 restent inchangés : fond Zone 1 et fallback, déplacement automatique, souris/tactile, virage progressif, six Fragments normaux, croissance exacte de +1 segment, suivi du corps indépendant du FPS, compteur interne, Spectre à 20 absorptions, corps organique, flash de 0,36 s et suspension portrait réelle.

Les constantes de gameplay existantes restent inchangées, notamment la vitesse de 95 px/s, la rotation progressive de `π × 0,9` rad/s et l’espacement de 14 px.

## Hors périmètre confirmé

Aucune brume ou nébuleuse parallaxe, particule proche, astéroïde décoratif, autre zone, transition, obstacle, danger, collectible supplémentaire, score, HUD, Dash, stabilité, dégâts, mort, changement de vitesse/rotation/contrôles/croissance, audio, CJ, profil, sauvegarde, réseau, multijoueur, GitHub ou déploiement n’a été ajouté.

**Arrêt strict après PACK 12. PACK 13 non commencé.**
