const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

const RARITIES = [
  { name: 'Common',    color: '#7eef6d', mult: 1,    craftChance: 0.65 },
  { name: 'Unusual',   color: '#ffe65d', mult: 1.8,  craftChance: 0.45 },
  { name: 'Rare',      color: '#4d52e3', mult: 3.2,  craftChance: 0.30 },
  { name: 'Epic',      color: '#861fde', mult: 5.8,  craftChance: 0.20 },
  { name: 'Legendary', color: '#de1f1f', mult: 10.5, craftChance: 0.14 },
  { name: 'Mythic',    color: '#1fdbde', mult: 20,   craftChance: 0.10 },
  { name: 'Exotic',    color: '#ff2b75', mult: 38,   craftChance: 0.08 },
  { name: 'Ultimate',  color: '#2bffa3', mult: 72,   craftChance: 0.06 },
  { name: 'Cosmic',    color: '#d946ef', mult: 140,  craftChance: 0.04 },
  { name: 'Divine',    color: '#ffd700', mult: 280,  craftChance: 0 }
];

function getRarity(idx) {
  return RARITIES[idx] ? RARITIES[idx] : RARITIES.at(0);
}

const PETALS = {
  basic:    { name: 'Basic',    dmg: 12, hp: 15, cd: 1.2, count: 1, color: '#ffffff', stroke: '#cccccc', shape: 'circle' },
  stinger:  { name: 'Stinger',  dmg: 45, hp: 5,  cd: 2.2, count: 1, color: '#333333', stroke: '#111111', shape: 'triangle' },
  leaf:     { name: 'Leaf',     dmg: 10, hp: 12, cd: 1.4, count: 1, color: '#3cd070', stroke: '#259b4e', shape: 'circle', heal: 5 },
  dust:     { name: 'Dust',     dmg: 15, hp: 10, cd: 0.8, count: 3, color: '#b8c4cc', stroke: '#7a8891', shape: 'circle' },
  triangle: { name: 'Triangle', dmg: 38, hp: 18, cd: 1.5, count: 1, color: '#ff5252', stroke: '#b71c1c', shape: 'triangle' },
  void:     { name: 'Void',     dmg: 85, hp: 45, cd: 1.8, count: 1, color: '#2b0a3d', stroke: '#c084fc', shape: 'void' }
};

const WORLD_SIZE = 3000;
let selectedSlot = 0;
let isPlaying = false;

const defaultSave = {
  playerName: 'Flower',
  level: 1,
  xp: 0,
  nextXp: 100,
  slots: [
    { type: 'basic', rarity: 0 },
    { type: 'dust', rarity: 0 },
    { type: 'leaf', rarity: 0 },
    { type: 'triangle', rarity: 1 },
    { type: 'stinger', rarity: 0 }
  ],
  inventory: [
    { type: 'basic', rarity: 0, count: 5 },
    { type: 'dust', rarity: 0, count: 5 },
    { type: 'triangle', rarity: 1, count: 5 },
    { type: 'void', rarity: 8, count: 5 }
  ]
};

let saveData;
try {
  saveData = JSON.parse(localStorage.getItem('myFlorrSave')) || defaultSave;
  if (!saveData.slots || !saveData.inventory) saveData = defaultSave;
  if (!saveData.playerName) saveData.playerName = 'Flower';
} catch (e) {
  saveData = defaultSave;
}

function saveGame() {
  localStorage.setItem('myFlorrSave', JSON.stringify(saveData));
}

const nameInput = document.getElementById('player-name-input');
nameInput.value = saveData.playerName;

document.getElementById('btn-play').onclick = () => {
  const newName = nameInput.value.trim();
  saveData.playerName = newName ? newName : 'Flower';
  saveGame();
  document.getElementById('start-screen').style.display = 'none';
  document.getElementById('ui').style.display = 'block';
  isPlaying = true;
  rebuildActivePetals();
  renderUI();
};

const player = {
  x: WORLD_SIZE / 2,
  y: WORLD_SIZE / 2,
  rad: 22,
  hp: 150,
  maxHp: 150,
  angle: 0,
  orbitDist: 60,
  activePetals: []
};

function rebuildActivePetals() {
  player.activePetals = [];
  saveData.slots.forEach((slot, sIdx) => {
    if (!slot || !PETALS[slot.type]) return;
    const pData = PETALS[slot.type];
    const rData = getRarity(slot.rarity);
    for (let i = 0; i < pData.count; i++) {
      player.activePetals.push({
        slotIdx: sIdx,
        type: slot.type,
        rarity: slot.rarity,
        hp: pData.hp * rData.mult,
        maxHp: pData.hp * rData.mult,
        dmg: pData.dmg * rData.mult,
        deadTimer: 0,
        x: player.x,
        y: player.y
      });
    }
  });
}

function addToInventory(type, rarity, amount = 1) {
  const item = saveData.inventory.find(i => i.type === type && i.rarity === rarity);
  if (item) item.count += amount;
  else saveData.inventory.push({ type, rarity, count: amount });
  saveGame();
  renderUI();
}

