# Règles de travail — NYR

## Source de vérité

- Lire et respecter le canon présent dans `docs/canon/` avant toute modification.
- Le nom officiel du jeu est **NYR**. « Nocturne Devourer » reste uniquement un ancien nom de travail.
- Ne pas altérer les références originales. Les copies de travail restent dans les dossiers prévus du projet.

## Méthode Work

- Travailler par petits packs atomiques, contrôlés, testables et entièrement terminables.
- Définir un seul pack, l’exécuter, vérifier ses résultats, écrire son checkpoint, puis s’arrêter avant tout pack important suivant.
- Ne jamais laisser une migration, une refonte ou un fichier essentiel partiellement terminé.
- Si une limite, un quota faible, une capacité réduite ou une incertitude sérieuse est signalé, s’arrêter avant le prochain pack et checkpoint­er l’état terminé.
- Si le quota précis est inaccessible, ne pas prétendre le connaître et conserver une stratégie prudente.

## Périmètre

- Ne pas inventer de système, mécanique ou contenu non validé par CJ et le canon.
- Ne pas modifier CJAJLK Games, Attrape-les-tous, Breaker, Velocity ni aucun autre projet.
- Ne pas créer de dépôt GitHub, publier ou déployer sans demande explicite de CJ.
- Ne pas intégrer le profil global, les CJ, le réseau, le multijoueur ou l’audio avant leur pack validé.

## Portabilité

- N’utiliser aucun chemin absolu dans les futurs fichiers du projet.
- Utiliser des chemins relatifs à la racine `NYR/` pour tous les assets et modules.
- N’ajouter aucune dépendance à un lecteur, un ordinateur ou un emplacement local fixe.
- Conserver chaque ressource nécessaire à l’intérieur du dossier du projet afin qu’il puisse être transféré sur un autre lecteur.

