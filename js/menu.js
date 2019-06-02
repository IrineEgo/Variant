'use strict';

let movedPiece = null,
  shiftX = 0,
  shiftY = 0,
  maxX,
  maxY;

const minX = wrap.offsetLeft;
const minY = wrap.offsetTop;

document.addEventListener('mousedown', dragStart);
document.addEventListener('mousemove', throttle(drag));
document.addEventListener('mouseup', drop);

// Переключение режимов меню
burger.addEventListener('click', () => {
  menu.dataset.state = 'default';
  mode.forEach(elem => elem.dataset.state = '');
});

mode.forEach(elem => {
  if (!elem.classList.contains('new')) {
    elem.addEventListener('click', (event) => {
      menu.dataset.state = 'selected';
      event.currentTarget.dataset.state = 'selected';
      if (elem.classList[2] === 'draw') {
        wrap.appendChild(canvasImage);
        canvasImage.appendChild(canvas);
        foldExceptCurrent();
      } else if (elem.classList[2] === 'comments') {
        wrap.appendChild(canvasComments);
        canvasComments.appendChild(canvas);
      } else {
        foldExceptCurrent();
      };
    });
  }
});

// Вычисляем смещение относительно левого верхнего угла меню
function dragStart(event) {
  if (!event.target.classList.contains('drag')) return;
  
  movedPiece = menu;
  const bounds = movedPiece.getBoundingClientRect();
  
  shiftX = event.pageX - bounds.left - window.pageXOffset;
  shiftY = event.pageY - bounds.top - window.pageYOffset;
  
  maxX = minX + wrap.offsetWidth - movedPiece.offsetWidth;
  maxY = minY + wrap.offsetHeight - movedPiece.offsetHeight;
}

// Перемещение меню
function drag(event) {
  if (!movedPiece) return;
  
  event.preventDefault();
  
  let x = event.pageX - shiftX;
  let y = event.pageY - shiftY;
  
  x = Math.min(x, maxX - 1);
  y = Math.min(y, maxY);
  
  x = Math.max(x, minX);
  y = Math.max(y, minY);
  
  movedPiece.style.left = `${x}px`;
  movedPiece.style.top = `${y}px`;
}

// "Отпускание" меню
function drop() {
  if (movedPiece) {
    movedPiece = null;
    localStorage.menuPosLeft = menu.style.left;
    localStorage.menuPosTop = menu.style.top;
  }
}

// Ограничение частоты срабатывания функции drag()
function throttle(callback) {
  let isWaiting = false;
  return function (...rest) {
    if (isWaiting) return;
    
    callback.apply(this, rest);
    isWaiting = true;
    requestAnimationFrame(() => {
      isWaiting = false;
    });
  };
}

// Смещение меню по горизонтали, если не помещается
function checkMenuFit() {
  if (menu.offsetHeight > 100) {
    menu.style.left = '0px';
    menu.style.left = (wrap.offsetWidth - menu.offsetWidth - 1) + 'px';
  }
}

// Проверка правильного отображения меню
function checkMenuFitTick() {
  checkMenuFit();
  window.requestAnimationFrame(checkMenuFitTick);
}
checkMenuFitTick();
