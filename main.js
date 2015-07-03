// Taille de l'écran
const width = 540;
const height = 887;

// Variables qui nous permettront de savoir quand le jeu démarre ou quand il y a un GAME OVER
var GAME_START = false;

// Les différentes couleurs que peut prendre le terrain selon le niveau
const COLOR = [
	{background: 'ebebeb', walls: '808080'}, /* lvl 0 - 5 */
	{background: 'deeaf0', walls: '627480'}, /* lvl 5 - 10 */
	{background: 'f4e8e1', walls: '806962'}, /* lvl 10 - 15 */
	{background: 'e8f1dd', walls: '738062'}, /* lvl 15 - 20 */
	{background: 'e6e1f4', walls: '6a6280'}, /* lvl 20 - 25 */
	{background: '727272', walls: 'ffffff'}, /* lvl 25 - 30 */
	{background: '006984', walls: '00beec'}, /* lvl 30 - 35 */
	{background: '288400', walls: '80ec00'}, /* lvl 35 - 40 */
	{background: '002484', walls: '0069ec'}, /* lvl 40 - 45 */
	{background: '84003e', walls: 'ec0064'}, /* lvl 45 - * */
];

// Création de l'objet Phaser
var game = new Phaser.Game(width, height, Phaser.AUTO, '');

// On déclare un objet qui contiendra les états "load" et "main"
var gameState = {};

gameState.load = function() { };
gameState.main = function() { };

// Va contenir le code qui chargera les ressources
gameState.load.prototype = {
	preload: function() {

		// On force le jeu à prendre la taille de l'écran
		game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
		game.scale.setShowAll();
		window.addEventListener('resize', function () {
			game.scale.refresh();
		});

		// On aligne au centre le jeu
		game.scale.pageAlignHorizontally = true;
	 	game.scale.pageAlignVertically = true;

		/**** SPRITES ****/
		// Pics - png et json
		game.load.atlas('spikes', 'img/sprite-spikes.png', 'data/spikes.json');
		// Bird - png et json
		game.load.atlas('bird', 'img/sprite-bird.png', 'data/bird.json');
   		// Trace de l'oiseau quand il saute
   		game.load.image('trail', 'img/trail-bird.png');
		// Walls 
		game.load.image('wall', 'img/background-walls.png');
		// Candy 
		game.load.image('candy', 'img/candy.png');
		// Cercle blanc pour le score 
		game.load.image('circle', 'img/circle-score.png');
		// Bouton rejouer et panel du score
		game.load.image('btnReplay', 'img/btn-replay.png');
		game.load.image('panelScore', 'img/panel-score.png');

		/**** PHYSICS ****/
		game.load.physics('physicsData', 'data/physics-data.json');

		/**** AUDIOS ****/
		game.load.audio('jump', 'audio/jump.ogg');
		game.load.audio('death', 'audio/death.ogg');
		game.load.audio('point', 'audio/point.ogg');
		game.load.audio('candy', 'audio/candy.ogg');
	},

	create: function() {
		game.state.start('main');
	}
};

