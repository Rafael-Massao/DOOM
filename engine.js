const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Ajusta o canvas ao tamanho da janela inicialmente
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Ajusta o canvas dinamicamente se a janela mudar de tamanho
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

const TILE = 400;

const map = [

// 20x20
[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
[1,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,1],
[1,0,1,1,1,0,1,0,1,1,1,1,0,1,0,1,1,1,0,1],
[1,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,1],
[1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,1,0,1,0,1],
[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,1,0,0,0,1],
[1,1,1,0,1,0,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
[1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1],
[1,0,1,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1,0,1],
[1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
[1,0,1,0,1,1,1,1,1,0,1,1,1,1,0,1,1,1,0,1],
[1,0,0,0,1,0,0,0,1,0,1,0,0,1,0,0,0,1,0,1],
[1,1,1,0,1,0,1,0,1,0,1,0,1,1,1,1,0,1,0,1],
[1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1],
[1,0,1,1,1,1,1,1,1,1,1,0,1,0,1,1,1,1,0,1],
[1,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1],
[1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1],
[1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1],
[1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

const player = {
    x: 500,
    y: 500,
    angle: 0,
    pitch: 0,
    speed: 0.1 // Velocidade base ajustada para rodar com o Delta Time
};

const keys = {};

// ================= SPRITES =================

// Sprite parada
const weaponIdle = new Image();
weaponIdle.src = "/weapon_idle/weapon_idle.png";

// Frames de tiro
const shootFrames = [];

for(let i = 0; i < 4; i++){

    const img = new Image();

    img.src = `/shoot/shoot_${i}.png`;

    shootFrames.push(img);
}


// Controle animações
let shootFrameIndex = 0;
let shootFrameTime = 0;
let shootFrameSpeed = 100;

let reloadFrameIndex = 0;

let reloadTime = 1000;
let reloadStartTime = 0;
let reloadProgress = 0;

let shooting = false;

// Status
let life = 100;
let armor = 50;
let ammo = 10;         
let reserveAmmo = 60;   
const MAX_AMMO = 10;

// Recarregamento   
let isReloading = false;
let weapon = "PISTOL";
let lastTime = 0;
let deltaTime = 16;
const reloadFrames = [];

// Frames reload
for(let i = 0; i < 5; i++){

    const img = new Image();

    img.src = `/reload/reload_${i}.png`;

    reloadFrames.push(img);
}

// Gun Bobbing
let bobTime = 0;
let weaponBobX = 0;
let weaponBobY = 0;

// Recoil
let recoil = 0;
let recoilRecover = 0;

let recoilRotation = 0;

// Mouse sway
let swayX = 0;
let swayY = 0;

let targetSwayX = 0;
let targetSwayY = 0;

// Tilt lateral
let weaponTilt = 0;
let targetTilt = 0;

// Inertia
let inertiaX = 0;
let inertiaY = 0;

// Clique trava o mouse no canvas
canvas.addEventListener("click", () => {
    canvas.requestPointerLock();
});

// Movimento do mouse
document.addEventListener("mousemove", (e) => {

    if (document.pointerLockElement !== canvas) return;

    player.angle += e.movementX * 0.0025;
    player.pitch -= e.movementY * 0.5;

    targetSwayX = e.movementX * 0.35;
    targetSwayY = e.movementY * 0.2;

    inertiaX = e.movementX * 0.15;
    inertiaY = e.movementY * 0.08;

    player.pitch = Math.max(
        -150,
        Math.min(150, player.pitch)
    );
});

document.addEventListener("mousedown", (e) => {

    if (
        e.button !== 0 ||
        ammo <= 0 ||
        shooting ||
        isReloading
    ) return;

    shooting = true;

    ammo--;

    recoil = 25;
    recoilRotation = 6;

    shootFrameIndex = 0;
    shootFrameTime = 0;
});

canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
});

function wallCollision(x, y) {
    const radius = 10;
    let points = [
        [x - radius, y - radius],
        [x + radius, y - radius],
        [x - radius, y + radius],
        [x + radius, y + radius]
    ];

    for (let p of points) {
        let mapX = Math.floor(p[0] / TILE);
        let mapY = Math.floor(p[1] / TILE);

        if (mapX < 0 || mapY < 0 || mapY >= map.length || mapX >= map[0].length) {
            return true;
        }
        if (map[mapY][mapX] === 1) {
            return true;
        }
    }
    return false;
}

function move() {

    if(keys["a"]){
    targetTilt = -8;
    }
    else if(keys["d"]){
        targetTilt = 8;
    }
    else{
        targetTilt = 0;
    }
        const moving =
        keys["w"] ||
        keys["a"] ||
        keys["s"] ||
        keys["d"];

    if(moving){

        bobTime += deltaTime * 0.008;

        weaponBobX = Math.cos(bobTime) * 8;

        weaponBobY = Math.abs(
            Math.sin(bobTime)
        ) * 10;

    }
    else{

        weaponBobX *= 0.85;
        weaponBobY *= 0.85;
    }

    let nextX = player.x;
    let nextY = player.y;

    let moveSpeed = player.speed * deltaTime;

    if (keys["w"]) {
        nextX += Math.cos(player.angle) * moveSpeed;
        nextY += Math.sin(player.angle) * moveSpeed;
    }
    if (keys["s"]) {
        nextX -= Math.cos(player.angle) * moveSpeed;
        nextY -= Math.sin(player.angle) * moveSpeed;
    }
    if (keys["a"]) {
        nextX += Math.cos(player.angle - Math.PI / 2) * moveSpeed;
        nextY += Math.sin(player.angle - Math.PI / 2) * moveSpeed;
    }
    if (keys["d"]) {
        nextX += Math.cos(player.angle + Math.PI / 2) * moveSpeed;
        nextY += Math.sin(player.angle + Math.PI / 2) * moveSpeed;
    }

    if (!wallCollision(nextX, player.y)) {
    player.x = nextX;
}
if (!wallCollision(player.x, nextY)) {
    player.y = nextY;
}
}
document.addEventListener("keydown", (e) => {
    if (document.pointerLockElement !== canvas) return;

    const key = e.key.toLowerCase();
    keys[key] = true;

    if (key === "r") reload();
});

document.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Esc - pausa
let paused = false;

document.addEventListener("pointerlockchange", () => {

    paused =
    document.pointerLockElement !== canvas;

    // limpa inputs presos
    for(let key in keys){

        keys[key] = false;
    }
});

function castRay(angle) {
    for (let depth = 0; depth < 1000; depth += 4) {
        let rayX = player.x + Math.cos(angle) * depth;
        let rayY = player.y + Math.sin(angle) * depth;

        let mapX = Math.floor(rayX / TILE);
        let mapY = Math.floor(rayY / TILE);

        if (mapX < 0 || mapY < 0 || mapY >= map.length || mapX >= map[0].length) {
            return 1000;
        }
        if (map[mapY][mapX] === 1) {
            return depth;
        }
    }
    return 1000;
}

function render() {

ctx.clearRect(
0,
0,
canvas.width,
canvas.height
);

// CÉU
let sky=ctx.createLinearGradient(
0,
0,
0,
canvas.height/2
);

sky.addColorStop(0,"#5c5c5c");
sky.addColorStop(1,"#1d1d1d");

ctx.fillStyle=sky;

ctx.fillRect(
0,
0,
canvas.width,
canvas.height/2+player.pitch
);


// CHÃO
let floor=ctx.createLinearGradient(
0,
canvas.height/2,
0,
canvas.height
);

floor.addColorStop(0,"#444");
floor.addColorStop(1,"#111");

ctx.fillStyle=floor;

ctx.fillRect(
0,
canvas.height/2+player.pitch,
canvas.width,
canvas.height
);


// PAREDES
const FOV=Math.PI/3;
const rays=canvas.width;

for(let i=0;i<rays;i++){

let rayAngle=
player.angle-
FOV/2+
(i/rays)*FOV;

let distance=
castRay(rayAngle);

distance*=Math.cos(
rayAngle-player.angle
);

let wallHeight=
9000/distance;

wallHeight=
Math.min(
wallHeight,
canvas.height*1.5
);

let wallX=i;

let wallY=
(canvas.height/2+player.pitch)
-
wallHeight/2;

let light=
Math.max(
0.3,
1-distance/800
);

let r=130*light;
let g=110*light;
let b=90*light;

ctx.fillStyle=
`rgb(${r},${g},${b})`;

ctx.fillRect(
wallX,
wallY,
1,
wallHeight
);

}

// ================= ARMA =================
ctx.save();

const weaponX =
canvas.width/2 + 180 +
weaponBobX +
swayX +
inertiaX;

const weaponY =
canvas.height - 170 +
weaponBobY +
recoil +
swayY +
inertiaY;

ctx.translate(weaponX, weaponY);

ctx.rotate(
(recoilRotation + weaponTilt) * Math.PI / 180
);

// RELOAD
if(
    isReloading &&
    reloadFrames[reloadFrameIndex] &&
    reloadFrames[reloadFrameIndex].complete
){

    ctx.drawImage(
        reloadFrames[reloadFrameIndex],
        -220,
        -150,
        440,
        300
    );
}

// SHOOT
else if(
    shooting &&
    shootFrames[shootFrameIndex] &&
    shootFrames[shootFrameIndex].complete
){

    ctx.drawImage(
        shootFrames[shootFrameIndex],
        -220,
        -150,
        440,
        300
    );
}

// IDLE
else{

    ctx.drawImage(
        weaponIdle,
        -220,
        -150,
        440,
        300
    );
}

ctx.restore();


    // Minimapa
    const scale = 15;
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            ctx.fillStyle = map[y][x] === 1 ? "white" : "#222";
            ctx.fillRect(x * scale, y * scale, scale, scale);
        }
    }

    ctx.beginPath();
    ctx.arc((player.x / TILE) * scale, (player.y / TILE) * scale, 4, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();

    // ================= HUD DOOM =================
    const hudY = canvas.height - 90;

    ctx.fillStyle = "#4a4a4a";
    ctx.fillRect(0, hudY, canvas.width, 90);

    // Linhas metálicas
    ctx.fillStyle = "#222";
    for (let x = 0; x < canvas.width; x += 25) {
        ctx.fillRect(x, hudY, 2, 90);
    }

    // Munição
    ctx.fillStyle = "black";
    ctx.fillRect(20, hudY + 10, 100, 70);
    ctx.fillStyle = "#ffcc00";
    ctx.font = "15px Arial";
    ctx.fillText("AMMO", 35, hudY + 25);
    ctx.font = "30px Arial";
    ctx.fillText(`${ammo}/${reserveAmmo}`, 35, hudY + 60);

    // Vida
    ctx.fillStyle = "black";
    ctx.fillRect(140, hudY + 10, 100, 70);
    ctx.fillStyle = "#ff3333";
    ctx.font = "15px Arial";
    ctx.fillText("HEALTH", 145, hudY + 25);
    ctx.font = "30px Arial";
    ctx.fillText(life + "%", 150, hudY + 60);

 // ================= ROSTO REATIVO AO DANO E AO TIRO =================
ctx.fillStyle = "black";
ctx.fillRect(canvas.width / 2 - 40, hudY + 10, 80, 70);

// Base da cabeça (cor muda conforme a vida)
ctx.beginPath();
ctx.arc(canvas.width / 2, hudY + 40, 20, 0, Math.PI * 2);
if (life > 50) ctx.fillStyle = "#f0c090"; 
else if (life > 20) ctx.fillStyle = "#e0a070"; 
else ctx.fillStyle = "#b09080"; 
ctx.fill();

// Olhos
ctx.fillStyle = "black";
if (shooting) {
    // Olhos "vibrando" ou arregalados de loucura ao atirar
    ctx.beginPath();
    ctx.arc(canvas.width / 2 - 9, hudY + 34, 3, 0, Math.PI * 2);
    ctx.arc(canvas.width / 2 + 9, hudY + 34, 3, 0, Math.PI * 2);
    ctx.fill();
} else if (life > 20) {
    // Olhos normais
    ctx.beginPath();
    ctx.arc(canvas.width / 2 - 8, hudY + 35, 2, 0, Math.PI * 2);
    ctx.arc(canvas.width / 2 + 8, hudY + 35, 2, 0, Math.PI * 2);
    ctx.fill();
} else {
    // Olhos semicerrados de dor
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 12, hudY + 35); ctx.lineTo(canvas.width / 2 - 4, hudY + 35);
    ctx.moveTo(canvas.width / 2 + 4, hudY + 35); ctx.lineTo(canvas.width / 2 + 12, hudY + 35);
    ctx.stroke();
}

// BOCA DINÂMICA (A parte que você queria!)
ctx.beginPath();
ctx.strokeStyle = "black";
ctx.lineWidth = 3;

if (shooting) {
    // SORRISO MANÍACO: Um arco para cima bem largo
    ctx.arc(canvas.width / 2, hudY + 42, 8, 0, Math.PI, false);
} else {
    // Expressões normais baseadas na vida
    ctx.lineWidth = 2;
    if (life > 70) {
        // Sério
        ctx.moveTo(canvas.width / 2 - 8, hudY + 48);
        ctx.lineTo(canvas.width / 2 + 8, hudY + 48);
    } else if (life > 30) {
        // Triste/Dor
        ctx.arc(canvas.width / 2, hudY + 54, 6, Math.PI, 0, false);
    } else {
        // Agonia (Boca aberta)
        ctx.arc(canvas.width / 2, hudY + 50, 4, 0, Math.PI * 2);
    }
}
ctx.stroke();

// Detalhes de sangue (mesmo atirando, o sangue continua lá)
if (life <= 70) {
    ctx.strokeStyle = "#800000";
    ctx.lineWidth = 2;
    if (life > 30) {
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2 - 12, hudY + 42); ctx.lineTo(canvas.width / 2 - 6, hudY + 46);
        ctx.stroke();
    } else {
        ctx.fillStyle = "#800000";
        ctx.fillRect(canvas.width / 2 - 4, hudY + 22, 3, 8); // Testa
        ctx.fillRect(canvas.width / 2 - 2, hudY + 50, 4, 10); // Queixo
    }
}
ctx.lineWidth = 1;

    // Armor
    ctx.fillStyle = "black";
    ctx.fillRect(canvas.width - 120, hudY + 10, 100, 70);
    ctx.fillStyle = "#00bfff";
    ctx.font = "15px Arial";
    ctx.fillText("ARMOR", canvas.width - 110, hudY + 25);
    ctx.font = "30px Arial";
    ctx.fillText(armor + "%", canvas.width - 110, hudY + 60);

    // Contadores de FPS no topo direito
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(`FPS: ${Math.round(1000 / deltaTime)}`, canvas.width - 120, 30);

    if(paused){

    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "50px Arial";
    ctx.textAlign = "center";

    ctx.fillText(
        "CLICK TO PLAY",
        canvas.width / 2,
        canvas.height / 2
        );
    }
}

