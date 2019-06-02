'use strict';

const wrap = document.querySelector('.wrap'),
  currentImage = document.querySelector('.current-image'),
  menu = document.querySelector('.menu'),
  burger = document.querySelector('.burger'),
  comments = document.querySelector('.comments'),
  draw = document.querySelector('.draw'),
  share = document.querySelector('.share'),
  menuUrl = document.querySelector('.menu__url'),
  mode = document.querySelectorAll('.mode'),
  imageLoader = document.querySelector('.image-loader'),
  errorMessage = document.querySelector('.error__message'),
  errorNode = document.querySelector('.error'),
  commentsOn = document.querySelector('.comments-on'),
  commentsOff = document.querySelector('.comments-off'),
  canvas = document.createElement('canvas'),
  canvasComments = document.createElement('div'),
  canvasImage = document.createElement('div'),
  shownComments = {},
  BRUSH_THICKNESS = 4, // постоянная толщина пера
  ctx = canvas.getContext('2d');

let userImg,
  curves = [],
  drawing = false,
  needsRepaint = false,
  currentColor = '#6cbe47', // зелёный цвет
  picID,
  curvesRemove = 0,
  wsGlobal = null;
