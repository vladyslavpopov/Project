'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const startButton = document.getElementById('start-button');
  const tryAgainButton = document.getElementById('try-again');
  const canvas = document.getElementById('game');
  const context = canvas.getContext('2d');

  const FIELD_IMAGE = new Image();
  FIELD_IMAGE.src = 'img/field.png';

  const FOOD_IMAGES = [
    { img: 'img/apple.png', points: 1 },
    { img: 'img/banana.png', points: 2 },
    { img: 'img/cherry.png', points: 3 },
    { img: 'img/mango.png', points: 4 },
    { img: 'img/orange.png', points: 5 },
  ];

  const HEAD_IMAGES = {
    up: 'img/head_up.png',
    down: 'img/head_down.png',
    left: 'img/head_left.png',
    right: 'img/head_right.png',
  };

  const BODY_IMAGES = {
    vertical: 'img/body_vertical.png',
    horizontal: 'img/body_horizontal.png',
    turnLeftUp: 'img/body_turn_left_up.png',
    turnLeftDown: 'img/body_turn_left_down.png',
    turnRightUp: 'img/body_turn_right_up.png',
    turnRightDown: 'img/body_turn_right_down.png',
  };

  const TAIL_IMAGES = {
    up: 'img/tail_up.png',
    down: 'img/tail_down.png',
    left: 'img/tail_left.png',
    right: 'img/tail_right.png',
  };

  const BOX_SIZE = 32;
  const FIELD_WIDTH = 17;
  const FIELD_HEIGHT = 15;
  const OFFSET_X = 1;
  const OFFSET_Y = 3;

  let score = 0;
  let currentFood;
  let snake;
  let direction;
  let headDirection;
  let gameInterval;

  const cachedImages = {
    head: {},
    body: {},
    tail: {},
    food: [],
  };

  const preloadImages = () => {
    for (const key in HEAD_IMAGES) {
      cachedImages.head[key] = new Image();
      cachedImages.head[key].src = HEAD_IMAGES[key];
    }

    for (const key in BODY_IMAGES) {
      cachedImages.body[key] = new Image();
      cachedImages.body[key].src = BODY_IMAGES[key];
    }

    for (const key in TAIL_IMAGES) {
      cachedImages.tail[key] = new Image();
      cachedImages.tail[key].src = TAIL_IMAGES[key];
    }

    FOOD_IMAGES.forEach((food) => {
      const img = new Image();
      img.src = food.img;
      cachedImages.food.push(img);
    });
  };

  preloadImages();

  startButton.addEventListener('click', startGame);
  tryAgainButton.addEventListener('click', resetGame);

  const hideStartScreen = () => {
    document.getElementById('start-screen').style.display = 'none';
  };

  const showCanvas = () => {
    canvas.style.display = 'block';
  };

  const directionChange = (event) => {
    const LEFT_ARROW = 37;
    const UP_ARROW = 38;
    const RIGHT_ARROW = 39;
    const DOWN_ARROW = 40;

    const keyCode = event.keyCode;

    switch (keyCode) {
      case LEFT_ARROW:
        direction = 'left';
        break;
      case UP_ARROW:
        direction = 'up';
        break;
      case RIGHT_ARROW:
        direction = 'right';
        break;
      case DOWN_ARROW:
        direction = 'down';
        break;
      default:
        break;
    }
  };

  const hideGameOverScreen = () => {
    document.getElementById('game-over').style.display = 'none';
  };

  const getRandomFood = () => {
    const randomIndex = Math.floor(Math.random() * FOOD_IMAGES.length);
    const food = FOOD_IMAGES[randomIndex];
    return {
      img: cachedImages.food[randomIndex],
      x: Math.floor(Math.random() * FIELD_WIDTH + OFFSET_X) * BOX_SIZE,
      y: Math.floor(Math.random() * FIELD_HEIGHT + OFFSET_Y) * BOX_SIZE,
      points: food.points,
    };
  };

  const drawSnakeHead = () => {
    context.drawImage(cachedImages.head[headDirection], snake[0].x, snake[0].y);
  };

  const getBodyImageSource = (part, previousPart, nextPart) => {
    const isVertical = part.x === previousPart.x && part.x === nextPart.x;
    const isHorizontal = part.y === previousPart.y && part.y === nextPart.y;
    const isTurnLeftUp =
      (previousPart.x < part.x && nextPart.y < part.y) ||
      (nextPart.x < part.x && previousPart.y < part.y);
    const isTurnLeftDown =
      (previousPart.x < part.x && nextPart.y > part.y) ||
      (nextPart.x < part.x && previousPart.y > part.y);
    const isTurnRightUp =
      (previousPart.x > part.x && nextPart.y < part.y) ||
      (nextPart.x > part.x && previousPart.y < part.y);
    const isTurnRightDown =
      (previousPart.x > part.x && nextPart.y > part.y) ||
      (nextPart.x > part.x && previousPart.y > part.y);

    switch (true) {
      case isVertical:
        return cachedImages.body.vertical;
      case isHorizontal:
        return cachedImages.body.horizontal;
      case isTurnLeftUp:
        return cachedImages.body.turnLeftUp;
      case isTurnLeftDown:
        return cachedImages.body.turnLeftDown;
      case isTurnRightUp:
        return cachedImages.body.turnRightUp;
      case isTurnRightDown:
        return cachedImages.body.turnRightDown;
      default:
        return null;
    }
  };

  const drawSnakeBody = () => {
    for (let i = 1; i < snake.length - 1; i++) {
      const part = snake[i];
      const previousPart = snake[i - 1];
      const nextPart = snake[i + 1] || {
        x: snake[i].x - (snake[i].x - snake[i - 1].x),
        y: snake[i].y - (snake[i].y - snake[i - 1].y),
      };

      const imageSrc = getBodyImageSource(part, previousPart, nextPart);
      context.drawImage(imageSrc, part.x, part.y);
    }
  };

  const getTailDirection = (currentPart, previousPart) => {
    switch (true) {
      case currentPart.x > previousPart.x:
        return 'left';
      case currentPart.x < previousPart.x:
        return 'right';
      case currentPart.y > previousPart.y:
        return 'up';
      case currentPart.y < previousPart.y:
        return 'down';
      default:
        return '';
    }
  };

  const drawSnakeTail = () => {
    if (snake.length >= 2) {
      const tailDirection = getTailDirection(
        snake[snake.length - 1],
        snake[snake.length - 2],
      );
      context.drawImage(
        cachedImages.tail[tailDirection],
        snake[snake.length - 1].x,
        snake[snake.length - 1].y,
      );
    }
  };

  const drawScore = () => {
    const SCORE_POS_X_MULTIPLIER = 2.5;
    const SCORE_POS_Y_MULTIPLIER = 1.7;

    const SCORE_POS_X = SCORE_POS_X_MULTIPLIER * BOX_SIZE;
    const SCORE_POS_Y = SCORE_POS_Y_MULTIPLIER * BOX_SIZE;

    context.fillStyle = 'white';
    context.font = '50px Times New Roman';
    context.fillText('Score: ' + score, SCORE_POS_X, SCORE_POS_Y);
  };

  const foodEating = (snakeX, snakeY, currentFood, score) => {
    const isEating = snakeX === currentFood.x && snakeY === currentFood.y;
    if (isEating) {
      score += currentFood.points;
      currentFood = getRandomFood();
    } else {
      snake.pop();
    }
    return { snake, currentFood, score };
  };

  const displayGameOverScreen = () => {
    document.getElementById(
      'final-score',
    ).innerText = `Game Over! Your score: ${score}`;
    document.getElementById('game-over').style.display = 'flex';
    canvas.style.display = 'none';
  };

  const endGame = () => {
    clearInterval(gameInterval);
    displayGameOverScreen();
  };

  const checkBorderCollision = (snakeX, snakeY) => {
    if (
      snakeX < BOX_SIZE ||
      snakeX > BOX_SIZE * FIELD_WIDTH ||
      snakeY < OFFSET_Y * BOX_SIZE ||
      snakeY > BOX_SIZE * FIELD_WIDTH
    ) {
      endGame();
    }
  };

  const checkCollision = () => {
    const snakeHead = snake[0];
    for (let i = 1; i < snake.length; i++) {
      if (snakeHead.x === snake[i].x && snakeHead.y === snake[i].y) {
        endGame();
      }
    }
  };

  const moveSnakeHead = (snakeX, snakeY) => {
    switch (direction) {
      case 'left':
        snakeX -= BOX_SIZE;
        headDirection = 'left';
        break;
      case 'right':
        snakeX += BOX_SIZE;
        headDirection = 'right';
        break;
      case 'up':
        snakeY -= BOX_SIZE;
        headDirection = 'up';
        break;
      case 'down':
        snakeY += BOX_SIZE;
        headDirection = 'down';
        break;
      default:
        break;
    }

    const newHead = {
      x: snakeX,
      y: snakeY,
    };

    checkCollision();

    snake.unshift(newHead);
  };

  const drawSnake = () => {
    context.drawImage(FIELD_IMAGE, 0, 0);
    context.drawImage(currentFood.img, currentFood.x, currentFood.y);

    drawSnakeHead();
    drawSnakeBody();
    drawSnakeTail();

    drawScore();

    const snakeX = snake[0].x;
    const snakeY = snake[0].y;

    const updatedValues = foodEating(snakeX, snakeY, currentFood, score);
    snake = updatedValues.snake;
    currentFood = updatedValues.currentFood;
    score = updatedValues.score;

    checkBorderCollision(snakeX, snakeY);

    moveSnakeHead(snakeX, snakeY);
  };

  function resetGame() {
    document.removeEventListener('keydown', directionChange);
    hideGameOverScreen();
    showCanvas();
    score = 0;
    snake = [{ x: 9 * BOX_SIZE, y: 10 * BOX_SIZE }];
    direction = 'right';
    headDirection = 'right';
    currentFood = getRandomFood();
    gameInterval = setInterval(drawSnake, 90);
    document.addEventListener('keydown', directionChange);
  }

  function startGame() {
    hideStartScreen();
    showCanvas();
    resetGame();
  }
});
