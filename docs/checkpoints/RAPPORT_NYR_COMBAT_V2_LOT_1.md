# NYR — COMBAT V2 — LOT 1
## IA pure du Parasite du Vide

Date : 18 octobre 2026.

**Lot 1 terminé. Logique autonome uniquement, aucune activation dans le jeu. Validation du joueur attendue avant le Lot 2.**

## 1. Périmètre et fichiers

Trois fichiers créés :

- `src/gameplay/voidParasite.js` : configuration, machine à états, trajectoires et contrats injectables.
- `tests/automated/voidParasite.test.mjs` : tests de la logique autonome, des interruptions et de l'isolation.
- `docs/checkpoints/RAPPORT_NYR_COMBAT_V2_LOT_1.md` : ce rapport.

**Aucun fichier préexistant modifié.** Aucun import ajouté dans `main.js`, aucun rendu, asset, son, mode, sauvegarde, score, CJ ou danger existant modifié. Combat V1 et les récompenses +50 restent intacts. Les dégâts de 20 et la récompense +75 ne sont pas appliqués.

Le nouveau module n'a aucun import et ne lit aucun objet de navigateur, stockage, horloge réelle ou minuterie. Il ne connaît ni les commandes de Nyr ni le moteur de combat.

## 2. Paramètres retenus

`VOID_PARASITE_CONFIG` est exporté et gelé. Chaque instance peut recevoir des valeurs de configuration propres, sans modifier les autres instances.

| Clé | Valeur par défaut |
|---|---:|
| radius | 12 px |
| detectionRadius | 160 px |
| preparationDuration | 0,8 s |
| chargeDuration | 0,6 s |
| recoveryDuration | 1,5 s |
| lockMinimum / lockMaximum | 80 / 192 px |
| appearanceDuration | 0,6 s |
| initialDelay | 8 s |
| respawnDelay | 12 s minimum |
| spawnRetryDelay | 2 s |
| spawnHeadDistance | 220 px |
| spawnBodyDistance | 45 px |
| spawnPortalDistance | 96 px |
| edgeMargin | 36 px |
| minimumDimension | 260 px |
| protectionDuration | 0,8 s |

Valeurs non finies, négatives, nulles, clés inconnues et fenêtre de verrouillage inversée refusées explicitement. Les durées configurées sont au minimum de 50 ms, afin de borner le nombre de transitions internes dans un pas maximal de 50 ms. Le délai de retour ne peut pas être configuré sous 12 secondes, conformément au cahier des charges. Aucun ajustement silencieux des paramètres.

Vitesse de charge : composantes de la différence entre cible verrouillée et origine, divisées par `chargeDuration`. Avec les paramètres par défaut, vitesse comprise entre environ 133,33 et 320 px/s. Il n'existe pas d'accélération de rattrapage ou de suivi de la tête après verrouillage.

Le freinage optionnel n'est pas développé : le parasite s'arrête à la cible après échec ou au point de contact après réussite. Cela évite d'ajouter une dérive à sécuriser avant le futur Lot 2. Les 1,5 seconde de récupération sont conservées dans les deux cas.

## 3. États et transitions

| État exposé | Règle |
|---|---|
| waiting | Première demande après 8 secondes actives. Si apparition refusée : nouvelle demande après 2 secondes. |
| appearing | Apparition de 0,6 seconde, sans détection ni appel au contrat de contact. |
| observing | Position logique immobile. Détection de la tête à 160 px inclus. |
| preparing | Pendant 0,8 seconde, la cible provisoire suit la tête fournie. Verrouillage définitif à la fin. |
| charging | Mouvement rectiligne de 0,6 seconde vers la cible copiée ; aucune poursuite. |
| recovering | Immobilité pendant 1,5 seconde. Aucun contact ou nouvelle attaque durant cette phase. |
| destroyed | Position retirée ; délai de retour d'au moins 12 secondes actives, puis nouvelle demande d'apparition sûre. |

