# Assistance IA — consignes et transparence

## Demande initiale

Créer pour un rendu le jour même un jeu de chasse aux poissons inspiré de Hungry Shark, en utilisant les concepts de la présentation Google Slides fournie.

## Directives de réalisation utilisées

- Lire les 62 diapositives du support et distinguer concepts théoriques, exercices et consignes propres à chaque promotion.
- Produire une création originale ; ne pas réutiliser d'assets de Hungry Shark.
- Fournir une version exécutable sans installation pour le cœur du jeu.
- Regrouper les steering behaviors dans Vehicle, avec héritage des objets mobiles et gestionnaire de comportements par instance.
- Implémenter Seek, Flee, Pursue, Evade, Arrive, Wander, projection scalaire, suivi de chemin, Avoid, Boids, leader et snake.
- Rendre les poids, la perception et la population réglables. Ajouter un affichage de débogage.
- Séparer les règles de jeu, les acteurs, les mathématiques et le réseau neuronal.
- Fournir une évolution par ADN et une démonstration distincte de neuro-évolution avec sauvegarde/import et test sur nouveau récif.
- Prévoir un contrôle ml5 HandPose facultatif, activé uniquement par l'utilisateur.
- Commenter les principes des algorithmes et fournir une documentation pour expliquer le code.
- Vérifier les mathématiques critiques, les règles du jeu et la stabilité des modes.
- Ne pas inventer d'expérience personnelle de l'étudiant ; fournir un canevas à compléter.

## Outils et responsabilité

Code et documentation générés avec ChatGPT / Codex dans un environnement de développement Linux. Le modèle exact doit être renseigné depuis l'interface si cette information est disponible ; il n'est pas inventé dans ce dossier. Inspection visuelle dans Chrome, vérifications JavaScript avec Node.js. L'étudiant doit tester, comprendre, personnaliser et déclarer les usages de l'IA selon les règles de son établissement.

Aucun dépôt GitHub public ni vidéo YouTube n'a été créé au nom de l'étudiant. La caméra n'a pas été testée sur du matériel réel.

## Révision demandée

L'utilisateur a précisé vouloir retrouver le jeu de référence avec les principes des slides. L'interface a donc été réorganisée autour d'une sélection de requins, d'une chasse en plein écran, de croissance, de pièces, d'améliorations et de frénésie d'or. La survie est sans fin automatique ; les missions donnent des récompenses. Les algorithmes du cours restent centralisés dans Vehicle, et le laboratoire reste accessible.

## Saut, taille et bateaux

Ajout demandé : saut hors de l'eau avec requin visible pendant le vol et la retombée ; consommation fondée sur la taille réelle des proies ; bateaux naviguant à la surface et consommables selon la croissance. La locomotion balistique est séparée des forces de pilotage. Boat hérite de Vehicle et utilise Seek/Flee. Les vérifications couvrent le cycle complet du saut, sa pause, les limites de taille et l'unicité des récompenses des bateaux.

## Océan étendu et stabilité à grande taille

À la demande de l'utilisateur, la surface de jeu est multipliée par environ 10,5. Ajout d'un zoom automatique lié à la croissance, de conversions de coordonnées partagées, de marges selon la silhouette et d'une collision capsule pour le requin joueur. Les récifs sont espacés, la nourriture reste disponible sans augmenter démesurément le nombre d'agents, et les tests couvrent le requin maximal sur trois formats d'écran ainsi que son saut.

## Réduction des saccades

À la suite du signalement de ralentissements : grille spatiale pour les voisins, calculs vectoriels et évitement allégés, historiques et forces visuelles à la demande, résolution et particules plafonnées, suppression des flous coûteux, sauvegardes regroupées et HUD actualisé seulement lors des changements. Un bouton Mode fluide réduit davantage la qualité graphique sans changer le gameplay. Les tests comparent les forces Boids à une recherche exhaustive et vérifient les sauvegardes et le bouton. Un benchmark CPU reproductible est fourni ; il ne mesure pas les FPS réels du navigateur.

## Ajout des niveaux

