# NYR — Absorption des fragments, son V2

13 octobre 2026. Retour de CJ : la V1 évoque une corde de guitare; privilégier une absorption spatiale.

Base propre : main, fd7f9fb. Trois variantes normales remplacées par une synthèse de souffle filtré, montée douce et résonance FM diffuse avec retards courts. L'attaque arrondie remplace le pincement et les harmoniques musicales de la V1. Durées conservées : 0,24 / 0,25 / 0,26 seconde. WAV mono 44 100 Hz, 16 bits. Le générateur demeure reproductible.

Fichiers modifiés : `scripts/generateGameplayAudio.mjs` et `assets/audio/sfx/nyr_fragment_absorb_1.wav`, `nyr_fragment_absorb_2.wav`, `nyr_fragment_absorb_3.wav`. Aucun changement des déclenchements, volumes du lecteur, fragment pur, portails, collisions, mouvement ou règles de jeu. La régénération laisse tous les autres WAV identiques à la base Git.

Vérifications : test audio existant réussi (intégrité WAV, absence d'écrêtage des fichiers, variantes, déblocage, pause, mute, page cachée, limite des voix et échecs de chargement). `git diff --check` conforme. Appréciation auditive et mixage final à confirmer par CJ en jeu. Aucun commit ni push.
