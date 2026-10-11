# NYR — Audio gameplay astral V1

Date : 11 octobre 2026. Base : main, 7292064.

CJ autorise explicitement la création et l'intégration directe des sons, avec ajustements après essais en jeu. Cette demande remplace l'étape d'écoute préalable prévue par le canon pour ce pack.

## Audit et périmètre

État initial propre. Aucun asset audio ni lecteur audio dans le gameplay. Les callbacks existants signalent déjà les absorptions, les contacts astéroïde/corruption et les passages des quatre portails. Le déplacement est continu pendant une partie active. L'autocollision en Survie termine la partie.

Les collisions, la Stabilité, les commandes, les progressions, les modes, les skins, les prix et les sauvegardes conservent leurs règles. Aucun son de musique ou d'interface ajouté, aucun service externe ni dépendance.

## Sons originaux

Synthèse déterministe reproductible avec `node scripts/generateGameplayAudio.mjs`. WAV mono PCM 16 bits, 44 100 Hz. Sources conservées dans `assets/audio/sfx/`; ces WAV courts servent également à la lecture dans le navigateur.

| Fichier WAV | Identité | Durée |
| --- | --- | --- |
| nyr_fragment_absorb_1 / 2 / 3 | Éclats cristallins doux, trois variantes alternées | 0,24 / 0,25 / 0,26 s |
| nyr_fragment_pur | Résonance claire et apaisante | 0,62 s |
| nyr_collision | Impact sourd énergétique | 0,34 s |
| nyr_corruption_hit | Pulsation grave avec harmoniques légèrement désaccordées | 0,42 s |
| nyr_portal_enter | Montée et passage énergétique astral | 0,85 s |
| nyr_death | Désagrégation descendante | 0,75 s |
| nyr_movement_loop | Souffle tonal astral très discret, boucle continue | 4 s |

Ces effets évoquent l'énergie de NYR dans l'univers spatial. Ils ne simulent pas des sons acoustiques dans le vide.

## Intégration

- `src/systems/gameplayAudio.js` : lecture Web Audio, déblocage par interaction souris/tactile/clavier, chargement unique, variantes, 12 effets simultanés maximum, gain global modéré et compression contre la saturation du mélange.
- `src/main.js` : raccordement aux callbacks existants, son de fin de partie, activation selon le runtime et arrêt lors d'une pause, d'un changement de session ou de la disparition de la page.
- La queue sonore du portail peut finir pendant une narration Histoire. La boucle de mouvement s'arrête immédiatement quand le jeu devient inactif.
- `assets/css/main.css` : bouton Son ON/OFF accessible, centré en bas, séparé de Pause/Menu à gauche et du plein écran à droite. Cible tactile de 44 px minimum. Le choix reste pendant la session de page; aucune écriture dans les sauvegardes.
- Un échec de chargement ou l'absence de Web Audio n'interrompt jamais le gameplay. Les événements arrivés avant le déblocage audio ne sont pas rejoués tardivement.
- `scripts/generateGameplayAudio.mjs` et les neuf WAV : production originale, sans enregistrement tiers.
- `tests/automated/gameplayAudio.test.mjs` : contrôles des WAV, variantes, déblocage, pause, page cachée, mute, limite des voix et échecs réseau/API.
- `tests/automated/pack24GameOver.test.mjs` et `pack27PureFragment.test.mjs` : assertions de raccordement mises à jour pour inclure l'appel audio, en conservant les contrôles de comportement précédents.

## Vérification

`node --test tests/automated/*.test.mjs` : **38 fichiers de tests passent, zéro échec**.

`git diff --check` : conforme. Contrôle navigateur : démarrage de Voyage Infini, absorption réelle d'un fragment, pause, bouton Son ON/OFF, écran PC et paysage simulé 844 × 390. Les sept familles de sons ont été déclenchées dans une page QA isolée utilisant le vrai module et le vrai Web Audio; les effets ont tous confirmé un démarrage de lecture. Aucun problème audio relevé dans le jeu pendant ces contrôles.

Les contrôles de lecture et d'intégrité ne constituent pas une appréciation auditive du mixage. Les essais sur téléphone réel et le réglage final des volumes restent à réaliser par CJ. Le mixage est une V1 ajustable après retour.

Aucun commit ni push effectué pour ce pack.

Correctif après retour de CJ : le bouton Son recouvrait Pause/Menu en bas à gauche. Placement corrigé au centre bas. Rectangles vérifiés sans chevauchement à 1280 × 720 et 667 × 375; clic Son OFF puis Pause confirmé dans le navigateur. Seule la disposition CSS change pour ce correctif.
