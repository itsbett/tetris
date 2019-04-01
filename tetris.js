const canvas = document.getElementById('tetris')
const context = canvas.getContext('2d')
context.scale(20, 20)
scaleFactor = window.innerWidth / 340 * 20

function setWindowSize () {
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent)) {
    canvas.width = window.innerWidth
    canvas.height = 20 * scaleFactor
    context.scale(scaleFactor, scaleFactor)
  }
}

function arenaSweep () { // checks for full rows
  let rowCount = 1
  outer: for (let y = arena.length - 1; y > 0; --y) {
    for (let x = 0; x < arena[y].length; ++x) {
      if (arena[y][x] === 0) { // shortcircuit the loop as soon as a 0 is found in column
        continue outer
      }
    }
    const row = arena.splice(y, 1)[0].fill(0)
    arena.unshift(row)
    ++y
    player.score += rowCount * 10
    rowCount *= 2
  }
}

function collide (arena, player) { // detects collision
  const m = player.matrix
  const o = player.pos
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] !== 0 &&
        (arena[y + o.y] &&
          arena[y + o.y][x + o.x]) !== 0) {
        return true
      }
    }
  }
  return false
}

function createMatrix (w, h) { // creates the board that the game is played on
  const matrix = []
  while (h--) {
    matrix.push(new Array(w).fill(0))
  }
  return matrix
}

function createPiece (type) {
  if (type === 'I') {
    return [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0]
    ]
  } else if (type === 'L') {
    return [
      [0, 2, 0],
      [0, 2, 0],
      [0, 2, 2]
    ]
  } else if (type === 'J') {
    return [
      [0, 3, 0],
      [0, 3, 0],
      [3, 3, 0]
    ]
  } else if (type === 'O') {
    return [
      [4, 4],
      [4, 4]
    ]
  } else if (type === 'Z') {
    return [
      [5, 5, 0],
      [0, 5, 5],
      [0, 0, 0]
    ]
  } else if (type === 'S') {
    return [
      [0, 6, 6],
      [6, 6, 0],
      [0, 0, 0]
    ]
  } else if (type === 'T') {
    return [
      [0, 7, 0],
      [7, 7, 7],
      [0, 0, 0]
    ]
  }
}

function drawMatrix (matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        context.fillStyle = colors[value]
        context.fillRect(x + offset.x,
          y + offset.y,
          1, 1)
      }
    })
  })
}

function draw () {
  context.fillStyle = '#000'
  context.fillRect(0, 0, canvas.width, canvas.height)
  drawMatrix(arena, {
    x: 0,
    y: 0
  })
  drawMatrix(player.matrix, player.pos)
  drawBorders()
  drawQueueArea()
  drawSavedPiece()
}

function merge (arena, player) { // transfers moving shape to board matrix
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        arena[y + player.pos.y][x + player.pos.x] = value
      }
    })
  })
}

function rotate (matrix, dir) { // Transposes matrix and flips the rows; 90 degree rotation for shapes
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [
        matrix[x][y],
        matrix[y][x]
      ] = [
        matrix[y][x],
        matrix[x][y]
      ]
    }
  }
  if (dir > 0) {
    matrix.forEach(row => row.reverse())
  } else {
    matrix.reverse()
  }
}

function playerDrop () { // drops player shape and checks for collision and points
  player.pos.y++
  if (collide(arena, player)) {
    pieceSaved = true
    player.pos.y--
    merge(arena, player)
    playRandomSound()
    playerReset()
    arenaSweep()
    updateScore()
  }
  dropCounter = 0
}

function playerMove (offset) {
  player.pos.x += offset
  if (collide(arena, player)) {
    player.pos.x -= offset
  }
}

function playerReset () {
  nextShape()
  playerResetPosition()
  if (collide(arena, player)) { // if player loses
    arena.forEach(row => row.fill(0))
    player.score = 0
    updateScore()
  }
}

function playerResetPosition () {
  player.pos.y = 0
  player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0)
}

function playerRotate (dir) {
  const pos = player.pos.x
  let offset = 1
  rotate(player.matrix, dir)
  while (collide(arena, player)) {
    player.pos.x += offset
    offset = -(offset + (offset > 0 ? 1 : -1))
    if (offset > player.matrix[0].length) {
      rotate(player.matrix, -dir)
      player.pos.x = pos
      return
    }
  }
}

function savePiece () {
  if (savedPiece.length === 0) {
    savedPiece = player.matrix
    nextShape()
    playerResetPosition()
    drawSavedPiece()
  } else if (pieceSaved) {
    playerResetPosition()
    let tempMatrix = player.matrix
    player.matrix = savedPiece
    savedPiece = tempMatrix
    pieceSaved = false
  }
}

let dropCounter = 0
let dropInterval = 1000
let lastTime = 0

