# RAPPORT NYR — COMBAT V1 — LOT 2

16 octobre 2026. Moteur interne de géométrie et neutralisation, sans commande utilisateur.

## 1. Audit et conservation du Lot 1

Branche `main`, HEAD `214e3eddff60a0669669ab0c2fac23e7e2558b73`. Aucun commit, push, reset, merge ou publication effectué.

État initial : `src/main.js` et `tests/automated/pack30Replay.test.mjs` modifiés par le Lot 1; quatre fichiers non suivis du Lot 1 : module d'énergie, deux suites et rapport. Cet état correspond aux références techniques et au rapport du Lot 1. Le module d'énergie existe, son API et ses tests sont compatibles.

Avant intervention, copies de référence des deux fichiers déjà modifiés et empreintes SHA-256 des quatre fichiers autonomes du Lot 1 conservées hors dépôt. Les quatre empreintes restent identiques après intervention :

- `src/gameplay/astralImpulse.js`;
- `tests/automated/astralImpulse.test.mjs`;
- `tests/automated/astralImpulseRuntime.test.mjs`;
- `docs/checkpoints/RAPPORT_NYR_COMBAT_V1_LOT_1.md`.

Le module et les tests du Lot 1 ne sont pas remplacés. `main.js` et le banc d'essai sont étendus en conservant leurs raccordements de charge, de saturation et de cycle de vie.

## 2. Fichiers créés et modifiés pour le Lot 2

| Fichier | Intervention |
| --- | --- |
| Nouveau `src/gameplay/astralImpulseCombat.js` | Déclenchement interne, temps actif, centre fixe, géométrie continue, confirmation de neutralisation et annulation |
| `src/gameplay/actionEvents.js` | Identités par génération, météorites et ondes neutralisées dans leur propriétaire avant dégâts, exclusion des esquives |
| `src/gameplay/fragmentSystem.js` | Ancienne position de corruption mobile et neutralisation ciblée avant son contact dommageable |
| `src/gameplay/corruptionPocket.js` | Intervalle actif du pas, neutralisation d'une génération et passage au cooldown normal |
| `src/gameplay/nyrScore.js` | Nouvelle opération séparée `awardNeutralizedDanger()` : +50 fixe |
| `src/core/zoneBackgroundTransition.js` | Information minimale `isCombatTransitioning()`, compteur d'une seconde indépendant du chargement des images |
| `src/main.js` | Instance interne par session, raccordement des dangers/score, priorité des portails pendant une attaque et nettoyage |
| Nouveau `tests/automated/astralImpulseCombat.test.mjs` | Module et géométrie |
| Nouveau `tests/automated/astralImpulseDangers.test.mjs` | Vrais propriétaires des dangers et transition avec images en erreur |
| Nouveau `tests/automated/astralImpulseCombatRuntime.test.mjs` | Vrai `main.js`, trois modes et neuf scénarios de fréquence |
| `tests/automated/pack30Replay.test.mjs` | Exposition en mémoire des fermetures seulement sous `NYR_COMBAT_TEST`, scénario dédié |
| `tests/automated/pack28Corruption.test.mjs` | Assertion textuelle adaptée à la branche conditionnelle des portails; contrôles fonctionnels conservés |
| Nouveau `docs/checkpoints/RAPPORT_NYR_COMBAT_V1_LOT_2.md` | Ce rapport |

Aucun asset, sprite, réglage CSS, commande, son, prix, défi, profil CJ ou format de sauvegarde modifié. Aucun nouveau système de rocher fixe ou ennemi.

## 3. Moteur d'impulsion réellement opérationnel

### Interface interne

`createAstralImpulseCombat()` reçoit l'instance d'énergie du Lot 1, une lecture de la tête logique, une lecture des autorisations du runtime et un callback de score confirmé.

