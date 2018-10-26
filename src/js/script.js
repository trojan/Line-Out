const $ = (e) => document.querySelector(e),
  $$ = (e) => document.querySelectorAll(e);

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#292222',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1500 },
      debug: false
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

var game = new Phaser.Game(config);

function preload() {
  this.load.spritesheet('tiles', 'assets/world/tileset.png', { frameWidth: 32, frameHeight: 32 });
  this.load.tilemapTiledJSON('level1', 'assets/world/tilemap.json');

  this.load.image('fire', 'assets/sprites/fire/png/1.png');
  this.load.image('fire-01', 'assets/sprites/fire/png/2.png');
  this.load.image('fire-02', 'assets/sprites/fire/png/3.png');
  this.load.image('fire-03', 'assets/sprites/fire/png/4.png');
  this.load.image('fire-04', 'assets/sprites/fire/png/5.png');
  this.load.image('fire-05', 'assets/sprites/fire/png/6.png');
  this.load.image('fire-06', 'assets/sprites/fire/png/7.png');

  this.load.image('monster', 'assets/sprites/monster.png');
  this.load.image('back', 'assets/world/back.png');
  this.load.image('cavernBack', 'assets/world/cavernBackground.png');
  this.load.spritesheet('char', 'assets/sprites/char.png', { frameWidth: 135, frameHeight: 160 });
  this.load.spritesheet('charLantern', 'assets/sprites/charLantern.png', { frameWidth: 161, frameHeight: 160 });
}

var player,
  cursors,
  monster,
  background,
  cameras,
  map,
  groundLayer,
  fire,
  light_intensity = 0,
  time,
  energy = 100,
  hasFire = false;

let getPos = () => console.log(this.player.x + 'x', this.player.y + 'y');

