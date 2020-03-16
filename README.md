# LIFPROJET
Cette application permet de visualiser et de modifier en temps réel une trace GPS.

## Installation:
Pour compiler le projet :
```
$ npm i
$ npm run dev
```

## Fonctionnalités principales:
### 1. Insertion d'un point
Il est possible d'insérer un point à n'importe quelle position sur le tracé. Lors de l'ajout d'un point, il est possible de le déplacer avec le curseur.

![Ajout d'un point](md/add_points.gif)

### 2. Suppression d'un point
Il est possible de supprimer un point à n'importe quelle position sur le tracé.

![Ajout d'un point](md/delete_points.gif)

### 3. Fusion de points
Il est possible de fusionner deux points consécutifs en déplaçant un des points vers le deuxième. Si les deux points ne sont pas consécutifs alors les deux points subsistent et sont modifiables individuellement (cela permet par exemple de créer un cycle).

![Ajout d'un point](md/fusion_points.gif)

### 4. Simplification de points
Il est possible de simplifier une portion du tracé comportant des points rapprochés.

![Ajout d'un point](md/select_points.gif)

## Fonctionnalités secondaires:
### Altitude
Un graphique présente l'évolution de l'altitude du tracé. Le graphique évolue dynamiquement en même temps que le tracé.

### Historique de tracé
Deux bouttons *undo* et *redo* permettent de revenir en arrière ou en avant.

### Mise en cache des tiles
Les *tiles* (images) qui constituent la carte sont mises en cache dans le navigateur de l'utilisateur afin d'optimiser un futur chargement de la page.

## Fonctionnalités en développement:
* Importation d'un fichier GPX
* Exportation de la trace GPS en fichier GPX
* Ajout d'un dégradé sur la polyline qui fluctue en fonction de l'altitude
* Partage de la trace ? (via un lien ?)