Demande : « ajoute moi des niveau dans le jeux ». Ajout d’une campagne de six niveaux débloqués dans l’ordre, avec sélection, objectifs, bonus uniques, sauvegarde, reprise après défaite et écran final. La difficulté augmente par les dangers, les courants et la faim, sans augmenter la population de poissons. Dans cette première version, les niveaux de bateaux commençaient avec une croissance suffisante ; ce choix est remplacé par la révision ci-dessous. Les modes Survie et Exploration et les comportements du cours sont conservés. Tests fonctionnels de la progression, des événements, du rejeu et des sauvegardes, puis inspection du menu, des objectifs et de la pause dans Chrome.

## Lisibilité, guidage et diversité des niveaux

À la demande de l’utilisateur après les propositions d’amélioration : repères verts pour les proies comestibles, flèche de croissance pour les proies trop grandes et avertissement pour les prédateurs dangereux. Ajout d’un guidage qui suit les objectifs restants et privilégie la nourriture en cas de faible vitalité. Chaque niveau reçoit une palette et un motif distincts ; le niveau des courants ajoute une force au gestionnaire du joueur. Les aides se désactivent et les détails restent plafonnés en Mode fluide. Tests des règles, de la géométrie des flèches, du courant, des transitions et du rendu ; inspection des repères et du bouton d’aide dans Chrome.

## Simplification des repères

À la demande de l’utilisateur, retrait des repères verts sur les proies comestibles et de leur cible/flèche verte dans le monde. Les indications ↑ Grandir et ! Danger sont conservées, ainsi que le guidage des autres objectifs. Les règles de capture restent identiques.

## Reprise, étoiles, prédateur final, son et conseils

L’utilisateur a accepté les cinq propositions suivantes : reprendre une partie interrompue, gagner trois étoiles par niveau, affronter un prédateur final, enrichir les sons et afficher des conseils contextuels. Ajout d’un point de reprise local toutes les cinq secondes et lors des transitions de sortie, avec profil associé et acteurs reconstruits à partir de données validées. Notation par réussite, temps et dégâts, avec meilleur score conservé. L’Ancien alterne Pursue/Evade/Wander et devient un objectif du niveau 6. Ajout de sons Web Audio courts, d’un tampon de bruit réutilisé pour les éclaboussures, de limites de fréquence et de conseils fermables mémorisés. Tests de restauration, d’achats après sauvegarde, de migration, d’étoiles, de comportement et de récompense unique du prédateur, ainsi que d’audio simulé. Vérification dans Chrome de la reprise après rechargement, du son activable et du saut.

## Nouveau départ et collisions à grande taille

À la demande de l’utilisateur, tous les nouveaux niveaux et rejeux repartent avec la taille de base du requin choisi et zéro XP. La croissance accélère progressivement (8, 8, 6, 5, 4 puis 3 unités par palier) pour garder les objectifs de bateaux et du prédateur final accessibles. Une reprise de plongée conserve sa progression. Le guidage invite à grandir avant de viser un bateau trop grand.

Le grand requin pouvait changer d’orientation de presque 180° au contact d’un rocher. Ajout d’une rotation progressive, d’un côté d’évitement stable et d’une projection des forces sur les contacts ; calculs scalaires de la capsule. Vérification des six départs pour les trois requins, des seuils de croissance, de la reprise et de sept scénarios de collision à taille maximale. Inspection du menu de niveaux et du départ petit dans Chrome.

## Retour utilisateur : secousses encore présentes au contact

Le signalement persiste après la première correction. Des tests de cible souris dans/autour d’un récif et entre deux rochers reproduisent une autre cause : la rotation de la capsule crée une pénétration, ensuite corrigée par un déplacement brusque. Ajout d’une vérification de l’arc de rotation avec recherche de la portion libre et retrait de la vitesse dirigée dans un contact persistant. Comparaison ancienne/nouvelle version avec neuf scénarios supplémentaires, pas de temps variables, trois tailles et dégagement final ; vérifications générales et benchmark CPU. Version du script actualisée dans le HTML pour éviter de réutiliser le fichier précédent en cache.

## Commande de son visible

L’utilisateur ne trouvait pas l’icône audio. Ajout d’un bouton textuel SON : ACTIVER près du titre au menu et dans la pause, avec état synchronisé sur les trois commandes. Le bouton supérieur affiche SON OFF/ON et reste visible sur petits écrans. L’activation conserve le son de confirmation et les effets existants.