- `trigger()` refuse sous 20, pendant une autre impulsion, un menu, une pause, un état terminal ou un verrou de transition. Un refus n'altère pas la charge.
- Un déclenchement valide capture `movement.snapshot().x/y`, consomme immédiatement 20 et crée l'état interne, même sans cible.
- `update(delta)` avance sur le temps actif du moteur, avec pas maximal de 0,05 s.
- Rayon maximal **110 pixels CSS**, durée **0,4 seconde**, progression linéaire, centre capturé et fixe. Aucun coefficient de skin, transformation ou DPR.
- `intersects()` vérifie la rencontre d'une cible autorisée pendant le pas; `confirmNeutralized()` ne crédite que les rencontres effectivement confirmées par leur propriétaire, une seule fois par identité.
- `cancel()` retire l'impulsion et ses rencontres en cours, sans rembourser l'énergie.

Ces méthodes ne sont pas reliées au clavier, au tactile, à un bouton, à une API de tir du joueur ou à une attaque automatique. L'accès aux instances du vrai jeu dans les tests est ajouté en mémoire par le banc d'essai, jamais dans le JavaScript livré à l'utilisateur.

### Géométrie continue

Pour une cible circulaire mobile, la position est interpolée entre ses anciennes et nouvelles coordonnées. Les intersections avec l'anneau en expansion sont calculées en résolvant les frontières quadratiques distance/rayon, avec vérification géométrique des racines et des bornes : aucune simple comparaison à la position finale.

Pour une onde ennemie, le moteur résout sur l'intervalle actif les trois contraintes linéaires d'intersection des cercles : `d ≤ r+s+w`, `r-s ≤ d+w`, `s-r ≤ d+w`, avec `w = 5 px`, demi-épaisseur dangereuse existante. Les cercles concentriques sont couverts; le centre d'une onde dans le disque final ne suffit pas.

La fin de l'impulsion à 0,4 s coupe exactement son sous-intervalle au sein du dernier pas. Les sous-intervalles de préparation/activité/dissipation des ondes et poches sont aussi pris en compte. Les tangences bénéficient d'une tolérance numérique de 1e-7 pixel, sans agrandissement graphique du rayon physique.

## 4. Propriétaires de dangers raccordés

### Météorites

Chaque pluie possède une génération et chaque météorite une identité distincte; le compteur d'identité ne dépend pas du compteur de planification réinitialisé aux zones. Après déplacement d'une météorite active, l'intersection offensive est vérifiée avant le calcul des dégâts.

Une cible touchée devient terminée et neutralisée dans le véritable objet interne. Elle est exclue des collisions et du rendu existant; sa récompense est close pour empêcher une esquive ultérieure. Une pluie ne crée aucun bonus de conteneur. La préparation ne peut pas être détruite.

### Ondes de choc

Seul l'intervalle d'expansion dangereux est éligible. La rencontre des anneaux retire le véritable événement avant ses dégâts et ferme toute possibilité de +100. Préparation et événement déjà terminé restent inéligibles.

### Corruption mobile

L'ancienne position est mémorisée lors de `advanceCorruption()`, puis comparée à la nouvelle avant le contact de tête de `fragmentSystem.update()`.

Seul l'objet `corruption` de cette génération est supprimé. Les fragments normaux et purs, leur placement et les compteurs d'absorption restent inchangés. L'enveloppe cible de 8 px est dérivée des paramètres de collision existants : rayon de contact 25 moins rayon logique de tête 17. Aucun rayon issu du PNG. Les générations suivantes gardent leur rythme d'absorption normal.

### Poche de corruption

Une génération active peut être neutralisée avant son contact dommageable. Elle passe au cooldown normal du niveau courant, contact remis à zéro, sans recréation immédiate. Le cooldown commence au pas de neutralisation; sa précision est celle de la simulation, au plus 0,05 s. Les phases de préparation et de cooldown ne sont pas des cibles. Les générations suivantes conservent leur fonctionnement et peuvent de nouveau infliger leurs dégâts normaux.

### Éléments non ciblés

La géométrie n'accepte que les catégories météorite, onde de choc, corruption mobile et poche. Aucun raccordement de neutralisation n'est ajouté aux rochers classiques, astéroïdes décoratifs, portails, fragments normaux/purs, décors ou segments. Les rochers classiques restent dangereux pendant une attaque; le corps demeure mortel en Survie.

