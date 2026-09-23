# CHECKPOINT — PACK 25 — Viewport mobile dynamique

Date : 2026-09-23
État : correctif après échec téléphone, PASS automatisé ; nouveau test CJ requis.

## Base contrôlée

Dépôt cjajlk/NYR, branche main. Après fetch, HEAD = origin/main =
`06e52763c17e429635c45eb82d0a789441c0b80c`.
Working tree initial propre. PACKS 17 à 24 : 8 PASS, 0 échec.

## Problème et périmètre

CJ observe sur téléphone paysage une surface de jeu réduite par les barres du
navigateur. Le CSS donnait priorité à 100svh : la petite hauteur restait utilisée
même après repli des barres. Ce pack exploite la hauteur disponible ; il ne force
pas la disparition des barres et ne fournit aucun plein écran.

## CSS avant / après

- Ordre de repli : vh, puis svh, puis dvh. Les navigateurs compatibles donnent
  priorité à dvh ; les autres conservent la dernière déclaration reconnue.
- Body, app-shell et hauteur du conteneur utilisent cette cascade.
- En paysage avec hauteur <= 420 px : padding vertical de 0.5rem à 0.125rem ;
  hauteur du conteneur de viewport - 1rem à viewport - 0.25rem.
  À une taille racine de 16 px, cela récupère 12 px verticaux supplémentaires.
- Padding horizontal, bordure, arrondis et identité visuelle conservés.
  Overflow hidden et min-height: 0 de la règle paysage conservés.

## Redimensionnement

getBoundingClientRect du conteneur reste la source finale. Aucune dimension du
monde n'est lue depuis visualViewport ou screen.height.

resize, orientationchange et visualViewport.resize (si disponible) utilisent le
même gestionnaire. Celui-ci synchronise immédiatement la suspension portrait et
pose un drapeau. La boucle existante traite ce drapeau une fois avant update, ou
dans render si la simulation est suspendue. Aucun ordonnanceur ou polling ajouté.

Le gestionnaire de canvas mémorise largeur, hauteur et DPR : aucune réécriture du
bitmap si ces valeurs sont identiques. La revalidation existante des fragments et
de l'astéroïde n'est appelée que si les dimensions changent et le runtime est actif.
Game Over et portrait continuent à bloquer la simulation indépendamment du rendu.

## Protection contre le saut de Nyr

Le premier PACK 25 empêchait le recentrage sur une tête déjà hors du nouveau
cadre, sans la réinscrire dans ce cadre. Cela laissait Nyr hors champ : cet état
n'est plus accepté. Voir la correction de rotation ci-dessous.

## Fichiers modifiés / ajoutés

- assets/css/main.css
- src/core/displayManager.js
- src/main.js
- src/gameplay/nyrMovement.js : protection technique contre le recentrage au resize.
- tests/automated/pack25DynamicViewport.test.mjs
- docs/checkpoints/CHECKPOINT_PACK_25.md

## Tests

`node --test tests/automated/*.test.mjs` : **9 PASS, 0 échec**, PACKS 17 à 25.

PACK 25 vérifie la cascade CSS et ses replis, les marges paysage et le cadre.
Le test exécute le vrai main et ses modules dans six sessions indépendantes :
30/60/120 Hz, avec et sans visualViewport. DOM, mesures de conteneur et dessin sont
simulés. Une insertion en mémoire expose les objets existants pour observation,
sans fichier auxiliaire ni interface de debug ajoutée en production.

Scénarios : changements successifs de hauteur ; trois événements regroupés en
une mesure ; événement visualViewport seul ; dimensions provenant exclusivement
du conteneur ; bitmap inchangé à taille identique ; snapshots gameplay inchangés
par les resizes de contrôle ; portrait immédiatement suspendu ; retour paysage
avec baseline temporelle sans rattrapage ; contact fatal raccordé par main puis
redimensionnements et rotations avec Game Over toujours verrouillé.

Un test ciblé à chaque fréquence vérifie maintenant qu'une réduction conserve
la tête visible par translation minimale, sans recentrage ni reset, et qu'un
vrai franchissement ultérieur conserve le garde-fou technique.

## Limites de validation et exclusions

Les tests ne simulent pas le moteur de layout CSS ni les barres natives mobiles.
Une validation réelle sur Chrome Android et Safari iPhone reste nécessaire :
barres ouvertes/repliées, changements répétés de hauteur, absence de scroll
parasite, portrait/paysage et rotations après Game Over.

