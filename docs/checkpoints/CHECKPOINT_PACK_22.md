# CHECKPOINT — PACK 22 — Dégâts de l’Astéroïde

Date : 2026-09-22
État : TERMINÉ — vérification automatisée réussie
Pack suivant : PACK 23 NON COMMENCÉ

## Périmètre

Suite demandée par l’utilisateur : appliquer une perte de 25 points de Stabilité par nouveau contact avec l’Astéroïde.

- Configuration centralisée : `asteroidContactDamage: 25`.
- Méthode `applyAsteroidContact()` dans le module de Stabilité ; minimum zéro.
- Raccordement dans `main.js` au signal existant `onHeadContactStarted`.
- Verrou de contact du PACK 21 conservé : un contact continu ne répète pas les dégâts ; une séparation autorise un nouveau dégât.
- Collision limitée à la tête ; le système Astéroïde reste indépendant du module de Stabilité.
- Score, croissance, mouvement, progression, assets et rendu inchangés.

## Fichiers

Modifiés : `src/gameplay/nyrStability.js`, `src/main.js`, `tests/automated/pack20Stability.test.mjs`, `README.md`.

Créés : `tests/automated/pack22AsteroidDamage.test.mjs`, ce checkpoint.

Le test PACK 20 a été adapté pour autoriser la nouvelle méthode publique et la configuration de dégâts. Ses vérifications de stabilité constante sans contact restent présentes. Les checkpoints précédents décrivent leur version historique.

## Validation exécutée

`node --test tests/automated/*.test.mjs` : 6 fichiers de tests réussis, 0 échec.

Nouveaux scénarios automatisés aux dimensions 1366 × 768 et 844 × 390, à 30, 60 et 120 mises à jour par seconde :

- Aucun dégât en Zone 1 ou sans contact en Zone 2.
- Premier contact : 100 → 75.
- Maintien pendant trois secondes simulées : reste à 75.
- Suspension via l’état runtime : position et Stabilité inchangées ; reprise sans second dégât sur le même contact.
- Séparations et nouveaux contacts : 50, 25, 0, puis 0.
- Corps seul et revalidation des dimensions sans dégâts.
- Score et progression inchangés ; instantanés immuables.
- Stabilité initiale de 10 : un contact donne 0.
- Vérification du raccordement dans le code de `main.js`.

Il s’agit de tests de modules et de vérifications de code ; aucun nouveau contrôle visuel ou test interactif sur téléphone n’a été effectué pour ce pack. Les fichiers visuels n’ont pas été modifiés.

## Limites de ce pack

Stabilité interne uniquement. Aucun HUD, effet de collision, recul, invulnérabilité, soin, corruption ou écran de fin de partie ajouté. À zéro, la simulation continue : la gestion du game over canonique reste un travail ultérieur, pas une mécanique finalisée dans ce pack.

Archive originale PACK 21 conservée. Aucun déploiement ni modification d’un autre projet.
