# NYR — PACK 53
## Cahier des charges V1 — Mode Survie

**Statut :** conception fonctionnelle validée, implémentation non commencée.

**Objectif :** ajouter un troisième mode de jeu exigeant, utilisant le moteur NYR existant, sans régression des autres modes.

### 1. Accès au mode

- Conserver le bouton principal **JOUER**, qui ouvre l'écran MODES.
- Ajouter **SURVIE** à côté d'HISTOIRE et VOYAGE INFINI.
- Débloquer Survie définitivement après la première conclusion réussie du Mode Histoire.
- Ne pas réinitialiser les déblocages existants.
- Permettre de rejouer Survie sans limite.

### 2. Gameplay

- Réutiliser les quatre zones, les fragments, les transformations et les portails existants.
- Conserver les 100 points de Stabilité au départ.
- Conserver les dégâts, soins et règles d'absorption habituels.
- Plafonner le corps à **120 segments visibles**, comme actuellement.
- Autoriser tous les skins possédés, sans bonus de gameplay.
- Aucun nouvel ennemi ni nouvelle zone.

### 3. Autocollision — règle principale

**La tête de Nyr touchant son propre corps entraîne immédiatement le Game Over.**

Conditions techniques :

- Calculer la collision à partir des positions physiques, indépendamment des images.
- Exclure les segments immédiatement voisins de la tête pour permettre les virages normaux.
- Calibrer la zone de collision selon l'espacement réel des segments.
- Ne pas déclencher de collision artificielle après un portail, une reprise de pause ou une initialisation.
- Ne jamais appliquer cette règle en Mode Histoire ou Voyage Infini.
- Enregistrer la cause de défaite « Autocollision ».
- Ne comptabiliser la fin de partie qu'une seule fois.

Le nombre de segments exclus et le rayon de collision doivent être déterminés par des tests, sans modifier la physique de déplacement.

### 4. Difficulté progressive

Un cycle correspond à la traversée des quatre zones.

| Cycle | Vitesse par rapport à la vitesse de référence |
|---|---|
| 1 | 100 % |
| 2 | 105 % |
| 3 | 110 % |
| 4 | 115 % |
| 5 et suivants | 120 % maximum |

- Appliquer le multiplicateur uniquement au Mode Survie.
- Ne jamais cumuler les multiplicateurs de manière exponentielle.
- Conserver les paramètres habituels des dangers.
- Ne pas augmenter leur fréquence dans cette première version.
- Le changement de vitesse intervient uniquement au début d'un nouveau cycle.

### 5. Portails

- Conserver les conditions d'apparition habituelles.
- Conserver les transitions habituelles entre les zones.
- Aucun compte à rebours supplémentaire.
- Après la Zone 4, revenir en Zone 1 pour commencer un nouveau cycle.
- Conserver la longueur du corps et la progression du joueur selon les règles actuelles.

### 6. Trois défis permanents

| Défi | Condition | Récompense |
|---|---|---|
| Premier survivant | Atteindre 5 minutes de survie dans une seule partie | 50 Éclats |
| Maître des trajectoires | Atteindre 80 segments dans une seule partie sans autocollision | 75 Éclats |
| Survivant du Vide | Terminer un cycle complet de quatre zones | 125 Éclats |

**Maximum : 250 Éclats par joueur, une seule fois.**

- Chaque défi est validé par les événements réels du Mode Survie.
- Les récompenses sont versées dans le portefeuille d'Éclats existant.
- Aucune récompense automatique supplémentaire par partie.
- Aucun doublon après redémarrage, rechargement ou reprise de sauvegarde.
- Une défaite après accomplissement d'un défi ne supprime pas sa progression.
- Les défis sont indépendants des défis hebdomadaires et des objectifs de l'Histoire.

### 7. Records et statistiques

Enregistrer séparément :

- Meilleur score Survie.
- Meilleur temps de survie.
- Plus grande longueur atteinte.
- Nombre maximal de cycles terminés.
- Nombre de parties jouées en Survie.

Les records Histoire et Voyage Infini doivent rester inchangés.

### 8. Fin de partie

Afficher :

- Cause de la défaite : autocollision, Stabilité épuisée ou autre cause existante.
- Score final.
- Temps de survie.
- Fragments absorbés.
- Longueur maximale.
- Cycles terminés.
- Défis nouvellement accomplis et récompenses correspondantes.

Boutons : **REJOUER** et **RETOUR AUX MODES**.

### 9. Pause et sauvegardes

- La pause fige intégralement la simulation, le temps et les collisions.
- Reprendre ne déclenche pas de collision immédiate injustifiée.
- Quitter volontairement n'attribue pas de victoire ni de cycle non terminé.
- Conserver les sauvegardes, les Éclats, les skins achetés et équipés, les statistiques et les défis précédents.
- Ajouter les nouvelles données avec une migration compatible avec les anciennes sauvegardes.

### 10. Contraintes de développement

- Réutiliser au maximum les modules existants.
- Isoler les nouvelles règles derrière l'identifiant du Mode Survie.
- Ne pas modifier les comportements Histoire et Voyage Infini.
- Conserver les assets, le rendu, les commandes tactiles et clavier/manette existants.
- Ne pas modifier le système économique de la Boutique.
- Ne pas créer de dépendance entre un skin et un mode.
- Éviter les modifications non nécessaires du moteur.

### 11. Tests obligatoires avant validation

**Autocollision :**
- Contact tête/corps éloigné : Game Over.
- Virage normal : aucune fausse collision.
- Corps à 120 segments : fonctionnement stable.
- Tous les skins : mêmes collisions.
- Portail, pause et reprise : aucune mort artificielle.

**Progression :**
- Les quatre zones sont accessibles.
- Les cycles se répètent correctement.
- Les cinq paliers de vitesse sont respectés.
- Le plafond de 120 % n'est jamais dépassé.

**Économie et sauvegardes :**
- Trois récompenses attribuées une seule fois.
- Maximum permanent de 250 Éclats.
- Aucun double versement après rechargement.
- Anciens comptes et achats conservés.

**Régressions :**
- Mode Histoire inchangé.
- Voyage Infini inchangé.
- Boutique et skins inchangés.
- Contrôles PC et téléphone fonctionnels.
- Pause, Game Over et navigation vérifiés.

### 12. Conditions de livraison du futur PACK 53

Lors de l'implémentation :

1. Inspecter d'abord le projet et son état Git.
2. Identifier les modules réutilisables et les risques de régression.
3. Développer uniquement le Mode Survie.
4. Exécuter les tests automatisés et contrôles visuels.
5. Livrer un ZIP complet conservant le dossier `.git`.
6. Ne faire aucun commit ni push sans autorisation.
7. Attendre les tests réels de CJ sur téléphone avant de déclarer le PACK 53 validé.

**Fin du cahier des charges V1.**