## 5. Ordre, récompenses et cycle de vie

### Ordre de collision

Sans attaque active, l'ordre historique des fragments puis portails est conservé. Lorsqu'une attaque est active au début du pas : mouvement normal → autocollision Survie prioritaire → portails/destination → avancée de l'impulsion → déplacement/phase de chaque danger → neutralisation interne → dégâts des seuls dangers restants.

Le propriétaire retire d'abord sa cible, puis confirme la neutralisation au moteur; le callback crédite alors le score. Aucun appel aux fonctions de dégâts, de soin ou de protection temporaire ne simule une destruction. Les tests vérifient notamment qu'une météorite ou une onde à portée de la tête ne retire pas sa Stabilité dans le pas où elle est neutralisée.

### Score et exclusivité

`awardNeutralizedDanger()` ajoute exactement 50 points au score global normal, sans combo. Les statistiques existantes lisent ce score; aucun compteur de fragments, Éclat, CJ ou protection n'est modifié par la confirmation.

Pour une même cible, destruction et esquive sont exclusives. Une météorite neutralisée ne peut plus donner +100. Inversement, une météorite déjà récompensée pour une esquive est déjà terminée dans le système existant et ne peut plus être sélectionnée ou créditée comme destruction. Les identités et confirmations bloquent les doubles récompenses d'une impulsion.

### Transitions et interruptions

Le fondu visuel conserve son comportement. Le seul ajout est un compteur de blocage de combat d'une seconde lors d'une synchronisation vers une nouvelle zone. Il avance avec le temps actif, même si une image reste en chargement ou en erreur; il ne dépend pas du champ visuel `progress`.

Entrer effectivement dans un portail annule l'impulsion avant les dangers de destination. Charge inutilisée conservée; aucune restitution d'une charge déjà consommée. Aucune intention de tir différée n'existe.

Pause ordinaire : l'impulsion est figée. Changement effectif de dimensions, recentrage technique, changement de zone, fin d'Histoire, Game Over et abandon : effet annulé. Une rotation qui change les dimensions annule donc l'effet en vol sans remboursement, tout en conservant une éventuelle énergie inutilisée. Nouvelle partie : énergie et combat neufs.

Survie : aucune activation des météorites ou ondes précédemment désactivées. Les formes de corruption présentes sont neutralisables. Vitesse, règles du corps et difficulté ne changent pas.

## 6. Tests exécutés

```text
node --test tests/automated/astralImpulseCombat.test.mjs
node --test tests/automated/astralImpulseDangers.test.mjs
node --test tests/automated/astralImpulseCombatRuntime.test.mjs
node --test tests/automated/*.test.mjs
git diff --check
```

**Résultat final : 46 fichiers de tests réussis, zéro échec.** Base du Lot 1 : 43; ajout du Lot 2 : trois suites. Les tests unitaires et d'intégration du Lot 1 restent inchangés et passent dans la suite complète.

### Détail de couverture

- Refus à 0 et 19, acceptation à 20, consommation immédiate dans le vide, refus d'un second tir avec conservation d'une nouvelle charge.
- Rayon 110, durée 0,4, centre fixe et tête logique; 20 Hz (pas maximal), 30/60/120 Hz.
- Matrice trois skins × quatre formes × DPR 1/2/3 : même rayon logique.
- Tangence et quasi-tangence, cible mobile manquée par les deux extrémités mais touchée entre les pas, anneaux se rencontrant seulement entre deux pas, cercles concentriques, exclusion du temps suivant la fin exacte de l'impulsion.
- Météorite active, préparation intacte, deux cibles dans une même pluie sans bonus de conteneur, onde active dissipée, préparation et onde terminée intactes.
- Corruption mobile supprimée sans dégâts, changement de compteur, de fragment pur ou gain de Stabilité; génération suivante à son compteur attendu.
- Poche active neutralisée, cooldown normal, aucune réapparition immédiate, préparation intacte et dégâts normaux de la génération suivante.
- Aucun dégât simultané d'une météorite/onde détruite, +50 unique, exclusion du +100 après destruction et absence de seconde récompense après une esquive déjà payée.
- Verrou initial absent, verrou d'une seconde après portail, déblocage malgré images en erreur, rendu visuel non modifié.
- Intégration réelle dans Histoire/Infini/Survie à 30/60/120 Hz : déclenchement interne du vrai `main.js`, mouvement inchangé, score et statistiques, combo/Éclats/stockage sans effet supplémentaire, pause, dimensions, portails, charge, Game Over, abandon et rejeu.
- Rocher classique encore dommageable pendant une attaque; en Survie, boucle physique réelle provoquant l'autocollision mortelle alors qu'une impulsion est active. Aucun segment neutralisé.

