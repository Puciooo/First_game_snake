'use strict';

const Application = PIXI.Application,
    Container = PIXI.Container,
    loader = PIXI.Loader.shared,
    resources = PIXI.Loader.shared.resources,
    Graphics = PIXI.Graphics,
    TextureCache = PIXI.utils.TextureCache,
    Sprite = PIXI.Sprite,
    Text = PIXI.Text,
    TextStyle = PIXI.TextStyle;


const app = new PIXI.Application({ 
    width: 768,         // default: 800
    height: 768,        // default: 600
    antialias: true,    // default: false
    transparent: false, // default: false
    resolution: 1       // default: 1
  }
);
//app.resizeTo = window;
app.renderer.backgroundColor = 0x4000;


document.body.appendChild(app.view);

PIXI.Loader.shared.onProgress.add(loadProgressHandler);
PIXI.Loader.shared
  .add([
    "images/treasureHunter.json",
    "images/cat.png"
  ])
  .load(setup);

function loadProgressHandler(loader, resource) {
  console.log("loading: " + resource.url); 
  console.log("progress: " + loader.progress + "%"); 
}


let head, state, player, dungeon, snake, message,messageScore, gameScene, gameOverScene, id, collision, scoreNumber, scoreMessage, foods, food;
let score = 0;


function setup() {

  gameScene = new Container();
  app.stage.addChild(gameScene);

  id = resources["images/treasureHunter.json"].textures;

  dungeon = new Sprite(id["dungeon.png"]);
  dungeon.scale.x = 1.5;
  dungeon.scale.y = 1.5;
  gameScene.addChild(dungeon);
 
  const styleScore = new TextStyle({
    fontFamily: "Futura",
    fontSize: 25,
    fill: "white"
  });

  scoreMessage = new Text("Score: "+score, styleScore);
  scoreMessage.x = dungeon.x /= 2;
  scoreMessage.y = 2;
  
  gameScene.addChild(scoreMessage);

  snake = [];
  foods = [];
  head = new Sprite(resources["images/cat.png"].texture);
  head.x = 200;
  head.y = 200; 
  head.vx = 0;
  head.vy = 0;
  head.width = 40;
  head.height = 40;
  snake.push(head);
  gameScene.addChild(head);

  app.ticker.add((delta) => gameLoop(delta));
  

  id = resources["images/treasureHunter.json"].textures; 

  let numberOfFoods = 1;
  for (let i = 0; i < numberOfFoods; i++) {
    const food = new Sprite(id["blob.png"]);
    const x = randomInt(45, 680);
    const y = randomInt(45, 680);
    food.x = x;
    food.y = y;
    foods.push (food);
    gameScene.addChild(food);
  }

  // RUCHY 
  const left = keyboard("ArrowLeft"),
  up = keyboard("ArrowUp"),
  right = keyboard("ArrowRight"),
  down = keyboard("ArrowDown");
  
  let direction;

  left.press = () => {
    if (direction !== "right") {
      head.vy = 0;
      head.vx = -2;
      direction = "left";
    }
  };
  
  right.press = () => {
    if (direction !== "left") {
      head.vx = 2;
      head.vy = 0;
      direction = "right"; 
    }
  };
  
  up.press = () => {
    if (direction !== "down") {
      head.vy = -2;
      head.vx = 0;
      direction = "up"; 
    }
  };

  down.press = () => {
    if (direction !== "up") {
      head.vy = 2;
      head.vx = 0;
      direction = "down" ;
    }
  };
 
  state = play;
  app.ticker.add((delta) => gameLoop(delta));


  gameOverScene = new Container();
  app.stage.addChild(gameOverScene);
  gameOverScene.visible = false;


  const style = new TextStyle({
    fontFamily: "Futura",
    fontSize: 64,
    fill: "white"
  });
  message = new Text("The End!", style);
  messageScore = new Text("Your score:" + score, style);
  message.x = 250;
  message.y = app.stage.height / 2 - 100;
  
  messageScore.x = 210;
  messageScore.y = app.stage.height / 2;
  
  gameOverScene.addChild(message);  
  gameOverScene.addChild(messageScore); 

  if (hitTestRectangle(snake,foods)){
    console.log ("eat");
  }
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function gameLoop(delta) { 
  state(delta);
}

function play(delta) {
  head.x += head.vx;
  head.y += head.vy;
  contain(head, {x: 45, y: 45, width: 720, height: 720});
  colisionBorder();
  
  
}


function end() {
  gameScene.visible = false;
  gameOverScene.visible = true;
}

function keyboard(value) {
  const key = {};
  key.value = value;
  key.isDown = false;
  key.isUp = true;
  key.press = undefined;
  key.release = undefined;
  
  
  key.downHandler = (event) => {
    if (event.key === key.value) {
      if (key.isUp && key.press) {
        key.press();
      }
      key.isDown = true;
      key.isUp = false;
      event.preventDefault();
    }
  };

  
  key.upHandler = (event) => {
    if (event.key === key.value) {
      if (key.isDown && key.release) {
        key.release();
      }
      key.isDown = false;
      key.isUp = true;
      event.preventDefault();
    }
  };

  const downListener = key.downHandler.bind(key);
  const upListener = key.upHandler.bind(key);
  
  window.addEventListener("keydown", downListener, false);
  window.addEventListener("keyup", upListener, false);
  
  key.unsubscribe = () => {
    window.removeEventListener("keydown", downListener);
    window.removeEventListener("keyup", upListener);
  };
  
  return key;
}
function hitTestRectangle(r1, r2) {

  //Define the variables we'll need to calculate
  let hit, combinedHalfWidths, combinedHalfHeights, vx, vy;

  //hit will determine whether there's a collision
  hit = false;

  //Find the center points of each sprite
  r1.centerX = r1.x + r1.width / 2; 
  r1.centerY = r1.y + r1.height / 2; 
  r2.centerX = r2.x + r2.width / 2; 
  r2.centerY = r2.y + r2.height / 2; 

  //Find the half-widths and half-heights of each sprite
  r1.halfWidth = r1.width / 2;
  r1.halfHeight = r1.height / 2;
  r2.halfWidth = r2.width / 2;
  r2.halfHeight = r2.height / 2;

  //Calculate the distance vector between the sprites
  vx = r1.centerX - r2.centerX;
  vy = r1.centerY - r2.centerY;

  //Figure out the combined half-widths and half-heights
  combinedHalfWidths = r1.halfWidth + r2.halfWidth;
  combinedHalfHeights = r1.halfHeight + r2.halfHeight;

  //Check for a collision on the x axis
  if (Math.abs(vx) < combinedHalfWidths) {

    //A collision might be occurring. Check for a collision on the y axis
    if (Math.abs(vy) < combinedHalfHeights) {

      //There's definitely a collision happening
      hit = true;
    } else {

      //There's no collision on the y axis
      hit = false;
    }
  } else {

    //There's no collision on the x axis
    hit = false;
  }

  //`hit` will be either `true` or `false`
  return hit;
};

function contain(sprite, container) {

  let collision = undefined;

  //Left
  if (sprite.x < container.x) {
    sprite.x = container.x;
    collision = "WALL";
  }

  //Top
  if (sprite.y < container.y) {
    sprite.y = container.y;
    collision = "WALL";
  }

  //Right
  if (sprite.x + sprite.width > container.width) {
    sprite.x = container.width - sprite.width;
    collision = "WALL";
  }

  //Bottom
  if (sprite.y + sprite.height > container.height) {
    sprite.y = container.height - sprite.height;
    collision = "WALL";
  }

  //Return the `collision` value
  return collision;
  
}

function colisionBorder() {
  if (head.x >= 680 && head.vx == 2){
    end();
  } else if (head.x <= 45 && head.vx == -2) {
    end();
  } else if (head.y <= 45 && head.vy == -2) {
    end();
  } else if (head.y >= 680 && head.vy == 2) {
    end();
  } 
}







