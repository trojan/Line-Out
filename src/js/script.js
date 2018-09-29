const $  = (e) => document.querySelector(e),
$$ = (e) => document.querySelectorAll(e);

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#292222',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 500 },
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

function preload ()
{
  this.load.spritesheet('tiles', 'assets/world/tileset.png', { frameWidth: 32, frameHeight: 32 });
  this.load.tilemapTiledJSON('level1', 'assets/world/tilemap.json');

  // this.load.json('Phase1', 'assets/world/Phase1.json');
  this.load.image('middle', 'assets/world/middle.png');
  this.load.image('monster', 'assets/sprites/monster.png');
  this.load.image('back', 'assets/world/back.png');
  this.load.spritesheet('char', 'assets/sprites/char.png', { frameWidth: 135, frameHeight: 160 });
}

var player, cursors, monster, background, shapes, cameras, map, groundLayer;

function create ()
{
  // +----------+
  // |   MENU   |
  // +----------+

  // AUDIO
  $$('#menu .options li').forEach(e =>
    e.onmouseover = () => $('audio[menu-hover]').play());

  let paused = false;
  let sound  = localStorage['sound'] || 50;
  let states = {
    pause:    () => { this.scene.pause(); paused = true },
    continue: () => { this.scene.resume(); paused = false; toggleMenu(); },
    start:    () => { states['continue'](); }
  };

  $('.sound h1 span').innerHTML = sound;
  $('.sound input').setAttribute('value', sound);

  $('.sound input').oninput = (e) => {
    localStorage['sound'] = e.target.value;

    $('.sound h1 span').innerHTML = `${localStorage['sound']}%`;
  }

  let toggleMenu = () =>
  $('#menu').classList.toggle('active');

  let changeState  = (state) => state ? 'continue' : 'pause';
  let changeTarget = (target) => target === 'save' ? 'load' : 'save';

  $('.options li[save-load]').innerHTML = changeTarget('save');

  let scene = 1;

  window.onkeyup = (e) => {
    // cutscene keybindings
    if ($('.cutscenes').getAttribute('style') === null) {
      if (e.keyCode == 32) {
       $(`.cutscenes div:nth-child(${scene++})`).setAttribute('style', `animation: fade 1s forwards`);

       if (scene == 3)
         $(`.cutscenes div:nth-child(3)`).setAttribute('style', 'animation: fade-eyes 1s forwards');
       else if (scene >= 4)
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
  background = this.add.tileSprite(294, 350, innerWidth, innerHeight, 'back');

  background.scaleX = (game.canvas.width / 1000);
  background.scaleY = background.scaleX;

  map = this.make.tilemap({ key: 'level1' });
  var groundTiles = map.addTilesetImage('tiles');
  groundLayer = map.createStaticLayer('Map', groundTiles, 0, 0);

  groundLayer.setCollisionByProperty({ collides: true });
  groundLayer.setCollisionBetween(1, 32);

  this.physics.world.bounds.width = groundLayer.width;
  this.physics.world.bounds.height = groundLayer.height;

  // monster = this.add.image(300, 400, 'monster');

  // monster.visible = false;

  // setInterval(() => {
  //   monster.visible = monster.visible == false ? true : false;
  //   // monster.visible = monster.visible || 1;
  // }, 1000);

  // +------------+
  // |   PLAYER   |
  // +------------+
  player = this.physics.add.sprite(playerX || 100, playerY || 0, 'char');

  player.setBounce(0.1);

  this.physics.add.collider(player, groundLayer);

  this.anims.create({
    key: 'left',
    frames: this.anims.generateFrameNumbers('char', { start: 0, end: 3}),
    frameRate: 10,
    repeat: -1
  });

  this.anims.create({
    key: 'turn',
    frames: [ { key: 'char', frame: 4 }],
    frameRate: 20
  });

  this.anims.create({
    key: 'right',
    frames: this.anims.generateFrameNumbers('char', { start: 5, end: 8 }),
    frameRate: 10,
    repeat: -1
  });

  cursors = this.input.keyboard.createCursorKeys();

  groundLayer.scene.cameras.main.startFollow(player);
  groundLayer.scene.cameras.main.setBounds(0, 0, groundLayer.width, groundLayer.height);

  player.body.collideWorldBounds = true;

  background.width *= player.x;
  background.y = 0;
}

function update ()
{
  velocity = 360;

  if (cursors.left.isDown) {
    player.flipX = true;

    player.setVelocityX(-velocity);
    player.anims.play('left', true);

    background.tilePositionX -= 5;
  }
  else if (cursors.right.isDown) {
    player.flipX = false;

    player.setVelocityX(velocity);
    player.anims.play('right', true);

    background.tilePositionX += 5;
  }
  else {
    player.setVelocityX(0);
    player.anims.play('turn');
  }

  // if (cursors.up.isDown && player.body.touching.down)
    // player.setVelocityY(-230);

  // $('.light').setAttribute('style', `left: ${(player.x - Math.abs(player.x - innerWidth))}px !important`)

  if (cursors.up.isDown && this.physics.overlap(player, groundLayer))
    player.setVelocityY(-230);
}
