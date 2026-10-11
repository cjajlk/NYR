# PACK 53 — Mode Survie

Date : 11 octobre 2026.
Statut : implémenté et contrôlé automatiquement ; validation CJ sur téléphone en attente.
État Git initial : propre, HEAD ae343db. Aucun commit ni push effectué.

## Périmètre livré

- Troisième mode débloqué par le reçu permanent de conclusion Histoire déjà existant.
- Quatre zones, portails et cycles existants réutilisés, sans nouvelle zone ni ennemi.
- Vitesse Survie : 95 px/s de référence multipliée par 1, 1.05, 1.10, 1.15, puis 1.20. Changement au cycle suivant uniquement. Les accélérations de Zone 3 et du Vide des autres modes restent propres à ces modes. En Survie, les dangers du Vide restent au premier palier existant, sans augmentation de fréquence au fil du temps.
- Autocollision physique : quatre segments voisins exclus, rayon 10.5 px pour un espacement de 14 px. Les positions sont interpolées sur la trajectoire physique, sans sprites ni ondulation graphique. Le corps non encore matérialisé sur une trajectoire courte ne participe pas à la collision.
- Les portails existants ne téléportent pas le corps. Le recentrage technique de bord efface déjà la trajectoire tout en conservant le temps et la longueur ; aucune trajectoire fantôme n’est ajoutée. La pause ne modifie pas les positions et remet l’horloge de frame à zéro.
- Défis permanents : 300 secondes actives, 80 segments, un cycle terminé. Récompenses respectives 50, 75, 125 Éclats ; attribution automatique lors des événements de Survie. La fin de partie n’attribue aucun gain additionnel.
- Reçus et balance écrits ensemble dans la sauvegarde existante `nyrWeeklyChallengesV1`, avec un champ additif `survival` conservé lors des changements de semaine. Les compteurs hebdomadaires ne sont pas alimentés par Survie. Les anciennes sauvegardes, l’Histoire, les achats et l’équipement sont conservés.
- Records sous `nyrSurvivalStatisticsV1` : score, temps, longueur, cycles maximum, nombre de parties terminées ou quittées. Une partie finalisée ne compte qu’une fois.
- Fin de partie : cause, score, temps, fragments, longueur maximum, cycles, nouveaux défis récompensés, Rejouer et Retour aux modes.

## Vérifications

Commande : `node --test tests/automated/*.test.mjs`.
36 suites, comprenant les régressions PACK 17 à PACK 51 et les nouveaux tests PACK 53.

PACK 53 contrôle :
- contacts tête/corps, virages à rotation maximale et cinq vitesses, limite de 120 segments, indépendance des skins et absence de corps fantôme à l’initialisation/recentrage ;
- lancement verrouillé refusé même après manipulation du bouton ;
- six cycles successifs, quatre zones et paliers mesurés à partir du déplacement réel ;
- pause intégrale, reprise, cinq minutes de frames actives et plafond permanent de 250 Éclats ;
- collision réelle par boucle de trajectoire, cause affichée, records séparés, finalisation idempotente, retour aux modes et nouvelle partie ;
- migration, rechargement, instance obsolète, changement de semaine et refus de stockage : pas de double versement et conservation des achats ;
- exécution des scénarios à 30, 60 et 120 images par seconde.

Contrôles visuels dans le navigateur local : modes verrouillés/déverrouillés, lancement Survie avec le skin acheté, pause et sortie, statistiques séparées, défis permanents, fin sur autocollision. Paysage PC et paysage simulé 667 × 375. Les scénarios visuels utilisent un portefeuille de test en mémoire, sans écriture dans les sauvegardes du joueur. Le scénario d’autocollision fournit un corps de 120 segments et une direction circulaire automatique ; il utilise ensuite la détection normale.

## Points à vérifier par CJ sur téléphone

1. Finir l’Histoire ou utiliser un compte l’ayant déjà finie ; vérifier le déblocage permanent de Survie.
2. Jouer au toucher/glisser, négocier des virages normaux et croiser volontairement une ancienne portion du corps ; vérifier la cause Autocollision.
3. Passer chaque portail, faire plusieurs cycles, contrôler la montée de vitesse et la conservation de la longueur.
4. Pauser, reprendre, changer l’orientation et revenir en paysage : pas de mort artificielle ni de temps écoulé en pause.
5. Accomplir les trois défis sur un compte de test ; vérifier le gain total maximum de 250 Éclats, les skins et la balance après rechargement.
6. Vérifier la lisibilité du bilan avec plusieurs récompenses, Rejouer et Retour aux modes, puis Histoire et Voyage Infini.

## Limites connues du socle

- Le projet conserve seulement les sauvegardes permanentes ; aucune restauration d’une partie en cours n’existait et ce pack n’en crée pas.
- Les contrôles de déplacement existants sont souris et pointeur tactile. Le clavier et la manette ne sont pas implémentés dans le socle fourni.
- Le stockage local doit être disponible pour enregistrer récompenses et achats. Une écriture refusée ne valide pas le reçu et ne verse pas la récompense ; le jeu réessaie tant que la session existe. Une partie quittée avant rétablissement du stockage ne peut pas garantir une persistance.
- Les tests en navigateur et les tests automatisés ne remplacent pas les essais matériels sur téléphone. Ne pas déclarer le PACK 53 validé avant le retour de CJ.

Livraison : ZIP complet avec le dossier `.git`, les assets, le code, la documentation et les tests, conservant les modifications non commitées.