Une cible hors de 80–192 px au verrouillage, ou un corridor non explicitement validé, fait passer directement en récupération. Aucun événement de début de charge ni contact n'est alors produit.

Le temps restant est consommé par portions : une fin de préparation au milieu d'un pas laisse uniquement la portion suivante disponible pour la charge. Une charge réussie passe immédiatement en récupération et le reste du pas est consommé dans cette récupération. Les tolérances numériques de l'ordre de 10⁻⁹ s évitent une transition parasite provoquée uniquement par un résidu flottant.

## 4. Interface publique

`createVoidParasite(options)` accepte :

- `config` : surcharges validées des paramètres exportés.
- `requestSpawn(context)` : proposition de point `{ x, y }`, ou absence de candidat.
- `isSpawnSafe(candidate, context)` : autorisation explicite du futur système de placement ; seul `true` autorise.
- `isCorridorValid(context)` : autorisation explicite de la future charge ; seul `true` autorise.
- `detectContact(portion)` : futur détecteur de collision continue, renvoyant `{ fraction }` ou aucun contact.

Par défaut, aucun point n'est proposé, aucune apparition n'est autorisée, aucun corridor n'est validé et aucun contact n'est inventé. Le module ne peut donc pas s'activer automatiquement.

Méthodes de l'instance :

- `update(deltaSeconds, frame)` : avance la simulation active, au maximum de 0,05 seconde par appel. `frame` fournit notamment `head`, éventuellement `previousHead`, `width`, `height`, `active` et les informations que le placement souhaite recevoir.
- `snapshot()` : copie gelée de l'état et des points, configuration également gelée.
- `drainEvents()` : récupère une fois les événements puis vide la file ; le tableau et ses événements sont gelés.
- `noteDamage()` : initialise la protection locale de 0,8 seconde si une entité existe, sans enlever de Stabilité.
- `interrupt(reason)` : interruption explicite de cycle de vie.
- `destroy()` : destruction logique explicite d'une entité existante ; booléen de succès, aucune récompense.

Les interfaces injectées sont synchrones. Elles doivent fournir des données cohérentes, sans effets sur les autres systèmes. Une garde de révision empêche notamment un contact de ressortir après une interruption effectuée depuis le hook de contact.

Le consommateur futur doit vider les événements à chaque pas. La file est plafonnée à 64 événements et abandonne les plus anciens si elle n'est jamais consommée : elle ne constitue ni un journal persistant ni une file de dégâts à rejouer ultérieurement.

## 5. Placement : contrat seulement

Le module vérifie les coordonnées finies, la dimension minimale de 260 px, les marges de 36 px et la distance minimale de 220 px à la tête, puis exige la validation de `isSpawnSafe`.

Il ne développe **ni grille de candidats, ni parcours du corps, ni évitement de portail/HUD/danger**. Les paramètres de distance au corps et aux portails sont transmis au futur placement, qui devra les vérifier avant de retourner `true`. Une validation toujours vraie dans les fixtures de test ne représente pas un placement sûr utilisable en jeu.

Un refus ne force jamais un point dangereux et ne déclenche pas de recherche à chaque image. La génération augmente uniquement lorsqu'une apparition est acceptée ; elle n'est pas réutilisée après un portail ou une annulation dans la même instance.

## 6. Contact et événements

Le hook de contact n'est appelé que durant les portions de charge. Il reçoit :

- `generation` et `chargeId` ;
- `from` et `to`, positions de l'ennemi sur cette portion ;
- `headFrom` et `headTo`, tête interpolée aux mêmes bornes ;
- `duration`, durée de la portion ;
- `activeFrom` et `activeTo`, fractions de cette portion dans le pas traité ;
- `protected`, état de la protection au début de la portion.

**La fraction renvoyée est locale à la portion**, comprise entre 0 et 1. Les valeurs absentes, non finies ou hors limites ne signalent pas un contact. Le module calcule le point et le temps correspondants, consomme le contact une seule fois et entre en récupération. Le hook est une interface, pas un solveur de collision développé dans ce lot.

