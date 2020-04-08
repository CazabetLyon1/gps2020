# LIFPROJET
Ce projet consiste en la conception d’un site internet permettant de visualiser et de modifier en temps réel une trace GPS.

## Installation:
Pour compiler le projet :
En mode dev :
```
$ npm i
$ npm run dev
```

En mode production :
```
$ npm i
$ npm run prod
```

## Outils:
### Insertion de points <img src="src/img/add.png" alt="Ajouter" width="20" height="20"/>
Cet outil permet d'ajouter un point à votre itinéraire GPS. Il est possible de cliquer sur le tracé pour ajouter votre point entre deux autres. Lors de l'ajout d'un point, il est possible de le déplacer avec le curseur.

<img src="src/img/add.gif" alt="Ajout de points" width="300" height="300"/>

### Suppression d'un point <img src="src/img/delete.png" alt="Supprimer" width="20" height="20"/>
Cet outil permet de supprimer un point de votre itinéraire GPS.

<img src="src/img/delete.gif" alt="Suppression d'un point" width="300" height="300"/>

### Déplacement et fusion de points <img src="src/img/move.png" alt="Déplacer" width="20" height="20"/>
Cet outil permet de déplacer un point déjà présent sur votre itinéraire GPS. Il est possible de fusionner deux points consécutifs en déplaçant un des points vers le deuxième. Si les deux points ne sont pas consécutifs alors les deux points subsistent et sont modifiables individuellement (cela permet par exemple de créer un cycle).

<img src="src/img/move.gif" alt="Déplacement et fusion de points" width="300" height="300"/>

### Simplification locale de points <img src="src/img/lasso.png" alt="Lasso" width="20" height="20"/>
Cet outil permet de réduire localement le nombre de points de votre itinéraire GPS.

<img src="src/img/lasso.gif" alt="Simplification locale de points" width="300" height="300"/>

### Simplification globale de points <img src="src/img/wand.png" alt="Correcteur" width="20" height="20"/>
Cet outil permet de réduire globalement le nombre de points de votre itinéraire GPS.

<img src="src/img/wand.gif" alt="Simplification globale de points" width="300" height="300"/>

### Raccourci <img src="src/img/cut.png" alt="Raccourci" width="20" height="20"/>
Cet outil permet de réduire localement votre itinéraire GPS en indiquant deux points.

<img src="src/img/cut.gif" alt="Raccourci d'un itinéraire" width="300" height="300"/>

### Effacer <img src="src/img/trash.png" alt="Effacer" width="20" height="20"/>
Cet outil permet d'effacer votre itinéraire GPS.

<img src="src/img/erase.gif" alt="Effacement d'un itinéraire" width="300" height="300"/>

## Fonctionnalités :
### Altitude
Un graphique présente l'évolution de l'altitude du tracé. Le graphique évolue dynamiquement en même temps que le tracé.

### Historique de tracé
Deux bouttons *undo* et *redo* permettent de revenir en arrière ou en avant.

### Mise en cache des tiles
Les *tiles* (images) qui constituent la carte sont mises en cache dans le navigateur de l'utilisateur afin d'optimiser un futur chargement de la page.

### Importation d'un fichier GPX
Le module d’importation de trace offre deux options :

* importer une trace via un lien
* importer une trace via un fichier personnel

Le seul format de fichier accepté est le .gpx

L’importation tient compte des métadonnées présentent au sein du fichier (nom de la trace, description de la trace, auteur, email, nom, etc…)

### Exportation d'une trace
Le module d’exportation permet à l’utilisateur de sauver une copie de sa trace GPS. Le fichier GPX généré est en version 1.1 (dernière norme en date). L’exportation classique ne tient pas compte des métadonnées contrairement à l’exportation avancée. Les métadonnées sont modifiables à tout moment.

L’importation et l’exportation s’effectue du côté client de l’application. Cela permet de soulager le serveur Node.js du traitement des fichiers GPX et de garantir le respect de la confidentialité des utilisateurs et de leurs données.


## Fonctionnalités en développement:
* 