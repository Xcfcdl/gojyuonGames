// 五十音跳一跳游戏主逻辑
import audioManager from './common/audioManager.js';
import SpeechManager from './common/speechManager.js';
import DataLoader, { getKanaList } from './common/dataLoader.js';

const MODES = [
  { name: '元音', value: 'vowel', kana: ['あ','い','う','え','お'] },
  { name: '平假名', value: 'hiragana' },
  { name: '片假名', value: 'katakana' },
  { name: '浊音', value: 'dakuon' },
  { name: '拗音', value: 'youon' },
  { name: '平片混合', value: 'mix' },
  { name: '全部', value: 'all' }
];

let currentMode = MODES[0];
let kanaList = [];
let currentIndex = 0;
let score = 0;
let paused = false;
let speechManager;

async function init() {
  speechManager = window.speechManager || new SpeechManager();
  // 等待假名数据加载完成
  if (window.dataLoader && window.dataLoader.loadKanaData) {
    await window.dataLoader.loadKanaData();
  }
  renderModeButtons();
  loadMode(currentMode.value);
  bindUI();
}

function renderModeButtons() {
  const modeSelect = document.getElementById('jump-mode-select');
  modeSelect.innerHTML = '';
  MODES.forEach(mode => {
    const btn = document.createElement('button');
    btn.className = 'jump-mode-btn' + (mode.value === currentMode.value ? ' active' : '');
    btn.textContent = mode.name;
    btn.onclick = () => {
      if (paused) return;
      currentMode = mode;
      loadMode(mode.value);
      renderModeButtons();
    };
    modeSelect.appendChild(btn);
  });
}

function loadMode(mode) {
  const allKana = getKanaList();
  if (mode === 'vowel') {
    kanaList = ['あ','い','う','え','お'];
  } else if (mode === 'hiragana') {
    kanaList = allKana.filter(k => k.type === 'basic').map(k => k.char).filter(Boolean);
  } else if (mode === 'katakana') {
    kanaList = allKana.filter(k => k.type === 'basic').map(k => k.katakana).filter(Boolean);
  } else if (mode === 'dakuon') {
    kanaList = allKana.filter(k => k.type === 'dakuon' || k.type === 'handakuon').map(k => k.char).filter(Boolean);
  } else if (mode === 'youon') {
    kanaList = allKana.filter(k => k.type === 'youon' || k.type === 'youon_dakuon' || k.type === 'youon_handakuon').map(k => k.char).filter(Boolean);
  } else if (mode === 'mix') {
    // 平假名+片假名基础音混合
    const hiragana = allKana.filter(k => k.type === 'basic').map(k => k.char).filter(Boolean);
    const katakana = allKana.filter(k => k.type === 'basic').map(k => k.katakana).filter(Boolean);
    kanaList = [...hiragana, ...katakana];
  } else if (mode === 'all') {
    // 所有假名（平假名+片假名+浊音+拗音等）
    kanaList = allKana.map(k => k.char).concat(allKana.map(k => k.katakana)).filter(Boolean);
  } else {
    kanaList = ['あ','い','う','え','お'];
  }
  // 去重并随机排序
  kanaList = Array.from(new Set(kanaList));
  currentIndex = 0;
  score = 0;
  paused = false;
  render();
  if (kanaList.length > 0) speechManager.speakKana(kanaList[0]);
}

function bindUI() {
  document.getElementById('jump-btn-pause').onclick = () => {
    paused = !paused;
    document.getElementById('jump-btn-pause').innerHTML = paused ? '<i class="fas fa-play"></i> 继续' : '<i class="fas fa-pause"></i> 暂停';
  };
  document.getElementById('jump-btn-reset').onclick = () => {
    loadMode(currentMode.value);
  };
  document.getElementById('jump-btn-exit').onclick = () => {
    window.location.href = '../index.html';
  };
  document.getElementById('jump-modal-close').onclick = () => {
    document.getElementById('jump-modal').style.display = 'none';
    loadMode(currentMode.value);
  };
}

function render() {
  // 分数与进度
  document.getElementById('jump-score').textContent = score;
  document.getElementById('jump-progress').textContent = (currentIndex + 1);

  // 第一行：当前假名（居中大方格）
  const currentRow = document.getElementById('jump-current-row');
  currentRow.innerHTML = '';
  const cur = kanaList[currentIndex] || '';
  const curBox = document.createElement('div');
  curBox.className = 'jump-kana-current';
  if (cur.length === 2) curBox.setAttribute('data-chars', '2');
  const curSpan = document.createElement('span');
  curSpan.textContent = cur;
  curBox.appendChild(curSpan);
  currentRow.appendChild(curBox);

  // 第二行：待选项（横向两个按钮）
  const candidateRow = document.getElementById('jump-candidate-row');
  candidateRow.innerHTML = '';
  const nextIndex = (currentIndex + 1) % kanaList.length;
  const correctKana = kanaList[nextIndex];
  let distractKana = '';
  if (kanaList.length > 5) {
    const sameRow = kanaList.filter(k => k !== correctKana && k !== cur);
    distractKana = sameRow[Math.floor(Math.random() * sameRow.length)] || '';
  } else {
    distractKana = kanaList[(nextIndex + 1) % kanaList.length];
    if (distractKana === correctKana) distractKana = kanaList[(nextIndex + 2) % kanaList.length];
  }
  const options = Math.random() > 0.5 ? [correctKana, distractKana] : [distractKana, correctKana];
  options.forEach(kana => {
    const btn = document.createElement('button');
    btn.className = 'jump-kana-btn';
    if (kana.length === 2) btn.setAttribute('data-chars', '2');
    const span = document.createElement('span');
    span.textContent = kana;
    btn.appendChild(span);
    btn.disabled = paused;
    btn.onclick = () => onSelect(kana, btn, correctKana);
    candidateRow.appendChild(btn);
  });

  // 第三行：未来预览（横向两个虚化方格）
  const futureRow = document.getElementById('jump-future-row');
  futureRow.innerHTML = '';
  for (let i = 0; i < 2; i++) {
    const box = document.createElement('div');
    box.className = 'jump-kana-box';
    const futKana = kanaList[(currentIndex + 2 + i) % kanaList.length] || '';
    if (futKana.length === 2) box.setAttribute('data-chars', '2');
    const span = document.createElement('span');
    span.textContent = futKana;
    box.appendChild(span);
    futureRow.appendChild(box);
  }
}

function onSelect(kana, btn, correctKana) {
  if (paused) return;
  if (kana === correctKana) {
    btn.classList.add('correct');
    score++;
    audioManager.playCorrect();
    setTimeout(() => {
      currentIndex = (currentIndex + 1) % kanaList.length;
      render();
      speechManager.speakKana(kanaList[currentIndex]);
    }, 400);
  } else {
    btn.classList.add('incorrect');
    audioManager.playIncorrect();
    score = Math.max(0, score - 1);
    if (currentIndex <= 1) {
      setTimeout(() => {
        document.getElementById('jump-modal').style.display = 'flex';
      }, 400);
    } else {
      setTimeout(() => {
        currentIndex = Math.max(0, currentIndex - 2);
        render();
        speechManager.speakKana(kanaList[currentIndex]);
      }, 400);
    }
  }
}

window.jumpGame = { init, loadMode };
document.removeEventListener('DOMContentLoaded', init);
document.addEventListener('DOMContentLoaded', init); 