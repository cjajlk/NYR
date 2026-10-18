# NYR Combat V2 — Correction PACK 20

Date : 18 octobre 2026.

## Correction et validation

Référence initiale : 9d91bda94718d48bbd243b425b56b1af08be5dea, branche main. Les travaux locaux des Lots1 et2 ont été conservés. Ce rapport complète les rapports historiques des deux lots, notamment l'arrêt décrit dans RAPPORT_NYR_COMBAT_V2_LOT_2.md.

src/gameplay/nyrStability.js est restauré au contenu exact du HEAD initial. Son interface publique reste snapshot, applyAsteroidContact, applyPureFragment et applyCorruptionContact. Aucun changement du test historique PACK20, aucune méthode cachée ou non énumérable.

Dans l'orchestrateur isolé, applyParasiteContact est remplacé par applyCorruptionContact. Cette opération de Stabilité retire exclusivement20 points, avec plancher zéro, puis transmet before/after au callback général si une perte a réellement eu lieu. Elle ne déclenche pas d'entité corruption, de score, de recharge, d'audio, d'absorption ou de récompense. Aucun conflit de comportement n'a été identifié dans ce chemin.

Le contrôle de protection locale et externe, la consommation du contact avant dégât, les1,5s de récupération et le signal GameOver unique restent dans l'orchestrateur. L'opération de score parasite reste dédiée à75 points ; les quatre catégories historiques restent à50.

## Tests exécutés

- Passe ciblée PACK20, Lot1, Lot2 et CombatV1 : **11/11 fichiers de tests réussis**.
- Passe complète node --test tests/automated/*.test.mjs : **51/51 réussites, zéro échec, zéro ignoré**.
- Les tests historiques n'ont pas été désactivés ou affaiblis.
- Les tests du Lot2 vérifient les callbacks de dommage et le GameOver, l'absence de double dégât, la protection locale, la neutralisation prioritaire en cas d'égalité temporelle, la présentation +75 et les récompenses +50.
- Comparaison continue à une référence4000Hz, pas30/60/120Hz et irréguliers jusqu'à50ms conservée.
- Tests logiques et runtime synthétiques ; aucune sauvegarde personnelle ni score réel manipulé. Aucun essai physique sur téléphone revendiqué.

Les journaux détaillés sont des preuves locales exclues du commit.

## Périmètre du commit Lots1 +2

Composants partagés adaptés :

- src/gameplay/astralImpulseCombat.js : catégorie parasite et sonde temporelle, récompense75 distincte des50 historiques.
- src/gameplay/impulsePresentation.js : montant confirmé et position d'impact.
- src/gameplay/nyrScore.js : opération dédiée75.

Modules isolés :

- src/gameplay/voidParasite.js.
- src/gameplay/voidParasiteCollisions.js.
- src/gameplay/voidParasiteCombat.js.

Tests : tests/automated/voidParasite.test.mjs et voidParasiteCombat.test.mjs.

Rapports techniques : RAPPORT_NYR_COMBAT_V2_LOT_1.md, RAPPORT_NYR_COMBAT_V2_LOT_2.md et le présent document dans docs/checkpoints/.

Soit11 fichiers prévus ; Stabilité et PACK20 restent inchangés et ne font pas partie des différences du commit. Les lignes vides terminales superflues des fichiers ajoutés sont normalisées pour satisfaire les contrôles Git, sans changement de logique.

## Isolation et limites

Le graphe normal depuis src/main.js ne charge aucun des trois modules du parasite. Histoire, Voyage infini, Survie, menus, commandes, vitesses et skins restent sans intégration du parasite. Aucun prototype jouable ajouté. Aucun autre jeu, Hub ou moteur CJ universels modifié.

L'orchestrateur isolé possède l'unique avance de l'impulsion par image. Le futur Lot3 devra respecter cette propriété s'il est autorisé ; il n'est pas commencé ici. Le callback de score du jeu normal reste son raccord historique50, puisque les modes normaux ne produisent aucune cible parasite.

Le rapport d'étude cité au Lot2 n'a pas été retrouvé localement ; les règles explicites validées des Lots1/2 restent la référence. L'Impulsion peut neutraliser les cinq phases vivantes dans le raccord isolé ; pas de vulnérabilité en waiting/destroyed. Placement complet, rendu spécifique, sons du parasite et essais sur téléphone restent à développer/valider dans des lots ultérieurs.

La publication conditionnelle et son SHA sont consignés dans le rapport final de publication après création du commit. Aucun Lot3 n'est lancé.