La protection est décrémentée jusqu'au temps du contact ; l'événement expose l'état de protection à cet instant. Le futur détecteur doit signaler un contact même protégé, afin que la charge soit consommée sans punition différée. Aucun dégât n'est appliqué ici, protégé ou non.

| Événement | Signification |
|---|---|
| spawned | Apparition acceptée, position et génération disponibles. |
| preparationStarted | Détection et entrée en préparation. |
| chargeStarted | Cible verrouillée, origine et vitesse fixées. |
| chargeMissed | Arrivée à la cible sans contact signalé. |
| firstContact | Premier contact signalé par le hook, position et protection au contact. |
| chargeInterrupted | Préparation ou charge interrompue, avec motif. |
| destroyed | Retrait logique d'une entité existante, sans score. |

Chaque événement porte son temps de simulation, sa génération et son identifiant de charge si applicable. Un contact réussi n'est pas également comptabilisé comme un échec. La destruction répétée ne génère pas un deuxième événement de destruction.

`destroy()` est une commande administrative logique acceptée dans chaque phase d'entité vivante, y compris l'apparition. Elle n'est pas une autorisation de vulnérabilité à l'Impulsion astrale : cette politique appartiendra au futur propriétaire/raccordement Combat. En attente sans entité, ou déjà détruit, elle renvoie `false`.

## 7. Interruptions et reprise

Motifs acceptés : `pause`, `zone-change`, `portal`, `resize`, `recenter`, `game-over`, `session-end`. Un motif inconnu est refusé.

- **Pause :** vider les anciens événements ; annuler une préparation ou charge en cours et placer l'entité en récupération complète, gelée. Dans les autres phases, conserver le temps restant gelé. `update` avec `active:false` signale la suspension ; un appel actif valide permet la reprise.
- **Reprise :** avancer seulement le delta actif fourni, plafonné à 50 ms ; jamais rattraper les secondes réelles de pause. La charge annulée ne repart pas après reprise.
- **Zone, portail, redimensionnement réel, recadrage :** vider les événements, retirer position/verrouillage/vitesse et retourner à une attente de 8 secondes. Le futur orchestrateur doit appeler l'interruption : le module ne lit ni la zone, ni la fenêtre, ni le jeu.
- **Game Over/fin de session :** retrait et instance définitivement arrêtée. Une nouvelle session doit créer une nouvelle instance.
- **Destruction :** supprimer les anciens événements dangereux, retirer l'entité, signaler interruption si nécessaire puis destruction, et attendre le délai de retour. Les minuteries restent gelées si la session est en pause.

La pause de cette livraison suit l'instruction du Lot 1 « une interruption annule la charge », plutôt que la simple reprise de charge envisagée dans l'étude. Ce choix est explicite ; il ne modifie pas la pause du jeu normal puisque le module n'y est pas branché.

## 8. Tests et résultats

**50 fichiers de tests exécutés, 50 réussites : les 49 suites historiques et la nouvelle suite autonome.**

La nouvelle suite couvre :

- Valeurs par défaut, paramètres configurables et rejets explicites de configuration invalide.
- Attente initiale de 8 s, apparition de 0,6 s, observation immobile, seuil de détection 160 px inclus.
- Suivi pendant préparation, verrouillage après 0,8 s, fenêtres de 80–192 px incluses, refus de corridor.
- Charges horizontales et diagonales, vitesse distance/durée, arrivée après 0,6 s, absence de poursuite.
- Échec, succès simulé par le hook, contact unique, récupération complète de 1,5 s, protection de 0,8 s.
- Portion de charge commençant en milieu de pas, interpolation de la tête, fraction locale et temps restant de récupération.
- Interruption de préparation/charge pour zone, portail, resize, recadrage, Game Over et fin de session.
- Pause/reprise, rejet de rattrapage réel, annulation de charge et gel des autres minuteries.
- Destruction dans chaque phase vivante, refus en attente/déjà détruit, retour après 12 s et nouvelle génération.
- Refus d'apparition, délais de nouvelle tentative, dimensions insuffisantes, proximité de tête et bords.
- Simulations à 30/60/120 Hz, pas irréguliers, pas maximal de 50 ms, entrées temporelles ou coordonnées invalides.
- Isolation des instances, copies gelées, consommation unique des événements, interruption depuis le hook.
- Absence d'import du module par le jeu normal et absence d'accès/écriture au stockage pendant les scénarios.