// va contenir le coeur du jeu
gameState.main.prototype = {
	create: function() {
		
   		game.physics.startSystem(Phaser.Physics.P2JS);

		// Au click, on appelle la fonction "jump()"
		game.input.onDown.add(this.jump, this);

		// ---- BACKGROUND ---------------------------------------------------------
		
		game.stage.backgroundColor = '#' + COLOR[0].background;		

		// ---- PHYSICS ------------------------------------------------------------

    	game.physics.p2.restitution = 1;
		game.physics.p2.gravity.y = 0;

		// ---- WALLS PROPERTIES ---------------------------------------------------
	    
		var widthWalls = 20;
		var widthWallBottom = 120;

		// ---- FIELD PROPERTIES ---------------------------------------------------

		this.backgroundProperties = {
			left: widthWalls, 
			top: widthWalls, 
			right: game.width - widthWalls, 
			bottom: game.height - widthWallBottom,
			width: game.width - widthWalls * 2,
			height: game.height - widthWallBottom - widthWalls,
		};

    	// ---- CANDY ---------------------------------------------------------------
	    
	    this.candyIsEaten = true;
	    this.candyHit = false;

	    // ---- SCORE ---------------------------------------------------------------

	    // Level
	    this.level = 0;

	    // Score
	    this.score = 0;
	    this.candyScore = 0;

		// Cercle du score en fond
		this.circleScore = game.add.sprite(0, 0, 'circle');
		// On centre le cercle
		this.circleScore.position = {
			x: game.width / 2 - this.circleScore.width / 2, 
			y: this.backgroundProperties.top + this.backgroundProperties.height / 2 - this.circleScore.height / 2
		};
		// Txt du score en fond
		this.txtBigScore = game.add.text(100, 100, zeroFill(this.score, 2), { font: '110px bigScoreFont', fill: '#ebebeb', align: 'center' });
		// On centre le score
		this.txtBigScore.position = {
			x: game.width / 2 - this.txtBigScore.width / 2, 
			y: this.backgroundProperties.top + this.backgroundProperties.height / 2 - this.txtBigScore.height / 2 + 10
		};

	    // Txt "+1" quand le joueur attrape un bonbon
		this.txtGainCandy = game.add.text(100, 100, '+1', { font: '45px scoreFont', fill: '#ff8207', align: 'center' });
		this.txtGainCandy.alpha = 0;

		// ---- BIRD ----------------------------------------------------------------

		// Bird
		this.bird = game.add.sprite(0, 0, 'bird');
		// On centre l'oiseau
		this.bird.position = {
			x: game.width / 2, 
			y: this.backgroundProperties.top + this.backgroundProperties.height / 2 - 20
		};
		game.physics.p2.enable(this.bird, false);

		// Animation du battement d'ailes sur un saut
		this.bird.animations.add('fly', [2,0]);
		
		// On fait démarrer l'animation, avec 3 images par seconde et répétée en boucle
		// this.bird.animations.play('fly', 3, true);

		this.bird.body.clearShapes();
		// Permet de charger la forme de collision de l'oiseau - définie dans le fichier "physicsData.json"
		this.bird.body.loadPolygon('physicsData', 'bird-right');

		this.bird.body.fixedRotation = true;
		// Pas de perte de vitesse
		this.bird.body.damping = 0;

		this.xBirdVelocity = 250;
		this.birdIsDead = false;

		// L'oiseau flotte avant de lancer la partie
		this.tweenBird = game.add.tween(this.bird.body);
    	this.tweenBird.to({ y: this.bird.y + 40 }, 600, Phaser.Easing.Quadratic.InOut, true, 0, -1, true);
    	this.bird.animations.frame = 1;
    	this.tweenBird.onLoop.add(function(target, tween) {
    		this.bird.animations.frame = (this.bird.animations.frame + 1) % 2;
    	}, this);

	    //	A chaque collision d'un élément avec l'oiseau, on appelle la fonction blockHit
   		this.bird.body.onBeginContact.add(this.blockHit, this);
		
   		// Particules de l'oiseau quand il saute
		this.emitter = game.add.emitter(game.world.centerX, 200);
		this.emitter.makeParticles('trail');
		this.emitter.maxParticles = 3;
		this.emitter.setScale(1, 0, 1, 0, 2000);
		this.emitter.setAlpha(1, 0, 2000);
		this.emitter.gravity = 0;
		this.emitter.setXSpeed(0, 0);
		this.emitter.setYSpeed(0, 0);


		// ---- SPIKES --------------------------------------------------------------

		this.spikes = {
			top: {group: game.add.group(), numberPossibles: 7, frame: 3 /* image dans le sprite */},
			bottom: {group: game.add.group(), numberPossibles: 7, frame: 0 /* image dans le sprite */},
			left: {group: game.add.group(), numberPossibles: 10, frame: 1 /* image dans le sprite */},
			right: {group: game.add.group(), numberPossibles: 10, frame: 2 /* image dans le sprite */}
		};

		this.minNumberSpikes = 2;
		this.maxNumberSpikes = 3;

   		this.spikes.top.group.enableBody = true;
     	this.spikes.top.group.physicsBodyType = Phaser.Physics.P2JS;

   		this.spikes.bottom.group.enableBody = true;
     	this.spikes.bottom.group.physicsBodyType = Phaser.Physics.P2JS;

   		this.spikes.left.group.enableBody = true;
     	this.spikes.left.group.physicsBodyType = Phaser.Physics.P2JS;

   		this.spikes.right.group.enableBody = true;
     	this.spikes.right.group.physicsBodyType = Phaser.Physics.P2JS;

		// ---- WALLS SPRITES ------------------------------------------------------

		this.wallLeft = this.createWall(widthWalls / 2, game.world.height / 2, widthWalls, game.world.height, 'wallLeft');
		this.wallRight = this.createWall(game.world.width - widthWalls / 2, game.world.height / 2, widthWalls, game.world.height, 'wallRight');
		this.wallTop = this.createWall(game.world.width / 2, widthWalls / 2, game.world.width, widthWalls, 'wallTop');
		this.wallBottom = this.createWall(game.world.width / 2, game.world.height - widthWallBottom / 2, game.world.width, widthWallBottom, 'wallBottom');
		this.createSpikes('top');
		this.createSpikes('bottom');
	},

	// Lancement du jeu
	startGame: function() {
		game.physics.p2.gravity.y = 1400;
		this.bird.body.velocity.x = this.xBirdVelocity;
		this.tweenBird.stop();
	},

	// Fonction qui permet de faire sauter l'oiseau
	jump: function() {
		
		// Son du saut
		game.sound.play('jump');

		// Jump
		this.bird.body.velocity.y = -500;

		// On fait démarrer l'animation, avec 3 images par seconde et répétée en boucle
		this.bird.animations.stop('fly');
		this.bird.animations.play('fly', 4, false);

		// Emission des particules
		this.emitter.on = false;
		this.emitter = game.add.emitter(game.world.centerX, 200);
		this.emitter.makeParticles('trail');
		this.emitter.setScale(1, 0, 1, 0, 1500);
		this.emitter.setAlpha(1, 0, 1500);
		this.emitter.gravity = 0;
		this.emitter.setXSpeed(0, 0);
		this.emitter.setYSpeed(0, 0);
    	this.emitter.start(false, 1500 /* durée de vie */, 130 /* fréquence */, 4 /* quantité */);

    	// On lance le jeu s'il ce n'est pas déjà le cas
		if(!GAME_START) {
			this.startGame();
			GAME_START = true;
		}
	},

	blockHit: function(body, shapeA, shapeB, equation) {
		// Quand l'oiseau touche quelque chose
		if(body != undefined && !this.birdIsDead) {
			// Si c'est le mur de droite
			if(body.sprite.key == 'wallRight') {
				this.bird.body.velocity.x = -this.xBirdVelocity;
				this.bird.body.clearShapes();
				// Permet de charger la forme de collision de l'oiseau - définie dans le fichier "physicsData.json"
				this.bird.body.loadPolygon('physicsData', 'bird-left');
				this.bird.scale.x = -this.bird.scale.x;
				this.createCandy('left');
				this.increaseScore();
				this.createSpikes('left');
			// Si c'est le mur de gauche
			} else if(body.sprite.key == 'wallLeft') {
				this.bird.body.velocity.x = this.xBirdVelocity;
				this.bird.scale.x = -this.bird.scale.x;
				this.bird.body.clearShapes();
				// Permet de charger la forme de collision de l'oiseau - définie dans le fichier "physicsData.json"
				this.bird.body.loadPolygon('physicsData', 'bird-right');
				this.createCandy('right');
				this.increaseScore();
				this.createSpikes('right');
			// Si c'est un bonbon
			} else if(body.sprite.key == 'candy' && !this.candyHit) {
				this.eatCandy();
			// Si c'est un pic
			} else if(body.sprite.key == 'spikeTop' || body.sprite.key == 'spikeBottom' || body.sprite.key == 'spikeLeft' || body.sprite.key == 'spikeRight') {
				this.death();
			}
		}
	},

	// Quand l'oiseau attrape un bonbon
	eatCandy: function() {
		
		// Son du bonbon
		game.sound.play('candy');

		this.candyHit = true;
		// Apparition du txt "+1"
		this.txtGainCandy.alpha = 1;
		this.txtGainCandy.y = this.candy.y - this.candy.height;
		this.txtGainCandy.x = this.candy.x - this.candy.width / 2;
		game.add.tween(this.txtGainCandy).to({ alpha: 0, y: this.txtGainCandy.y - 50 }, 800, Phaser.Easing.Linear.None, true);
		this.candyScore++;
		// Disparition du bonbon
		game.add.tween(this.candy).to({ alpha: 0 }, 100, Phaser.Easing.Quadratic.InOut, true).onComplete.add(function() {
			this.candy.destroy();
			this.candyHit = false;
			this.candyIsEaten = true;
		}, this);
	},

	// Fonction permettant d'augmenter le score
	increaseScore: function() {

		// Son du point supplémentaire
		game.sound.play('point');

		this.score++;
		this.txtBigScore.setText(zeroFill(this.score, 2));

		// Tous les 5 niveaux, on change la couleur du niveau et on augmente la vitesse de l'oiseau
		if(this.score % 5 == 0) {
			this.level++;
			if(COLOR[this.level] != undefined) {
				// On change la couleur des pics
				for(var key in this.spikes) {
					for(var keyChild in this.spikes[key].group.children) {
						this.spikes[key].group.children[keyChild].tint = '0x' + COLOR[this.level].walls;
					}
				}
				// On change la couleur des murs
				this.wallLeft.tint = '0x' + COLOR[this.level].walls;
				this.wallRight.tint = '0x' + COLOR[this.level].walls;
				this.wallTop.tint = '0x' + COLOR[this.level].walls;
				this.wallBottom.tint = '0x' + COLOR[this.level].walls;
				// On change la couleur du background
				game.stage.backgroundColor = '#' + COLOR[this.level].background;
				this.txtBigScore.fill = '#' + COLOR[this.level].background;
				// On augmente la vitesse de l'oiseau
				if(this.xBirdVelocity + 15 <= 400)
					this.xBirdVelocity += 15;
				else
					this.xBirdVelocity = 400;
			}
		}

		// Tous les 10 points, on augmente le nombre de pics possibles
		if(this.score % 10 == 0 && this.maxNumberSpikes < 6) {
			this.minNumberSpikes++;
			this.maxNumberSpikes++;
		}
	},

	// Fonction permettant de créer les pics sur un mur (position : left || right)
	createSpikes: function(position) {

		// On ajoute le sprite du pic dans le jeu
		var spike = game.add.sprite(0, 0, 'spikes', this.spikes[position].frame);

		// Création des pics en haut ou en bas de l'écran
		if(position == 'top' || position == 'bottom') {
			var zoneOccupedByOne = this.backgroundProperties.width / this.spikes[position].numberPossibles;
			var xPositionSpike = this.backgroundProperties.left + zoneOccupedByOne / 2;
			
			// On ajoute autant de pics que possible en haut ou en bas (position = bottom || top)
			for(var i = 0; i < this.spikes[position].numberPossibles; i++) {
				
				var spikeToAdd = game.add.sprite(0, 0, 'spikes', this.spikes[position].frame);
				spikeToAdd.tint = '0x' + COLOR[this.level].walls;

				game.physics.p2.enable(spikeToAdd);
				spikeToAdd.body.kinematic = true;
				spikeToAdd.body.clearShapes();
				// Permet de charger la forme triangulaire de collision des pics
				spikeToAdd.body.loadPolygon('physicsData', 'spike-' + position);
				spikeToAdd.body.data.shapes[0].sensor = true;
				
				spikeToAdd.body.x = xPositionSpike;

				if(position == 'top') {
					spikeToAdd.key = 'spikeTop';
					spikeToAdd.body.y = this.backgroundProperties[position] + spike.height / 2 - 1;
				} else {
					spikeToAdd.key = 'spikeBottom';
					spikeToAdd.body.y = this.backgroundProperties[position] - spike.height / 2 + 1;
				}

				this.spikes[position].group.add(spikeToAdd);
				xPositionSpike = xPositionSpike + zoneOccupedByOne;
			}

		// Création des pics à gauche ou à droite de l'écran
		} else if(position == 'left' || position == 'right') {
			this.calculateRandomsSpikes(this.spikes[position].numberPossibles, getRandomInt(this.minNumberSpikes, this.maxNumberSpikes), spike, position);
		}

		spike.destroy();
	},

	// Permet de calculer et de créer les pics sur un mur
	calculateRandomsSpikes: function(numberSpikesPossible, numberSpikes, spike, position) {
		
		var arraySpikes = [];
		
		var zoneOccupedByOne = this.backgroundProperties.height / numberSpikesPossible;
		var yPositionSpike = this.backgroundProperties.top + zoneOccupedByOne / 2;
		
		// Variables qui vont nous permettre de faire apparaître et disparaître les pics (effet de slide)
		var keySpikeToAdd = (position == 'left') ? 'spikeLeft' : 'spikeRight';
		var xToHideOldSpikes = (position == 'left') ? (this.backgroundProperties['right'] + spike.width / 2 + 1) : (this.backgroundProperties['left'] - spike.width / 2 - 1);
		var xToHideNewSpikes = (position == 'left') ? (this.backgroundProperties['left'] - spike.width / 2 - 1) : (this.backgroundProperties['right'] + spike.width / 2 + 1);
		var xToShowSpikes = (position == 'left') ? (this.backgroundProperties[position] + spike.width / 2 - 1) : (this.backgroundProperties[position] - spike.width / 2 + 1);
		// A chaque fois que le joueur touche un mur, on fait disparaître les pics de ce mur
		// Si on doit placer des pics à gauche, on supprime les pics du mur de droite et inversement
		var groupSpikesToDelete = (position == 'left') ? (this.spikes['right'].group) : (this.spikes['left'].group);

		// On fait disparaître les pics du mur touché par le joueur (effet de slide)
		for(var i = 0; i < groupSpikesToDelete.length; i++) {
			var spikeToDelete = groupSpikesToDelete.getAt(i);
			game.add.tween(spikeToDelete.body).to({ x: xToHideOldSpikes }, 100, Phaser.Easing.Quadratic.InOut, true).onComplete.add(function() {
				groupSpikesToDelete.removeAll(true);
			}, this);
		}

		// On remplit le tableau avec des valeurs vides
		for(var i = 0; i < numberSpikesPossible; i++)
			arraySpikes[i] = undefined;

		var inserted = false;
		for(var i = 0; i < numberSpikes; i++) {
			inserted = false;
			while(!inserted) {
				// On calcule aléatoirement la place du pics à ajouter
				var key = getRandomInt(0, numberSpikesPossible - 1);
				// Si la valeur est "undefined", on peut alors remplir le tableau avec le spike
				if(arraySpikes[key] == undefined) {
					var spikeToAdd = game.add.sprite(0, 0, 'spikes', this.spikes[position].frame);
					game.physics.p2.enable(spikeToAdd);

					// En fonction du niveau, on change la couleur des pics
					if(COLOR[this.level] != undefined)
						spikeToAdd.tint = '0x' + COLOR[this.level].walls;
					else
						spikeToAdd.tint = '0x' + COLOR[COLOR.length - 1].walls;

					spikeToAdd.body.kinematic = true;
					spikeToAdd.body.clearShapes();
					// Permet de charger la forme triangulaire de collision des pics
					spikeToAdd.body.loadPolygon('physicsData', 'spike-' + position);
					spikeToAdd.body.data.shapes[0].sensor = true;
					spikeToAdd.body.y = yPositionSpike + zoneOccupedByOne * key;
					spikeToAdd.body.x = xToHideNewSpikes;
					spikeToAdd.key = keySpikeToAdd;

					this.spikes[position].group.add(spikeToAdd);
					inserted = true;
					arraySpikes[key] = spike;
				}
			}
		}

		// Un fois tous les pics placés, on les fait apparaître
		for(var i = 0; i < this.spikes[position].group.length; i++) {
			var spikeToDisplay = this.spikes[position].group.getAt(i);
			game.add.tween(spikeToDisplay.body).to({ x: xToShowSpikes }, 100, Phaser.Easing.Quadratic.InOut, true);
		}
	},

	// Création d'un bonbon en fonction de la position donnée (left || right)
	createCandy: function(position) {

		if(this.candyIsEaten) {
			// Candy
			this.candy = game.add.sprite(0, 0, 'candy');

			var positionCandy = {x: 0, y: Math.random() * (this.backgroundProperties.height - this.backgroundProperties.top - this.candy.height * 4) + this.backgroundProperties.top + this.candy.height * 2};

			if(position == 'right')
				positionCandy.x = this.backgroundProperties.right - this.candy.width * 1.5;
			else if(position == 'left')
				positionCandy.x = this.backgroundProperties.left + this.candy.width * 1.5;

			this.candy.position = positionCandy;

			// ---- PHYSICS ------------------------------------------------------------

			game.physics.p2.enable(this.candy, false);

	    	// ---- PROPERTIES --------------------------------------------------------------

	    	this.candy.body.data.shapes[0].sensor = true;
	    	this.candy.body.data.gravityScale = 0;
	    	this.candyIsEaten = false;

	    	// On fait apparaître le bonbon
	    	this.candy.alpha = 0;
	    	game.add.tween(this.candy).to({ alpha: 1 }, 100, Phaser.Easing.Linear.None, true);
	    	game.add.tween(this.candy.body).to({ y: this.candy.y + 20}, 500, Phaser.Easing.Linear.None, true, 0, -1, true);
	    }
	},

	// Création d'un mur
	createWall: function(x, y, width, height, key) {
		var wall = game.add.sprite(x, y, 'wall');
		wall.key = key;
		wall.width = width;
		wall.height = height;
		game.physics.p2.enable(wall, false);
		wall.body.kinematic = true;
		wall.body.damping = 0;
		wall.tint = '0x' + COLOR[0].walls;

		return wall;
	},

	update: function() {
		// Quand l'oiseau est mort, on le fait tourner sur lui-même
		if(this.birdIsDead)
			this.bird.rotation -= 0.2;

		// Particules derrière l'oiseau
		if(this.bird.scale == -1) {
			this.emitter.emitX = this.bird.x + this.bird.width / 4;
		} else {
			this.emitter.emitX = this.bird.x - this.bird.width / 4;
		}
		this.emitter.emitY = this.bird.y;
	},

	// Fonction qui se déclenche lorsque l'oiseau touche un pic
	death: function() {	
		// Son de l'oiseau qui meurt
		game.sound.play('death');

		game.input.onDown.removeAll();
		this.bird.animations.stop('fly');
		this.bird.animations.frame = 3;
		this.birdIsDead = true;
    	game.physics.p2.restitution = 0.5;

    	// On fait disparaître l'oiseau, le bonbon et on fait apparaître le menu
    	game.add.tween(this.candy).to({ alpha: 0 }, 500, Phaser.Easing.Linear.None, true /* auto start */, 1000 /* delay */);
    	game.add.tween(this.bird).to({ alpha: 0 }, 500, Phaser.Easing.Linear.None, true /* auto start */, 1000 /* delay */).onComplete.add(function() {
    		this.menu();
    	}, this);
		
		var self = this;
	},

	// Fonction qui fait apparaître le menu à la fin d'une partie
	menu: function() {
	
		// Bouton "REJOUER"
		this.btnReplay = game.add.group();
		this.spriteBtnReplay = game.add.sprite(0, 0, 'btnReplay');
		this.txtReplay = game.add.text(0, 0, 'REJOUER', { font: '55px scoreFont', fill: 'white', align: 'center' });
		this.txtReplay.x = this.spriteBtnReplay.width / 2 - this.txtReplay.width / 2;
		// On ajoute l'image du bouton + le texte dans le groupe "btnReplay"
		this.btnReplay.add(this.spriteBtnReplay);
		this.btnReplay.add(this.txtReplay);
		this.btnReplay.y = game.height / 2;
		this.btnReplay.x = game.width / 2 - this.btnReplay.width / 2;
		
		// Panel du score
		this.panelScore = game.add.group();
		this.spritePanelScore = game.add.sprite(0, 0, 'panelScore');
		this.txtPanelScore = game.add.text(0, 5, this.score + '', { font: '70px scoreFont', fill: 'white', align: 'center' });
		this.txtPanelScore.x = this.spritePanelScore.width / 2 - this.txtPanelScore.width / 2;
		// On ajoute l'image du panel + le texte + le btn des score dans le groupe "panelScore"
		this.panelScore.add(this.spritePanelScore);
		this.panelScore.add(this.txtPanelScore);
		this.panelScore.y = game.height / 2 - this.panelScore.height - 30;
		this.panelScore.x = game.width / 2 - this.panelScore.width / 2;
		
		// Score des bonbons attrapés
		this.finalCandyScore = game.add.group();
		this.spriteCandyScore = game.add.sprite(0, 0, 'candy');
		this.txtFinalCandyScore = game.add.text(80, -5, this.candyScore + '', { font: '45px scoreFont', fill: '#ff8207', align: 'center' });
		// On ajoute le score des bonbons
		this.finalCandyScore.add(this.spriteCandyScore);
		this.finalCandyScore.add(this.txtFinalCandyScore);
		this.finalCandyScore.y = game.height / 2 + 200;
		this.finalCandyScore.x = game.width / 2 - this.finalCandyScore.width / 2;

		this.btnReplay.alpha = this.panelScore.alpha = this.finalCandyScore.alpha = 0;

		var self = this;
		// On fait apparaître le menu
		game.add.tween(self.panelScore).to({ alpha: 1 }, 300, Phaser.Easing.Linear.None, true).onComplete.add(function() {
			game.add.tween(self.btnReplay).to({ alpha: 1 }, 300, Phaser.Easing.Linear.None, true).onComplete.add(function() {
				game.add.tween(self.finalCandyScore).to({ alpha: 1 }, 600, Phaser.Easing.Linear.None, true);
			});
		});

    	// Evénements sur le bouton replay
		this.spriteBtnReplay.inputEnabled = true;
		this.spriteBtnReplay.events.onInputDown.add(function() {
			self.spriteBtnReplay.tint = 0xbdbdbd;
		});
		this.spriteBtnReplay.events.onInputUp.add(function() {
			self.spriteBtnReplay.tint = 0xffffff;
			self.restart();
		});
	},

	restart: function() {
		GAME_START = false;
		game.state.start('main');
	}
};


// On ajoute les 2 fonctions "gameState.load" et "gameState.main" à notre objet Phaser
game.state.add('load', gameState.load);
game.state.add('main', gameState.main);
// Il ne reste plus qu'à lancer l'état "load"
game.state.start('load');