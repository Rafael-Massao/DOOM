const canvas=document.getElementById("game");
const ctx=canvas.getContext("2d");

canvas.width=window.innerWidth;
canvas.height=window.innerHeight;

const TILE=100;

const map=[

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

const player={

x:150,
y:150,
angle:0,
pitch:0,
speed:1

};

const keys={};

let shooting=false;



document.addEventListener("keydown",(e)=>{

keys[e.key.toLowerCase()]=true;

});

document.addEventListener("keyup",(e)=>{

keys[e.key.toLowerCase()]=false;

});



canvas.addEventListener("click",()=>{

canvas.requestPointerLock();

});



document.addEventListener("mousemove",(e)=>{

if(document.pointerLockElement===canvas){

player.angle+=e.movementX*0.0025;

player.pitch-=e.movementY*0.5;

player.pitch=Math.max(
-150,
Math.min(
150,
player.pitch
)
);

}

});



document.addEventListener("mousedown",()=>{

shooting=true;

setTimeout(()=>{

shooting=false;

},100);

});



function wallCollision(x,y){

const radius=5;

let points=[

[x-radius,y-radius],
[x+radius,y-radius],
[x-radius,y+radius],
[x+radius,y+radius]

];

for(let p of points){

let mapX=Math.floor(
p[0]/TILE
);

let mapY=Math.floor(
p[1]/TILE
);

if(

mapX<0||
mapY<0||
mapY>=map.length||
mapX>=map[0].length

){

return true;

}

if(map[mapY][mapX]===1){

return true;

}

}

return false;

}



function move(){

let nextX=player.x;
let nextY=player.y;


if(keys["w"]){

nextX+=
Math.cos(player.angle)
*player.speed;

nextY+=
Math.sin(player.angle)
*player.speed;

}

if(keys["s"]){

nextX-=
Math.cos(player.angle)
*player.speed;

nextY-=
Math.sin(player.angle)
*player.speed;

}

if(keys["a"]){

nextX+=
Math.cos(
player.angle-
Math.PI/2
)
*player.speed;

nextY+=
Math.sin(
player.angle-
Math.PI/2
)
*player.speed;

}

if(keys["d"]){

nextX+=
Math.cos(
player.angle+
Math.PI/2
)
*player.speed;

nextY+=
Math.sin(
player.angle+
Math.PI/2
)
*player.speed;

}



if(!wallCollision(
nextX,
player.y
)){

player.x=nextX;

}

if(!wallCollision(
player.x,
nextY
)){

player.y=nextY;

}

}



function castRay(angle){

for(let depth=0; depth<1000; depth++){

let rayX = player.x + Math.cos(angle) * depth;

let rayY=
player.y+
Math.sin(angle)
*depth;

let mapX=
Math.floor(
rayX/TILE
);

let mapY=
Math.floor(
rayY/TILE
);

if(

mapX<0||
mapY<0||
mapY>=map.length||
mapX>=map[0].length

){

return 1000;

}

if(map[mapY][mapX]===1){

return depth;

}

}

return 1000;

}



function render(){

ctx.clearRect(
0,
0,
canvas.width,
canvas.height
);


// céu

let sky=
ctx.createLinearGradient(
0,
0,
0,
canvas.height/2
);

sky.addColorStop(
0,
"#5c5c5c"
);

sky.addColorStop(
1,
"#1d1d1d"
);

ctx.fillStyle=sky;

ctx.fillRect(

0,
0,
canvas.width,
canvas.height/2+
player.pitch

);


// chão

let floor=
ctx.createLinearGradient(

0,
canvas.height/2,
0,
canvas.height

);

floor.addColorStop(
0,
"#444"
);

floor.addColorStop(
1,
"#111"
);

ctx.fillStyle=floor;

ctx.fillRect(

0,
canvas.height/2+
player.pitch,

canvas.width,
canvas.height

);

const FOV=Math.PI/3;

// aumenta quantidade de raios
const rays=canvas.width;

for(
let i=0;
i<rays;
i++
){

let rayAngle=

player.angle-
FOV/2+

(i/rays)
*FOV;



let distance=
castRay(rayAngle);



distance*=Math.cos(
rayAngle-
player.angle
);



let wallHeight=
5000/distance;



wallHeight=
Math.min(
wallHeight,
canvas.height
);



let wallX=i;

let wallY=

(canvas.height/2+
player.pitch)

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

// arma
ctx.beginPath();

ctx.arc(

canvas.width/2,

shooting
?canvas.height-20
:canvas.height-40,

80,

Math.PI,

0

);

ctx.fillStyle="#555";

ctx.fill();



// mira

ctx.strokeStyle="white";

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



// minimapa

const scale=15;

for(
let y=0;
y<map.length;
y++
){

for(
let x=0;
x<map[y].length;
x++
){

ctx.fillStyle=
map[y][x]===1
? "white"
: "#222";

ctx.fillRect(

x*scale,
y*scale,
scale,
scale

);

}

}



ctx.beginPath();

ctx.arc(

(player.x/TILE)
*scale,

(player.y/TILE)
*scale,

4,
0,
Math.PI*2

);

ctx.fillStyle="red";

ctx.fill();

}



function gameLoop(){

move();

render();

requestAnimationFrame(
gameLoop
);

}

gameLoop();