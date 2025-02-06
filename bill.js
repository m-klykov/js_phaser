const WIDTH = window.innerWidth; // Ширина экрана
const HEIGHT = window.innerHeight; // Высота экрана
const BALL_SIZE = WIDTH / 50;
const HOLE_SIZE = BALL_SIZE * 1.5;

const config = {
    type: Phaser.AUTO,
    width: WIDTH,
    height: HEIGHT,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: { create, update }
};

const game = new Phaser.Game(config);
let balls = [], isDragging = false, startX, startY, aimLine, trajectoryLine;
let holes = [], lastMovementTime = 0;
let selectedBall = null; // Храним выбранный шар

window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});

function create() {
    const scene = this;

    // Создание стола (фон)
    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x228B22);

    // Создание луз (на краях стола)
	let dd = HOLE_SIZE / 5;
    let holePositions = [
        { x: 0+dd, y: 0+dd }, { x: WIDTH-dd, y: 0+dd },
        { x: 0+dd, y: HEIGHT-dd }, { x: WIDTH-dd, y: HEIGHT-dd },
        { x: WIDTH / 2, y: 0 }, { x: WIDTH / 2, y: HEIGHT }
    ];
    
    holePositions.forEach(pos => {
        let hole = this.add.circle(pos.x, pos.y, HOLE_SIZE, 0x000000);
        holes.push(hole);
    });

    // Создание пирамиды из 10 шаров (повернутой углом)
    let startX = WIDTH * 0.7, startY = HEIGHT / 2, offset = BALL_SIZE * 1.7;
    let pyramidPositions = []
	
	pyramidPositions.push({ x: WIDTH * 0.3, y: startY });
	for(ix=0; ix<4; ix++){
		x = startX + ix * offset
		for(iy=0; iy<ix+1; iy++){
			y = startY - ix * offset / 2 + iy * offset
			pyramidPositions.push({ x: x, y: y });			
		}
	}		

    
    pyramidPositions.forEach(pos => {
        let ball = scene.add.circle(pos.x, pos.y, BALL_SIZE, 0xffffff);
        scene.physics.add.existing(ball);
        ball.body.setCircle(BALL_SIZE);
        ball.body.setCollideWorldBounds(true);
        ball.body.setBounce(0.8);
        ball.body.setDamping(true);
        ball.body.setDrag(0.7);
        balls.push(ball);

        // Добавляем обработчик для выбора шара
        ball.setInteractive();
        ball.on('pointerdown', () => {
            selectedBall = ball; // Выбираем шар
        });
    });

    this.physics.add.collider(balls, balls);

    // Линия прицеливания
    aimLine = this.add.graphics();
    trajectoryLine = this.add.graphics();


    // Обработчики мыши для удара
    this.input.on('pointerdown', (pointer) => {
        if (selectedBall && Phaser.Math.Distance.Between(pointer.x, pointer.y, selectedBall.x, selectedBall.y) < BALL_SIZE) {
			selectedBall.body.setVelocity(0, 0);
            isDragging = true;
            startX = pointer.x;
            startY = pointer.y;
        }
    });
    
    this.input.on('pointermove', (pointer) => {
        if (isDragging && selectedBall) {
            aimLine.clear();
            aimLine.lineStyle(2, 0xff0000);
            aimLine.lineBetween(selectedBall.x, selectedBall.y, pointer.x, pointer.y);
			
			// Вычисляем траекторию удара в обратную сторону (зеленая линия)
			let angle = Phaser.Math.Angle.Between(selectedBall.x, selectedBall.y, pointer.x, pointer.y); // Угол прицеливания
			let len = 6000; // длина линии

			// Расчитаем координаты конца линии (от шара в противоположную сторону)
			let offsetX = Math.cos(angle + Math.PI) * len; // Противоположная сторона
			let offsetY = Math.sin(angle + Math.PI) * len;

			let endX = selectedBall.x + offsetX;
			let endY = selectedBall.y + offsetY;

			// Рисуем зеленую линию в противоположную сторону
			trajectoryLine.clear();
			trajectoryLine.lineStyle(2, 0x00ff00); // Зеленая линия
			trajectoryLine.lineBetween(selectedBall.x, selectedBall.y, endX, endY);
        }
    });

    this.input.on('pointerup', (pointer) => {
        if (isDragging && selectedBall) {
            isDragging = false;
            aimLine.clear();
			trajectoryLine.clear();
            let forceX = (startX - pointer.x) * 5;
            let forceY = (startY - pointer.y) * 5;
            selectedBall.body.setVelocity(forceX, forceY);
            lastMovementTime = this.time.now;
            selectedBall = null; // После удара сбрасываем выбор шара
        }
    });
}

function update(time) {
    let allStopped = true;
    balls.forEach(ball => {
		let has_ball = 1
        holes.forEach(hole => {
            if (Phaser.Math.Distance.Between(ball.x, ball.y, hole.x, hole.y) < BALL_SIZE*2) {
                balls = balls.filter(b => b !== ball);
                ball.destroy();
				has_ball = 0
                if (balls.length === 0) {
                    resetGame();
                }
            }
        });
        
		if (has_ball){
		
			if (ball.body.speed > 2) {
				lastMovementTime = time;
			}
			if (ball.body.speed > 0.5) {
				allStopped = false;
			}
		}
    });
    
    if (allStopped && time - lastMovementTime > 10000) {
        balls.forEach(ball => ball.body.setVelocity(0, 0));
    }
}

function resetGame() {
    balls.forEach(ball => ball.destroy());
    balls = [];
    create.call(game.scene.scenes[0]);
}