function update (time = 0) {
  const deltaTime = time - lastTime
  dropCounter += deltaTime
  if (dropCounter > dropInterval) {
    playerDrop()
  }
  lastTime = time
  draw()
  requestAnimationFrame(update)
}

function updateScore () {
  document.getElementById('score').innerText = player.score
}

function keyInput (event) {
  if (event.keyCode === 37 || event.keyCode === 65) { // left or a
    playerMove(-1)
  } else if (event.keyCode === 39 || event.keyCode === 68) { // right or d
    playerMove(1)
  } else if (event.keyCode === 40 || event.keyCode === 83) { // down or s
    playerDrop()
  } else if (event.keyCode === 81) { // q
    playerRotate(-1)
  } else if (event.keyCode === 87 || event.keyCode === 38) { // w or up
    playerRotate(1)
  } else if (event.keyCode === 32) {
    savePiece()
  }
}

function startTouch (event) {
  startTouchX = event.changedTouches[0].screenX
  startTouchY = event.changedTouches[0].screenY
}

function moveTouch (event) {
  endTouchX = event.changedTouches[0].screenX
  endTouchY = event.changedTouches[0].screenY
  if (startTouchY - endTouchY < -20) {
    playerDrop()
    startTouchY = endTouchY
    tap = false
  }
  if (startTouchY - endTouchY > 100) {
    startTouchY = endTouchY
    savePiece()
    tap = false
  }
  if (Math.abs(startTouchX - endTouchX) > 10) {
    calculateMove()
    startTouchX = endTouchX
    tap = false
  }
}

function endTouch (event) {
  endTouchX = event.changedTouches[0].screenX
  endTouchY = event.changedTouches[0].screenY
  if ((Math.abs(startTouchY - endTouchY) < 3) && (Math.abs(startTouchX - endTouchX) < 3) && tap) {
    playerRotate(1)
  }
  tap = true
}

function calculateMove () {
  if (endTouchX < startTouchX) playerMove(-1)
  if (endTouchX > startTouchX) playerMove(1)
}

const colors = [
  null,
  '#FF0D72',
  '#0DC2FF',
  '#0DFF72',
  '#F538FF',
  '#FF8E0D',
  '#FFE138',
  '#3877FF'
]
const arena = createMatrix(12, 20)
const player = {
  pos: {
    x: 0,
    y: 0
  },
  matrix: null,
  score: 0
}

function getRandomShape () {
  const pieces = 'TJLOSZI'
  return createPiece(pieces[pieces.length * Math.random() | 0])
}

function nextShape () {
  player.matrix = shapeQueue.pop()
  shapeQueue.unshift(getRandomShape())
}
function createShapeQueue () {
  let shapeQueue = []
  for (let i = 0; i < 3; i++) shapeQueue.push(getRandomShape()) // add three random shapes to the queue
  return shapeQueue
}

function drawQueueArea () {
  for (let i = 0; i < 3; i++) {
    drawMatrix(shapeQueue[i], { x: 13, y: 1 + (2 - i) * 5 })
  }
}

function drawSavedPiece () {
  drawMatrix(savedPiece, { x: 13, y: 16 })
}

function drawBorders () {
  context.fillStyle = '#75675E'
  context.fillRect(12, 0, 1, 20) // left border
  context.fillRect(12, 15, 5, 1)
  context.fillRect(16, 0, 1, 20)
}

function playRandomSound () {
  let sound = soundList[soundList.length * Math.random() | 0]
  sound.play()
}

function createSoundsList () {
  let soundList = [
    new Audio('sounds/Army die.mp3'),
    new Audio('sounds/Cat O nine tails die.mp3'),
    new Audio('sounds/Click Clack die.mp3'),
    new Audio('sounds/Klaptrap die.mp3'),
    new Audio('sounds/Klinger die.mp3'),
    new Audio('sounds/Klomp die.mp3'),
    new Audio('sounds/Klump die.mp3'),
    new Audio('sounds/Kritter die.mp3'),
    new Audio('sounds/Mini Necky die.mp3'),
    new Audio('sounds/Mini Pirate Necky die.mp3'),
    new Audio('sounds/Neek die.mp3'),
    new Audio('sounds/Slippa die.mp3'),
    new Audio('sounds/Zinger die DKC2.mp3'),
    new Audio('sounds/Zinger die.mp3')
  ]
  return soundList
}

let shapeQueue = createShapeQueue()
let soundList = createSoundsList()
let pieceSaved = false
let savedPiece = []
let startTouchX = 0
let endTouchX = 0
let startTouchY = 0
let endTouchY = 0
let tap = true

function start () {
  createShapeQueue()
  drawBorders()
  playerReset()
  updateScore()
  drawQueueArea()
  update()
  window.addEventListener('touchstart', startTouch)
  window.addEventListener('touchmove', moveTouch)
  window.addEventListener('touchend', endTouch)
  window.addEventListener('keydown', keyInput)
}

window.addEventListener('load', setWindowSize)
