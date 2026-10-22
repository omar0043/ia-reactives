# Démonstration de 2 minutes

**Avant d'enregistrer** : tester le son, lancer le jeu, vérifier le lien du jeu et ses droits d’accès et préparer les fenêtres de code. Compléter la section MON EXPERIENCE. Ne pas activer la caméra pendant une soutenance sans l'avoir testée.

## 0:00–0:20 — Le concept

« Mon projet est un jeu de chasse sous-marine inspiré de la boucle manger, grandir et survivre. Les poissons ne suivent pas un script de trajectoire : ils décident selon leur voisinage, la nourriture, les obstacles et les prédateurs. »

Montrer la sélection des trois requins, les améliorations et le solde de pièces. Montrer la sélection de Campagne et ses six niveaux, leurs objectifs et leurs récompenses. Expliquer que chaque niveau repart petit et que la croissance accélère ensuite. Lancer le niveau 1 en plein écran, se déplacer, accélérer et capturer quelques poissons. Expliquer que manger recharge la vitalité et la frénésie d'or. Montrer les repères ↑ / ! et le guidage automatique. Les six ambiances varient le décor ; le courant du niveau 4 est une force du BehaviorManager.

## 0:20–0:50 — Les comportements

Ouvrir le laboratoire et mettre Vecteurs et Trajectoires, puis Observer. Montrer un banc qui se sépare à l'approche du requin. Expliquer : séparation, alignement, cohésion. Les requins ennemis utilisent Pursue ; les poissons Evade. La couleur verte montre la vitesse, l'or la cible prédite.

## 0:50–1:15 — Leader, snake et obstacles

Passer en exploration, appuyer sur L, faire demi-tour pour montrer le dégagement devant le leader, puis X pour la file indienne. Ajouter un rocher avec O, assez loin du requin. Montrer le choix d'un ahead dynamique et le point projeté dans Vehicle.avoid. Revenir au banc avec N.

## 1:15–1:40 — Évolution

Montrer les quatre gènes des poissons dans actors.js, puis le laboratoire Neuro-évolution. Lancer l'entraînement, montrer la topologie, la fitness et les rayons. Expliquer que ce n'est pas une animation de score : chaque agent exécute son propre réseau et les poids évoluent à chaque génération. Exporter un cerveau et expliquer le test de généralisation.

## 1:40–2:00 — Architecture et recul

« Tous les objets mobiles héritent de Vehicle. Les comportements élémentaires sont regroupés dans cette classe. Chaque objet a son BehaviorManager ; les sous-classes définissent surtout les combinaisons. Le rendu Canvas et les vecteurs sont autonomes. Le contrôle gestuel ml5 est une option séparée. »

Montrer le bouton Reprendre après un retour au menu et les étoiles par niveau. Pour expliquer le prédateur final, lire ApexShark : Pursue quand le joueur est petit, Evade quand il grandit, avec les mêmes comportements de Vehicle.

Terminer par UNE observation personnelle réellement faite et UNE limite du projet.

# Questions à préparer

1. Pourquoi Flee n'est pas l'opposé de la force de Seek ? Parce que la soustraction de la vitesse actuelle doit toujours agir comme correction ; c'est la vitesse désirée qu'on inverse.
2. Pourquoi Arrive ? Pour réduire la vitesse près de la cible et éviter les oscillations rapides ou le dépassement.
3. Pourquoi ajouter une résolution de collision après Avoid ? Avoid anticipe mais n'est pas une garantie géométrique, notamment en cas de départ dans un rocher.
4. Quelle différence entre Pursue et Seek ? Pursue vise la position future de la cible mobile.
5. Quelle différence entre Boids et leader ? Les Boids calculent un comportement collectif local ; le suivi de leader a une référence explicite et évite la zone devant elle.
6. Où se fait l'apprentissage ? Dans le laboratoire : les poids/biais des réseaux évoluent via fitness, sélection, croisement et mutation. Les forces des Boids sont déterministes à partir de la scène ; elles n'apprennent pas.
7. Pourquoi la convergence peut-elle échouer ? Fitness insuffisamment informative, exploration pauvre, paramètres ou mutations inadaptés, difficulté de l'environnement.
8. Qu'est-ce qui a été généré par IA ? Indiquer honnêtement le code, la documentation et les vérifications, puis expliquer tes propres essais et changements.
9. Pourquoi pas p5.js/TensorFlow ? Le choix réduit les dépendances et rend les calculs explicites ; confirmer que l'enseignant accepte ce choix si sa consigne impose une bibliothèque.

# Dernière vérification avant rendu

- Renseigner nom(s), groupe et auteur(s).
- Compléter MON EXPERIENCE avec de vrais essais.
- Publier sur GitHub Pages ou itch.io si demandé ; vérifier le lien en navigation privée.
- Ajouter le lien de démo et celui de la vidéo au README si exigés.
- Ne pas présenter l'option caméra comme testée sans essai sur ton ordinateur.
- Relire au moins Vec, Vehicle.seek/flee/avoid, Fish.intention et EvolutionTrainer.nextGeneration.
