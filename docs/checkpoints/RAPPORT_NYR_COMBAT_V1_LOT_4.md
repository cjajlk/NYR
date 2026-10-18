# NYR — COMBAT V1 — LOT 4

Date : 18 octobre 2026.
Statut : Lot 4 terminé ; validation du joueur sur téléphone attendue.

## Résultat

Le grand bouton rectangulaire est remplacé par un contrôle circulaire : **44 × 44 px visibles dans une cible tactile de 48 × 48 px**. Le groupe complet mesure 52 × environ 70,38 px, contre 136 × environ 83,56 px au Lot 3. La jauge 0/20 et sa barre de 52 px restent juste au-dessus. Le symbole local représente une onde concentrique avec un éclair central ; nom accessible : « Impulsion astrale ». Le contrôle reste en bas à droite, avec les marges de sécurité existantes. Aucun autre élément du HUD n'est déplacé et le Canvas conserve sa surface.

## Fichiers modifiés

- `assets/css/main.css` : bouton circulaire, cible tactile, jauge compacte, états et lumière discrète respectant le mouvement réduit.
- `src/ui/impulseDisplay.js` : symbole décoratif et nom accessible ; logique de jauge et découverte conservée.
- `src/gameplay/astralImpulseRenderer.js` : anneau violet de 5 px, cœur cyan de 2 px, petite lueur de départ limitée à 12 px et aux 0,1 premières secondes. Aucun flash d'écran.
- `src/main.js` : branchement de la présentation sur les commandes et les confirmations existantes, nettoyage à toutes les annulations déjà prévues.
- `src/systems/gameplayAudio.js` : deux nouvelles ressources dans le mixage existant, plafond spécifique de deux voix d'impulsion et arrêt ciblé de ces voix.
- `tests/automated/astralImpulseUi.test.mjs` : nom accessible/symbole et lecture du trait réel dans le contexte simulé du rendu enrichi.
- `tests/automated/astralImpulseUiRuntime.test.mjs` : vérification de l'armement par commande et de l'annulation à la rotation.
- `tests/automated/gameplayAudio.test.mjs` : décompte des ressources depuis le manifeste, tous les contrôles des sons précédents conservés.
- `tests/automated/pack30Replay.test.mjs` : exposition de la présentation uniquement pour les scénarios d'intégration d'interface.

## Fichiers créés

- `assets/ui/impulse.svg` : symbole local, sans dépendance extérieure.
- `src/gameplay/impulsePresentation.js` : adaptateur de présentation, confirmation des effets et rendu des retours de destruction.
- `assets/audio/sfx/nyr_impulse.wav` : souffle/pulsation futuriste à modulation de fréquence, 0,28 s, 24 740 octets, crête 4 517/32 767.
- `assets/audio/sfx/nyr_impulse_neutralized.wav` : réponse spatiale plus légère, 0,14 s, 12 392 octets, crête 1 874/32 767.
- `scripts/generateImpulseAudio.mjs` : génération reproductible des deux nouveaux WAV uniquement, PCM mono 44,1 kHz/16 bits.
- `tests/automated/astralImpulsePresentation.test.mjs` : confirmation, refus, audio, plafonds, mouvement réduit, vrai propriétaire de corruption et charge de présentation bornée.
- `tests/manual/impulseLayout.js` : assertions de dimensions réelles/chevauchements dans le navigateur et mesure de cadence.
- `docs/checkpoints/RAPPORT_NYR_COMBAT_V1_LOT_4.md` : ce rapport.

## Effets et limites de coût

Le moteur du Lot 2 reste la source unique du rayon, du centre et du temps offensif : **110 px maximum, 0,4 seconde, centre fixe**. L'adaptateur transmet les intersections et les confirmations sans recalculer les collisions. Il mémorise seulement la position de la cible présentée par son propriétaire.

Une intersection ne suffit pas à afficher un retour : seule une neutralisation confirmée après une attaque du joueur produit le petit « +50 » et les particules. Ce texte ne distribue aucun point ; la récompense existante reste attribuée une seule fois par le moteur.