Les historiques valident notamment Combat V1, collisions et récompenses existantes, trois modes, Survie, audio, sauvegardes simulées et rendu des skins. Aucun de leurs fichiers n'a été modifié.

Incidents intermédiaires corrigés : un test de verrouillage à 192 px commençait hors de la portée de détection de 160 px ; la fixture entre maintenant en détection avant de s'éloigner pendant la préparation. Un résidu flottant pouvait faire commencer une nouvelle préparation à la fin exacte d'une récupération ; les bornes temporelles sont normalisées avec une tolérance numérique minime. Aucun échec restant dans la passe complète.

**Ces tests sont logiques et simulés. Ils ne constituent pas une validation de gameplay ou de tactile sur téléphone.** Aucun prototype jouable ni essai visuel n'est livré dans ce lot.

## 9. Limites et risques pour le Lot 2

1. Aucun détecteur de collision continue n'est développé. Le hook devra fournir une fraction de premier contact fiable, même quand la tête et l'ennemi traversent leurs positions entre deux images.
2. Les portions exposées ont leur propre intervalle temporel. Ne pas les envoyer telles quelles au moteur V1, qui interprète `previous/current` sur tout le pas : un adaptateur temporel reste à concevoir et tester au Lot 2.
3. La détection d'observation est échantillonnée sur les pas de simulation, ce n'est pas une détection continue de franchissement de la portée. Aucun solveur de détection supplémentaire n'a été ajouté.
4. Aucun placement complet : corps, portails, HUD et dangers ne sont sûrs que si le futur hook de validation réalise ces vérifications. Les seuils sont préparés, pas prétendument tous appliqués.
5. Pas de mouvement de freinage en récupération. Il faudra une validation distincte si une dérive est finalement souhaitée.
6. Les minuteries configurées sous 50 ms sont volontairement rejetées ; les paramètres validés provisoirement sont tous compatibles avec cette borne.
7. Le futur orchestrateur doit appeler les interruptions de zone/terrain/session et drainer les événements immédiatement. Ne jamais rejouer un ancien `firstContact` après pause ou destruction. Associer aussi l'identité de session aux références conservées hors de cette instance.
8. La protection est un état logique informatif. La perte de Stabilité et le raccordement au signal commun des dégâts ne sont pas activés.
9. La catégorie parasite et le +75 restent refusés/non disponibles dans Combat V1 actuel. Aucune extension de catégorie, confirmation, score ou texte +75 n'a été commencée.
10. Aucun son ou effet ne découle des événements. La vulnérabilité réelle pendant l'apparition et les autres phases reste une politique du futur raccordement, pas de la commande administrative `destroy()`.

## 10. Git et conservation

Avant : dépôt propre sur `main`, HEAD `9d91bda94718d48bbd243b425b56b1af08be5dea`.

Après : même branche et même HEAD. Seulement les trois nouveaux fichiers de ce lot sont non suivis ; aucun fichier suivi existant modifié, supprimé ou remplacé. Les Lots Combat V1 restent intégralement conservés dans leur commit précédent. Tous les fichiers suivis attendus sont présents. Vérification des différences conforme.

Une copie externe du rapport et du journal des tests est fournie pour consultation. Dossier `.git` conservé. **Aucun commit, push ou publication. Aucun Lot 2 commencé. Attendre la validation du joueur.**
