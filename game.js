const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Растягиваем холст на весь экран
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Координаты мыши и состояние кнопок
const mouse = { x: canvas.width / 2, y: canvas.height / 2, leftDown: false, rightDown: false };

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener('mousedown', (e) => {
    if (e.button === 0) mouse.leftDown = true;  // Левая кнопка
    if (e.button === 2) mouse.rightDown = true; // Правая кнопка
});

window.addEventListener('mouseup', (e) => {
    if (e.button === 0) mouse.leftDown = false;
    if (e.button === 2) mouse.rightDown = false;
});

// Отключаем контекстное меню на правую кнопку мыши
window.addEventListener('contextmenu', e => e.preventDefault());

// Настройки игрока (цветка)
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 25,
    speed: 0.08,
    petalCount: 5,
    petalAngle: 0,
    orbitRadius: 55
};

// Главный игровой цикл
function gameLoop() {
    // 1. Очистка экрана
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Плавное движение игрока к курсору
    player.x += (mouse.x - player.x) * player.speed;
    player.y += (mouse.y - player.y) * player.speed;

    // 3. Управление радиусом лепестков (атака / защита)
    let targetOrbit = 55; // Обычное состояние
    if (mouse.leftDown) targetOrbit = 95;  // Атака (расширяем)
    if (mouse.rightDown) targetOrbit = 35; // Защита (прижимаем)
    player.orbitRadius += (targetOrbit - player.orbitRadius) * 0.15;

    // 4. Вращение лепестков
    player.petalAngle += 0.05;

    // 5. Отрисовка лепестков
    for (let i = 0; i < player.petalCount; i++) {
        const angle = player.petalAngle + (i * (Math.PI * 2) / player.petalCount);
        const px = player.x + Math.cos(angle) * player.orbitRadius;
        const py = player.y + Math.sin(angle) * player.orbitRadius;

        ctx.beginPath();
        ctx.arc(px, py, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#cccccc';
        ctx.stroke();
    }

    // 6. Отрисовка самого цветка (игрока)
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffe763';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#cfb946';
    ctx.stroke();

    requestAnimationFrame(gameLoop);
}

// Запуск игры
gameLoop();
