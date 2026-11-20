const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

const WORLD_SIZE = 3000;
const player = {
  x: WORLD_SIZE / 2,
  y: WORLD_SIZE / 2,
  rad: 22,
  hp: 150,
  maxHp: 150,
  level: 1,
  xp: 0,
  nextXp: 100,
  angle: 0,
  orbitDist: 60
};

const mouse = { x: canvas.width / 2, y: canvas.height / 2, left: false, right: false };

window.addEventListener('mousemove', e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});
window.addEventListener('mousedown', e => {
  if (e.button === 0) mouse.left = true;
  if (e.button === 2) mouse.right = true;
});
window.addEventListener('mouseup', e => {
  if (e.button === 0) mouse.left = false;
  if (e.button === 2) mouse.right = false;
});
window.addEventListener('contextmenu', e => e.preventDefault());

let lastTime = performance.now();

function update(dt) {
  const dx = mouse.x - canvas.width / 2;
  const dy = mouse.y - canvas.height / 2;
  const dist = Math.hypot(dx, dy);

  if (dist > 10) {
    const speed = Math.min(280, dist * 2.5);
    player.x += (dx / dist) * speed * dt;
    player.y += (dy / dist) * speed * dt;
  }

  player.x = Math.max(40, Math.min(WORLD_SIZE - 40, player.x));
  player.y = Math.max(40, Math.min(WORLD_SIZE - 40, player.y));

  // Управление орбитой (ЛКМ - атака, ПКМ - защита)
  const targetOrbit = mouse.left ? 115 : (mouse.right ? 34 : 60);
  player.orbitDist += (targetOrbit - player.orbitDist) * 10 * dt;
  player.angle += 3.2 * dt;
}

function draw() {
  ctx.fillStyle = '#1ea761';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(canvas.width / 2 - player.x, canvas.height / 2 - player.y);

  ctx.strokeStyle = '#1b9657';
  ctx.lineWidth = 2;
  for (let x = 0; x <= WORLD_SIZE; x += 60) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, WORLD_SIZE); ctx.stroke();
  }
  for (let y = 0; y <= WORLD_SIZE; y += 60) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD_SIZE, y); ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 16;
  ctx.strokeRect(0, 0, WORLD_SIZE, WORLD_SIZE);

  for (let i = 0; i < 5; i++) {
    const a = player.angle + (i / 5) * Math.PI * 2;
    const px = player.x + Math.cos(a) * player.orbitDist;
    const py = player.y + Math.sin(a) * player.orbitDist;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(px, py, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = '#ffe763';
  ctx.strokeStyle = '#c9b037';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.rad, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(player.x - 7, player.y - 4, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(player.x + 7, player.y - 4, 3.5, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

function loop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
