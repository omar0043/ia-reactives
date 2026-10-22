# Carte de lecture du projet

Support : 62 diapositives de Michel Buffa, Master 2 MIAGE IA2, octobre 2026.

| Notion | Slides | Implémentation | Démonstration |
|---|---|---|---|
| Agent autonome, action/pilotage/locomotion | 9–13 | Vehicle, intention des sous-classes, update | Comparer un poisson et un requin ennemi |
| Opérations vectorielles | 15–16 | Vec | Ouvrir vector.js, normalisation et limit |
| Seek | 14, 17 | Vehicle.seek | Laboratoire → Attraction |
| Flee | 18 | Vehicle.flee | Laboratoire → Fuite |
| Pursue | 19–21 | Vehicle.pursue | Voir un requin rouge anticiper sa cible |
| Evade + perception | 19–21 | Vehicle.evade, Fish.intention | Approcher un banc et activer V |
| Arrive et distance d'arrêt | 22–25 | Vehicle.arrive | Viser puis immobiliser la souris |
| Snake | 23, 58, 61–62 | Fish.intention | Touche X ; chaque poisson suit le précédent |
| Wander | 26–28 | Vehicle.wander | Mode Déambulation et trajectoires |
| Projection scalaire | 29 | projectPoint | Lire le produit scalaire ; observer la migration |
| Suivi de chemin | 30–31 | Vehicle.followPath | Mode Migration : circuit et points projetés |
| Évitement dynamique et court | 32–36 | Vehicle.avoid, resolveObstacles | O ajoute un obstacle ; V montre la menace |
| Séparation | 39 | Vehicle.separation | Mettre le curseur à zéro puis l'augmenter |
| Alignement | 37 | Vehicle.alignment | Banc : comparer 0 et 2 |
| Cohésion | 38 | Vehicle.cohesion | Banc : comparer 0 et 2 |
| Boids | 40–42 | Fish + BehaviorManager | Mode Banc et trois curseurs |
| Vie/nourriture/poison/ADN/mutation | 43–46 | Fish.dna, offspring ; step | Activer l'évolution et observer la génération |
| Réseau de neurones évolutif | 47–49, 53–54 | Brain, TrainingAgent, EvolutionTrainer | Lancer l'entraînement dans Neuro-évolution |
| Topologie et activation | 53, 56 | réglages nnRays/nnLayers/nnHidden | Changer rayons, couches, neurones et activation |
| Fitness, sélection, croisement | 53–54 | EvolutionTrainer.nextGeneration/select | Lire neural.js et suivre une génération |
| Sauvegarde des cerveaux | 54, 56, 59 | Brain.toJSON/fromJSON | Exporter, réimporter et tester sur autre récif |
| Généralisation et arrêt | 54 | testNewWorld, nextGeneration | Tester sur un récif différent ; noter le résultat |
| ML5 pré-entraîné | 48, 55 | lab.js, activation caméra | Option HandPose, à valider avec votre webcam |
| Leader non naïf | 50–51, 61–62 | Vehicle.followLeader | Touche L, demi-tour du requin |
| Gestionnaire pondéré | 52, 60 | BehaviorManager | Lire add/remove/activate/deactivate/changeWeight |
| Locomotion et gravité (extension) | 13 | Shark.advance et launchJump | J près de la surface : arc, rotation et retombée |
| Agents bateaux (extension) | 9–13, 14–18 | Boat hérite de Vehicle ; croisière Seek et fuite Flee | Observer les bateaux en surface puis les dévorer en grandissant |
| Boundaries | 61–62 | Vehicle.boundaries | Approcher les bords |
| Champ de forces (extension) | illustration d'introduction | Vehicle.flowField | Activer Courants + V |

Les figures, vidéos externes et exercices d'installation sont des supports pédagogiques, pas des fonctionnalités du jeu. Les projets de voitures, fusées et tirs de missiles sont des exemples / options ; leur logique de sélection et réseau est transposée aux créatures marines. Le contrôle HandPose et le réseau dense du laboratoire sont deux usages différents de l'IA.

## Explication courte des formules

