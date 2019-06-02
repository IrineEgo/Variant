'use strict';

// Изменение цвета линий
document.querySelectorAll('.menu__color').forEach(colorInput => {
  colorInput.addEventListener('change', () => {
    if (!colorInput.checked) return;
    currentColor = colorInput.value;
  });
});

// Задаем атрибуты холста и вставляем его в DOM
function createCanvas() {
  canvas.width = getComputedStyle(currentImage).width.slice(0, -2);
  canvas.height = getComputedStyle(currentImage).height.slice(0, -2);

  canvas.classList.add('image-canvas');
  if (!canvasImage) {
    canvasImage = document.createElement('div');
  }
  if (currentImage.dataset.load === 'load') {
    curves = [];
  }
  canvasImage.style.width = getComputedStyle(currentImage).width;
  canvasImage.style.height = getComputedStyle(currentImage).height;
  canvasImage.classList.add('image-canvas');
  drawing = false;
  needsRepaint = false;
  currentColor = '#6cbe47';
}

// Рисуем точку
function circle(point) {
  ctx.beginPath();
  ctx.arc(...point, BRUSH_THICKNESS / 2, 0, 2 * Math.PI);
  ctx.fill();
}

// Рисуем плавную линию между двумя точками
function smoothCurveBetween(p1, p2) {
  const cp = p1.map((coord, idx) => (coord + p2[idx]) / 2);
  ctx.quadraticCurveTo(...p1, ...cp);
}

// Рисуем плавную линию между множеством точек
function smoothCurve(points) {
  ctx.beginPath();
  ctx.lineWidth = BRUSH_THICKNESS;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.moveTo(...points[0]);

  for (let i = 1; i < points.length - 1; i++) {
    smoothCurveBetween(points[i], points[i + 1]);
  }
  ctx.stroke();
}

// Задаем координаты точки в виде массива
function makePoint(x, y) {
  return [x, y];
}

// События
canvas.addEventListener('mousedown', event => {
  if (draw.dataset.state !== 'selected') return;
  drawing = true;
  let curve = [];
  curve.color = currentColor;
  curve.push(makePoint(event.offsetX, event.offsetY));
  curves.push(curve);
  needsRepaint = true;
});

canvas.addEventListener('mouseup', () => {
  drawing = false;
});

canvas.addEventListener('mouseleave', () => {
  drawing = false;
});

canvas.addEventListener('mousemove', event => {
  if (draw.dataset.state !== 'selected') return;

  if (drawing) {
    const point = makePoint(event.offsetX, event.offsetY);
    curves[curves.length - 1].push(point);
    needsRepaint = true;
    debounceSendImageToServer();
  }
});


// Отрисовка
function repaint() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  curves
    .forEach(curve => {
      ctx.strokeStyle = curve.color;
      ctx.fillStyle = curve.color;
      circle(curve[0]);
      smoothCurve(curve);
    });
}

document.addEventListener('mousemove', throttleImg(drag));
const debounceSendImageToServer = debounceImg(sendImageToServer, 1000);

// Проверяем и при необходимости перерисовываем холст
function tick () {
  if(needsRepaint) {
    repaint();
    needsRepaint = false;
  }
  window.requestAnimationFrame(tick);
};
tick();

// Создаем img элемент, через который будем отражать рисунки пользователей, пришедшие с сервера
function createUserImg() {
  if (!userImg) {
    userImg = document.createElement('img');
  }
  wrap.appendChild(canvasImage);
  canvasImage.appendChild(canvas);
  userImg.width = getComputedStyle(currentImage).width.slice(0, -2);
  userImg.height = getComputedStyle(currentImage).height.slice(0, -2);
  userImg.classList.add('image-canvas');
  canvasImage.appendChild(userImg);
}

// Ограничение частоты срабатывания функции
function throttleImg(callback, delay = 0) {
  let isWaiting = false;
  return function (...rest) {
    if (!isWaiting) {
      console.log('Вызов throttle callback!');
      callback.apply(this, rest);
      isWaiting = true;
      setTimeout(() => {
        isWaiting = false;
      }, delay);
    }
  };
}

// Отправка оставшихся данных
function debounceImg(callback, delay) {
  let timeout;
  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      timeout = null;
      console.log('Вызов debounce callback!');
      callback();
    }, delay);
  };
}

// Посылаем рисунки пользователя на сервер
function sendImageToServer() {
  canvas.toBlob(blob => {
    if (!wsGlobal) return;
    wsGlobal.send(blob);
  });
}

// Отражаем рисунки пользователей пришедшие с сервера
function drawUsersStrokes(url) {
  if (!url) return;
  userImg.src = url;
}
