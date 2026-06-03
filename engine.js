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

const TILE = 150;

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
// R0stos
const faceNormal = new Image();
faceNormal.src = "/face/face_normal.png";

const faceShoot = new Image();
faceShoot.src = "/face/face_hurt.png";

const faceHurt = new Image();
faceHurt.src = "/face/face_bleed.png";

const faceDead = new Image();
faceDead.src = "/face/face_death.png";

// Sprite parada
const weaponIdle = new Image();
weaponIdle.src = "/weapon_idle/weapon_idle.png";

// Sprite Mira
const weaponAim = new Image();
weaponAim.src = "/weapon_aim/weapon_aim.png";

let aiming = false;

// Frames de tiro
const shootFrames = [];

for(let i = 0; i < 4; i++){

    const img = new Image();

    img.src = `/shoot/shoot_${i}.png`;

    shootFrames.push(img);
}

// Arma atual
const butterflyIdle = new Image();
butterflyIdle.src = "/butterfly/butterfly_idle/butterfly_idle.png";

const butterflySpinFrames = [];

for(let i = 0; i < 6; i++){

    const img = new Image();

    img.src = `/butterfly/butterfly_push/butterfly_push_${i}.png`;

    butterflySpinFrames.push(img);
}

let currentWeapon = "PISTOL";

// Butterfly
let butterflySpinning = false;
let butterflyFrame = 0;
let butterflyFrameTime = 0;
let butterflyDirection = 1;
let butterflyEquipping = false;

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
let lastTime = 0;
let deltaTime = 16;
const reloadFrames = [];

// Frames reload
for(let i = 0; i < 5; i++){

    const img = new Image();

    img.src = `/reload/reload_${i}.png`;

    reloadFrames.push(img);
}

// Mapa 
let showMinimap = false;

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

    if(e.button === 2){

        if(currentWeapon === "PISTOL"){

            aiming = true;
            return;
        }

        if(
            currentWeapon === "BUTTERFLY" &&
            !butterflySpinning
        ){
            butterflySpinning = true;
            butterflyFrame = 0;
            butterflyFrameTime = 0;
            butterflyDirection = 1;
        }
    }
});

document.addEventListener("mousedown", (e) => {

    if (
        e.button !== 0 ||
        ammo <= 0 ||
        shooting ||
        isReloading ||
        currentWeapon !== "PISTOL"
    ) return;

    shooting = true;

        if(currentWeapon === "PISTOL"){
        ammo--;
    }

    recoil = 25;
    recoilRotation = 6;

    shootFrameIndex = 0;
    shootFrameTime = 0;
});

