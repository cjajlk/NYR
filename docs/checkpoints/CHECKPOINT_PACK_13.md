# CHECKPOINT — PACK 13 — Parallaxe brume nébuleuse

Date : 2026-09-10  
État : **TERMINÉ ET VALIDÉ**  
Pack suivant : **PACK 14 NON COMMENCÉ**

## Périmètre réalisé

- Intégration de `assets/images/parallax/NYR_PARALLAX_NEBULA_MID_V1.png` comme deuxième couche de parallaxe.
- Conservation sans modification de la couche d’étoiles lointaines du PACK 12.
- Ordre de rendu confirmé : fond réel Zone 1, étoiles lointaines, brume nébuleuse, six Fragments normaux, Nyr et flash d’absorption.
- Déplacement cyclique calme et discret : amplitude horizontale de 6 px, amplitude verticale de 3 px, cycle de 56 s et opacité de 0,12.
- Le temps de la nébuleuse n’avance que par le `deltaSeconds` de la boucle de simulation active.
- En portrait mobile suspendu, les étoiles et la nébuleuse restent exactement figées ; la première image après reprise ne reçoit aucun temps suspendu et ne produit aucun saut.
- Le rendu utilise le calcul `cover` centré existant, sans déformation.
- Tant que l’image n’est pas prête, ou si son chargement échoue, la nébuleuse reste simplement masquée : le fond, les étoiles et le gameplay continuent de fonctionner.

## Fichiers

### Créés

- `src/core/midNebulaParallax.js`
- `docs/checkpoints/CHECKPOINT_PACK_13.md`

### Modifiés

- `src/main.js`
- `README.md`

### Asset utilisé sans modification

- `assets/images/parallax/NYR_PARALLAX_NEBULA_MID_V1.png`

## Validation fonctionnelle et visuelle

- Desktop paysage 1366 × 768 : **PASS**.
- Mobile paysage 844 × 390 : **PASS**.
- Mobile portrait 390 × 844 : **PASS**, runtime suspendu et deux couches de parallaxe figées.
- DPR 1 et DPR 2 : **PASS**, géométrie CSS identique et canvas correctement redimensionné.
- 30, 60 et 120 Hz : **PASS**. Après 12 s actives, les trois simulations de nébuleuse donnent exactement `x = 5,849567`, `y = -0,667563`.
- Deux cycles portrait/reprise : **PASS**, aucune avance pendant la suspension et aucun saut des étoiles ou de la nébuleuse à la reprise.
- Rendu canvas réel contrôlé en 1366 × 768 et 844 × 390 : **PASS**.
- Fond réel Zone 1 toujours visible, en cover centré et sans déformation : **PASS**.
- Étoiles lointaines toujours visibles : **PASS**.
- Nébuleuse visible mais discrète : **PASS**.
- Six Fragments normaux, Nyr Éclat/Spectre et flash d’absorption toujours lisibles : **PASS**.
- Seuil 19 → 20 : **PASS** ; 23 segments en Éclat puis 24 segments en Spectre.
- Flash d’absorption conservé à 0,36 s de temps actif : **PASS**.
- Chargement local HTTP : **24/24 ressources accessibles**, sans erreur.
- Syntaxe de tous les modules JavaScript : **PASS**.
- Aucun chemin absolu, aucune URL `file://`, aucun CDN : **PASS**.

## Non-régression

Les acquis des PACKS 0 à 12 restent inchangés : fond Zone 1 et fallback, déplacement automatique, souris/tactile, virage progressif, six Fragments normaux, croissance exacte de +1 segment, suivi du corps indépendant du FPS, compteur interne, Spectre à 20 absorptions, corps organique, flash de 0,36 s, suspension portrait réelle et parallaxe d’étoiles lointaines.

Les constantes de gameplay existantes restent inchangées, notamment la vitesse de 95 px/s, la rotation progressive de `π × 0,9` rad/s et l’espacement de 14 px.

## Hors périmètre confirmé

Aucune particule proche, aucun astéroïde décoratif, autre zone, transition, obstacle, danger, collectible supplémentaire, score, HUD, record, combo, multiplicateur, Dash, stabilité, dégâts, mort, game over, changement de vitesse/rotation/contrôles/croissance/seuil, audio, CJ, profil, sauvegarde, réseau, multijoueur, GitHub ou déploiement n’a été ajouté.

**Arrêt strict après PACK 13. PACK 14 non commencé.**
