# Fluidité du jeu

## Changements

- Grille de cellules de 128 unités pour rechercher les voisins ; chaque comportement conserve son rayon et ses formules.
- Évitement et collisions : rejet rapide des obstacles éloignés avant les calculs détaillés.
- Historiques et copies des forces uniquement pour les affichages qui en ont besoin.
- Suppression des flous par créature et du filtre appliqué au canvas entier ; dessin limité à la zone visible.
- Résolution plafonnée à 1,6 million de pixels ; Mode fluide à 0,85 million. Le facteur minimal de résolution est 0,65.
- Particules plafonnées, HUD mis à jour seulement si les valeurs changent, sauvegardes regroupées sur 750 ms et vidées lors des transitions et de la sortie.
- Bouton **ϟ Mode fluide** en haut de l’écran, mémorisé localement. Il réduit les détails, les animations et la résolution sans changer population, comportements, océan ou règles.

## Mesure locale

Commande depuis la racine :

```bash
node tests/performance.cjs
node tests/verify.cjs
```

Le benchmark utilise une graine fixe, 110 poissons, 120 pas de chauffe puis 600 pas mesurés. Le rendu et le DOM sont simulés pour compter les appels. Les résultats suivants ont été obtenus dans le même environnement Node.js avant et après optimisation :

| Indicateur | Avant | Après |
|---|---:|---:|
| Calcul d’un pas, médiane | 8,403 ms | 1,173 ms |
| Calcul d’un pas, 95e centile | 9,723 ms | 1,676 ms |
| Appels de dessin par image | 3 109 | 2 576 |
| Activations de flou par image | 27 | 0 |
| Affectations DOM pour 60 HUD identiques | 1 560 | 0 |
| Écritures de stockage pour 100 captures, vidage compris | 285 | 2 |

Le calcul de simulation est environ 7,2 fois plus rapide dans ce test. Les durées varient selon la machine et la charge. **Ce benchmark ne mesure ni le GPU ni les FPS réels du navigateur et ne garantit pas l’absence de saccades sur tout appareil.** Les nombres d’appels de dessin ne correspondent pas à des images par seconde.

Les tests de régression vérifient l’équivalence des forces Boids avec un calcul exhaustif, la réduction du nombre de candidats, l’activation des traces et du débogage, les sauvegardes différées, le plafond de résolution et l’absence de changement du gameplay lors de l’activation du Mode fluide.

## Ajout des aides et des ambiances

Les repères sont plafonnés à 12 créatures proches visibles (6 en Mode fluide). Les motifs de décor sont rejetés hors champ et limités à 8 par image (4 en Mode fluide). Le guidage textuel suit la cadence du HUD ; aucune sauvegarde n’est effectuée par image. Les palettes remplacent les couleurs des dégradés existants, sans filtre supplémentaire sur le canvas. Le benchmark charge également `experience.js` quand il est présent.

## Reprise et prédateur final

Les sauvegardes de plongée sont espacées de cinq secondes de jeu, avec une sauvegarde lors du retour au menu et des événements de sortie. Le dernier niveau ajoute un seul acteur à sa population de prédateurs. Les conseils sont évalués deux fois par seconde. Les sons utilisent des sources courtes et des limites de fréquence ; le tampon de bruit des éclaboussures est réutilisé. Le benchmark charge aussi `progression.js` et `audio.js` ; il reste un test CPU et d’appels simulés, pas une mesure des FPS ou de la latence de stockage du navigateur.

## Grand requin au contact des rochers

Le problème reproduit était un retournement visuel : l’orientation pouvait changer de presque 180° en un pas lors d’un contact, même sans pénétration du rocher. Le joueur tourne désormais progressivement, conserve un côté d’évitement et projette ses forces le long des contacts. La capsule emploie des calculs scalaires.

`node tests/rocks.cjs` simule sept situations de contact à un rayon de 155, pendant 900 pas chacune à 1/60 s. Dans ces scénarios, le changement maximal d’orientation est de 2,41° par pas, le déplacement maximal de 4,37 pixels et aucune pénétration n’est mesurée. La pression continue au clavier et à la souris ne produit pas de tremblement au repos ; le requin peut repartir du contact. Ce sont des mesures de stabilité géométrique, pas une mesure des FPS.

Après cette correction, le benchmark simulé donne une médiane de 1,238 ms et un 95e centile de 2,109 ms par pas. Les limites de mesure ci-dessus s’appliquent toujours.

## Deuxième correction : tourner au bord d’un rocher

Le premier correctif limitait la vitesse d’orientation, mais la capsule pouvait encore pivoter dans un rocher. Sa correction de position provoquait alors une secousse. Le joueur vérifie maintenant l’arc de rotation et ne tourne que jusqu’à la dernière orientation libre, sans augmenter une pénétration existante. La vitesse dirigée dans les contacts persistants est également retirée avant l’intégration.

Le test `tests/rocks.cjs` couvre désormais neuf scénarios supplémentaires : souris visant dans un récif, cible tournant autour et passage entre deux rochers, pour des rayons de 25, 82 et 155. Il alterne des pas de 1/120, 1/60, 1/30 et 1/20 seconde avec un plafond de vitesse de 520, puis commande un dégagement. Sur le requin maximal, l’ancienne version produisait des corrections de position atteignant 25,919 pixels ; la nouvelle reste sous 0,051 pixel dans ces mêmes cas, sans pénétration ni blocage du dégagement. Les sept scénarios précédents passent aussi.

Le benchmark CPU après ce correctif donne 1,151 ms en médiane et 1,697 ms au 95e centile. Ces tests ne mesurent toujours pas les FPS réels du navigateur.