document.addEventListener("mouseup", (e) => {

    if(
        e.button === 2 &&
        currentWeapon === "PISTOL"
    ){
        aiming = false;
    }
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

    if(key === "m"){
        showMinimap = !showMinimap;
    }

    if (key === "r" && currentWeapon === "PISTOL") {
    reload();
    }

    if(key === "1"){
    currentWeapon = "PISTOL";
    }

    if(
    key === "2" &&
    currentWeapon !== "BUTTERFLY"
){
    currentWeapon = "BUTTERFLY";

    butterflyEquipping = true;

    butterflyFrame = 0;
    butterflyFrameTime = 0;
    butterflyDirection = 1;
}

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

let weaponOffsetX = 180;
let weaponOffsetY = -170;

function getCurrentFace() {

    // rosto sorrindo enquanto atira
    if (shooting) {
        return faceShoot;
    }

    // vida baixa
    if (life <= 20) {
        return faceDead;
    }

    // machucado
    if (life <= 50) {
        return faceHurt;
    }

    // normal
    return faceNormal;
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
const FOV =
    aiming
    ? Math.PI / 5
    : Math.PI / 3;
const rays = Math.floor(canvas.width);

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

const weaponX =
    canvas.width / 2 +
    weaponOffsetX +
    weaponBobX +
    swayX +
    inertiaX;

const weaponY =
    canvas.height +
    weaponOffsetY +
    weaponBobY +
    recoil +
    swayY +
    inertiaY;

// ================= ARMA =================
ctx.save();

ctx.translate(weaponX, weaponY);

ctx.rotate(
(recoilRotation + weaponTilt) *
Math.PI / 180
);

if(currentWeapon === "BUTTERFLY"){

    if(
        (butterflyEquipping || butterflySpinning) &&
        butterflySpinFrames[butterflyFrame]
    ){
        ctx.drawImage(
            butterflySpinFrames[butterflyFrame],
            -220,
            -150,
            440,
            300
        );
    }
    else{
        ctx.drawImage(
            butterflyIdle,
            -220,
            -150,
            440,
            300
        );
    }
}
else{

    if(
        isReloading &&
        reloadFrames[reloadFrameIndex]
    ){
        ctx.drawImage(
            reloadFrames[reloadFrameIndex],
            -220,
            -150,
            440,
            300
        );
    }
    else if(
        shooting &&
        shootFrames[shootFrameIndex]
    ){
        ctx.drawImage(
            shootFrames[shootFrameIndex],
            -220,
            -150,
            440,
            300
        );
    }
    else{

        const sprite =
            aiming
            ? weaponAim
            : weaponIdle;

        ctx.drawImage(
            sprite,
            -220,
            -150,
            440,
            300
        );
    }
}

ctx.restore();


    // Minimapa
    if(showMinimap){

    const scale = 15;

    for(let y = 0; y < map.length; y++){

        for(let x = 0; x < map[y].length; x++){

            ctx.fillStyle =
                map[y][x] === 1
                ? "white"
                : "#222";

            ctx.fillRect(
                x * scale,
                y * scale,
                scale,
                scale
            );
        }
    }

    ctx.beginPath();

    ctx.arc(
        (player.x / TILE) * scale,
        (player.y / TILE) * scale,
        4,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "red";
    ctx.fill();
}

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

 ctx.fillStyle = "black";

ctx.fillRect(
    canvas.width / 2 - 40,
    hudY + 10,
    80,
    70
);

const face = getCurrentFace();

ctx.drawImage(
    face,
    canvas.width / 2 - 40,
    hudY + 10,
    80,
    70
);
ctx.lineWidth = 1;

const fps = Math.round(1000 / Math.max(deltaTime, 1));

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
    ctx.fillText(`FPS: ${fps}`, canvas.width - 120, 30);

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

    if(
        aiming &&
        currentWeapon === "PISTOL"
    ){

        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;

        const x = canvas.width / 2;
        const y = canvas.height / 2;

        ctx.beginPath();

        ctx.moveTo(x - 10, y);
        ctx.lineTo(x + 10, y);

        ctx.moveTo(x, y - 10);
        ctx.lineTo(x, y + 10);

        ctx.stroke();
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
if(
    butterflyEquipping ||
    butterflySpinning
){
    butterflyFrameTime += deltaTime;

    if(butterflyFrameTime >= 150){

        butterflyFrameTime = 0;

        butterflyFrame += butterflyDirection;

        if(
            butterflyFrame <= 0 &&
            butterflyDirection === -1
        ){
            butterflyDirection = 1;
        }

        if (
            butterflyFrame >= butterflySpinFrames.length - 1 &&
            butterflyDirection === 1
        ){
            butterflyFrame = butterflySpinFrames.length - 1;

            butterflySpinning = false;
            butterflyEquipping = false;
        }
    }
}

if(
    aiming &&
    currentWeapon === "PISTOL"
){
    weaponOffsetX += (0 - weaponOffsetX) * 0.1;
    weaponOffsetY += (-80 - weaponOffsetY) * 0.1;
}
else{
    weaponOffsetX += (180 - weaponOffsetX) * 0.1;
    weaponOffsetY += (-170 - weaponOffsetY) * 0.1;
}

    move();

    // render faz TODO desenho
    render();

    requestAnimationFrame(gameLoop);
}

// Inicializa o loop
requestAnimationFrame(gameLoop);