# RAPPORT NYR — COMBAT V1 — LOT 1

16 octobre 2026. Fondations de l'énergie d'impulsion, sans activation du combat.

## État initial et périmètre

- Branche `main`, HEAD et `origin/main` local : `214e3eddff60a0669669ab0c2fac23e7e2558b73`.
- Dépôt propre avant intervention, aucun changement local préexistant.
- Base identique à celle de l'étude technique du 15 octobre 2026 : sessions dans `startGame()`, absorptions normales dans le callback du système de fragments, portails et cycles ne recréant pas la session.
- Les huit choix de conception sont validés par CJ, mais seule l'énergie interne du Lot 1 est autorisée ici.
- Les 41 fichiers de tests préexistants ont été conservés. Deux fichiers dédiés sont ajoutés : total 43.

## Fichiers créés et modifiés

| Fichier | Intervention |
| --- | --- |
| `src/gameplay/astralImpulse.js` | Nouveau module autonome, sans dépendance au DOM, aux skins, à l'économie, aux sauvegardes ou aux dangers |
| `src/main.js` | Une instance par session, absorption normale et remise à zéro aux fins de session |
| `tests/automated/astralImpulse.test.mjs` | Tests unitaires de la charge et de la consommation interne |
| `tests/automated/astralImpulseRuntime.test.mjs` | Tests des vrais raccordements du moteur dans les trois modes |
| `tests/automated/pack30Replay.test.mjs` | Extension du banc d'essai sous `NYR_IMPULSE_TEST`, sans effet sur l'application livrée ni sur les scénarios préexistants |
| `docs/checkpoints/RAPPORT_NYR_COMBAT_V1_LOT_1.md` | Ce rapport et checkpoint |

`fragmentSystem.js` n'est pas modifié : son callback d'absorption existant est utilisé tel quel. Les autres modules de production et tous les assets sont conservés.

## Module et fonctionnement

`createAstralImpulse()` crée une nouvelle instance à énergie 0. `ASTRAL_IMPULSE_CAPACITY` vaut 20.

- `absorbNormalFragment()` ajoute exactement une unité, avec saturation à 20.
- `isReady()` indique si la charge complète est disponible.
- `consume()` renvoie `false` sous 20 sans changer l'énergie. À 20, renvoie `true` et remet l'énergie à 0, sans exiger de cible ni créer de points ou d'effets.
- `reset()` remet explicitement l'énergie à 0.
- `snapshot()` retourne une copie figée `{ energy, capacity, ready }`; la modification d'un snapshot ne peut pas altérer l'état.

Une seule charge peut être stockée. Les fragments supplémentaires à 20 ne constituent pas de réserve. Aucun timer, rechargement automatique, état global ou stockage permanent n'est utilisé.

La consommation reste une opération interne du module, non raccordée au joueur. Elle ne gère pas encore les restrictions d'une commande de combat, puisqu'aucune commande n'existe dans ce lot.

## Points d'intégration exacts

1. `main.js` importe la fabrique et crée `astralImpulse` à l'entrée de `startGame()`. Chaque session possède son instance, séparée de `actionEvents`.
2. Le callback `onAbsorbed()` passé à `createFragmentSystem()` appelle `astralImpulse.absorbNormalFragment()`. Il s'agit du callback déjà déclenché après la détection réelle d'une absorption normale, pas d'un événement d'affichage ou de score.
3. Aucun appel n'est ajouté à `onPureAbsorbed`, `onCorruptionContact`, aux bonus, aux esquives ou aux portails. Ces événements ne chargent pas l'énergie.
4. La fonction locale `endGame()` remet l'énergie à zéro avant la clôture de partie.
5. `syncMenuDisplay()` la remet aussi à zéro lorsque le runtime indique Game Over ou fin d'Histoire, couvrant la fin complète de l'Histoire et les chemins de finalisation du runtime.
6. `replaceSession()` remet à zéro l'ancienne instance lors de la destruction effective de session, avant d'en créer une nouvelle. Aucun transfert entre instances.

Les portails, changements de zone, cycles d'Infini, suspensions PAUSE et suspensions d'orientation n'appellent pas la remise à zéro du module. L'énergie n'est pas rattachée aux réinitialisations du gestionnaire de dangers.

## Tests et résultats

Commandes exécutées :

```text
node --test tests/automated/astralImpulse.test.mjs tests/automated/astralImpulseRuntime.test.mjs
node --test tests/automated/*.test.mjs
git diff --check
```