function closeModals() {
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('open'));
}

function toggleModal(id) {
  if (!isPlaying) return;
  const el = document.getElementById(id);
  if (!el) return;
  const isOpen = el.classList.contains('open');
  closeModals();
  if (!isOpen) {
    el.classList.add('open');
    renderUI();
  }
}

document.getElementById('btn-inv').onclick = () => toggleModal('modal-inv');
document.getElementById('btn-craft').onclick = () => toggleModal('modal-craft');

window.addEventListener('keydown', e => {
  if (!isPlaying) return;
  if (e.key.toLowerCase() === 'x') toggleModal('modal-inv');
  if (e.key.toLowerCase() === 'c') toggleModal('modal-craft');
  if (e.key === 'Escape') closeModals();
});

function renderUI() {
  const hb = document.getElementById('hotbar');
  hb.innerHTML = '';
  saveData.slots.forEach((slot, idx) => {
    const div = document.createElement('div');
    div.className = 'slot' + (selectedSlot === idx ? ' selected' : '');
    if (slot && PETALS[slot.type]) {
      const r = getRarity(slot.rarity);
      div.style.background = r.color;
      div.innerHTML = `<div>${PETALS[slot.type].name}</div><div class="slot-rarity">${r.name}</div>`;
    } else {
      div.style.background = 'rgba(0,0,0,0.45)';
      div.textContent = 'Пусто';
    }
    div.onclick = () => {
      selectedSlot = idx;
      renderUI();
      toggleModal('modal-inv');
    };
    hb.appendChild(div);
  });

  const invGrid = document.getElementById('inv-grid');
  invGrid.innerHTML = '';
  saveData.inventory.sort((a, b) => b.rarity - a.rarity).forEach(item => {
    if (item.count <= 0 || !PETALS[item.type]) return;
    const r = getRarity(item.rarity);
    const div = document.createElement('div');
    div.className = 'inv-item';
    div.style.background = r.color;
    div.innerHTML = `<span class="inv-count">x${item.count}</span><div>${PETALS[item.type].name}</div><div class="slot-rarity">${r.name}</div>`;
    div.onclick = () => {
      const old = saveData.slots[selectedSlot];
      if (old) addToInventory(old.type, old.rarity, 1);
      item.count--;
      saveData.slots[selectedSlot] = { type: item.type, rarity: item.rarity };
      saveGame();
      rebuildActivePetals();
      renderUI();
    };
    invGrid.appendChild(div);
  });

  const craftGrid = document.getElementById('craft-grid');
  craftGrid.innerHTML = '';
  saveData.inventory.forEach(item => {
    if (item.count < 5 || item.rarity >= RARITIES.length - 1 || !PETALS[item.type]) return;
    const r = getRarity(item.rarity);
    const nextR = getRarity(item.rarity + 1);
    const div = document.createElement('div');
    div.className = 'inv-item';
    div.style.background = r.color;
    div.innerHTML = `<span class="inv-count">${item.count}/5</span><div>${PETALS[item.type].name}</div><div class="slot-rarity">${r.name} → ${nextR.name}</div>`;
    div.onclick = () => {
      item.count -= 5;
      const msg = document.getElementById('craft-msg');
      if (Math.random() < r.craftChance) {
        addToInventory(item.type, item.rarity + 1, 1);
        msg.style.color = '#7eef6d';
        msg.textContent = `УСПЕХ! Создан ${nextR.name} ${PETALS[item.type].name}!`;
      } else {
        const back = 1 + Math.floor(Math.random() * 3);
        item.count += back;
        msg.style.color = '#ff6b6b';
        msg.textContent = `Неудача! Сгорело ${5 - back} шт. (Шанс был ${Math.round(r.craftChance * 100)}%)`;
        saveGame();
        renderUI();
      }
    };
    craftGrid.appendChild(div);
  });
}

const mouse = { x: canvas.width / 2, y: canvas.height / 2, left: false, right: false };
window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
window.addEventListener('mousedown', e => { if (e.button === 0) mouse.left = true; if (e.button === 2) mouse.right = true; });
window.addEventListener('mouseup', e => { if (e.button === 0) mouse.left = false; if (e.button === 2) mouse.right = false; });
window.addEventListener('contextmenu', e => e.preventDefault());

let lastTime = performance.now();
rebuildActivePetals();

function update(dt) {
  player.angle += 3.2 * dt;

  if (isPlaying) {
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

    const targetOrbit = mouse.left ? 115 : (mouse.right ? 34 : 60);
    player.orbitDist += (targetOrbit - player.orbitDist) * 10 * dt;
  }

  const total = player.activePetals.length;
  player.activePetals.forEach((p, idx) => {
    const a = player.angle + (idx / total) * Math.PI * 2;
    p.x = player.x + Math.cos(a) * player.orbitDist;
    p.y = player.y + Math.sin(a) * player.orbitDist;
  });
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

  for (const p of player.activePetals) {
    const pData = PETALS[p.type];
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = pData.color;

