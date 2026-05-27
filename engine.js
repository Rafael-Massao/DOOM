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

const TILE = 100;

const map = [
    [1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,1,0,1],
    [1,0,1,0,1,0,0,1,0,1],
    [1,0,1,0,1,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,1,1],
    [1,0,0,1,0,1,0,1,0,1],
    [1,0,1,0,0,0,0,1,0,1],
    [1,0,1,1,0,0,0,1,0,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1]
];

const player = {
    x: 150,
    y: 150,
    angle: 0,
    pitch: 0,
    speed: 0.1 // Velocidade base ajustada para rodar com o Delta Time
};

const keys = {};

let shooting = false;
let life = 100;
let armor = 50;
let ammo = 10;         
let reserveAmmo = 60;   
const MAX_AMMO = 10;   
let isReloading = false;
let weapon = "PISTOL";
let lastTime = 0;
let deltaTime = 16;
const reloadFrames = [];

for(let i = 0; i <= 3; i++){

    let img = new Image();

    img.src = `reload_${i}.png`;

    img.onerror = () => {
        console.log(`Erro ao carregar reload_${i}.png`);
    };

    reloadFrames.push(img);
}

let reloadFrameIndex = 0;
let reloadProgress = 0;
let reloadStartTime = 0;
const reloadTime = 800;


document.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener("click", () => {
    canvas.requestPointerLock();
});

document.addEventListener("pointerlockchange", () => {
    if (document.pointerLockElement !== canvas) {
        for (let key in keys) {
            keys[key] = false;
        }
    }
});

document.addEventListener("mousemove", (e) => {
    if (document.pointerLockElement === canvas) {
        player.angle += e.movementX * 0.0025;
        player.pitch -= e.movementY * 0.5;
        player.pitch = Math.max(-150, Math.min(150, player.pitch));
    }
});

document.addEventListener("mousedown", (e) => {
    if (e.button !== 0 || ammo <= 0 || shooting || isReloading) return; 
    shooting = true;
    ammo--;

    // Mantém o flash do tiro visível por 100ms
    setTimeout(() => {
        shooting = false;
    }, 100);
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

function castRay(angle) {
    for (let depth = 0; depth < 1000; depth++) {
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
8000/distance; // aumentei altura

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

if (isReloading && reloadFrames[reloadFrameIndex]) {

    // Sprite da animação de reload
    ctx.drawImage(
        reloadFrames[reloadFrameIndex],
        canvas.width / 2 - 180,
        canvas.height - 280,
        350,
        250
    );

} else {

    let weaponOffset = shooting ? 15 : 0;

    // Flash do tiro
    if (shooting) {

        let flash = ctx.createRadialGradient(
            canvas.width/2,
            canvas.height-230,
            10,
            canvas.width/2,
            canvas.height-230,
            80
        );

        flash.addColorStop(
            0,
            "rgba(255,255,200,1)"
        );

        flash.addColorStop(
            0.4,
            "rgba(255,100,0,0.8)"
        );

        flash.addColorStop(
            1,
            "rgba(0,0,0,0)"
        );

        ctx.fillStyle = flash;

        ctx.beginPath();

        ctx.arc(
            canvas.width/2,
            canvas.height-230,
            80,
            0,
            Math.PI*2
        );

        ctx.fill();
    }

    // Corpo principal
    ctx.fillStyle="#444";

    ctx.fillRect(
        canvas.width/2-45,
        canvas.height-170+weaponOffset,
        90,
        60
    );

    // Parte superior
    ctx.fillStyle="#555";

    ctx.fillRect(
        canvas.width/2-35,
        canvas.height-190+weaponOffset,
        70,
        25
    );

    // Cano
    ctx.fillStyle="#222";

    ctx.fillRect(
        canvas.width/2-8,
        canvas.height-220+weaponOffset,
        16,
        40
    );

    // Boca do cano
    ctx.fillStyle="#111";

    ctx.fillRect(
        canvas.width/2-12,
        canvas.height-225+weaponOffset,
        24,
        8
    );

    // Mira frontal azul
    ctx.fillStyle="#00ffff";

    ctx.fillRect(
        canvas.width/2-2,
        canvas.height-210+weaponOffset,
        4,
        10
    );

    // Cabo
    ctx.fillStyle="#333";

    ctx.beginPath();

    ctx.moveTo(
        canvas.width/2-30,
        canvas.height-110+weaponOffset
    );

    ctx.lineTo(
        canvas.width/2-10,
        canvas.height-60+weaponOffset
    );

    ctx.lineTo(
        canvas.width/2+10,
        canvas.height-60+weaponOffset
    );

    ctx.lineTo(
        canvas.width/2+30,
        canvas.height-110+weaponOffset
    );

    ctx.closePath();

    ctx.fill();

    // Detalhe lateral
    ctx.fillStyle="#777";

    ctx.fillRect(
        canvas.width/2-20,
        canvas.height-155+weaponOffset,
        40,
        8
    );
}

// Mira da tela
ctx.strokeStyle="rgba(255,255,255,0.5)";

ctx.beginPath();

ctx.moveTo(
    canvas.width/2-8,
    canvas.height/2
);

ctx.lineTo(
    canvas.width/2+8,
    canvas.height/2
);

ctx.moveTo(
    canvas.width/2,
    canvas.height/2-8
);

ctx.lineTo(
    canvas.width/2,
    canvas.height/2+8
);

ctx.stroke();

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
    reloadFrameTime = 0;
}

function gameLoop(time) {

    if (!lastTime){
        lastTime = time;
    }

    deltaTime = time - lastTime;
    lastTime = time;

    if(deltaTime > 100){
        deltaTime = 16;
    }

// ================= RELOAD =================
// Animação de Reload
    if(isReloading){

    reloadProgress =
    (time - reloadStartTime) / reloadTime;

    // distribui os frames automaticamente
    reloadFrameIndex = Math.floor(
        reloadProgress * reloadFrames.length
    );

    if(reloadFrameIndex >= reloadFrames.length){
        reloadFrameIndex =
        reloadFrames.length - 1;
    }

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