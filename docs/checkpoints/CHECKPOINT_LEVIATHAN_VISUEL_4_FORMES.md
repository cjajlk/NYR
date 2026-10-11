# NYR — Correctif visuel Léviathan, quatre transformations

Date : 11 octobre 2026.
Statut : correctif appliqué, tests logiciels et contrôles visuels en navigateur terminés. Validation finale sur téléphone réel : CJ, en attente.
Branche : main. HEAD conservé : 422debeff482f4b669468ddc959cf19f0c6c4d00.
État initial : aucun fichier modifié ou non suivi. Aucun commit ni push effectué pour ce correctif.

## Diagnostic avant correction

Les 20 PNG ont été examinés individuellement et sur une planche d’ensemble : tête, trois écailles, queue, pour chacune des quatre formes. Les captures sur téléphone évoquées dans la demande n’étaient pas jointes ; le diagnostic repose sur les assets du dépôt et la reproduction du rendu existant.

Tous les fichiers sont RGBA et possèdent des pixels transparents (alpha minimum 0, maximum 252 ou 253). Leur boîte englobante à alpha non nul atteint les dimensions du PNG. Au seuil alpha 128, les marges sont généralement de 0 à 4 pixels : aucun grand cadre transparent ne justifie de découper les images. Les sources sont conservées sans modification.

Dimensions natives, en pixels :

| Transformation | Tête | Écaille 01 | Écaille 02 | Écaille 03 | Queue |
|---|---|---|---|---|---|
| Éclat | 80 × 96 | 118 × 140 | 119 × 143 | 97 × 128 | 168 × 201 |
| Spectre | 116 × 93 | 89 × 129 | 104 × 126 | 99 × 130 | 114 × 137 |
| Nocturne | 112 × 102 | 99 × 130 | 93 × 129 | 99 × 132 | 94 × 162 |
| Dévoreur | 135 × 106 | 97 × 131 | 104 × 131 | 105 × 135 | 102 × 175 |

Le rendu appliquait au Léviathan les réglages du Premier skin. Les premières têtes utilisaient une correction de -0.25 radian et un ancrage à 72 % de la largeur. Nocturne et Dévoreur partageaient -2.7 radians et un ancrage proche du bord gauche. Or les trois premières têtes regardent naturellement vers le bas-gauche ; Dévoreur regarde vers le bas-droite. Les queues n’ont pas non plus la même direction native ni le même point de raccord.

Le calcul de direction du moteur est correct : la tête reçoit `state.heading`, les segments reçoivent la tangente de la trajectoire retournée de π. L’erreur était dans les paramètres du dessin propres aux images. La mise à l’échelle existante conservait déjà le rapport largeur/hauteur : l’écrasement apparent venait surtout du mauvais axe, du mauvais ancrage et du chevauchement de pièces trop grandes pour l’espacement de 14 pixels.

## Corrections par transformation

Le nouveau profil définit des repères anatomiques mesurés sur chaque PNG. Chaque axe est calculé entre deux points propres à l’image. La tête est ancrée au milieu de son axe museau/nuque ; la queue à sa racine. Les trois écailles ont chacune leur propre calibration. Les nombres ci-dessous décrivent la correction ajoutée à l’orientation physique, et non une modification de cette orientation.

| Forme | Correction de tête | Ancrage tête X / Y | Longueur museau–nuque dessinée | Correction principale |
|---|---|---|---|---|
| Éclat | -128.96° | 36.25 % / 65.10 % | 34 px | Redressement du museau, recentrage du crâne, écailles de 20 px d’axe et queue raccordée à sa racine courbe. |
| Spectre | -144.46° | 37.50 % / 63.98 % | 38 px | Orientation propre à sa tête plus large ; suppression du décalage lié à l’ancrage à 72 % ; écailles de 22 px et queue avec un axe distinct d’Éclat. |
| Nocturne | -133.96° | 34.82 % / 62.75 % | 42 px | Ajustement du museau et de son centre, écailles de 24 px pour limiter le chevauchement et queue raccordée par sa racine supérieure. |
| Dévoreur | -33.69° | 63.70 % / 65.09 % | 46 px | Correction de l’inversion liée au profil des autres formes ; ancrage déplacé sur son crâne orienté à droite ; écailles de 26 px et queue recalibrée séparément. |