- Seek : `desired = normalize(target - pos) × maxSpeed`, puis `limit(desired - vel, maxForce)`.
- Flee : `desired = normalize(pos - target) × maxSpeed`. Ne pas simplement inverser la force de Seek.
- Pursue/Evade : cible future = `target.pos + target.vel × horizon`, avec horizon limité par le temps estimé pour rejoindre la cible.
- Arrive : vitesse désirée proportionnelle à la distance entre rayon d'arrêt et rayon de ralentissement.
- Projection : `t = clamp(((p-a)·(b-a))/|b-a|², 0, 1)`, projection = `a+t(b-a)`.
- Boids : séparation = directions répulsives pondérées par l'inverse de la distance ; alignement = vitesse moyenne ; cohésion = Seek du centre moyen.
- Intégration : `vel += acceleration × dt`, `pos += vel × dt`, puis remise de l'accélération à zéro.

## Limites identifiées

- Voisinage accéléré par une grille spatiale, avec filtrage exact des distances. Si tous les agents se regroupent dans les mêmes cellules, le pire cas reste O(n²). La population est plafonnée à 110 poissons.
- Évitement local, pas planification A* : un agent peut hésiter dans une géométrie complexe.
- Le réseau neuronal est une démonstration expérimentale, sans garantie de convergence ni de transfert sur un nouveau récif.
- La navigation du joueur est réactive ; il peut être arrêté par un rocher qui masque sa cible.
- Les ressources ml5 et les polices distantes peuvent être bloquées par un réseau d'école ; le jeu principal reste autonome.
- La caméra n'a pas été testée matériellement pendant la création. Faire un essai avant la présentation.

## Campagne et IA

`levels.js` organise six étapes à objectifs. La difficulté change la faim, les dangers et les courants, tout en réutilisant les comportements de Vehicle et le gestionnaire existant. Le numéro de campagne est séparé du niveau de croissance. La progression est validée par des événements du jeu (traversée de surface, capture d’un bateau, collision avec un coffre) et des seuils de proies/score/survie. La campagne n’entraîne pas un nouveau réseau neuronal ; la neuro-évolution reste une démonstration du laboratoire.

## Lisibilité et ambiances

Les repères de `experience.js` reprennent la règle de taille de la simulation ; ils ne modifient ni les collisions ni l’alimentation. Le guidage est une indication au joueur, distincte de Seek/Pursue : il choisit une cible utile puis projette une direction dans l’écran avec les conversions monde/écran partagées. Le courant du niveau 4 est une force pondérée de BehaviorManager, ajoutée aux forces de pilotage et retirée lors du retour au menu. Les six ambiances sont dessinées en Canvas avec culling et plafonds de motifs ; les structures de fond ne sont pas de nouveaux obstacles physiques.

## Prédateur final et reprise

`ApexShark` hérite de Shark puis de Vehicle. La sélection d’action bascule entre Pursue, Evade et Wander selon la menace ; l’évitement et les limites restent ceux du gestionnaire. Les conditions de capture utilisent toujours les tailles, avec l’exception de frénésie. Les étoiles sont des règles de score, pas un apprentissage. La reprise sérialise des données puis reconstruit les instances des classes et leurs gestionnaires ; elle ne désérialise aucune fonction ni objet arbitraire. Le réseau de neuro-évolution du laboratoire n’est pas inclus dans la sauvegarde d’une plongée.

## Pilotage et contact physique

Le joueur conserve les forces de pilotage de Vehicle, mais Shark stabilise l’évitement selon la direction demandée et mémorise le côté choisi. La résolution géométrique de capsule corrige ensuite les pénétrations et retire les composantes de vitesse et de force dirigées dans le rocher. La rotation visuelle est limitée en vitesse pour éviter les retournements brusques. Avoid anticipe ; la contrainte de contact garantit le glissement une fois au bord.

La contrainte d’orientation du joueur teste aussi l’arc de rotation de sa capsule contre les obstacles proches. Une recherche par dichotomie garde la fraction libre du virage ; elle évite qu’une rotation crée une pénétration et impose un déplacement de correction. Elle complète les forces de pilotage et la résolution des contacts, sans modifier les comportements des poissons ou des requins ennemis.
