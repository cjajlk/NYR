# NYR — Interface mobile, audio et orientation

13 octobre 2026. Base : main, 8cbf69e5633322fe4b5f2c97936213ca1a725656. État initial propre, aucune modification locale préexistante. CJ demande le commit et le push après tests dans la dernière phrase de sa demande; cette instruction remplace l'interdiction de commit/push présente plus haut. Aucune publication GitHub Pages lancée.

## Corrections

Le bouton Son flottant a été retiré intégralement. La commande ON/OFF apparaît uniquement dans OPTIONS, dans le menu existant. Elle n'est plus visible sur l'accueil, MODES, BOUTIQUE, le gameplay ou PAUSE. Les autres commandes conservent leurs positions CSS.

L'audit a constaté que le choix audio précédent était uniquement en mémoire et qu'aucun réglage de volume n'existait. Le gain existant de 0,65 reste inchangé. ON/OFF est désormais conservé au rechargement sous la clé séparée `nyrAudioPreferencesV1`, sans toucher aux sauvegardes de jeu ou au profil CJ. Si le stockage est indisponible ou invalide, le jeu reste utilisable. Tous les WAV et leurs déclenchements restent inchangés, notamment fragments V2, dangers et portails.

L'écran portrait contient un SVG local léger montrant un téléphone qui tourne et une flèche lumineuse, le titre « TOURNEZ VOTRE TÉLÉPHONE » et « NYR se joue en mode paysage. ». Il réutilise le fond spatial existant. Aucun asset externe ni animation obligatoire.

La détection distingue les appareils mobiles (signal mobile du navigateur, Android/iOS, iPad à identité Mac tactile ou pointeur tactile principal sans identité PC) d'une fenêtre PC étroite. Un PC Windows tactile n'est pas bloqué pour sa seule forme de fenêtre. Sur mobile, un viewport ou une surface de jeu plus haute que large suspend le runtime. Retour automatique au paysage, sans retirer la raison de suspension `user-pause`.

L'écran couvre le HUD et les commandes. Tous les autres enfants du conteneur de jeu deviennent `inert`, et l'ancien focus est retiré pour empêcher les interactions sous l'écran. Les marges de sécurité sont respectées dans le CSS; `viewport-fit=cover` active leur prise en compte sur les téléphones compatibles.

## Fichiers

- `src/main.js` : retrait du bouton flottant, passage de l'audio à OPTIONS, détection mobile et inhibition des commandes en portrait.
- `src/ui/mainMenu.js` : commande Son uniquement sur la page OPTIONS.
- `src/systems/gameplayAudio.js` : conservation du choix ON/OFF dans une préférence dédiée; lecture et volume inchangés.
- `src/ui/mobileOrientation.js` : nouveau prédicat de détection mobile/portrait.
- `src/ui/orientationOverlay.js` : illustration et textes de l'écran dédié.
- `assets/images/ui/rotate-phone.svg` : illustration locale.
- `assets/css/main.css` : écran spatial, marges de sécurité, empilement et retrait des styles du bouton flottant.
- `index.html` : viewport compatible avec les zones de sécurité.
- `tests/automated/mobileUi.test.mjs` : nouvelle suite dédiée aux préférences, pages, rotation et distinction PC/mobile.
- `tests/automated/pack25DynamicViewport.test.mjs` et `pack30Replay.test.mjs` : navigateurs simulés identifiés explicitement comme mobiles pour leurs scénarios de rotation; extension du banc d'essai.
- `tests/automated/pack17ScoreDisplay.test.mjs` et `pack29StabilityHud.test.mjs` : assertions adaptées au niveau d'affichage de l'écran portrait, désormais au-dessus de tout le HUD.
- Ce checkpoint.

## Tests et contrôles

Suite complète : `node --test tests/automated/*.test.mjs` — **41 fichiers passent, aucun échec**. Les tests ciblés mobile/audio ont également été rejoués après le dernier ajustement de la distinction PC tactile/mobile. `git diff --check` conforme.

Scénarios dédiés : préférence OFF persistante, stockage indisponible, absence du bouton flottant, Son uniquement dans OPTIONS, accueil/OPTIONS/BOUTIQUE/MODES/gameplay/PAUSE, inhibition des contrôles en portrait, retour à la même page, rotation pendant une pause à 30/60/120 Hz sans progression, écran PC étroit et PC tactile. Les tests audio vérifient encore la lecture de chaque famille de sons, les variantes, la coupure et les erreurs éventuelles.

Contrôles navigateur isolés du profil réel : appareil mobile simulé à 390 × 844, 360 × 800, 430 × 932, 320 × 568 et paysages correspondants; PC étroit 320 × 568 et paysage 844 × 390. Illustration, titre et sous-texte visibles sur le petit écran. OPTIONS, BOUTIQUE, MODES, gameplay et PAUSE contrôlés. Sauvegarde de Son OFF confirmée après rechargement. Pause conservée après rotation. Aucune erreur de console relevée. Captures portrait et OPTIONS fournies.

Mécaniques, collisions, nouveaux dangers, skins, Éclats, CJ et données de progression non modifiés. Dossier `.git` conservé.

Ces contrôles ne remplacent pas la validation par CJ sur téléphone réel, notamment les encoches, les interruptions du navigateur mobile et le ressenti audio. Le commit et le push sont effectués après ces tests conformément à la demande finale de CJ.