Les textures restent proportionnelles. La première écaille reste sur sa position physique existante ; sa texture et la nuque se chevauchent naturellement. Toutes les écailles suivent les tangentes déjà calculées dans les virages. La racine de la queue rejoint exactement la dernière pose du corps, avec sa pointe dirigée vers l’arrière.

## Fichiers du projet

| Fichier | Intervention |
|---|---|
| `src/gameplay/skinSprites.js` | Seul fichier de production préexistant modifié : sélection du profil uniquement pour `leviathan_astral`. Les réglages et chemins des autres skins restent ceux d’origine. |
| `src/gameplay/leviathanVisuals.js` | Ajout des 20 calibrations de dessin, calculées depuis les repères de chaque PNG. |
| `tests/automated/leviathanRendering.test.mjs` | Ajout des contrôles d’orientation, raccord, proportions, non-mutation de la simulation et non-régression des autres skins. |
| `tests/fixtures/leviathan_other_skin_render.json` | Référence des appels de dessin du Premier skin, capturée depuis le code antérieur à la correction. |
| `docs/checkpoints/CHECKPOINT_LEVIATHAN_VISUEL_4_FORMES.md` | Présent rapport et point de reprise. |

Une comparaison SHA-256 des sources et des assets avant/après confirme que seul `skinSprites.js` a changé parmi les fichiers existants de ces deux dossiers. Aucun PNG, aucune physique, commande, collision, Stabilité, progression, sauvegarde, prix, Boutique, fragment ou portail n’a été modifié. Les fichiers des modes existants, y compris le Mode Survie déjà présent dans HEAD, sont inchangés ; aucun travail sur Survie n’a été entrepris dans ce correctif. Le dossier `.git` est conservé intégralement.

## Tests et contrôles

Commande exécutée : `node --test tests/automated/*.test.mjs`.
Résultat : 37 suites réussies sur 37, aucune erreur.

Le test Léviathan vérifie 576 combinaisons : quatre transformations × huit directions × trois longueurs (4, 30, 120 segments) × six trajectoires (droite, gauche, droite, serré gauche, serré droite, changements de direction). Il contrôle l’axe du museau en coordonnées de dessin, la racine et l’axe de la queue, les proportions natives, les positions des segments et l’absence de modification de l’état de simulation. Les appels de dessin des quatre formes du Premier skin sont identiques à leur référence antérieure. Le skin Classique conserve son rendu de secours existant.

Contrôles visuels manuels dans le navigateur local :
- Comparaison avant/après des quatre transformations en déplacement horizontal.
- Inspection des quatre formes dans les huit orientations : horizontales, verticales et quatre diagonales.
- Corps courts, moyens et longs, courbes gauche/droite, virages serrés et changements de direction.
- Planche sur écran PC 1280 × 720 et aperçu à l’échelle de dessin du jeu en paysage simulé 667 × 375, avec prise en compte de la densité de pixels.
- Vérifications des raccords Éclat et Spectre à 4 segments, de Nocturne et Dévoreur à 120 segments, ainsi que des autres skins en paysage simulé.
- Aucun message d’erreur navigateur dans l’aperçu final.

Les aperçus utilisent les modules réels de mouvement et de rendu du dépôt, sans démarrer de partie ni accéder aux sauvegardes. Ils servent aux contrôles du dessin et ne sont pas intégrés à l’interface du jeu.

## Validation à réaliser par CJ

Les tests automatisés et le paysage simulé ne constituent pas une validation visuelle sur téléphone réel.

Sur téléphone, équiper Léviathan puis vérifier chacune des quatre transformations : museau orienté selon le déplacement réel, crâne centré, premier raccord continu, écailles suivant les deux sens de virage et queue attachée. Tester horizontal, vertical, diagonales, virages serrés, changements de direction et longueurs jusqu’à 120 segments. Refaire une vérification visuelle des autres skins. La validation finale appartient à CJ après ces essais.

Livraison : projet corrigé sur main, modifications laissées non commitées ; archive complète avec `.git`, rapport, journal de tests et captures de contrôle. Les fichiers originaux restent intacts.
