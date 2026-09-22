# NYR

**Slogan :** « Absorbez. Grandissez. Survivez. »

NYR est un jeu autonome de l’écosystème CJAJLK Games. Le joueur y contrôlera une petite créature astrale de type dragon-serpent qui avancera en permanence, absorbera des fragments d’énergie, grandira, évoluera visuellement et tentera de survivre le plus longtemps possible.

## Statut

Prototype PACK 22 — l’Astéroïde mobile de Zone 2 retire 25 points de Stabilité à chaque nouvelle entrée en contact avec la tête de Nyr.

Un contact continu ne provoque qu’une seule perte ; une séparation réarme la détection. La Stabilité reste bornée à zéro. Son état reste interne : aucun HUD, flash de collision, recul ou écran de fin de partie n’est ajouté. À zéro, le prototype continue de tourner ; le game over reste à réaliser dans un prochain pack. Le rendu canvas de l’Astéroïde reste provisoire.

## Vérification

Avec une version récente de Node.js : `node --test tests/automated/*.test.mjs`.
Pour jouer, servir le dossier avec un serveur HTTP local et ouvrir `index.html` dans le navigateur.

## Plateformes et format

- Mobile : orientation paysage.
- PC : format horizontal classique.
- Tous les futurs chemins de fichiers et d’assets devront rester relatifs à la racine du projet.

## Écosystème CJAJLK

NYR devra plus tard reconnaître le profil global CJAJLK et son solde CJ partagé. Cette intégration n’est pas réalisée dans le PACK 0 : le projet ne crée aucun profil CJ concurrent et ne contient encore aucun raccord au compte global.

## Documents de référence

- Canon : `docs/canon/NYR_DIRECTION_V1_CANON_2026-09-09.txt`
- Références visuelles : `assets/images/references/`
- Règles Work : `docs/work/WORK_RULES.md`
- Checkpoints : `docs/checkpoints/`
