const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 550, // Уменьшил высоту, чтобы учесть панель инструментов
    physics: { default: 'arcade' },
    scene: { create, update }
};

const game = new Phaser.Game(config);

let cannon, target, ball, spaceKey, circles = [];
let cannonX = 400, cannonY = 530;
let selectedCircle = null;
let slider, deleteButton, addButton;

function create() {
    const scene = this;

    // Добавляем панель инструментов (вне Phaser)
    createToolbar();

    // Мишень (широкая)
    target = scene.add.rectangle(400, 20, 120, 20, 0xff0000);
    scene.physics.add.existing(target, true);

    // Пушка (узкая)
    cannon = scene.add.rectangle(cannonX, cannonY, 40, 20, 0x0000ff);
    scene.physics.add.existing(cannon, true);

    // Снаряд (изначально в пушке)
    ball = scene.add.circle(cannonX, cannonY - 10, 10, 0xffffff);
    scene.physics.add.existing(ball);
    ball.body.setCollideWorldBounds(true);
    ball.body.setBounce(1);
    resetBall();
	
	// Обработчик начала перетаскивания
    scene.input.on('dragstart', (pointer, gameObject) => {
        
		selectCircle(gameObject); // При начале перетаскивания сразу выделяем круг
        
    });
	
	// Обработка перетаскивания кругов
	scene.input.on('drag', (pointer, obj, x, y) => { obj.x = x; obj.y = y; });


    // Обработчик процесса перетаскивания
    scene.input.on('drag', (pointer, gameObject, dragX, dragY) => {
        if (gameObject instanceof Phaser.GameObjects.Circle) {
            gameObject.setPosition(dragX, dragY);
        }
    });

    // Клавиша пробел
    spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
}

function update() {
    if (Phaser.Input.Keyboard.JustDown(spaceKey)) {
        if (!ball.active) {
            shootBall();
        } else {
            resetBall();
        }
    }

    if (ball.active) {
        circles.forEach(circle => {
            let dx = circle.x - ball.x;
            let dy = circle.y - ball.y;
            let dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 100) {
                let force = 200 / dist;
                ball.body.setVelocity(ball.body.velocity.x + force * (dx / dist),
                                      ball.body.velocity.y + force * (dy / dist));
            }
        });

        if (Phaser.Geom.Intersects.RectangleToRectangle(ball.getBounds(), target.getBounds())) {
            resetBall();
            console.log("Попадание!");
        }
    }
}

function shootBall() {
    ball.setActive(true).setVisible(true);
    ball.body.setVelocity(0, -300);
}

function resetBall() {
    ball.setActive(false).setVisible(false);
    ball.setPosition(cannonX, cannonY - 10);
    ball.body.setVelocity(0, 0);
}

function createToolbar() {
    document.querySelector("canvas").style.marginTop = "50px";

    let toolbar = document.createElement("div");
    toolbar.style.position = "absolute";
    toolbar.style.top = "0";
    toolbar.style.width = "100%";
    toolbar.style.height = "50px";
    toolbar.style.background = "#ccc";
    toolbar.style.display = "flex";
    toolbar.style.alignItems = "center";
    toolbar.style.padding = "10px";
    toolbar.style.boxSizing = "border-box";

    // Кнопка удаления
    deleteButton = document.createElement("button");
    deleteButton.innerText = "Del";
    deleteButton.style.marginRight = "10px";
    deleteButton.onclick = deleteSelectedCircle;
    toolbar.appendChild(deleteButton);

    // Кнопка добавления круга
    addButton = document.createElement("button");
    addButton.innerText = "Add";
    addButton.style.marginRight = "10px";
    addButton.onclick = addCircle;
    toolbar.appendChild(addButton);

    // Ползунок для изменения радиуса
    slider = document.createElement("input");
    slider.type = "range";
    slider.min = "10";
    slider.max = "50";
    slider.value = "20";
    slider.oninput = updateCircleSize;
    toolbar.appendChild(slider);

    document.body.appendChild(toolbar);
}

function addCircle() {
    const scene = game.scene.scenes[0];
    let newCircle = scene.add.circle(400, 275, 20, 0x00ff00).setInteractive(); // Центр игрового поля
    scene.input.setDraggable(newCircle);
	
	
	// Добавляем физику и отскок для круга
    scene.physics.add.existing(newCircle);
    newCircle.body.setBounce(1); // Настроим отскок для кругов (можно изменить значение)
    newCircle.body.setCollideWorldBounds(true); // Круги не будут выходить за пределы экрана
	newCircle.body.immovable = true; // Круги не будут двигаться при столкновении


    circles.push(newCircle);
    selectCircle(newCircle);

    // Включаем коллайдер для пули и кругов
    scene.physics.add.collider(ball, newCircle, bounceBallFromCircle, null, scene);
	
	
    circles.push(newCircle);
    selectCircle(newCircle);
}

function bounceBallFromCircle(ball, circle) {
    // Настроим отскок пули при столкновении с кругом
    let dx = ball.x - circle.x;
    let dy = ball.y - circle.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < circle.radius + ball.radius) {
        // Отскок пули (можно изменить силу отскока)
        let angle = Math.atan2(dy, dx);
        let force = 200; // сила отскока
        ball.body.setVelocity(
            force * Math.cos(angle),
            force * Math.sin(angle)
        );
    }
}

function selectCircle(circle) {
    selectedCircle = circle;

    // Сбрасываем цвет всех кругов
    circles.forEach(c => c.setFillStyle(0x00ff00)); // Все круги зеленые

    // Если выбран круг, меняем его цвет
    if (circle) {
        circle.setFillStyle(0xff0000); // Выделенный круг красный
        slider.value = circle.radius;  // Обновляем ползунок для радиуса
    }
}

function deleteSelectedCircle() {
    if (selectedCircle) {
        circles = circles.filter(c => c !== selectedCircle);
        selectedCircle.destroy();
        selectedCircle = null;
    }
}

function updateCircleSize() {
    if (selectedCircle) {
        let newRadius = parseInt(slider.value);
        selectedCircle.setDisplaySize(newRadius * 2, newRadius * 2); // Меняем размер
        selectCircle(selectedCircle);  // Обновляем цвет выделенного круга
    }
}

