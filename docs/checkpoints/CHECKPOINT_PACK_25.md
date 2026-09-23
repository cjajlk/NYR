# CHECKPOINT — PACK 25 — Viewport mobile dynamique

Date : 2026-09-23
État : PASS technique, validation réelle téléphone nécessaire, avant commit/push.

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

Le garde-fou technique de recentrage du prototype pouvait réinitialiser la position
à la frame suivant une réduction de hauteur laissant la tête hors du cadre.
Il ne se déclenche désormais que lorsqu'un déplacement franchit effectivement
une limite, en comparant les positions avant et après le pas. Une tête déjà hors
du nouveau cadre n'est pas téléportée par le resize ; elle peut momentanément
rester hors champ. Un franchissement ultérieur d'une autre limite conserve le
recentrage technique existant. Vitesse, virage, croissance et suivi inchangés.

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

Un test ciblé à chaque fréquence vérifie aussi qu'une réduction plaçant Nyr hors
du cadre ne le recentre pas, et qu'un vrai franchissement ultérieur conserve le
garde-fou technique.

## Limites de validation et exclusions

Les tests ne simulent pas le moteur de layout CSS ni les barres natives mobiles.
Une validation réelle sur Chrome Android et Safari iPhone reste nécessaire :
barres ouvertes/repliées, changements répétés de hauteur, absence de scroll
parasite, portrait/paysage et rotations après Game Over.

Aucun bouton, Fullscreen API, verrouillage d'orientation, PWA, manifest, service
worker, nouvelle UI ou règle de dégâts/score/fragments/Spectre ajouté. Aucun autre
projet modifié. Aucun commit/push ; PACK 26 non commencé.