Au maximum trois retours simultanés, chacun de quatre particules, soit **12 particules** et trois textes. Durée du retour : 0,55 seconde. Les confirmations groupées partagent un son, avec un intervalle minimum de 0,12 seconde et deux voix maximum pour les nouveaux effets. Le plafond audio général existant reste inchangé. Une tentative refusée ne joue aucun son et ne crée aucun effet supplémentaire.

Avec `prefers-reduced-motion`, la lumière décorative du bouton, la lueur de départ, les particules et le déplacement du texte sont supprimés. L'anneau essentiel garde la géométrie réelle du combat et le +50 reste discret, fixe et décroissant.

Pendant la pause, la présentation visuelle est figée par la boucle existante. Les changements de zone, dimensions, fin de partie et fermeture de session annulent les retours et arrêtent les deux nouveaux types de sons. Les autres sons conservent leur comportement, notamment celui des portails. Aucun son offensif n'est créé par une neutralisation interne sans attaque du joueur.

## Audio et préférences

Les deux fichiers sont ajoutés au même service audio que les fragments et les portails. Ils respectent son déverrouillage, l'état actif, la page cachée, le réglage SON dans OPTIONS et son gain maître existant. Aucun réglage, sauvegarde ou bouton sonore supplémentaire. Les sons non chargés sont abandonnés, sans relecture différée.

Les neuf anciens WAV sont inchangés octet pour octet. Leur logique de choix et de volume n'est pas modifiée. L'équilibre perceptif des nouveaux sons reste à juger en jeu, notamment sur le haut-parleur du téléphone.

## Tests et résultats

Avant modification : **48 suites sur 48 réussies**.

Dernière passe complète : **49 suites sur 49 réussies**, y compris l'intégralité des Lots 1 à 3. Après l'ajout de l'arrêt ciblé des nouvelles voix, les suites présentation/audio/intégration d'interface ont été relancées avec succès. `git diff --check` conforme.

Couverture ciblée :
- Commande refusée sans son ni nouveau retour ; commande acceptée avec consommation existante.
- Intersection sans effet avant confirmation ; confirmation unique, récompense +50 préservée ; cinq confirmations simultanées avec plafond de trois retours et un son de neutralisation.
- Destruction d'une vraie corruption via son propriétaire : retrait de la cible, aucun dégât de contact, récompense unique et retour au bon emplacement.
- Extinction des particules et de la lueur en mouvement réduit ; expiration et annulation des retours.
- Deux voix offensives au maximum ; conservation des autres sons, arrêt ciblé, SON OFF, préférence persistée, pause et page cachée.
- Tests d'intégration des trois modes à 30/60/120 Hz : clavier, deux doigts direction/attaque, zone, rotation, pause, plein écran simulé, fermeture et nouvelle session.
- Tous les contrôles historiques de collisions, esquive exclue après destruction, autocollision mortelle en Survie, corruption/poche/ondes/météorites, statistiques, monnaies, audio et skins.

Un test de charge de présentation exécute 36 000 images simulées avec des groupes répétés de cinq confirmations, retours et particules plafonnés : environ 24 à 32 ms sur cette machine. Le contexte de dessin y est simulé : ce chiffre vérifie surtout le coût borné du code, pas les performances d'un téléphone.

La première exécution du nouveau scénario de corruption avait une fixture incomplète : absence de `trail`, puis absence du callback activant les corruptions. Ces préparations de test ont été corrigées ; aucun moteur n'a été adapté pour les faire passer. La passe complète finale ne présente aucun échec.

## Contrôle de disposition en navigateur

Les assertions du module `tests/manual/impulseLayout.js` ont été exécutées dans une scène de jeu active aux cinq formats, après vérification de la taille effective du viewport :

