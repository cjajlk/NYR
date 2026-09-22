# CHECKPOINT — PACK 14 — Parallaxe particules proches

Date : 2026-09-10  
État : **TERMINÉ ET VALIDÉ**  
Pack suivant : **PACK 15 NON COMMENCÉ**

## Périmètre réalisé

- Intégration de `assets/images/parallax/NYR_PARALLAX_PARTICLES_NEAR_V1.png` comme troisième couche de parallaxe.
- Conservation sans modification des étoiles lointaines du PACK 12 et de la brume nébuleuse du PACK 13.
- Ordre de rendu confirmé : fond réel Zone 1, étoiles lointaines, brume nébuleuse, particules proches, six Fragments normaux, Nyr et flash d’absorption.
- Déplacement cyclique légèrement plus perceptible mais calme : amplitude horizontale de 12 px, amplitude verticale de 7 px, cycle de 32 s et opacité de 0,07.
- La densité naturelle de l’asset est contenue par une opacité très faible afin de préserver la lisibilité.
- Le temps des particules n’avance que par le `deltaSeconds` de la boucle de simulation active.
- En portrait mobile suspendu, les trois couches restent exactement figées ; la première image après reprise ne reçoit aucun temps suspendu et ne produit aucun saut.
- Le rendu utilise le calcul `cover` centré existant, sans déformation.
- Tant que l’image n’est pas prête, ou si son chargement échoue, les particules restent simplement masquées : le fond, les autres couches et le gameplay continuent de fonctionner.

## Fichiers

### Créés

- `src/core/nearParticlesParallax.js`
- `docs/checkpoints/CHECKPOINT_PACK_14.md`

### Modifiés

- `src/main.js`
- `README.md`

### Asset utilisé sans modification

- `assets/images/parallax/NYR_PARALLAX_PARTICLES_NEAR_V1.png`

## Validation fonctionnelle et visuelle

- Desktop paysage 1366 × 768 : **PASS**.
- Mobile paysage 844 × 390 : **PASS**.
- Mobile portrait 390 × 844 : **PASS**, runtime suspendu et trois couches de parallaxe figées.
- DPR 1 et DPR 2 : **PASS**, géométrie CSS identique et canvas correctement redimensionné.
- 30, 60 et 120 Hz : **PASS**. Après 12 s actives, les trois simulations de particules donnent exactement `x = -8,485281`, `y = -4,949747`.
- Deux cycles portrait/reprise : **PASS**, aucune avance pendant la suspension et aucun saut des trois couches à la reprise.
- Rendu canvas réel contrôlé en 1366 × 768 et 844 × 390 : **PASS**.
- Fond réel Zone 1, étoiles lointaines et nébuleuse toujours visibles : **PASS**.
- Particules proches visibles mais très discrètes : **PASS**.
- Six Fragments normaux, Nyr Éclat/Spectre et flash d’absorption parfaitement lisibles : **PASS**.
- Seuil 19 → 20 : **PASS** ; 23 segments en Éclat puis 24 segments en Spectre.
- Flash d’absorption conservé à 0,36 s de temps actif : **PASS**.
- Chargement local HTTP : **26/26 ressources accessibles**, sans erreur.
- Syntaxe de tous les modules JavaScript : **PASS**.
- Aucun chemin absolu, aucune URL `file://`, aucun CDN : **PASS**.

## Non-régression

Les acquis des PACKS 0 à 13 restent inchangés : déplacement automatique, souris/tactile, virage progressif, six Fragments normaux, croissance exacte de +1 segment, suivi du corps indépendant du FPS, compteur interne, Spectre à 20 absorptions, corps organique, flash de 0,36 s, suspension portrait réelle, fond Zone 1 et ses deux premières couches de parallaxe.

Les constantes de gameplay existantes restent inchangées, notamment la vitesse de 95 px/s, la rotation progressive de `π × 0,9` rad/s et l’espacement de 14 px.

## Hors périmètre confirmé

Aucun astéroïde décoratif, autre zone, transition, obstacle, danger, collectible supplémentaire, score, HUD, record, combo, Dash, stabilité, dégâts, mort, changement de vitesse/rotation/contrôles/croissance/seuil, audio, CJ, profil, sauvegarde, réseau, multijoueur, GitHub ou déploiement n’a été ajouté.

**Arrêt strict après PACK 14. PACK 15 non commencé.**