// Recarregamento
function reload() {
    if (isReloading) return;
    if (ammo >= MAX_AMMO) return;
    if (reserveAmmo <= 0) return;

    isReloading = true;
    shooting = false;

    reloadProgress = 0;
    reloadStartTime = performance.now();

    reloadFrameIndex = 0;
}

function gameLoop(time) {

    if(paused){
        requestAnimationFrame(gameLoop);
        return;
    }

    // Smooth sway
    swayX += (targetSwayX - swayX) * 0.12;
    swayY += (targetSwayY - swayY) * 0.12;

    targetSwayX *= 0.7;
    targetSwayY *= 0.7;

    // Smooth tilt
    weaponTilt += (targetTilt - weaponTilt) * 0.1;

    // Inertia decay
    inertiaX *= 0.9;
    inertiaY *= 0.9;

    // Recoil smooth
    recoil += (0 - recoil) * 0.15;
    recoilRotation += (0 - recoilRotation) * 0.15;

    if (!lastTime){
        lastTime = time;
    }

    deltaTime = time - lastTime;
    lastTime = time;

    if(deltaTime > 100){
        deltaTime = 16;
    }

// ================= SHOOT =================
// Animação de Tiro

// ================= SHOOT =================

if(shooting){

    shootFrameTime += deltaTime;

    if(shootFrameTime >= shootFrameSpeed){

        shootFrameTime = 0;

        shootFrameIndex++;

        // terminou animação
        if(shootFrameIndex >= shootFrames.length){

            shooting = false;

            shootFrameIndex = 0;
        }
    }
}

// ================= RELOAD =================
// Animação de Reload
if(isReloading){

    reloadProgress =
    (time - reloadStartTime) / reloadTime;

    reloadFrameIndex = Math.min(
    Math.floor(
        reloadProgress * reloadFrames.length
    ),
    reloadFrames.length - 1
);

    // trava no último frame
    if(reloadFrameIndex >= reloadFrames.length){

        reloadFrameIndex =
        reloadFrames.length - 1;
    }

    // terminou reload
    if(reloadProgress >= 1){

        let needed =
        MAX_AMMO - ammo;

        let taken =
        Math.min(
            needed,
            reserveAmmo
        );

        ammo += taken;
        reserveAmmo -= taken;

        isReloading = false;

        reloadProgress = 0;
        reloadFrameIndex = 0;
    }
}
    move();

    // render faz TODO desenho
    render();

    requestAnimationFrame(gameLoop);
}

// Inicializa o loop
requestAnimationFrame(gameLoop);