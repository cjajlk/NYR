# NYR — COMBAT V2 — LOT 2
## Collisions, Impulsion astrale et récompense +75

Date : 18 octobre 2026.

**Statut : implémentation locale non validée. Arrêt avant commit et push à la suite d'un échec historique.**

## 1. Audit préalable et conservation

Projet vérifié : E:\cj_project\NYR ; dépôt origin https://github.com/cjajlk/NYR.git ; branche main ; HEAD initial et final : **9d91bda94718d48bbd243b425b56b1af08be5dea**.

Au début, aucun fichier suivi modifié. Trois fichiers locaux du Lot1 étaient présents et non suivis :

- src/gameplay/voidParasite.js.
- tests/automated/voidParasite.test.mjs.
- docs/checkpoints/RAPPORT_NYR_COMBAT_V2_LOT_1.md.

Le code, les paramètres et les tests du Lot1 correspondent à son rapport. **50/50 suites passent avant intervention** : 49 historiques et celle du Lot1. Le canon et les règles docs/work/WORK_RULES.md ont été lus. Le rapport d'étude RAPPORT_NYR_COMBAT_V2_ETUDE_PARASITE.md n'a pas été retrouvé dans le projet ; aucun contenu supposé de ce document n'a été présenté comme vérifié. Les règles explicites du présent cahier et le contrat du Lot1 ont servi de référence.

L'état initial et les empreintes des fichiers suivis et des trois fichiers du Lot1 sont enregistrés dans docs/validation/parasite-lot2/before.json. Aucun travail local n'a été supprimé ou réinitialisé.

## 2. Fichiers de cette intervention

Fichiers suivis modifiés :

| Fichier | Changement local |
|---|---|
| src/gameplay/astralImpulseCombat.js | Catégorie parasite ; premier instant d'intersection ; sonde sans confirmation ; récompense mémorisée par catégorie, +75 pour parasite et +50 pour les quatre catégories historiques |
| src/gameplay/impulsePresentation.js | Montant confirmé passé à la présentation ; +50 par défaut, +75 pour parasite ; position de contact explicite facultative |
| src/gameplay/nyrScore.js | Opération dédiée awardNeutralizedParasite, +75 sans effet secondaire |
| src/gameplay/nyrStability.js | Opération locale applyParasiteContact, −20 avec callback de dégâts existant ; cet ajout à l'API publique provoque le blocage décrit ci-dessous |

Fichier du Lot1 étendu : src/gameplay/voidParasite.js. Ajout de hooks synchrones de neutralisation et de contact, comparaison chronologique des deux événements, retrait avant confirmation et consommation de la portion restante. Les hooks par défaut ne produisent pas d'effet économique ou de dégâts ; le module reste sans import d'environnement ni stockage.

Nouveaux fichiers :

- src/gameplay/voidParasiteCollisions.js : premier contact continu de deux disques mobiles et adaptation des portions de trajectoire au repère temporel du CombatV1.
- src/gameplay/voidParasiteCombat.js : orchestrateur isolé réutilisant les composants existants ; aucune activation par le jeu normal.
- tests/automated/voidParasiteCombat.test.mjs : collisions, priorité, récompenses, présentation, fréquences et isolation.
- Le présent rapport.

Le test et le rapport historiques du Lot1 sont conservés. Les preuves locales supplémentaires dans docs/validation/parasite-lot2/ ne sont pas indexées pour publication.

## 3. Comportement préparé et tests ciblés réussis

### Collisions et dégâts

Solveur continu sur mouvement relatif des deux disques : tête17, parasite12, somme29. Prise en compte du recouvrement initial, de la tangence et des traversées rapides entre deux positions échantillonnées.

Seules les portions charging peuvent produire un contact. Le contact est consommé avant le callback de dommage ; la charge se termine et entre en récupération1,5s. Un contact protégé est lui aussi consommé, sans punition différée. Après un dommage réellement subi, la protection locale0,8s est décrémentée depuis l'instant du dommage, y compris pour le reste de l'image.

Les dégâts passent par le callback before/after du composant Stabilité ; l'orchestrateur notifie une seule fin de partie lorsque le parasite amène la Stabilité à zéro. La protection locale n'est pas lue par les autres dangers et ne modifie pas le bouclier météo. Un garde injectable peut représenter une protection externe applicable.

**Attention : ces comportements passent leurs tests ciblés, mais le raccord choisi à Stabilité n'est pas compatible avec le contrat public historique. L'ensemble n'est donc pas validé.**

### Impulsion et chronologie

Le premier instant d'intersection est comparé au premier contact de charge. Si les deux instants coïncident dans la tolérance numérique minime, la neutralisation l'emporte. Si un dommage survient strictement avant une neutralisation dans la même image, il reste appliqué.

Le parasite est retiré logiquement avant confirmation du score et du feedback. Une simple sonde firstIntersection n'autorise aucun score ; intersects enregistre la candidature puis confirmNeutralized consomme une seule confirmation. La méthode de score dédiée ajoute75 une seule fois. Pas de +50 préalable, recharge d'énergie, Éclats, CJ ou réparation.

Les quatre catégories historiques météorite/onde/corruption/poche restent à50. Les anciens consommateurs de présentation gardent la valeur par défaut50. L'orchestrateur isolé transmet75 explicitement au feedback parasite.

