# Checkpoint — PACK 2

**Date :** 10 septembre 2026  
**Statut :** terminé et vérifié

## Fichiers créés

- `src/core/runtimeState.js`
- `src/core/displayManager.js`
- `src/ui/orientationOverlay.js`
- `docs/checkpoints/CHECKPOINT_PACK_2.md`

## Fichiers modifiés

- `index.html`
- `assets/css/main.css`
- `src/main.js`
- `README.md`

`src/core/appConfig.js` a été conservé sans modification.

## Architecture retenue

- `runtimeState.js` conserve les raisons de suspension et expose une API neutre : `isRuntimeActive()`, `getRuntimeState()`, `suspendRuntime(reason)`, `resumeRuntime(reason)` et `onRuntimeStateChange(listener)`.
- `displayManager.js` redimensionne le canvas depuis la taille réelle de son conteneur, conserve sa taille CSS et adapte sa définition interne au `devicePixelRatio`, plafonné à 3.
- `orientationOverlay.js` crée et contrôle uniquement le message demandant de tourner l’appareil.
- `main.js` assemble ces fondations, écoute `resize` et `orientationchange`, puis synchronise affichage et état d’exécution sans boucle de jeu.
- Le canvas dessine une seule fois, lors de chaque dimensionnement, un fond et un repère technique statiques. Il ne contient aucun sprite ni objet de gameplay.

## État actif et suspendu

- En paysage, l’overlay est masqué et la raison `portrait-orientation` est retirée : le runtime est actif.
- Sur une fenêtre mobile en portrait, l’overlay est visible et la raison `portrait-orientation` est ajoutée : le runtime est réellement suspendu.
- Le retour au paysage enlève cette raison et rend le runtime actif.
- Les appels répétés avec le même état sont sans effet secondaire et les futurs packs pourront consulter l’état avant toute exécution.

## Tests réalisés

- Ouverture avec un serveur HTTP local temporaire : réussie.
- Chargement local de la page, de la feuille CSS et des cinq modules JavaScript : réussi.
- Ressource distante obligatoire ou CDN : aucun.
- Validation syntaxique de tous les modules JavaScript : réussie.
- Exécution complète du point d’entrée dans un environnement DOM/canvas de contrôle : aucune erreur JavaScript bloquante.
- Desktop 1366 × 768 : canvas présent, dimensions CSS contenues dans la surface et définition interne adaptée au DPR.
- Paysage mobile 844 × 390 : canvas correctement redimensionné, overlay masqué et runtime actif.
- Portrait mobile 390 × 844 : overlay visible et runtime suspendu.
- Redimensionnement portrait 412 × 915 puis retour paysage 915 × 412 : aucune erreur ; overlay masqué et runtime redevenu actif.
- Événement `orientationchange` supplémentaire : traité sans erreur.
- DPR 2, 2,5 et 3 : définition interne du canvas multipliée sans modifier sa taille CSS attendue.
- Recherche de chemins absolus : aucun trouvé.
- Vérification du périmètre persistant : aucun fichier modifié hors de `NYR/`.

La simulation des formats mobiles ne remplace pas un futur test sur téléphone réel.

## Contrôle des interdictions

- Aucun déplacement, corps, segment, croissance, évolution ou animation de Nyr.
- Aucun fragment, collectible, spawn, score, combo, stabilité, collision, dégâts ou mort.
- Aucun Dash, HUD gameplay, caméra, zone, danger, événement, mini-carte ou timer de partie.
- Aucune boucle de jeu et aucun `requestAnimationFrame`.
- Aucun profil CJ, stockage joueur, gain CJ, audio, réseau, serveur ou multijoueur.
- Aucun Capacitor, npm, framework, bundler ou CDN.
- Aucun GitHub, publication ou déploiement.
- Aucun autre projet CJAJLK modifié.

## Arrêt du pack

Le PACK 2 est terminé. Le PACK 3 n’a pas été commencé.