**Deux nouveaux fichiers de tests réussis. Suite complète : 43 fichiers réussis, aucun échec**, environ 50,4 secondes. La suite préexistante en comptait 41 : l'écart de +2 correspond exactement aux nouvelles suites. Les tests dédiés ont également été rejoués après renforcement du contrôle d'une charge partielle pendant le portrait actif.

### Module

Vérification de 0, 1, 10, 19 et 20 unités; 21 absorptions et plus; saturation après 1 000 appels supplémentaires; indisponibilité sous 20; refus à 0 et 19 sans mutation; consommation à 20 même sans cible; retour à 0; refus d'une seconde consommation; absence de réserve; remise à zéro; indépendance de deux instances; snapshots non modifiables; absence de recharge avec le temps.

### Intégration réelle

Neuf scénarios : **Histoire, Voyage Infini et Survie, chacun à 30/60/120 Hz**. Le banc simule les surfaces du navigateur et observe les fermetures du vrai `main.js`, sans remplacer les callbacks de fragments, score, collision ou portail.

- Les normales sont absorbées par `fragmentSystem.update()` avec leurs positions issues de son vrai snapshot, puis passent par le callback original de `main.js`.
- Le fragment pur est réellement absorbé; son compteur augmente sans énergie.
- Le contact avec la corruption passe par son vrai système sans énergie supplémentaire.
- Le bonus de score et une esquive effectivement calculée par `actionEvents.update()` ne chargent pas. L'esquive traverse le callback original et ajoute bien +100, sans variation d'énergie.
- La consommation interne n'a aucune cible et ne change ni score, ni feedback d'absorption, ni nombre d'écritures de stockage.
- Les quatre entrées de portail utilisent leurs callbacks réels. Une charge partielle est conservée aux changements de zone; un cycle complet d'Infini et de Survie conserve la charge dans la même instance.
- La fin complète de l'Histoire libère l'énergie, puis une nouvelle Histoire repart à 0.
- Une charge partielle est conservée pendant le portrait d'une partie active, ainsi que pendant PAUSE et une rotation pendant PAUSE. Le retour paysage ne retire pas la pause utilisateur.
- Quitter une partie remet l'ancienne instance à 0; la session suivante utilise une instance différente à 0.
- Des contacts répétés avec le rocher classique provoquent les vrais dégâts, le vrai Game Over de `main.js`, puis la remise à zéro. Rejouer repart à 0.
- Les écritures du stockage simulé restent limitées aux clés préexistantes des défis et statistiques; aucun champ d'énergie n'est ajouté aux données sérialisées. Aucun profil utilisateur réel n'est utilisé par ces scénarios.

La suite complète inclut toujours les skins et transformations, Léviathan, Survie, événements dangereux/esquives, audio, OPTIONS, orientation mobile, économie, portails, sauvegardes et statistiques.

## État Git après intervention

HEAD conservé à `214e3eddff60a0669669ab0c2fac23e7e2558b73`. Les fichiers existants modifiés sont uniquement `src/main.js` et le banc d'essai `tests/automated/pack30Replay.test.mjs`. Les quatre créations sont le module, ses deux suites et ce rapport. Tous les changements restent locaux et non committés.

`git diff --check` conforme. Aucun reset, nettoyage destructif, merge, remplacement global ou manipulation destructive de `.git`. Aucune sauvegarde utilisateur modifiée et aucun appel nouveau à CJEngine.

## Limites et confirmation de livraison

Aucune anomalie restante dans les contrôles effectués. Les interfaces de navigateur et le stockage des tests sont simulés : **aucun test tactile physique n'a été effectué**, et ce lot n'ajoute aucune interface à valider visuellement.

Les dangers ne sont pas destructibles dans ce lot; l'absence de charge par destruction repose aussi sur l'absence totale de fonctionnalité de destruction. Le module d'énergie n'a aucune dépendance aux cibles ou au rendu.

**Aucun élément du Lot 2 ou des lots suivants n'est implémenté :** pas de bouton IMPULSION, jauge, raccourci Espace, rayon 110, durée 0,4, onde offensive, effet visuel/sonore, collision offensive, destruction, neutralisation ou bonus +50. Les commandes existantes, les dangers, l'économie, l'audio et leurs réglages restent inchangés.

**Aucun commit. Aucun push. Aucune publication. Lot 1 terminé; attendre la validation de CJ avant toute autre intervention.**