function create() {
  time = new Date().getSeconds();

  // LAMP
  $('.lamp').innerHTML += "<div class='energy'></div>";

  let dim_lamp = () => {
    setInterval(() => {
      $('.lamp .energy').setAttribute('style', `height: ${energy -= 1}px`);

      if (energy < 10)
        $('.lamp').setAttribute('style', 'opacity: 0');
    }, 1000);

    // setTimeout(dim_lamp, 1000);
  };

  dim_lamp();

  // setTimeout(dim_lamp, 1000);

  // LIGHTING
  let dim = () => {
    $('.gloom').setAttribute('style', `background: rgba(0, 0, 0, ${(light_intensity += 2) / 100})`);

    if (light_intensity >= 100) {
      game_over();
    }

    setTimeout(dim, 1000);
  };

  setTimeout(dim, 1000);
  // +----------+
  // |   MENU   |
  // +----------+
  let toggleMenu = () =>
    $('#menu').classList.toggle('active');

  // CONTROLS GUIDE
  $('#menu .options li[controls]').onclick = () =>
    $('.controls-guide').classList.add('show');

  // AUDIO
  $$('#menu .options li').forEach(e => e.onmouseover = () => $('audio[menu-hover]').play());
  $('audio[walking-grass]').volume = 0.3;

  let paused = false;
  let sound = localStorage['sound'] || 50;
  let states = {
    pause: () => { this.scene.pause(); paused = true; },
    continue: () => { this.scene.resume(); paused = false; toggleMenu(); },
    start: () => { states['continue'](); }
  };

  $('.sound h1 span').innerHTML = sound;
  $('.sound input').setAttribute('value', sound);

  $('.sound input').oninput = (e) => {
    localStorage['sound'] = e.target.value;

    $('.sound h1 span').innerHTML = `${localStorage['sound']}%`;
  };

  let changeState = (state) => state ? 'continue' : 'pause';
  let changeTarget = (target) => target === 'save' ? 'load' : 'save';

  $('.options li[save-load]').innerHTML = changeTarget('save');

  let scene = 1;

  window.onkeyup = (e) => {
    // cutscene keybindings
    if ($('.cutscenes').getAttribute('style') === null) {
      if (e.keyCode == 32) {
        $(`.cutscenes div:nth-child(${scene++})`).setAttribute('style', `animation: fade 1s forwards`);

        if (scene >= 4)
          $('.cutscenes').setAttribute('style', 'animation: exit-cutscene 8s forwards');
      }
    }
    else {
      if (e.key === 'Escape' || e.key == 'Enter')
        toggleMenu();
      else if (e.key === 'p') {
        states['pause']();

        $('.options li[states]').innerHTML = changeState(paused);

        toggleMenu();
      }
    }
  };

  // SAVE AND LOAD
  if (localStorage['playerPos'] === undefined)
    localStorage['playerPos'] = [100, 0];

  let [playerX, playerY] = localStorage['playerPos'].split(',').map(i => parseInt(i));

  $('.options li[states]').onclick = (e) => {
    states[e.target.innerHTML]();

    e.target.innerHTML = changeState(paused);

    $('audio[menu-click]').play();
  };

  $('.options li[save-load]').onclick = (e) => {
    let target = e.target.innerHTML;

    if (target === 'save')
      localStorage['playerPos'] = [player.x, player.y];
    else if (target === 'load')
      [player.x, player.y] = [playerX, playerY];

    e.target.innerHTML = changeTarget(target);

    $('audio[menu-click]').play();
  };

  // +-----------+
  // |   WORLD   |
  // +-----------+
  background = this.add.tileSprite(294, 250, innerWidth, innerHeight, 'back');

  background.scaleX = (game.canvas.width / 1000);
  background.scaleY = background.scaleX;

  map = this.make.tilemap({ key: 'level1' });
  var groundTiles = map.addTilesetImage('tiles');
  groundLayer = map.createStaticLayer('Map', groundTiles, 0, 0);

  groundLayer.setCollisionByProperty({ collides: true });

  // collision range in the tileset
  [
    [8, 12],
    [18, 32]
  ].forEach(x => groundLayer.setCollisionBetween(...x));

  this.physics.world.bounds.width = groundLayer.width;
  this.physics.world.bounds.height = groundLayer.height;

  // +------------+
  // |   PLAYER   |
  // +------------+
  player = this.physics.add.sprite(playerX || 810, playerY || 830, 'char');

  player.setBounce(0.1);

  this.physics.add.collider(player, groundLayer);

  this.anims.create({
    key: 'left',
    frames: this.anims.generateFrameNumbers('char', { start: 0, end: 3 }),
    frameRate: 5,
    repeat: -1
  });

  this.anims.create({
    key: 'turn',
    frames: [{ key: 'char', frame: 4 }],
    frameRate: 20
  });

  this.anims.create({
    key: 'right',
    frames: this.anims.generateFrameNumbers('char', { start: 5, end: 8 }),
    frameRate: 5,
    repeat: -1
  });

  cursors = this.input.keyboard.createCursorKeys();

  groundLayer.scene.cameras.main.startFollow(player);
  groundLayer.scene.cameras.main.setBounds(0, 0, groundLayer.width, groundLayer.height);

  player.body.collideWorldBounds = true;

  this.anims.create({
    key: 'flicker',
    frames: [
      { key: 'fire-01' },
      { key: 'fire-02' },
      { key: 'fire-03' },
      { key: 'fire-04' },
      { key: 'fire-05' },
      { key: 'fire-06' }
    ],
    frameRate: 10,
    repeat: -1
  });

  fire = this.physics.add.group({
    key: 'fire',
    setXY: { x: 810, y: 700, stepX: 70 }
  });
  this.physics.add.collider(fire, groundLayer);
  fire.playAnimation('flicker');

  background.width *= player.x;
  background.y = 800;

  this.physics.add.collider(player, fire, collectFire, null, this);

  this.anims.create({
    key: 'left-with-lamp',
    frames: this.anims.generateFrameNumbers('charLantern', { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1
  });

  this.anims.create({
    key: 'turn-with-lamp',
    frames: [{ key: 'charLantern', frame: 4 }],
    frameRate: 20
  });

  this.anims.create({
    key: 'right-with-lamp',
    frames: this.anims.generateFrameNumbers('charLantern', { start: 5, end: 8 }),
    frameRate: 10,
    repeat: -1
  });
}

var jump = 0;

function update() {
  let velocity = 360,
    bgVelocity = 1,
    energy = 100;

  if (cursors.left.isDown) {
    player.flipX = true;

    player.setVelocityX(-velocity);
    player.anims.play(hasFire ? 'left-with-lamp' : 'left', true);

    background.tilePositionX -= bgVelocity;

    if (player.body.onFloor())
      $('audio[walking-grass]').play();
  }
  else if (cursors.right.isDown) {
    player.flipX = false;

    player.setVelocityX(velocity);
    player.anims.play(hasFire ? 'right-with-lamp' : 'right', true);

    background.tilePositionX += bgVelocity;

    if (player.body.onFloor())
      $('audio[walking-grass]').play();
  }
  else {
    player.setVelocityX(0);
    player.anims.play(hasFire ? 'turn-with-lamp' : 'turn');
    $('audio[walking-grass]').pause();
  }

  $('.gloom').style.width = groundLayer.width;
  $('.gloom').style.height = groundLayer.height;

  if (cursors.up.isDown && player.body.onFloor()) {
    player.setVelocityY(-900);
    $('audio[walking-grass]').pause();
  }

  // coordinates where the monster will appear
  // [
  //   [2475, 1328, 1980, 1232]
  // ].forEach((xy) => {
  //   if (player.x >= xy[0])
  //     monster = this.add.image(xy[2], xy[3], 'monster');
  // });

  // let dim_lamp = (energy) => {
  //   setInterval(() => {
  //     $('.lamp .energy').setAttribute('style', `height: ${energy -= 1}px`);

  //     if (energy <= 10)
  // 	$('.lamp').setAttribute('style', 'opacity: 0');
  //   }, 1000);

  //   // setTimeout(dim_lamp(energy), 1000);
  //   return false;
  // };

  // setTimeout(dim_lamp(100), 1000);
}

// Collides with fire
function collectFire(player, fire) {
  // fire.visible = false;
  fire.destroy();

  hasFire = true;

  light_intensity = 0;
  energy = 100;
}

function game_over() {
  game.scene.pause();

  $('.game-over').classList.add('active');
  $('.game-over .score span').innerHTML = new Date().getSeconds() - time;
}
