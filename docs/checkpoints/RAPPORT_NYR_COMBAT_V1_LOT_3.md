# NYR — COMBAT V1 — LOT 3

Date : 18 octobre 2026. Branche : `main`.
Statut : implémentation et vérifications simulées terminées ; validation de CJ sur téléphone réel attendue.

## Fonctionnement livré

- Bouton **IMPULSION** en bas à droite, uniquement pendant le jeu actif. Hauteur de la cible : 48 px ; groupe compact de 136 × environ 84 px. Marges tenant compte des zones de sécurité. La surface du Canvas reste inchangée.
- Valeur `0/20` à `20/20` et barre directement au-dessus du bouton. Le moteur du Lot 1 reste la seule source d'énergie : fragments normaux uniquement, saturation à 20, conservation entre zones, consommation immédiate après attaque acceptée.
- Aspect discret désactivé sous 20 ; bord cyan et lueur violet/cyan à pleine charge. L'animation décorative de disponibilité est supprimée avec `prefers-reduced-motion`.
- Espace sur PC : une tentative par pression ; répétitions et touche maintenue ignorées, défilement empêché pendant son utilisation en jeu. Champs de saisie et autres boutons focalisés conservent leur comportement. Le bouton d'impulsion focalisé ne produit pas de double activation.
- Pointeur : déclenchement sur la pression initiale du bouton ; les clics de compatibilité sont ignorés. Le clic d'assistance sans pointeur reste pris en charge. Un geste commencé sur le Canvas ne peut pas tirer en traversant le bouton. Les deux doigts de direction et d'attaque sont indépendants.
- Anneau Canvas cyan/violet à centre fixe : il lit directement `snapshot()` du moteur du Lot 2, y compris rayon et temps écoulé. Portée logique maximale 110 px et durée 0,4 seconde ; opacité décroissante. Aucun second chronomètre offensif, son, flash, secousse ou particule avancée.
- L'anneau se fige pendant la pause et est annulé aux transitions existantes. Les commandes sont refusées pendant ces transitions. Bouton, jauge et indication sont cachés en menus, narration, pause, portrait bloqué et fin de partie.
- En Histoire, la première pleine charge affiche pendant quatre secondes de simulation active une indication non bloquante : « IMPULSION PRÊTE — Appuie sur IMPULSION pour attaquer ! » sur mobile ; « Appuie sur Espace » sur PC. Une fois par session, sans sauvegarde permanente.
- Écouteurs des commandes et abonnements de session nettoyés à la fermeture. Nouvelle partie : énergie nulle et découverte réinitialisée.

## Fichiers du Lot 3

Créés :
- `src/ui/impulseDisplay.js` : bouton, barre, texte d'énergie et découverte Histoire.
- `src/systems/impulseInput.js` : commande Espace, pointeur, clic d'assistance et nettoyage.
- `src/gameplay/astralImpulseRenderer.js` : rendu de l'état offensif réel.
- `tests/automated/astralImpulseUi.test.mjs` : commandes isolées, direction, deux doigts, capture, HUD, découverte et rendu.
- `tests/automated/astralImpulseUiRuntime.test.mjs` : intégration dans le vrai démarrage du jeu, trois modes à 30/60/120 Hz.
- `docs/checkpoints/RAPPORT_NYR_COMBAT_V1_LOT_3.md` : ce rapport.

Modifiés :
- `src/main.js` : branchement des trois modules, affichage, libération des gestes et nettoyage de session ; ajouts sur les travaux locaux des Lots 1/2.
- `src/systems/pointerInput.js` : libération ciblée du toucher et de la capture lors des interruptions, protection du premier doigt de direction, désabonnement à la fermeture.
- `assets/css/main.css` : placement, cible de 48 px, barre, états et mouvement réduit.
- `tests/automated/pack30Replay.test.mjs` : transmission optionnelle des événements et branche de test Lot 3, sans supprimer les scénarios précédents.

## Diagnostic et corrections ciblées

L'ancien système de direction gardait son identifiant de toucher pendant une suspension. Il prenait aussi le dernier doigt reçu comme doigt de direction. Un test dédié reproduit ces états. La correction ne change ni `aimAt`, ni la vitesse, ni le calcul des virages : elle libère le geste interrompu et conserve le premier doigt jusqu'à sa fin. Les passages de portail et les changements réels de dimensions appellent cette même libération.

La revue finale a identifié un appel de libération trop large à chaque synchronisation d'écran. Il est maintenant limité aux changements réels de dimensions. Un test vérifie qu'un événement de plein écran sans changement de surface conserve le geste de direction.

Un contrôle de rayon a initialement utilisé une égalité stricte à 110 : le moteur existant retourne 109,99999999999997 après huit additions de 0,05. Le test emploie une tolérance numérique ; le moteur du Lot 2 n'a pas été modifié.

## Tests automatisés

Avant modification : **46 fichiers de tests exécutés, 46 réussis**, conformément à la référence du Lot 2.

Après implémentation : **48 fichiers de tests exécutés, 48 réussis**. Cela comprend tous les tests précédents et les deux nouvelles suites.

Après la dernière correction de libération du toucher et le renforcement des assertions : cinq suites pertinentes réexécutées, toutes réussies (`astralImpulseUi`, `astralImpulseUiRuntime`, `astralImpulseCombatRuntime`, `mobileUi`, `pack30Replay`). `git diff --check` conforme.

