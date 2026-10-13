# NYR — PACK 53 Gameplay V2 : Action et dangers

13 octobre 2026. Validation finale : CJ sur téléphone réel.

## Audit initial avant modification

Archive fournie retrouvée sous le nom `NYR.zip` dans le dossier parent du dépôt. Comparaison SHA-256 de ses **249 fichiers hors .git** avec le dépôt : tous identiques, aucun fichier supplémentaire local. Le ZIP et le dépôt possèdent la même branche `main` et les mêmes références Git. HEAD et origin/main local et distant : `bffc04322128d4de928d27918a63ad8c33f268f5`. Dépôt propre avant intervention. Aucune modification locale préexistante à préserver séparément.

Les correctifs du Léviathan, les sprites des fragments et l'audio sont déjà intégrés dans cette base. Le Mode Survie existe réellement; ses tests couvrent les cycles, la progression de vitesse, l'autocollision fatale, les récompenses permanentes, les migrations, la pause et les statistiques séparées. Les **38 fichiers de tests préexistants passent avant modification**.

Systèmes réutilisés :

- `mobileAsteroidSystem.js` : rocher classique mobile, contact de tête avec rayon physique 17 px, contact continu protégé contre les appels répétés.
- `fragmentSystem.js` et `corruptionPocket.js` : fragments normaux/purs/corrompus et poches; leurs règles restent inchangées.
- `nyrStability.js` : dégâts astéroïde −25 et corruption −20, callback commun de statistiques. Il n'existe pas d'invulnérabilité temporisée générale.
- `nyrScore.js` : score normal lié au combo; extension séparée pour un bonus fixe d'esquive.
- `zoneExitPortal.js`, `runtimeState.js`, `gameLoop.js` : transitions, suspensions et cycle de simulation. Aucun gestionnaire général d'événements majeurs n'existait.
- `gameplayAudio.js` : sons d'impacts réutilisés sans changer les assets, le mixage ni le bouton Son.

Risques identifiés et traités : dégâts groupés, faux bonus dus au recentrage technique, collision d'un disque à la place de l'anneau, conflits avec transitions et pause, couloirs trop étroits en paysage, régression des statistiques et modification involontaire des règles Survie.

## Réalisation et paramètres V1

Un gestionnaire commun limite les nouveaux événements à **un seul actif**. Les rochers classiques et la corruption continuent selon leurs règles.

| Zone | Délai moyen entre fin d'un événement et alerte suivante | Météorites | Ondes |
| --- | --- | --- | --- |
| 1 | 75 s | 3 | aucune |
| 2 | 55 s | 3–4 | un événement sur trois |
| 3 | 42 s | 4–5 | un événement sur deux |
| 4 | 34 s | 4–5 | un événement sur deux |

Le délai du premier événement d'une zone est le délai indiqué. Les suivants varient de ±10 %. La durée de l'événement s'ajoute aux intervalles ci-dessus; les ondes de zone 2 restent donc espacées de plusieurs minutes. Les minuteries utilisent exclusivement le temps de jeu actif.

Pluie : alerte de 1,5 s, couloirs pointillés et flèches indiquant le sens d'arrivée; météorites de rayon physique 14 px, vitesse 70–90 px/s, couloirs parallèles de sens alternés. Aucun suivi automatique de Nyr. Apparition hors écran, à au moins 120 px de la tête. L'axe de circulation est choisi pour garantir au moins 95 px entre couloirs; si l'espace disponible ne permet pas cette marge, l'apparition est reportée. Cela laisse au moins 33 px de couloir libre après les deux enveloppes physiques tête/météorite. Dégâts −25, une seule application possible par météorite.

Onde : préparation 2 s, expansion 1,5 s, dissipation 0,5 s. Centre choisi parmi quatre points éloignés de la tête, au moins 140 px. Rayon maximal limité au minimum de 170 px et 36 % du petit côté de l'écran, laissant un espace de fuite. Collision uniquement avec l'anneau de demi-épaisseur 5 px augmenté du rayon physique de tête 17 px; aucun dégât durant préparation/dissipation. Une seule application de −20 par onde. Les collisions des météorites et de l'anneau examinent aussi le déplacement entre deux pas pour réduire le risque de traversée sans détection.

Protection : une temporisation de **0,8 s protège contre les nouveaux dangers après tout dégât**. Elle est informée par le callback existant des statistiques. Elle ne rend pas Nyr invulnérable aux dangers anciens et ne change pas leurs dégâts. Un contact protégé invalide aussi le bonus d'esquive. Cette limite est volontaire pour préserver les règles existantes.

