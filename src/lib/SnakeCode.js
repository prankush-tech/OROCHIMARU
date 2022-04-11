import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';

export default class SnakeCode {
	constructor() 
	{
		this.gameScale = 2;
		this.boardSize = 8;
		this.snakeSpeed = 0.5;
		this.snakeStarterLength = 10 ;

		this.lastTimeStamp = 0;
		this.loopTimeStep = 500;
		this.tweenTimeStep = 150;
		this.lastPressedKey = 'Esc';

		this.boardGroup = new THREE.Group();
		this.snackGroup = new THREE.Group();
		this.snakeGroup = new THREE.Group();

		this.snakegamegroup = new THREE.Group();

		this.snakegamegroup.add(this.snakeGroup);
		this.snakegamegroup.add(this.snackGroup);
		this.snakegamegroup.scale.set(this.gameScale, this.gameScale, this.gameScale);

		this.resetBoard();
		this.resetSnake();
		this.resetSnack();
	}

	getRandomXY() {
		const x = Math.ceil(Math.random() * this.boardSize) - 0.5 - this.boardSize / 2;
		const y = Math.ceil(Math.random() * this.boardSize) - 0.5 - this.boardSize / 2;

		return { x, y };
	}

	snakePartsOnSnack(snakePartsXY, snackXY) {
		return snakePartsXY.some((snakePartXY) => {
			return this.almostEqual(snakePartXY.x, snackXY.x) && this.almostEqual(snakePartXY.y, snackXY.y);
		});
	}

	clearSnackGroup() {
		this.snackGroup.clear();
	}

	clearSnakeGroup() {
		this.snakeGroup.clear();
	}

	clearBoardGroup() {
		this.boardGroup.clear();
	}

	pressKey(event) {
		this.lastPressedKey = event.key;
	}

	almostEqual(a, b) {
		const epsilon = 0.25;
		return Math.abs(a - b) < epsilon;
	}

	resetSnake()
	 {
		this.clearSnakeGroup();

		for (let i = 0; i < this.snakeStarterLength; i++)
		 {
			const snakePartGeometry = new THREE.BoxGeometry(1, 1, 1);
			const snakePartMaterial = new THREE.MeshNormalMaterial();
			const snakePart = new THREE.Mesh(snakePartGeometry, snakePartMaterial);

			snakePart.position.x = this.snakeStarterLength / 2 - 0.5 - i;
			snakePart.position.y = -0.5;
			this.snakeGroup.add(snakePart);
		}
	}

	resetSnack() {
		this.clearSnackGroup();

		const snakePartsXY = [];
		this.snakeGroup.children.forEach((snakePart) => {
			snakePartsXY.push({
				x: snakePart.position.x,
				y: snakePart.position.y
			});
		});

		let snackXY = this.getRandomXY();
		while (this.snakePartsOnSnack(snakePartsXY, snackXY)) {
			snackXY = this.getRandomXY();
		}

		const geometry = new THREE.SphereGeometry(0.5);
		const material = new THREE.MeshBasicMaterial( { color: 0xf00fff } );
		const snack = new THREE.Mesh(geometry, material);
		snack.position.x = snackXY.x;
		snack.position.y = snackXY.y;

		this.snackGroup.add(snack);
	}

	resetBoard() {
		this.clearBoardGroup();

		for (let i = 0; i < this.boardSize; i++) {
			for (let j = 0; j < this.boardSize; j++) {
				const geometry = new THREE.BoxGeometry(1, 1, 1);
				const material = new THREE.MeshNormalMaterial({ wireframe: true });
				const boardTile = new THREE.Mesh(geometry, material);

				// NOTE: Position the board tiles in the center of the screen.
				boardTile.position.x = i - this.boardSize / 2 + 0.5;
				boardTile.position.y = j - this.boardSize / 2 + 0.5;
				this.boardGroup.add(boardTile);
			}
		}
	}

	extendSnake(lastSnakePartCoords)
	  {
		const snakePartGeometry = new THREE.BoxGeometry(1, 1, 1);
		const snakePartMaterial = new THREE.MeshNormalMaterial();
		const snakePart = new THREE.Mesh(snakePartGeometry, snakePartMaterial);

		snakePart.position.x = lastSnakePartCoords.x;
		snakePart.position.y = lastSnakePartCoords.y;
		this.snakeGroup.add(snakePart);
	}

	loop(t) {
		TWEEN.update(t);
		const timeStep = t - this.lastTimeStamp;
		if (timeStep > this.loopTimeStep) {
			this.moveSnake();
			this.lastTimeStamp = t;
		}
	}

	moveSnake() {
		const lastPressedKey = this.lastPressedKey;

		const oldHeadXCoord = this.snakeGroup.children[0].position.x;
		const oldHeadYCoord = this.snakeGroup.children[0].position.y;

		const oldCoords = {
			x: oldHeadXCoord,
			y: oldHeadYCoord
		};
		const newCoords = {
			x: oldHeadXCoord,
			y: oldHeadYCoord
		};

		const lastChildIndex = this.snakeGroup.children.length - 1;
		const lastSnakePartCoords = {
			x: this.snakeGroup.children[lastChildIndex].position.x,
			y: this.snakeGroup.children[lastChildIndex].position.y
		};

		const upKeys = [ 'w', 'ArrowUp' ];
		const leftKeys = [ 'a', 'ArrowLeft' ];
		const downKeys = [ 's', 'ArrowDown' ];
		const rightKeys = [ 'd', 'ArrowRight' ];

		if (upKeys.includes(lastPressedKey))
		 {
			newCoords.y = oldHeadYCoord + this.snakeSpeed;
			this.animateSnakeMovement(oldCoords, newCoords);
		} 
		else if (leftKeys.includes(lastPressedKey))
		 {
			newCoords.x = oldHeadXCoord - this.snakeSpeed;
			this.animateSnakeMovement(oldCoords, newCoords);
		} else if (downKeys.includes(lastPressedKey)) {
			newCoords.y = oldHeadYCoord - this.snakeSpeed;
			this.animateSnakeMovement(oldCoords, newCoords);
		} else if (rightKeys.includes(lastPressedKey)) {
			newCoords.x = oldHeadXCoord + this.snakeSpeed;
			this.animateSnakeMovement(oldCoords, newCoords);
		}

		const snack = this.snackGroup.children[0];
		if (this.almostEqual(newCoords.x, snack.position.x) && this.almostEqual(newCoords.y, snack.position.y)) {
			this.resetSnack();
			this.extendSnake(lastSnakePartCoords);
		}
	}

	animateSnakeMovement(oldCoords, newCoords) {
		for (let i = 0; i < this.snakeGroup.children.length; i++) {

			if (i !== 0) {
				newCoords = { x: oldCoords.x, y: oldCoords.y };
				oldCoords = {
					x: this.snakeGroup.children[i].position.x,
					y: this.snakeGroup.children[i].position.y
				};
			}
			const tween = new TWEEN.Tween(oldCoords)
				.to(newCoords, this.tweenTimeStep)
				.easing(TWEEN.Easing.Sinusoidal.Out)
				.onUpdate(({ x, y }) => {
					this.snakeGroup.children[i].position.x = x;
					this.snakeGroup.children[i].position.y = y;
				});
			tween.start();
		}
	}
}