Les scénarios d'intégration utilisent les vrais modules, propriétaires et callbacks du moteur. Les surfaces de navigateur et le stockage sont simulés. Certains cas positionnent explicitement la tête logique via les API de mouvement pour isoler une collision; ils conservent le temps de simulation afin de ne pas fausser les records de chapitre. Ce ne sont pas des essais manuels de pilotage.

### Échecs intermédiaires identifiés et corrigés

- L'ancienne assertion textuelle du pack corruption attendait les portails sans branche conditionnelle; elle a été adaptée à la priorité offensive, sans retirer ses contrôles fonctionnels.
- Deux anciens contrôles de ressources interprétaient un nouveau commentaire `//` comme une URL. Le commentaire est devenu un bloc; les tests historiques concernés n'ont pas été affaiblis.
- Un scénario multi-météorites attendait deux cibles alors qu'une troisième entrait réellement dans la portée pendant le pas. Le placement temporel du cas contrôlé a été corrigé pour isoler deux cibles.
- Le montage initial d'un test Histoire réinitialisait son horloge en repositionnant la tête, créant une durée de chapitre négative. Le montage conserve désormais le temps et le nombre de segments; aucun changement du système Histoire n'a été nécessaire.

Aucun échec restant dans les vérifications finales.

## 7. État Git et conservation

HEAD reste `214e3eddff60a0669669ab0c2fac23e7e2558b73`. Les changements du Lot 1 restent locaux et conservés. Ses quatre fichiers autonomes sont identiques octet pour octet aux références prises avant Lot 2.

Le Lot 2 ajoute cinq fichiers (moteur, trois suites, ce rapport) et étend huit fichiers existants, dont les deux fichiers déjà modifiés par le Lot 1. Aucun changement d'asset, de sauvegarde utilisateur, de donnée économique ou de fichier CJ. `git diff --check` conforme. Aucun nettoyage destructif ou remplacement global. Dossier `.git` conservé.

## 8. Limites et risques restants

- Le moteur offensif n'est déclenchable que par son interface interne et les tests. Il ne peut pas encore être essayé par une commande de jeu.
- Aucun bouton, jauge, raccourci, son, animation offensive définitive, particules ou indication +50 n'est ajouté. Les cibles disparaissent par leur état réel et le HUD de score existant reflète le bonus.
- Les déplacements mobiles sont interpolés linéairement sur chaque pas de simulation. La corruption reste animée selon ses positions sinusoïdales existantes, dont l'ancien et le nouveau point sont pris en compte.
- Les tests numériques couvrent les cas contrôlés, mais ne constituent pas une preuve formelle pour toutes les configurations flottantes possibles.
- Aucun test sur téléphone physique ni mesure de performance matérielle. Le nombre de cibles demeure borné par les systèmes existants; aucune boucle de particules ou ressource lourde ajoutée.
- L'ergonomie, l'audio offensif et le rendu définitif restent à valider dans leurs lots autorisés ultérieurement. Les risques futurs principaux concernent les gestes tactiles, la lisibilité des anneaux superposés et les interruptions mobiles.

**Lot 2 terminé. Aucun Lot 3 commencé. Aucun commit, push ou publication. Attendre l'autorisation explicite de CJ avant toute suite.**
