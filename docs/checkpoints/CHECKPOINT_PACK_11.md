# Checkpoint — PACK 11

**Date :** 10 septembre 2026  
**Statut :** terminé et vérifié

## Fichiers créés

- `src/core/zoneOneBackground.js`
- `docs/checkpoints/CHECKPOINT_PACK_11.md`

## Fichiers modifiés

- `src/main.js`
- `README.md`

Tous les autres fichiers et acquis des PACKS 0 à 10 ont été conservés. L'image source et les autres assets n'ont été ni modifiés ni remplacés.

## Fond intégré

- Asset utilisé : `assets/images/zones/NYR_ZONE_01_ESPACE_NOCTURNE_V1.png`.
- Dimensions vérifiées : `1672 × 941 px`, RGB, PNG.
- Chargement par un chemin relatif au projet, sans ressource distante.
- Une seule image statique est chargée : aucune couche parallaxe ni autre zone.
- Le fond est rendu en premier, puis les six Fragments normaux, Nyr et son feedback d'absorption sont dessinés au-dessus.

## Architecture

- `zoneOneBackground.js` isole uniquement le chargement et le rendu du fond de la Zone 1.
- `createZoneOneBackground()` conserve un petit état technique `loading`, `ready` ou `failed`.
- `main.js` instancie le fond une fois et appelle son rendu à chaque frame sans lui transmettre ni compteur, ni progression, ni état de zone.
- `calculateCoverRect()` est une fonction pure et testable qui calcule le cadrage.
- Aucun système de sélection ou de transition de zone n'a été créé.

## Cadrage sans déformation

- Échelle utilisée : `max(largeur surface / largeur image, hauteur surface / hauteur image)`.
- La même échelle est appliquée aux deux axes : le ratio de l'image est strictement préservé.
- L'image couvre toujours toute la surface.
- Le surplus est réparti symétriquement autour du centre du canvas.

| Surface | Rectangle rendu | Recadrage centré |
| --- | --- | --- |
| Desktop `1366 × 768` | `1366 × 768,783 px` | environ `0,392 px` en haut et en bas |
| Mobile paysage `844 × 390` | `844 × 475,002 px` | environ `42,501 px` en haut et en bas |

- Aucun étirement horizontal ou vertical indépendant.
- Aucun voile sombre permanent n'a été ajouté : le fond original reste intact.

## Fallback

- Pendant le chargement ou si l'image échoue, le fond technique validé précédemment est rendu.
- Une erreur de chargement simulée bascule proprement sur le fallback.
- Le fallback ne modifie aucun état de jeu et ne bloque pas la boucle.
- Un chargement valide remplace le fallback dès que les dimensions naturelles de l'image sont disponibles.

## Lisibilité visuelle

- Rendus canvas réels contrôlés en Éclat sur desktop DPR 1 et en Spectre sur mobile paysage DPR 2.
- Les six Fragments normaux cyan restent nettement visibles.
- La tête, les yeux, le corps organique et la queue de Nyr restent lisibles dans les deux formes.
- Le flash d'absorption autour de la queue reste visible sur le fond.
- La luminance médiane mesurée du décor est `27/255`, avec un percentile 90 à `56/255` : les lueurs cyan/violet conservent un contraste suffisant sans assombrissement ajouté.

## Desktop, mobile, DPR et portrait

- Desktop `1366 × 768` : couverture complète, centrage et lisibilité validés.
- Mobile paysage `844 × 390` : couverture complète, recadrage vertical centré et lisibilité validés.
- DPR 1 et DPR 2 : rectangle logique identique dans les coordonnées CSS normalisées.
- Portrait `390 × 844` : calcul de couverture valide et suspension existante inchangée.
- Pendant la suspension, le fond statique peut continuer à être redessiné mais aucun état du fond ni du gameplay n'évolue.
- Première frame de reprise neutre et feedback d'absorption figé/repris conformément au PACK 10.

## Non-régression PACKS 0 à 10

- Déplacement automatique, souris, tactile et virage progressif inchangés.
- Vitesse `95 px/s`, rotation `π × 0,9 rad/s` et espacement `14 px` inchangés.
- Six Fragments normaux, absorption et respawn inchangés.
- Croissance exacte `+1 segment`, suivi indépendant du FPS et corps organique inchangés.
- Compteur interne et passage Éclat → Spectre exactement à 20 inchangés.
- Test 19 → 20 validé : 23 → 24 segments, Spectre et feedback Spectre.
- Flash d'absorption toujours fixé à `0,36 s` de simulation active.
- Suspension portrait et reprise sans bond conservées.

## Chargement et robustesse

- Asset Zone 1 : réponse HTTP 200.
- `index.html`, CSS, image et tous les modules : `20/20` réponses HTTP 200.
- Validation syntaxique de tous les modules JavaScript : réussie.
- Tests déterministes de cadrage, chargement, fallback, DPR, portrait et non-régression : réussis.
- Aucune erreur JavaScript bloquante pendant les tests.
- Aucun chemin absolu dans le prototype et aucun CDN.

## Systèmes explicitement non commencés

- Aucun parallaxe et aucune intégration des couches stars, nebula, particles ou asteroids.
- Aucune Zone 2, 3 ou 4 et aucune transition à 25 fragments.
- Aucun obstacle, danger, astéroïde de gameplay ou collision.
- Aucun nouveau collectible, score, record, combo, multiplicateur ou HUD.
- Aucune Forme III/IV, vitesse supplémentaire, Dash, stabilité, dégâts, mort ou game over.
- Aucune caméra, mini-carte, événement, CJ, profil ou sauvegarde.
- Aucun audio, vibration, réseau, multijoueur, Capacitor, npm, framework, GitHub, publication ou déploiement.
- Aucun autre projet CJAJLK modifié.

## Arrêt strict

Le PACK 11 est terminé. **PACK 12 NON COMMENCÉ.**
