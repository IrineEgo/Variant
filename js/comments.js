'use strict';

// Отображение/Скрытие комментариев
commentsOn.addEventListener('change', checkCommentsShow);
commentsOff.addEventListener('change', checkCommentsShow);

function checkCommentsShow() {
	if (commentsOn.checked) {
		document.querySelectorAll('.comments__form').forEach(form => {
			form.style.display = '';
		});
	} else {
		document.querySelectorAll('.comments__form').forEach(form => {
			form.style.display = 'none';
		});
	}
}

// Создание div для размещения комментариев
function createCommentsWrap() {
	if (!canvasComments) {
		canvasComments = document.createElement('div');
	}

	canvasComments.style.width = getComputedStyle(currentImage).width;
	canvasComments.style.height = getComputedStyle(currentImage).height;
	canvasComments.classList.add('comments-canvas');
	canvasComments.addEventListener('click', event => {
		if (event.target.closest('.comments__form')) {
			const currentForm = event.target.closest('.comments__form');
			document.querySelectorAll('.comments__form').forEach(form => {
				form.style.zIndex = 10;
			});
			currentForm.style.zIndex = 11;
			deleteExceptCurrent(currentForm);
			foldExceptCurrent(currentForm);
		}
	});
}

// Создание нового комментария при клике на холсте
canvas.addEventListener('click', event => {
	if (comments.dataset.state !== 'selected' || !commentsOn.checked) return;

	deleteExceptCurrent();
	foldExceptCurrent();

	const newComment = createNewForm();
	newComment.querySelector('.comments__marker-checkbox').checked = true;
	canvasComments.appendChild(newComment);

	const marker = newComment.querySelector('.comments__marker');
	const coordX = event.offsetX - getComputedStyle(marker).left.slice(0, -2) - (+getComputedStyle(marker).width.slice(0, -2)) / 2;
	const coordY = event.offsetY - getComputedStyle(marker).top.slice(0, -2) - getComputedStyle(marker).height.slice(0, -2);

	newComment.style.left = coordX + 'px';
	newComment.style.top = coordY + 'px';

	newComment.dataset.left = coordX;
	newComment.dataset.top = coordY;
});

// Удаление пустых комментариев
function deleteExceptCurrent(currentForm = null) {
	document.querySelectorAll('.comments__form').forEach(form => {
		if (form.querySelectorAll('.comment').length < 2 && form !== currentForm) {
			form.remove();
		}
	});
}

// Свёртывание пустых комментариев
function foldExceptCurrent(currentForm = null) {
	document.querySelectorAll('.comments__form').forEach(form => {
		if (form !== currentForm) {
			form.querySelector('.comments__marker-checkbox').checked = false;
		}
	});
}

// Новый элемент для комментариев (form)
function createNewForm() {
	const newForm = document.querySelector('.comments__form__sample').cloneNode(true);
	newForm.classList.remove('comments__form__sample');
	newForm.classList.add('comments__form');
	newForm.style.display = '';
	newForm.style.zIndex = 10;

	// Кнопка "Закрыть"
	newForm.querySelector('.comments__close').addEventListener('click', () => {
		if (newForm.querySelectorAll('.comment').length > 1) {
			newForm.querySelector('.comments__marker-checkbox').checked = false;
		} else {
			newForm.remove();
		}
	});

	// Кнопка "Отправить"
	newForm.addEventListener('submit', event => {
		event.preventDefault();
		const message = newForm.querySelector('.comments__input').value;
		const body = `message=${encodeURIComponent(message)}&left=${encodeURIComponent(newForm.dataset.left)}&top=${encodeURIComponent(newForm.dataset.top)}`;
		newForm.querySelector('.loader').parentElement.style.display = '';

		fetch(`https://neto-api.herokuapp.com/pic/${picID}/comments`, {
			body: body,
			credentials: 'same-origin',
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			}
	})
		.then(res => {
				if (res.status >= 400) throw res.statusText;
				return res.json();
		})
		.then(res => {
				updateComments(res.comments);
				newForm.querySelector('.comments__input').value = '';
		})
		.catch(err => {
				newForm.querySelector('.loader').parentElement.style.display = 'none';
		});
	});
	return newForm;
}

// Отрисовка комментариев, полученных с сервера
function updateComments(newComments) {
	wrap.appendChild(canvasComments);
	canvasComments.appendChild(canvas);
	if (!newComments) return;
	Object.keys(newComments).forEach(id => {
		if (id in shownComments) return;

		shownComments[id] = newComments[id];
		let сreateNewForm = true;
		document.querySelectorAll('.comments__form').forEach(form => {
			if (+form.dataset.left === shownComments[id].left && +form.dataset.top === shownComments[id].top) {
					form.querySelector('.loader').parentElement.style.display = 'none';
					addMsgToForm(newComments[id], form);
					сreateNewForm = false;
			}
		});

		if (сreateNewForm) {
			const newForm = createNewForm();
			newForm.dataset.left = newComments[id].left;
			newForm.dataset.top = newComments[id].top;

			newForm.style.left = newComments[id].left + 'px';
			newForm.style.top = newComments[id].top + 'px';

			addMsgToForm(newComments[id], newForm);
			canvasComments.appendChild(newForm);

			if (!commentsOn.checked) {
					newForm.style.display = 'none';
			}
		}
	});
}

// Добавление нового сообщения в форму, сортировка
function addMsgToForm(newMsg, form) {
	function getDate(timestamp) {
		const options = {
			day: 'numeric',
			month: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: 'numeric',
			second: 'numeric'
		};

		const date = new Date(timestamp);
		const dateStr = date.toLocaleString(options);
		return dateStr.slice(0, 6) + dateStr.slice(8, 10) + dateStr.slice(11);
	}

	let timestamp = Number.MAX_VALUE;
	let lowerDiv = form.querySelector('.loader').parentElement;

	form.querySelectorAll('.user__comment').forEach(msgDiv => {
		const currentTimestamp = +msgDiv.dataset.timestamp;

		if (currentTimestamp < newMsg.timestamp) return;
		if (currentTimestamp < timestamp) {
			timestamp = currentTimestamp;
			lowerDiv = msgDiv;
		}
	});

	const newMsgDiv = document.createElement('div');
	newMsgDiv.classList.add('comment');
	newMsgDiv.classList.add('user__comment');
	newMsgDiv.dataset.timestamp = newMsg.timestamp;

	const pCommentTime = document.createElement('p');
	pCommentTime.classList.add('comment__time');
	pCommentTime.textContent = getDate(newMsg.timestamp);
	newMsgDiv.appendChild(pCommentTime);

	const pCommentMessage = document.createElement('p');
	pCommentMessage.classList.add('comment__message');
	pCommentMessage.textContent = newMsg.message;
	pCommentMessage.style.whiteSpace = 'pre-line';
	newMsgDiv.appendChild(pCommentMessage);

	form.querySelector('.comments__body').insertBefore(newMsgDiv, lowerDiv);
}

// Преобразуем комментарий полученый из веб-сокета
function insertWSComment(wsComment) {
	const wsCommentEdit = {};
	wsCommentEdit[wsComment.id] = {};
	wsCommentEdit[wsComment.id].left = wsComment.left;
	wsCommentEdit[wsComment.id].message = wsComment.message;
	wsCommentEdit[wsComment.id].timestamp = wsComment.timestamp;
	wsCommentEdit[wsComment.id].top = wsComment.top;

	updateComments(wsCommentEdit);
}
