# NYR

**Slogan :** « Absorbez. Grandissez. Survivez. »

NYR est un jeu autonome de l’écosystème CJAJLK Games. Le joueur y contrôlera une petite créature astrale de type dragon-serpent qui avancera en permanence, absorbera des fragments d’énergie, grandira, évoluera visuellement et tentera de survivre le plus longtemps possible.

## Statut

PACK 53 — Mode Survie implémenté, en attente des essais réels de CJ sur téléphone.

Survie se débloque après la première conclusion réussie de l’Histoire. Il reprend les quatre zones et les portails du Voyage Infini, avec une défaite immédiate par autocollision et une vitesse de 100 %, 105 %, 110 %, 115 %, puis 120 % selon le cycle. Trois défis permanents accordent au total 250 Éclats, une seule fois. Les records Survie sont séparés.

Les contrôles existants restent souris sur PC et toucher/glisser sur téléphone. Aucun contrôle clavier ou manette de déplacement n’existe dans ce socle ; le PACK 53 n’en ajoute pas. Voir `docs/checkpoints/CHECKPOINT_PACK_53.md` pour les vérifications et limites de livraison.

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
