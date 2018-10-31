const $ = (e) => document.querySelector(e),
      $$ = (e) => document.querySelectorAll(e);

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#585858',
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

window.addEventListener('resize', () => {
  game.resize(window.innerWidth, window.innerHeight);
});

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
    hasFire = false,
    global_timer = 200,
    dim_light,
    monster_summoned = false;

let getPos  = () => [this.player.x, this.player.y];
let savePos = () => localStorage['playerPos'] = (getPos());

function create() {
  time = new Date().getSeconds();

  // MONSTER
  let summon_monster = () => {
    monster.visible = true;

    $('audio[soundtrack]').volume = 0;

    if (!paused) {
      $('audio[monster-1]').play();

      setTimeout(() => {
        $('audio[monster-2]').play();
      }, 5000);
    }
  };

  // LAMP
  $('.lamp').innerHTML += "<div class='energy'></div>";

  let dim_lamp = () => {
    setInterval(() => {
      if (!paused)
	      $('.lamp .energy').setAttribute('style', `height: ${energy -= 1}px`);

      if (energy < 40) {
      	summon_monster();
        $('.lamp').setAttribute('style', 'animation: flicker .3s infinite');
      }
      else if (energy < 10)
        $('.lamp').setAttribute('style', 'opacity: 0');
      else {
        $('.lamp').setAttribute('style', 'animation: none');

        $('audio[soundtrack]').volume = 1;
      }
    }, global_timer);
  };

  // LIGHTING
  let dim = () => {
    if (!paused)
      $('.gloom').setAttribute('style', `background: rgba(0, 0, 0, ${(light_intensity += 1) / 100})`);

    if (light_intensity >= 100) {
      clearInterval(dim_light);
      game_over(this);
    }
  };

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
  $('audio[get-fire]').volume = 0.3;

  let pause = () => {
    this.scene.pause();
    paused = true;
  };

  let resume = () => {
    this.scene.resume();
    paused = false;
    toggleMenu();
  };

  let paused = false;
  let sound = localStorage['sound'] || 50;
  let states = {
    pause:    () => { pause(); },
    continue: () => { resume(); },
    start:    () => { states['continue'](); }
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

        if (scene >= 4) {
          $('.cutscenes').setAttribute('style', 'animation: exit-cutscene 8s forwards');

          $('audio[soundtrack]').play();

	        dim_lamp();
	        dim_light = setInterval(dim, global_timer);
	      }
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

	let savePos = () => {
		localStorage['playerPos'] = [player.x, player.y];
	};

  $('.options li[save-load]').onclick = (e) => {
    let target = e.target.innerHTML;

    if (target === 'save')
			savePos();
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
    [8, 23],
    [25, 27]
  ].forEach(x => groundLayer.setCollisionBetween(...x));

  this.physics.world.bounds.width = groundLayer.width;
  this.physics.world.bounds.height = groundLayer.height;

  // +------------+
  // |   PLAYER   |
  // +------------+
  player = this.physics.add.sprite(playerX || 810, playerY || 830, 'char');

  player.setBounce(0.1);

  this.physics.add.collider(player, groundLayer);

  monster = this.physics.add.sprite((player.x - 300), (player.y - 300), 'monster');
  monster.visible = false;

  this.physics.add.collider(monster, groundLayer);

  // sprite without lamp
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

  // anims of the sprite carrying the lamp
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
    setXY: { x: 810, y: 700 }
  });

  // Coordinates of each flame object
  [
    [1573, 810],
    [2053, 260],
    [2874, 1220],
    [4240, 1250],
    [4510, 550],
    [6164, 840],
    [1924, 1225],
    [6064, 1830],
    [4626, 2224],
    [2505, 2695],
    [644, 3210],
    [3180, 3625]
  ].forEach((xy) => fire.create(...xy, 'fire'));

  this.physics.add.collider(fire, groundLayer);
  fire.playAnimation('flicker');

  // scale all flame objects
  fire.children.entries.map(i => i.setScale(0.4));

  background.width *= player.x;
  background.y = 800;

  this.physics.add.collider(player, fire, collectFire, null, this);
}

var jump = 0;

function checkBounds(bounds) {
  if (bounds >= 6000)
    $('.gloom .light').setAttribute('style', 'right: 100%');
  else if (bounds <= 400)
    $('.gloom .light').setAttribute('style', 'left: auto; right: 0');
  else
    $('.gloom .light').setAttribute('style', 'left: 0; right: 180px;');
}

function update() {
  let velocity     = 360,
      bgVelocity   = 1,
      energy       = 100,
      playerBounds = Math.abs(player.x - groundLayer.width);

  if (cursors.left.isDown) {
    player.flipX = true;

    player.setVelocityX(-velocity);
    checkBounds(playerBounds);
    player.anims.play(hasFire ? 'left-with-lamp' : 'left', true);

    background.tilePositionX -= bgVelocity;

    if (player.body.onFloor())
      $('audio[walking-grass]').play();
  }
  else if (cursors.right.isDown) {
    player.flipX = false;

    player.setVelocityX(velocity);
    checkBounds(playerBounds);
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

  monster.x = player.x - 150;
  monster.y = player.y - 150;

  if (player.x >= 5926 && player.y == 3568)
    win(this);
}

// Collides with fire
function collectFire(player, fire) {
  fire.destroy();

  hasFire = true;

  light_intensity = 0;
  energy = 100;
  monster.visible = false;

  $('audio[get-fire]').play();
}

function win(game) {
  game.scene.pause();
  paused = true;

  $('.win').classList.add('active');
}

function game_over(game) {
  game.scene.pause();
  paused = true;

  let now = new Date().getSeconds();

  $('.game-over').classList.add('active');
  $('.game-over .score span').innerHTML = Math.abs(now - time);
}