Aucun bouton, Fullscreen API, verrouillage d'orientation, PWA, manifest, service
worker, nouvelle UI ou règle de dégâts/score/fragments/Spectre ajouté. Aucun autre
projet modifié. PACK 26 non commencé.

## Correctif après échec réel Android

Le PACK 25 initial a été publié sous `8bb0d21e80d706e11968b4f376ab7f6a337cf88d`.
C'est le HEAD réel de départ du correctif, sur main avec état initial propre.
`06e52763c17e429635c45eb82d0a789441c0b80c` reste la base historique PACK 24.
Aucun retour arrière, commit ou push effectué pour ce correctif.

### Cause reproduite

Le canvas était redimensionné mais les coordonnées de Nyr ne l'étaient pas.
Le démarrage portrait initialisait notamment la tête à mi-hauteur portrait,
potentiellement sous le bas du futur paysage. Le garde-fou anti-recentrage du
PACK 25 la laissait ensuite hors champ. L'ancien test vérifiait justement cette
conservation hors champ au lieu d'exiger la visibilité : il a été corrigé.

Autre défaut reproduit : le seuil mobile de 600 px laissait fonctionner le jeu
en portrait quand les dimensions CSS dépassaient ce seuil. Enfin, les dimensions
de window peuvent annoncer paysage avant que le conteneur ait fini sa rotation.
L'ordre exact des événements sur le téléphone de CJ n'a pas été enregistré ;
ces trois chemins sont désormais reproduits en test, sans prétendre à une trace
du téléphone réel.

### Correction retenue

- Aucune initialisation de la partie avant un premier paysage valide.
- Portrait suspendu sans seuil de largeur ; reprise seulement si window ET le
  conteneur mesuré sont en paysage. Les événements ne reprennent jamais eux-mêmes
  le runtime ; la synchronisation du conteneur décide de la reprise.
- Conservation des dernières dimensions jouables, sans remplacer cette référence
  par les dimensions portrait intermédiaires.
- Si la tête dépasse la nouvelle zone intérieure, clamp au point le plus proche,
  avec marge technique de 24 px. Si elle est déjà à l'intérieur, déplacement nul.
- Translation identique de la tête, de tout l'historique du corps, des fragments
  et de l'astéroïde actif : aucune compression, aucune modification des distances
  de collision, de la vitesse, du cap, du temps ou du nombre de segments.
- Les objets hors cadre utilisent ensuite leur revalidation sûre existante.
  Aucun appel de collecte ou de dégâts lors de cette adaptation.
- Game Over conserve son verrou ; aucun repositionnement de simulation après la
  fin. Une frame qui vient d'être suspendue pendant la synchronisation ne poursuit
  pas update. La reprise rétablit une baseline temporelle sans rattrapage.

Il s'agit d'une adaptation de coordonnées au nouveau cadre, pas d'une animation
de déplacement ni d'un reset vers le centre. Le corps conserve sa géométrie ;
les parties d'une longue traîne déjà hors champ ne sont pas comprimées pour tenir.
Le CSS dvh et displayManager restent inchangés par ce correctif.

### Fichiers du correctif

- src/main.js
- src/gameplay/nyrMovement.js
- src/gameplay/fragmentSystem.js
- src/gameplay/mobileAsteroidSystem.js
- tests/automated/pack25DynamicViewport.test.mjs
- docs/checkpoints/CHECKPOINT_PACK_25.md

### Validation renforcée

PACK 25 : neuf sessions isolées, 30/60/120 Hz avec visualViewport présent, absent,
ou lancement portrait. Rotations paysage -> portrait suspendu -> portrait de
grandes dimensions CSS -> paysage annoncé avant la fin du layout -> paysage
final, notamment 800x360, 956x440 et 740x260.

Assertions : tête dans les limites avec 24 px de marge ; conservation rigide du
corps ; aucun reset, score, absorption ou dégât ajouté ; contact astéroïde déjà
en cours conservé sans second dégât ; frames de reprise sans saut temporel ;
Game Over inchangé après les rotations. Les surfaces navigateur et dimensions
du conteneur restent simulées ; un nouveau test réel Android par CJ est requis.

Résultat PACKS 17 à 25 : **9 PASS, 0 échec**. Correctif non publié.
