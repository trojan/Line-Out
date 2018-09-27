
function animatePlayer() {
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
}