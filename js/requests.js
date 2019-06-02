'use strict';

// Копирование ссылки в буфер обмена
document.querySelector('.menu_copy').addEventListener('click', () => {
  menuUrl.select();
  document.execCommand('copy');
});

// Обработка ответа, пришедшего от сервера по Ajax
function workServerAjaxAnswer(res) {
  // Переключение режимов меню
  menu.dataset.state = 'selected';
  mode.forEach(elem => elem.dataset.state = '');
  share.dataset.state = 'selected';
  menu.style.left = localStorage.menuPosLeft;
  menu.style.top = localStorage.menuPosTop;
  // Формирование ссылки
  const url = document.location.href.split('?')[0] + `?id=${res.id}`;
  menuUrl.value = url;
  currentImage.addEventListener('load', () => {
    createCommentsWrap();
    createCanvas();
    createUserImg();
    updateComments(res.comments);
    drawUsersStrokes(res.mask);
    currentImage.dataset.load = 'load';
  });
  currentImage.src = res.url;
  window.history.pushState(null, null, url);
  // Создание соединение через веб-сокет
  const ws = new WebSocket(`wss://neto-api.herokuapp.com/pic/${res.id}`);
  ws.addEventListener('open', () => {
    console.log('web socket is open');
  });
  ws.addEventListener('message', event => {
    console.log(`Пришло сообщение через веб-сокет:\n${event.data}`);
    const wsData = JSON.parse(event.data);
    if (wsData.event === 'comment') {
      insertWSComment(wsData.comment);
    }
    if (wsData.event === 'mask') {
      drawUsersStrokes(wsData.url);
    }
  });
  ws.addEventListener('error', error => {
    console.log('ошибка вэбсокета');
  });
  wsGlobal = ws;
}

// Отправка изображения на сервер и получение данных
function publishImage(file) {
  if (!file) return;
  
  function fileTypeCheck(fileType) {
    let isIncorrect = false;
    fileType.split('/').forEach(type => {
      if ( !(type === 'image' || type === 'png' || type === 'jpeg') ) {
      isIncorrect = true;
      }
    });
    return isIncorrect;
  }
  
  if (fileTypeCheck(file.type)) {
    errorMessage.textContent = 'Неверный формат файла. Пожалуйста, выберите изображение в формате .jpg или .png.';
    errorNode.style.display = '';
    return;
  }
  
  const formData = new FormData();
  formData.append('title', file.name);
  formData.append('image', file);
  
  errorNode.style.display = 'none';
  menu.style.display = 'none';
  imageLoader.style.display = '';
  
  fetch('https://neto-api.herokuapp.com/pic', {
    body: formData,
    credentials: 'same-origin',
    method: 'POST',
  })
  .then(res => {
    document.querySelectorAll('.comments__form').forEach(form => form.remove());
    if (userImg);
    menu.style.display = '';
    imageLoader.style.display = 'none';
    if (res.status >= 400) throw res.statusText;
    return res.json();
  })
  .then(res => {
    picID = res.id;
    return fetch(`https://neto-api.herokuapp.com/pic/${res.id}`);
  })
  .then(res => {
    if (res.status >= 400) throw res.statusText;
    return res.json();
  })
  .then(res => {
    workServerAjaxAnswer(res);
  })
  .catch(err => {
    menu.style.display = 'none';
    imageLoader.style.display = 'none';
    errorMessage.textContent = err;
    errorNode.style.display = '';
    console.log(err);
  });
}

// Загрузка изображения через меню
const fileInput = document.createElement('input');
fileInput.setAttribute('type', 'file');
fileInput.setAttribute('accept', 'image/jpeg, image/png');
fileInput.classList.add('menu__fileloader');

fileInput.addEventListener('change', event => {
  const file = event.currentTarget.files[0];
  publishImage(file);
  burger.style.display = '';
});
document.querySelector('.new').insertBefore(fileInput, document.querySelector('.new').firstElementChild);

// Загрузка изображения через drop
wrap.addEventListener('drop', event => {
  event.preventDefault();
  if (picID) {
    errorMessage.textContent = 'Чтобы загрузить новое изображение, пожалуйста, воспользуйтесь пунктом "Загрузить новое" в меню.';
    errorNode.style.display = '';
    return;
  }
  const file = event.dataTransfer.files[0];
  publishImage(file);
});
wrap.addEventListener('dragover', event => event.preventDefault());

// Отображение содержимого при GET запросе
const regexp = /id=([^&]+)/i;
if (regexp.exec(document.location.search)) {
  picID = regexp.exec(document.location.search)[1];
  
  menu.style.display = 'none';
  imageLoader.style.display = '';
  
  fetch(`https://neto-api.herokuapp.com/pic/${picID}`)
    .then(res => {
      if (res.status >= 400) throw res.statusText;
      menu.style.display = '';
      imageLoader.style.display = 'none';
      return res.json();
    })

  .then(res => {
    workServerAjaxAnswer(res);
    mode.forEach(elem => elem.dataset.state = '');
    comments.dataset.state = 'selected';
  })
  .catch(err => {
    menu.style.display = 'none';
    imageLoader.style.display = 'none';
    errorMessage.textContent = err;
    errorNode.style.display = '';
    console.log(err);
  });
}
