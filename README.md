# ABYSS HUNT — L'appel des profondeurs

Jeu de chasse sous-marine original, inspiré des mécaniques de chasse, survie et croissance de Hungry Shark. Projet pédagogique sur les agents autonomes, les steering behaviors et la neuro-évolution.

**Compte GitHub : [omar0043](https://github.com/omar0043)** — compléter les noms du binôme si nécessaire.

**Jouer directement :** https://omar0043.github.io/ia-reactives/

Le jeu est hébergé sur GitHub Pages. Le bouton de son se trouve au menu et dans la pause. Aucun téléchargement ni compte n’est nécessaire pour jouer.

**Vidéo YouTube de présentation : À RENSEIGNER si exigée pour votre promotion.**

## Lancer immédiatement

Décompresser entièrement le ZIP, puis ouvrir `LANCER.html` (ou `dist/index.html`) dans Chrome, Edge ou Firefox récent. Le jeu et le laboratoire fonctionnent sans installation, sans serveur et sans dépendance JavaScript pour le cœur du jeu. Une connexion est nécessaire uniquement pour la police optionnelle et le contrôle gestuel ml5.

Pour utiliser un serveur local :

```bash
python -m http.server 8000
```

Ouvrir http://localhost:8000/dist/ dans le navigateur. Dans VS Code, l'extension Live Server peut aussi servir `dist/index.html`. La caméra demande HTTPS ou localhost ; l'ouverture par fichier n'est pas une garantie pour cette option.

## Jouer

- Souris ou toucher : viser une position ; le requin y arrive en ralentissant.
- Flèches, ZQSD ou WASD : piloter au clavier. Espace : boost. Sur écran tactile : double toucher pour un boost bref.
- P ou Échap : pause / reprise. V : vision IA.
- **ϟ Mode fluide**, en haut : réduit la résolution et les effets pour les appareils moins puissants, sans modifier les règles ni la population. Le choix est mémorisé.
- L : suivi de leader ; X : snake ; N : retour au banc.
- O : ajouter un rocher à la position du pointeur, suffisamment loin du requin.
- Le bouton Laboratoire permet de modifier en direct population, perception, vitesse, force et pondérations des comportements.

## Structure arcade inspirée de Hungry Shark

Le jeu s'ouvre sur une sélection de requins, puis sur un océan défilant de **12 000 × 6 000 unités**, soit environ **10,5 fois** la surface de la carte précédente. La caméra dézoome progressivement à mesure que le requin grandit, pour garder son corps entier visible, y compris sur mobile. Le menu propose désormais une **Campagne de 6 niveaux**, la **Survie sans fin** et l’**Exploration libre**. En Survie, la partie dure tant que le requin survit ; ses trois défis donnent des récompenses sans provoquer de fin automatique.

- Trois requins : récif (S, disponible), marteau (M, 250 pièces), grand blanc (L, 800 pièces).
- Manger restaure la vitalité, rapporte score et pièces et fait grandir le requin. Tout poisson ou prédateur strictement plus petit que le requin est comestible. La croissance débloque progressivement les plus grandes proies, sans condition de morsure.
- Poissons, tortues et raies ont des tailles distinctes. Requins rouges, méduses et mines sont dangereux.
- Les captures remplissent une jauge de frénésie d'or : pendant 9 s, score ×3, pièces ×4, énergie et vitalité restaurées et grosses proies comestibles.
- Saut : près de la surface, appuyer sur **J** ou le bouton **SAUT**. Une remontée rapide avec boost permet aussi de jaillir. Le requin décrit un arc avec gravité, reste visible dans le ciel et retombe avec des éclaboussures. La pause suspend le saut.
- Barques, bateaux de pêche et yachts naviguent en surface et fuient le requin. En grandissant, on peut les dévorer pour gagner pièces, score et croissance. Leurs coques coulent après la capture.
- Vitesse, morsure et accélération s'améliorent avec les pièces gagnées, sur 5 rangs, sans achat réel. La morsure augmente le score des captures de 10 % par rang et améliore les soins ; elle ne bloque jamais une proie plus petite. Le profil est sauvegardé dans localStorage.
- En Survie sans fin, 25 proies, 1 000 points et 90 s de survie donnent respectivement 40, 60 et 100 pièces, une seule fois par plongée. La campagne utilise ses propres objectifs et bonus.
- Douze coffres cachés rapportent chacun 50 pièces. La carte montre reliefs, prédateurs, mines et trésors.
- En Survie et Exploration, le lagon est accessible immédiatement et les abysses demandent un requin M/L. En Campagne, chaque nouveau niveau repart à la taille de base du requin choisi ; la croissance accélère dans les étapes avancées pour rendre leurs objectifs accessibles.
- Joystick tactile, bouton de saut et bouton de boost ; au clavier : flèches/ZQSD/WASD et Espace.
- La vision IA, le laboratoire, les huit modes et la neuro-évolution restent disponibles pour expliquer les principes du cours.

Le style graphique est une adaptation originale en 2D Canvas. Ce n'est pas le jeu commercial d'Ubisoft ni une reproduction de ses assets ou de son moteur 3D.

## Campagne : les 6 niveaux

Le bouton **↺ RECOMMENCER AU NIVEAU 1** lance directement le premier niveau depuis le menu, la pause ou la fin de partie, sans supprimer les pièces, étoiles ni déblocages. Pour les autres niveaux, sélectionner **Campagne**, cliquer sur **CHOISIR UN NIVEAU** dans la carte, puis lancer le niveau choisi. Terminer tous les objectifs dans la même plongée ouvre l’écran de réussite et le bouton du niveau suivant. Une défaite permet de recommencer le même niveau avec une vitalité pleine. Les étapes débloquées et les réussites sont mémorisées sur l’appareil.

| Niveau | Objectifs | Bonus de première réussite | XP par palier de croissance |
|---|---|---:|---:|
| 1 · Le lagon d’azur | 12 proies et 500 points | 80 pièces | 8 |
| 2 · L’envol du chasseur | 20 proies et 2 sauts hors de l’eau | 120 pièces | 8 |
| 3 · La baie des épaves | 30 proies et 1 bateau | 180 pièces | 6 |
| 4 · Les courants sauvages | 40 proies, 2 coffres et 75 s de survie | 240 pièces | 5 |
| 5 · Les abysses | 50 proies, 2 bateaux et 90 s de survie | 320 pièces | 4 |
| 6 · Le roi de l’océan | 65 proies, 1 yacht, 3 sauts hors de l’eau et L’Ancien | 500 pièces | 3 |

La faim passe progressivement de 0,7 à 1,45 point de vitalité par seconde ; les prédateurs deviennent plus nombreux et plus grands, les méduses et les mines augmentent, les courants apparaissent au niveau 4. Le nombre de poissons ne monte pas avec les niveaux et reste plafonné pour conserver les optimisations de fluidité. Des bateaux et coffres sont placés près du secteur de départ pour rendre les objectifs accessibles dans le grand océan.

La croissance du requin et le numéro du niveau sont distincts : chaque nouveau niveau ou rejeu recommence petit, avec zéro XP de croissance, puis les captures et bateaux le font grandir. Le nombre d’unités requis par palier passe de 8 à 3 au fil de la campagne. Reprendre une plongée interrompue conserve sa taille et sa progression. Les sauts sont comptés une fois par vol, après traversée réelle de la surface. Les coffres et les yachts sont comptés lors de leur capture. Les bonus de niveau sont uniques, même lors d’un rejeu ; les pièces des captures continuent à être gagnées. La sauvegarde de campagne `abyss-campaign-v1` est séparée du profil existant pour préserver pièces et améliorations. Les objectifs de Survie sont désactivés pendant la Campagne.

### Reprendre une partie

Le bouton **REPRENDRE** du menu restaure la dernière plongée de Campagne ou de Survie. Elle redémarre **en pause** : cliquer sur Reprendre la plongée pour continuer. Une sauvegarde locale est faite toutes les 5 secondes de jeu, au retour au menu, au masquage et à la fermeture de la page lorsque le navigateur transmet cet événement. La taille, la vitalité, le boost, le temps, les objectifs, les acteurs et les objets déjà ramassés sont conservés, y compris un saut en cours.

Une seule plongée est conservée sur cet appareil et cette origine du navigateur. Commencer une nouvelle Campagne ou Survie remplace cette sauvegarde ; l’Exploration ne la remplace pas. Une victoire ou une défaite la termine. Les achats effectués au menu sont répercutés sur le profil de la partie sauvegardée. En cas de fermeture brutale, la reprise peut revenir jusqu’à 5 secondes en arrière ; elle restaure le profil associé à ce point. Le stockage local doit être autorisé. Les sessions ouvertes dans plusieurs onglets partagent ce stockage : jouer dans un seul onglet évite de remplacer mutuellement leur sauvegarde.

### Jusqu’à trois étoiles

Chaque niveau réussi donne **1 étoile**, plus une étoile de rapidité et une étoile de maîtrise des dégâts. Les deux bonus sont indépendants ; les dégâts de faim ne pénalisent pas cette note. Le meilleur résultat est conservé sur chaque carte. Les anciennes réussites sans note commencent à une étoile.

| Niveau | Bonus de rapidité | Bonus de dégâts évités |
|---|---:|---:|
| 1 | ≤ 90 s | ≤ 20 dégâts |
| 2 | ≤ 120 s | ≤ 25 dégâts |
| 3 | ≤ 160 s | ≤ 35 dégâts |
| 4 | ≤ 200 s | ≤ 40 dégâts |
| 5 | ≤ 220 s | ≤ 50 dégâts |
| 6 | ≤ 300 s | ≤ 60 dégâts |

### L’Ancien et les nouvelles aides

Le niveau 6 demande aussi de dévorer **L’Ancien**, un prédateur géant à trois marques dorées. `ApexShark` hérite de Shark et Vehicle. Son gestionnaire utilise Pursue quand le joueur est encore trop petit, Evade quand celui-ci devient assez grand ou entre en frénésie, et Wander loin du joueur. Son rayon de 152 est inférieur à la taille maximale de 155 : la règle de taille existante permet donc de le manger. La capture retire ce prédateur et valide l’objectif une seule fois ; elle rapporte 1 500 points et 165 pièces hors frénésie. Il n’est pas ajouté aux autres niveaux. La reprise reconstruit ses comportements sans dupliquer l’acteur.

Des conseils courts apparaissent à la première situation utile : déplacement, saut près de la surface, boost, bateau et danger. Un seul conseil reste visible pendant 6 secondes ; il peut être fermé et sa lecture est mémorisée.

Le bouton **SON : ACTIVER** du menu ou de la pause (également **SON OFF** en haut à droite) active les sons de capture, d’éclaboussure, de bateau dévoré, de blessure, de faible vitalité et de réussite. Les sons sont synthétisés dans le navigateur ; le son reste désactivé au chargement. Les captures et alertes sont espacées pour éviter les superpositions. La disponibilité de Web Audio dépend du navigateur et de ses réglages.

### Repères de chasse et guidage

- **↑ jaune** : grandir avant de le manger. **! rouge** : prédateur plus grand, dangereux. Les repères reprennent exactement `canEatPrey` / `canEatBoat` et disparaissent quand la croissance ou la frénésie rend la proie comestible. Les proies comestibles ne portent aucun repère vert.
- Pour conserver une image lisible et légère, les repères concernent jusqu’à 12 créatures proches et visibles, ou 6 en Mode fluide. Les poissons trop grands ne deviennent pas automatiquement dangereux : ils portent ↑, tandis que les prédateurs portent !.
- Un bandeau donne la direction et la distance en mètres du jeu vers une proie, un coffre, un bateau, un yacht ou la surface. Les objectifs hors nourriture reçoivent un cercle dans la zone de jeu, ou une flèche en dehors. Les repères verts de nourriture sont retirés ; son guidage textuel reste disponible. Les distances utilisent la même conversion que la profondeur (20 unités du monde pour un mètre affiché).
- Le guidage suit les objectifs restants et change après leur accomplissement. Si la vitalité devient faible, la nourriture passe en priorité. Les bateaux déjà comestibles sont privilégiés pour les objectifs de bateaux. Les proies proposées par le guidage restent mobiles : il faut les chasser, le jeu ne pilote pas à ta place.
- Le bouton de légende en bas à gauche masque ou réactive les aides. Le choix est mémorisé. L’Exploration conserve les repères mais n’impose pas de guidage d’objectif.

### Six ambiances

| Niveau | Décor et ambiance | Particularité du défi |
|---|---|---|
| Lagon | Eau turquoise, jardin de corail | Apprendre la chaîne alimentaire |
| Envol | Côte bleue claire, bouées et fanions | Traverser la surface lors de deux sauts |
| Baie | Eau grisée, épaves et mâts engloutis | Dévorer une barque |
| Courants | Eau verte, forêt de laminaires et filets de courant | Chasser et trouver les coffres avec une poussée latérale |
| Abysses | Eau indigo, cheminées et panaches | Davantage de prédateurs et deux bateaux à manger |
| Roi | Lumière dorée, colonnes d’une cité engloutie | Yacht, sauts et chasse avec un requin géant |

Les nouveaux motifs de fond sont décoratifs ; les récifs existants conservent leurs collisions. Le courant du niveau 4 est une force `levelCurrent` ajoutée au BehaviorManager du joueur, désactivable avec les courants du laboratoire. Il n’agit pas pendant le vol ou la pause et est retiré à la sortie du niveau. Le rendu est procédural, limité à 8 motifs visibles par image (4 en Mode fluide), sans ajout de flou ni d’images externes.

## Architecture et principes du cours

Tous les objets mobiles sont des sous-classes de `Vehicle`. `Obstacle` est immobile et n'en hérite pas. `Vec` fournit les opérations vectorielles équivalentes à celles étudiées avec `p5.Vector`. Le rendu utilise Canvas 2D natif pour que le jeu démarre hors ligne. **Ce projet n'utilise pas p5.js ni TensorFlow.js : vérifier si une bibliothèque précise est imposée à votre groupe.** Le réseau dense est implémenté explicitement pour rendre les calculs lisibles.

| Fichier | Rôle |
|---|---|
| `dist/vector.js` | Vecteurs, normalisation, limitation, produit scalaire, projection bornée |
| `dist/vehicle.js` | Classe mère, tous les comportements simples et BehaviorManager |
| `dist/actors.js` | Fish, Shark, Jelly, Particle et Boat : intentions, vol balistique et navigation des bateaux |
| `dist/neural.js` | Réseau dense, agents apprenants et entraînement génétique |
| `dist/game.js` | Boucle, collisions, scores, commandes, monde, graphismes et son procéduraux |
| `dist/lab.js` | Réglages, sauvegarde, entraînement, import/export et caméra facultative |
| `dist/arcade.js` | Couche arcade : profil, requins, économie, chaîne alimentaire, missions, carte et commandes tactiles |
| `dist/levels.js` | Six niveaux, objectifs, difficulté, récompenses uniques, sauvegarde et transitions |
| `dist/experience.js` | Repères de taille, guidage des objectifs, six ambiances et courant du niveau 4 |
| `dist/progression.js` | Reprise de partie, validation, étoiles, L’Ancien et conseils contextuels |
| `dist/audio.js` | Sons courts synthétisés avec Web Audio et limitation de fréquence |
| `dist/style.css` | Interface adaptable à la taille de l'écran |
| `tests/verify.cjs` | Vérifications de mathématiques, IA et règles de jeu |
| `tests/rocks.cjs` | Stabilité du grand requin contre les rochers, à la souris et au clavier |
| `tests/performance.cjs` | Mesure reproductible du coût CPU et des appels de rendu |
| `PERFORMANCE.md` | Optimisations, mesures et limites du benchmark |
| `CONCEPTS.md` | Correspondance entre concepts, slides et implémentation |
| `SOUTENANCE.md` | Déroulé de démonstration et questions à préparer |
| `PROMPTS_IA.md` | Transparence sur l'assistance IA et choix techniques |

### Les trois couches

1. **Sélection d'action** : Fish choisit fuir, se nourrir, migrer ou suivre un leader ; Shark choisit suivre le pointeur, poursuivre ou déambuler.
2. **Pilotage** : les méthodes de Vehicle produisent des forces. BehaviorManager les pondère et limite le total.
3. **Locomotion** : intégration de l'accélération puis de la vitesse avec un delta temps en secondes ; orientation du dessin sur le vecteur vitesse.

La relation fondamentale est `steering = desiredVelocity - currentVelocity`. Dans Flee et Evade, l'inversion porte sur la vitesse désirée. Les unités sont px, px/s et px/s² ; la force maximale n'est donc pas numériquement identique à un TP exprimé par image.

### Réglages et arbitrages

- Vitesse de base des poissons : 115 px/s, modifiée par espèce et ADN ; requin joueur : 255 à 280 selon l’espèce, +15 par amélioration de vitesse, boost ×1,65 ; ennemis : 145.
- Force poisson : 160 ; poids séparation 1,5, alignement 0,8, cohésion 0,65.
- Évitement prioritaire : poids 3,3 pour les poissons et 3,6 pour les requins. Les limites repoussent également les agents.
- Évitement : vecteur ahead dynamique `45 + vitesse × 0,55`, point intermédiaire, projection de l'obstacle sur le segment et position actuelle. Si une pénétration survient, une correction géométrique distincte l'élimine.
- Le comportement de fuite des poissons ajoute un poids de 2,1 à l'évasion quand un prédateur entre dans leur champ de perception.
- Les forces des poissons sont toutes évaluées avant leur déplacement pour limiter le biais lié à l'ordre du tableau.
- Les historiques sont bornés à 45 positions. La population et le nombre d'objets ont des plafonds.
- Le redimensionnement, la pause lors de perte de focus, la reprise, les entrées tactiles et les erreurs de stockage sont gérés.
- Les mondes sont aléatoires : aucune promesse de score ni de convergence de l'apprentissage.

### Grand océan et caméra adaptée à la croissance

- Le monde passe de 3 600 × 1 900 à 12 000 × 6 000. Les récifs sont distribués en grille irrégulière avec au moins 700 unités de passage entre leurs cercles. Bateaux, trésors, méduses et prédateurs sont répartis dans le nouveau monde.
- Le zoom est calculé à partir de la taille du requin et du plus petit côté de l'écran : le corps à taille maximale occupe environ 44 % de ce côté. Le zoom varie doucement pendant la croissance et s'adapte immédiatement au redimensionnement de la fenêtre.
- `screenToWorld`, `worldToScreen`, `viewportWorld` et `applyWorldTransform` centralisent les conversions : dessin, visée à la souris, caméra HandPose, rochers ajoutés et mini-carte utilisent la même échelle.
- Les marges aux côtés et au fond tiennent compte de la silhouette tournée du requin (nez, queue et aileron), au lieu de constantes prévues pour sa taille initiale. L'orientation est conservée à l'arrêt pour éviter une rotation brutale contre un bord.
- Le joueur résout les collisions avec une capsule qui suit son corps allongé, avec jusqu'à cinq passes de correction et une vitesse qui glisse le long des rochers. La rotation de la capsule est limitée à un arc libre pour ne pas repousser le requin lors d’un virage au contact. L’orientation du joueur tourne progressivement ; l’évitement garde un côté stable et les forces dirigées dans un contact sont retirées pour permettre le glissement. Les calculs de capsule utilisent des coordonnées scalaires. Les ennemis conservent leur collision circulaire.
- La population reste plafonnée : les poissons trop éloignés peuvent être replacés en petits groupes autour de la zone explorée, pour conserver de la nourriture sans multiplier les calculs de voisinage. Les modes de démonstration Leader, Snake et Migration conservent leurs parcours.
- Le champ de forces est dessiné uniquement dans la zone visible. Le HUD reste à taille constante et le ciel s'étend au champ de caméra pendant les sauts.

Les tests de régression couvrent la taille maximale sur ordinateur, mobile portrait et paysage, les transformations écran/monde, les bords, le fond, les rochers, le peuplement et un saut complet avec le grand requin. Cela vérifie les problèmes ciblés ; ce n'est pas une garantie d'absence de tout bug.

### Fluidité

Une grille spatiale limite la recherche de voisins aux cellules proches ; les distances exactes des comportements restent appliquées. Les forces de débogage et les historiques ne sont calculés que lorsqu’ils sont affichés. Les effets coûteux, la résolution du canvas et les particules sont plafonnés ; le rendu évite les parties hors champ. Les écritures de sauvegarde sont regroupées et les textes du HUD ne sont réaffectés que lorsqu’ils changent. Voir `PERFORMANCE.md` pour les mesures et leurs limites.

### Saut, croissance et bateaux

Le requin utilise `Shark.advance` : dans l'eau, le pilotage suit les forces de Vehicle ; en vol, l'accélération verticale de 900 px/s² remplace le pilotage Arrive. L'impulsion est de −850 px/s (−940 avec boost). La commande est disponible à moins de 170 pixels de profondeur sous la surface. Le retour dans l'eau exige d'avoir effectivement traversé la surface et de redescendre ; un délai de 0,85 s empêche le double saut. La caméra peut passer au-dessus de y=0, le ciel est dessiné avant le requin aérien pour éviter de le masquer.

La règle unique `canEatPrey` compare les rayons : `requin.radius > proie.radius`. La frénésie garde son exception temporaire. Toutes les proies continuent à simuler leurs comportements, même lorsqu'elles sont trop grandes. Un poisson capturé ajoute une unité de croissance, un bateau en ajoute huit. Chaque palier ajoute 6 pixels de rayon, avec un plafond de taille de 155 pixels. En Survie et Exploration, il faut huit unités par palier ; en Campagne, il en faut respectivement 8, 8, 6, 5, 4 et 3 selon le niveau. Les trois types de bateaux demandent respectivement un rayon de 50, 82 et 125 pixels. Avec le requin de récif, sans bateau déjà dévoré, cela correspond à 40, 80 et 136 proies en Survie/Exploration. Au niveau 3, 30 proies suffisent pour la barque ; au niveau 6, 51 permettent le yacht, puis 65 proies et le yacht permettent d’atteindre la taille maximale et de manger L’Ancien.

`Boat` hérite de Vehicle. Son BehaviorManager choisit Seek pour la croisière ou Flee près du requin ; la locomotion reste contrainte à la surface. La récompense et le retrait d'un bateau sont atomiques dans `consumeBoat`, qui refuse un second paiement pour un bateau déjà supprimé. L'animation de coque et les éclaboussures sont distinctes de l'objet naviguant.

### Évolution de l'écosystème

Chaque poisson a quatre gènes : facteur de vitesse, rayon de perception des prédateurs, perception de nourriture, perception de poison. Sa santé diminue ; le plancton la restaure ; les méduses la diminuent. Un poisson mort libère de la nourriture. Quand la population est sous la cible, les parents sont tirés dans les 30 % ayant la meilleure santé. Leur ADN est copié avec mutation bornée. La chasse humaine et les prédateurs exercent aussi une pression de sélection. Il s'agit d'une sélection évolutive simple, distincte du réseau neuronal du laboratoire.

### Neuro-évolution

Chaque agent possède un réseau entièrement connecté. Entrées : direction de la prochaine nourriture (2), vitesse normalisée (2), distance (1), constante (1) et capteurs d'obstacles (3 à 9 rayons). Les deux sorties fournissent les forces x/y. Les couches cachées (1–3), neurones (4–16), rayons, activation et population sont réglables. Les sorties utilisent toujours tanh pour borner la commande ; les couches internes proposent tanh, sigmoid ou ReLU.

Fitness : `120 × captures + 0,08 × somme des diminutions de distance - 18 × collisions`.

La diminution de distance est signée : s'éloigner annule le bénéfice. Les collisions sont pénalisées au plus une fois toutes les 0,6 s pour limiter la dépendance au pas de temps. Chaque agent a sa propre progression dans une liste de nourritures partagée en positions, mais non consommée globalement : la comparaison des individus reste équitable.

Une génération dure 12 s simulées. Deux élites sont conservées, les autres enfants viennent d'un tournoi dans les meilleurs 35 %, d'un croisement uniforme et de mutations des poids/biais. Arrêt quand 60 % ont capturé trois proies ou à 40 générations. Le meilleur réseau peut être exporté en JSON, importé avec validation stricte, puis essayé pendant 12 secondes sur un récif différent. **La présence d'une procédure d'apprentissage n'est pas une garantie que le réseau converge sur chaque lancement.**

### Machine learning pré-entraîné / ml5

L'onglet « Le cours en pratique » propose d'activer HandPose de ml5 1.3.1 à la demande. L'index pilote le requin, avec inversion horizontale pour le miroir. Le code utilise `ml5.handPose()` puis `detectStart(video, callback)` et prévoit l'arrêt de détection et des pistes caméra. Cette option télécharge une bibliothèque et des modèles. Elle doit être testée sur votre machine avec une vraie webcam et une connexion autorisant les CDN. Elle n'est pas requise pour jouer et **n'a pas été validée avec une caméra pendant la fabrication du projet**.

## Vérifications

Depuis la racine du dossier avec Node.js installé :

```bash
node tests/verify.cjs
node tests/rocks.cjs
```

Le script vérifie Seek/Flee/Arrive, projection, prédiction, évitement, restauration du gestionnaire, héritage ADN, export/import du réseau, plusieurs générations, capture, stabilité des huit modes, pause, défaite, survie continue, frénésie, achats et récompenses uniques. Les vérifications couvrent aussi l'envol, l'arc balistique, le suivi caméra dans le ciel, le retour dans l'eau, la recharge et la pause aérienne, les captures selon la taille et les trois seuils de bateaux avec récompense unique. La syntaxe de chaque fichier JS a aussi été contrôlée. Une inspection visuelle du menu arcade, de la chasse en plein écran, de la carte et du laboratoire a été réalisée dans Chrome. Les tests de campagne couvrent les six étapes, leur verrouillage, le passage au suivant, la faim, les sauts réellement simulés, les collisions avec les coffres, les captures de bateaux/yacht, la récompense unique, l’échec et la reprise, le rejeu et la restauration des réglages en Survie/Exploration. Les tests couvrent aussi les repères selon la taille, la frénésie et les bateaux, les priorités et transitions du guidage, la projection des flèches sur trois formats d’écran et au dézoom, le courant réel du niveau 4, la restauration des réglages et le rendu des six ambiances sans coordonnées invalides. Les vérifications de progression couvrent aussi les sauvegardes JSON invalides, la reprise en pause, la restitution des objets et du profil, les achats après sauvegarde, le vol sans double saut, les étoiles et leur migration, la pénalité des dégâts réels, les comportements et la récompense unique de L’Ancien, les conseils et la génération des sons avec un contexte audio simulé. La reprise après rechargement et les boutons son/saut ont été inspectés dans Chrome. Les tests vérifient aussi les départs à petite taille pour les six niveaux et les trois requins, les seuils de croissance et la conservation de la taille lors d’une reprise. Seize scénarios de contact avec les rochers couvrent l’approche, le glissement, les angles, la pression continue, la souris et le dégagement. Le contrôle webcam nécessite votre propre validation.

## Publication GitHub Pages

Ce dépôt se publie depuis **Settings → Pages → Deploy from a branch → main → / (root)**. Le fichier `index.html` à la racine ouvre `dist/index.html`. Le fichier `.nojekyll` permet de servir les fichiers statiques directement. Chaque modification de `main` actualise le jeu après déploiement.

Pour itch.io : créer un projet de type HTML, zipper les fichiers contenus dans `dist` avec `index.html` à la racine du ZIP, puis l'importer et activer la lecture dans le navigateur. Le ZIP de rendu complet contient aussi la documentation : ne pas l'utiliser tel quel comme build itch.io.

## MON EXPERIENCE — à personnaliser honnêtement

Cette section doit être rédigée par la personne qui rend le projet après manipulation. Le support demande une réflexion personnelle ; le texte ci-dessous est un canevas et ne prétend pas décrire une expérience que je n'ai pas vécue.

- **Pourquoi ce jeu ?** [Expliquer ton intérêt pour Hungry Shark, la chasse sous-marine et un écosystème qui réagit.]
- **Comportements que j'ai compris et choisis :** [Citer 3–5 méthodes et expliquer leur lien avec le gameplay.]
- **Réglages que j'ai essayés :** [Par exemple mettre la séparation à 0, puis à 2 ; décrire ce que TU observes.]
- **Difficulté réellement rencontrée :** [Décrire une difficulté après tes essais, pas un problème inventé.]
- **Comment je l'ai résolue :** [Décrire une mesure, un test ou une lecture.]
- **Ce que j'améliorerais :** [Performances, niveaux, adaptation de la fitness, ergonomie tactile…]
- **IDE utilisé sur mon ordinateur :** [VS Code ou autre, à renseigner.]
- **Assistance IA :** Projet généré et vérifié avec ChatGPT / Codex. [Ajouter le modèle affiché dans ta session si connu, les modifications que tu as faites et le périmètre de ton travail personnel.]

## Références

- Support fourni : Michel Buffa, *Steering behaviors / comportements réactifs*, Master 2 MIAGE IA2, octobre 2026, 62 diapositives : https://docs.google.com/presentation/d/1KACjUkg9xarx656LXUrwJLLHulNr8NWvjlmMHctGVtQ/edit
- Reynolds, C. W. (1987). *Flocks, Herds, and Schools: A Distributed Behavioral Model*. Computer Graphics, 21(4), 25–34. DOI : 10.1145/37402.37406. https://www.red3d.com/cwr/boids/
- Reynolds, C. W. (1999). *Steering Behaviors for Autonomous Characters*. Game Developers Conference. https://www.red3d.com/cwr/steer/gdc99/
- Shiffman, D. (2024). *The Nature of Code*, chapitres Autonomous Agents et Evolutionary Computing. https://natureofcode.com/
- Documentation officielle ml5, HandPose : https://docs.ml5js.org/

## Périmètre et transparence

Le support regroupe plusieurs promotions, années et sujets. Le projet couvre les familles de concepts du cours dans le jeu et dans son laboratoire ; **il ne prétend pas reproduire chaque exercice ni chaque démo du support** (voiture, fusée, toutes les variantes de formations, etc.). Aucun asset d'Ubisoft / Hungry Shark n'est utilisé. Tout le rendu des créatures, du récif et du son est procédural. Les assistants n'ont envoyé ni devoir ni email au professeur, créé de vidéo YouTube ou publié de dépôt GitHub en votre nom. Le lien Sites est une démo privée, pas la publication publique éventuellement imposée.