Chaque update de l'orchestrateur avance l'impulsion une seule fois. Les portions de mouvement de la machine à états sont extrapolées dans le repère de l'image entière puis bornées par activeFrom/activeTo. La fin de vie de l'impulsion au milieu d'une image est respectée.

### Vulnérabilité retenue dans le raccord isolé

Les phases vivantes appearing/observing/preparing/charging/recovering peuvent être neutralisées ; waiting/destroyed n'ont pas de cible. Le cahier actuel ne définit pas d'invulnérabilité d'apparition. Ce choix est explicite, sans prétendre le déduire du rapport d'étude absent. Aucune de ces phases, hormis charging, ne peut infliger de dégâts de contact.

## 4. Résultats des tests

| Exécution | Résultat |
|---|---|
| Baseline complète avant changement | **50/50** réussites |
| Passe ciblée CombatV1 géométrie, présentation/audio, Lot1, Lot2 | **4/4** réussites |
| Passe complète après implémentation | **50 réussites /51 ; 1 échec** |

Les nouveaux tests réussis couvrent notamment :

- Deux objets mobiles, trajectoires rapides, tangence, recouvrement et absence d'intersection.
- Contact seulement en charge, dommage20, contact unique et récupération1,5s après réussite ou échec.
- Protection locale, protection externe sans création d'une protection gratuite, autres dangers encore dangereux.
- Callback de dommage réel et GameOver unique.
- Priorité de l'impulsion à l'instant zéro et à un instant non nul ; dommage antérieur conservé si l'impulsion arrive ensuite.
- Retrait dans les cinq phases vivantes, aucune cible en attente ; une seule récompense75.
- Affichage +75 et maintien des quatre récompenses historiques50.
- Sonde sans droit de confirmation ; double confirmation refusée ; énergie non rechargée.
- Portions temporelles correctement repositionnées et fin fractionnelle de l'impulsion.
- Comparaison à une référence à **4000Hz** sur trois scénarios : collision seule, impulsion juste avant contact, impulsion juste après contact. Répétition à30/60/120Hz et avec pas irréguliers7/50/13/29/41ms ; tolérance de comparaison temporelle2µs.
- Pause, reprise sans double avance, portail/zone/resize/recentrage et absence d'accès localStorage.

La passe complète valide encore les autres scénarios historiques, notamment les contrôles et les trois modes via leurs bancs runtime. **Ces succès partiels ne compensent pas le test en échec.**

Journal complet : docs/validation/parasite-lot2/tests-after.txt. Aucun test sur téléphone physique ni prototype jouable supplémentaire.

## 5. Blocage exact et correction recommandée

Échec : **tests/automated/pack20Stability.test.mjs:46**.

Ce test vérifie exactement les quatre clés publiques historiques : snapshot, applyAsteroidContact, applyPureFragment et applyCorruptionContact. L'implémentation locale ajoute une cinquième méthode, **applyParasiteContact**, donc Object.keys(stability) ne correspond plus au contrat V1.

L'ajout que j'ai effectué casse ce contrat historique, même si les dégâts des quatre méthodes initiales n'ont pas été modifiés. Il ne faut pas qualifier le test d'obsolète ni l'affaiblir pour masquer ce changement.

**Correction recommandée, non effectuée après l'arrêt :** conserver l'API StabilitéV1 intacte et injecter dans l'orchestrateur isolé une opération de dommage20 réutilisant le chemin existant approprié et son callback before/after. Réexaminer ce raccord avant toute reprise, sans rendre une méthode supplémentaire non énumérable pour contourner le test. Relancer ensuite toute la suite.

La consigne impose un arrêt avant commit/push en cas de test échoué. Aucun nouveau correctif fonctionnel ni nouvelle passe destinée à contourner cet arrêt n'a été réalisé après le constat.

## 6. Isolation, état Git et publication

L'analyse du graphe d'import normal contient60 modules : aucun voidParasite, voidParasiteCombat ou voidParasiteCollisions n'est accessible depuis src/main.js. src/main.js est inchangé. Aucun ajout à Histoire, Voyage infini, Survie, accueil ou sélection de modes ; aucun contrôle mobile, skin ou vitesse modifié.

Les quatre composants partagés mentionnés sont modifiés localement ; on ne peut pas affirmer une préservation complète du contrat CombatV1 tant que le test de Stabilité échoue. Tous les scénarios du parasite utilisent des instances mémoire et des données synthétiques. Aucun score réel, record, défi, achat ou stockage personnel n'a été modifié. Aucun autre jeu, Hub ou moteur CJ universels modifié.

Git : main, HEAD9d91bda94718d48bbd243b425b56b1af08be5dea inchangé. Fetch effectué avant le constat : origin/main correspondait à HEAD, divergence0/0. Quatre fichiers suivis modifiés et fichiers des deux lots encore locaux/non suivis. L'index n'a pas été modifié.

- git diff --check sur les fichiers suivis : réussi avant le constat.
- git diff --cached --check : non exécuté pour préparer une publication ; aucun fichier n'a été indexé après l'échec.
- **Aucun commit. Aucun push. Aucun nouveau SHA. Aucune publication déclenchée.**
- L'intégrité d'une nouvelle version publique n'a pas été vérifiée puisqu'aucune nouvelle livraison n'a été poussée.

Une nouvelle autorisation de reprise est nécessaire pour corriger le raccord Stabilité et terminer la validation. Aucun Lot3 ni prototype supplémentaire commencé. Travail arrêté après ce rapport.