| Format | Disque visible | Cible tactile | Jauge | Chevauchement avec commandes/HUD vérifiés |
|---|---|---|---|---|
| 568 × 320 | 44 × 44 | 48 × 48 | 52 px | Aucun |
| 667 × 375 | 44 × 44 | 48 × 48 | 52 px | Aucun |
| 844 × 390 | 44 × 44 | 48 × 48 | 52 px | Aucun |
| 932 × 430 | 44 × 44 | 48 × 48 | 52 px | Aucun |
| 1280 × 720 | 44 × 44 | 48 × 48 | 52 px | Aucun |

À 568 × 320, cible de x=506 à 554, y=264 à 312 ; disque de x=508 à 552, y=266 à 310. Groupe de x=504 à 556 et y=241,63 à 312. PAUSE reste en bas à gauche ; la Stabilité et les fragments restent en haut à droite. À 667 × 375, cible de x=605 à 653 et y=319 à 367. À 844 × 390, cible de x=782 à 830 et y=334 à 382. Hors encoche simulée, le groupe conserve 12 px de marge droite et 8 px de marge basse ; les variables de zones de sécurité restent appliquées.

Les vues du contrôle chargé, du retour +50/particules et de l'anneau ont été inspectées dans le navigateur. Le groupe n'a plus de grand panneau opaque. L'export local des captures a échoué dans l'outil de navigateur ; les mesures et résultats DOM sont donc consignés ici.

Une première série automatisée de vues utilisait la taille par défaut à l'ouverture des nouveaux onglets. Elle n'a pas été retenue. La série ci-dessus applique la taille après ouverture et vérifie explicitement les dimensions effectives avant d'accepter le résultat.

## Fluidité en navigateur simulé

Sur une scène à 568 × 320, avec mouvement réel et impulsion/retour de neutralisation actifs au départ, mesure de 90 intervalles d'images :
- Moyenne des 30 premiers : **20,010 ms**.
- Moyenne des 60 suivants : **20,003 ms**.
- Intervalle maximal : **20,200 ms**.
- Intervalles supérieurs à 50 ms : **0**.
- Aucune erreur console relevée dans cette scène.

Pas de dégradation notable observée dans ce test court, à la cadence de cet environnement. Les scènes chargées utilisées pour les contrôles visuels sont instrumentées à l'extérieur du dépôt ; elles ne modifient ni les sauvegardes réelles ni le produit. Les cibles de démonstration visuelle sont synthétiques ; le retrait d'un vrai danger est vérifié séparément avec son propriétaire dans les tests automatisés.

## Préservation et Git

Avant : dépôt propre sur `main`, HEAD `adcc0b7fb65bf82aa8d4407c8d3e90dcdf3bb413` ; Lots 1 à 3 déjà commités lors de la livraison précédente.

Après : même branche et même HEAD, changements du Lot 4 uniquement locaux. Neuf fichiers suivis modifiés et huit fichiers créés, rapport inclus. Dossier `.git` conservé ; aucun commit, push, publication ou nettoyage destructif.

Comparaison des empreintes avant/après : les modules d'énergie et de combat, tous les propriétaires de dangers, le score, les transitions, le mouvement et les entrées tactiles du Lot 3 sont inchangés. Les anciens sons et sprites sont également inchangés. Les ajouts de présentation dans `main.js` appellent le même moteur et les mêmes confirmations. Aucun fichier CJEngine/CJ universels, sauvegarde, économie, skin ou transformation n'est modifié.

## Validation restante

**Tests sur navigateur simulé uniquement pour ce Lot 4.** Le retour de validation physique du Lot 3 a été pris en compte, mais il ne valide pas automatiquement ce nouveau bouton et ces sons.

CJ doit encore juger la taille, le symbole, les gestes à deux doigts, les encoches et interruptions réelles, la lisibilité des effets ainsi que le mixage sur téléphone. La mesure de fluidité courte ne remplace pas une mesure matérielle sur téléphone ni une partie prolongée. Comme tout HUD superposé, le petit disque reste dans un coin de la surface de jeu ; aucune mécanique de déplacement ou d'apparition n'a été changée pour l'éviter.

**Lot 4 terminé. Aucun autre lot commencé. Attendre la validation du joueur.**