Couverture ajoutée :
- Espace simple, maintien, répétition, reprise, saisie, modificateurs, autres boutons et bouton d'impulsion focalisé.
- Pression sur le bouton, rejet des clics doublons, activation d'assistance, glissement sans pression initiale, deux doigts, absence de vol de direction et prévention du comportement tactile par défaut.
- Capture libérée à la suspension et à la fermeture ; ancien geste sans effet après reprise ou portail ; événement de plein écran sans redimensionnement conservant le geste.
- Énergie 0 à 20, disponibilité, retour immédiat à zéro, refus en transition, conservation au portail, nouvelle session et fin de partie.
- Centre/rayon/opacité issus de l'état réel, durée et portée du Lot 2, pause figée, fin et annulation sans anneau résiduel.
- Découverte une seule fois et variantes mobile/PC ; nettoyage des anciens boutons et absence d'écriture persistante par la commande.
- Intégration Histoire, Voyage Infini et Survie à 30, 60 et 120 Hz.

La suite complète conserve notamment les vérifications des collisions, dégâts, neutralisations et +50, sauvegardes/statistiques, monnaies et défis, audio, orientation et 576 combinaisons de rendu Léviathan/autres skins. Aucun moteur de collision, skin ou ressource sonore n'est modifié par ce lot.

## Validation visuelle — navigateur simulé uniquement

Formats inspectés : **568 × 320, 667 × 375, 844 × 390, 932 × 430 et 1280 × 720**.

Description précise du HUD : groupe sombre arrondi en bas à droite, compteur centré en petit texte, fine barre horizontale violet/cyan puis bouton IMPULSION. Largeur du groupe : 136 px ; hauteur mesurée : 83,56 px ; bouton : 122,81 × 48 px. Sans encoche simulée : marge droite 12 px et marge basse 8 px. À 568 × 320, groupe de x=420 à 556 et y=228,44 à 312 ; bouton de y=257,41 à 305,41. PAUSE reste à gauche, x=8 à environ 69, y=272 à 316. Aucun chevauchement entre ces commandes. La Stabilité et le compteur de fragments restent en haut à droite. À 844 × 390, le bouton est de x=702,59 à 825,41 et y=327,41 à 375,41. À 932 × 430, groupe de x=784 à 920 et y=338,44 à 422.

Sur PC 1280 × 720, même groupe en bas à droite ; le message Histoire apparaît juste au-dessus et indique Espace. Sur 568 × 320, le message tactile tient sur deux lignes au-dessus du groupe, sans intercepter les gestes.

L'accueil, MODES, OPTIONS, BOUTIQUE, PAUSE et le gameplay ont été parcourus. Le réglage sonore reste uniquement dans OPTIONS. Espace sur le bouton focalisé a fait passer la jauge de 20/20 à 0/20 sans déplacement de page. Portrait pendant PAUSE affiche l'écran de rotation ; le retour au paysage conserve la pause et laisse l'impulsion masquée jusqu'à REPRENDRE.

Pour inspecter les états chargés sans attendre une collecte manuelle, un serveur de validation extérieur au dépôt absorbe vingt vrais fragments via leurs callbacks et peut figer une scène. L'anneau a été inspecté avec un état réel à 0,2 seconde, soit un rayon de 55 px. Cette scène instrumentée vérifie la présentation ; elle ne remplace pas les tests temporels et les tests d'intégration du jeu normal.

L'entrée plein écran a été sollicitée dans le navigateur de test ; son environnement est revenu automatiquement à l'état fenêtré. Le traitement des événements et des changements de surface est couvert automatiquement. La tenue du plein écran sur Safari/Chrome mobile reste à vérifier matériellement.

L'export des captures a échoué dans l'outil de navigateur. Le présent rapport fournit donc la description et les mesures du HUD autorisées par le cahier des charges ; les vues ont été inspectées à l'écran.

## Préservation et état Git

Avant : branche `main`, HEAD `214e3eddff60a0669669ab0c2fac23e7e2558b73`, Lots 1 et 2 locaux non commités (8 fichiers suivis modifiés et 9 fichiers non suivis).

Après : même branche et même HEAD. Les modifications locales précédentes sont conservées. Comparaison des empreintes prises avant Lot 3 : seuls `src/main.js` et le montage de tests `tests/automated/pack30Replay.test.mjs` ont reçu les ajouts prévus ; les quinze autres fichiers locaux des Lots 1/2 sont identiques octet pour octet. Les modules d'énergie, combat et propriétaires de dangers restent inchangés, ainsi que leurs tests et rapports autonomes.

Le Lot 3 ajoute six fichiers et modifie quatre fichiers. Les modifications accumulées restent locales. Dossier `.git` conservé. Aucun reset, merge, nettoyage destructif, commit, push ou publication. Aucun changement de CJ universels/CJEngine, prix, sauvegardes utilisateur, ressources, skins ou transformations. Les fixtures utilisent un stockage isolé de test.

## Limites et validation restante

- Aucun essai sur téléphone physique. Les encoches réelles, le tactile à deux doigts, les interruptions du navigateur et le plein écran matériel doivent être validés par CJ.
- Les tests de gestes reposent sur des événements simulés et ne garantissent pas tous les comportements propres aux navigateurs mobiles.
- Le bouton occupe un petit espace en bas à droite au-dessus du jeu ; un fragment mobile peut passer derrière ce HUD comme derrière les autres indicateurs. Aucun système d'apparition ou de collision n'a été déplacé pour ce lot.
- Aucun son offensif ni effet avancé ajouté. Aucun Lot 4 commencé.

**Arrêt après Lot 3. Attendre la validation de CJ sur téléphone avant toute suite.**