Esquive : proximité de la tête à moins de 18 px à l'extérieur de l'enveloppe de collision. Bonus fixe **+100**, sans combo, monnaie, Éclats ou récupération. Attribution uniquement lorsque la météorite quitte l'écran ou l'onde finit de se dissiper, si aucun contact n'a eu lieu et si aucun bonus n'a déjà été attribué. Texte « ESQUIVE +100 » et bord cyan discret pendant 0,9 s. Attendre la fin évite de récompenser prématurément une esquive suivie d'un impact.

Sécurité : à moins de 100 px d'un portail actif, les nouveaux événements sont retirés et la génération suspendue, sans modifier le portail. Nettoyage également à l'entrée effective d'un portail, lors d'un changement de zone/session, d'un redimensionnement, du recentrage technique de Nyr et en Game Over. Pause et orientation portrait figent les alertes, événements, protections et feedbacks.

## Modes et périmètre conservé

Activation en **Histoire et Voyage Infini**. Les objectifs, fins de chapitres, portails, cycles et sauvegardes gardent leurs règles. Les bonus de score sont naturellement inclus dans le score et les statistiques existants.

**Mode Survie inchangé pour cette V1** : les nouveaux événements y sont désactivés. Son défi d'autocollision et sa progression de vitesse sont déjà stabilisés; ajouter ces dangers changerait son équilibre et ses règles. Une éventuelle activation fera l'objet d'un réglage dédié après validation de CJ. La suite Survie préexistante reste exécutée.

Aucune fissure instable, aucun éclat chasseur, nouvel asset, son, prix, monnaie ou option ajouté. Collisions fondées uniquement sur les rayons physiques, sans consultation de la taille des sprites. Tous les assets, les modules de skins, les commandes, les boutiques et les sauvegardes restent identiques à la base.

## Fichiers du pack

- Ajout `src/gameplay/actionEvents.js` : gestion, collisions, bonus et rendu Canvas des deux événements.
- Modification `src/main.js` : raccordements, information de dégâts, nettoyage et rendu.
- Modification `src/gameplay/nyrScore.js` : méthode `awardDodge()` ajoutant exactement 100 points.
- Ajout `tests/automated/actionEvents.test.mjs` : scénarios déterministes des événements et de leur rendu.
- Ajout `tests/automated/actionEventsRuntime.test.mjs` : callbacks du vrai main, dégâts/statistiques, score/combo, pause, portail, Game Over et redémarrage à 30/60/120 Hz.
- Modification `tests/automated/pack20Stability.test.mjs` : assertion du raccordement de dégâts adaptée; contrôles de comportement conservés.
- Modification `tests/automated/pack30Replay.test.mjs` : extension du banc d'essai sous variable de test dédiée, sans effet dans le jeu.
- Ce checkpoint : audit, paramètres, choix Survie et vérifications.

## Vérification et limites

Suite finale `node --test tests/automated/*.test.mjs` : **40 fichiers de tests passent, zéro échec**. Les deux suites supplémentaires vérifient les phases, dégâts exacts, intérieur sûr derrière l'anneau, contact continu, protection après dégâts, proximité réelle, refus de récompense après contact, paiement unique, limites par zone, espace entre couloirs, pause, transition de portail, nettoyage, statistiques, Game Over et reprise. La suite Léviathan de 576 combinaisons reste verte.

Un échec intermédiaire portait sur l'ancienne assertion textuelle du callback Stabilité, désormais enveloppé pour informer la protection; l'assertion a été adaptée sans supprimer ses contrôles. Aucun échec restant dans la livraison.

Contrôles navigateur dans une page QA isolée, avec les vrais modules de rendu et de simulation et les assets du dépôt : PC 1280 × 720 et paysage 667 × 375, alerte/pluie active, onde préparée/active, sélection des trois skins et de leurs quatre transformations. Captures fournies. Aucune erreur navigateur relevée. Les simulations de couloirs sont des cas contrôlés, pas une garantie d'évitement de toutes les combinaisons possibles avec les dangers anciens.

Ce n'est **pas un test sur téléphone réel**, ni une validation finale du plaisir de jeu. CJ doit encore apprécier lisibilité, fréquence et difficulté sur son appareil. Les nouveaux événements n'ont pas de son propre supplémentaire; les sons d'impact existants sont conservés.

Livraison : ZIP complet avec `.git`, vérifié fichier par fichier. HEAD conservé. Aucun commit, push ou publication GitHub Pages.
