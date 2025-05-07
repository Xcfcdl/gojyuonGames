import SpeechManager from './common/speechManager.js';

// 假名消消乐核心逻辑

const DIFFICULTY_MAP = {
    3: 9,
    5: 25,
    9: 81,
    16: 256
};

const BOARD_SIZE = {
    3: 3,
    5: 5,
    9: 9,
    16: 16
};

let kanaPool = [];
let currentBoard = [];
let revealed = [];
let matched = [];
let firstBtn = null;
let secondBtn = null;
let revealTimeout = null;
let matchTimeout = null;
let canClick = true;
let mode = 'hiragana';
let difficulty = 3;

const boardEl = document.getElementById('match-board');
const feedbackEl = document.getElementById('match-feedback');
const difficultySelect = document.getElementById('difficulty-select');
const modeSelect = document.getElementById('mode-select');
const restartBtn = document.getElementById('restart-match');
const audioCorrect = document.getElementById('audio-correct');
const audioIncorrect = document.getElementById('audio-incorrect');

// 载入假名数据
let kanaMapping = null;
fetch('../assets/audio/kana/kana_mapping.json')
    .then(res => res.json())
    .then(data => { kanaMapping = data; initGame(); });

function getKanaList(mode) {
    let list = [];
    if (!kanaMapping) return list;
    if (mode === 'hiragana') {
        list = [
            ...Object.keys(kanaMapping.basic),
            ...Object.keys(kanaMapping.dakuon),
            ...Object.keys(kanaMapping.youon)
        ];
    } else if (mode === 'katakana') {
        list = Object.keys(kanaMapping.katakana);
    } else {
        // mixed
        list = [
            ...Object.keys(kanaMapping.basic),
            ...Object.keys(kanaMapping.dakuon),
            ...Object.keys(kanaMapping.youon),
            ...Object.keys(kanaMapping.katakana)
        ];
    }
    return list;
}

function shuffle(arr) {
    return arr.map(v => [Math.random(), v])
        .sort((a, b) => a[0] - b[0])
        .map(v => v[1]);
}

function pickKanaPairs(count, mode) {
    let list = getKanaList(mode);
    list = shuffle(list);
    // 3x3 特殊处理
    if (count === 9) {
        const pairs = list.slice(0, 4);
        return shuffle([...pairs, ...pairs, null]);
    } else {
        const pairCount = count / 2;
        const pairs = list.slice(0, pairCount);
        return shuffle([...pairs, ...pairs]);
    }
}

function renderBoard() {
    boardEl.innerHTML = '';
    boardEl.style.gridTemplateColumns = `repeat(${BOARD_SIZE[difficulty]}, 1fr)`;
    currentBoard.forEach((kana, idx) => {
        const btn = document.createElement('button');
        btn.className = 'match-btn hidden';
        btn.dataset.idx = idx;
        btn.disabled = kana === null;
        if (kana === null) {
            btn.style.visibility = 'hidden';
        }
        btn.addEventListener('click', () => onBtnClick(btn, kana));
        boardEl.appendChild(btn);
    });
}

function onBtnClick(btn, kana) {
    if (!canClick || btn.classList.contains('matched') || btn === firstBtn || kana === null) return;
    btn.classList.remove('hidden', 'incorrect');
    btn.classList.add('pulse');
    btn.textContent = kana;
    window.speechManager.speak(kana);
    setTimeout(() => btn.classList.remove('pulse'), 300);

    if (!firstBtn) {
        firstBtn = btn;
        clearTimeout(revealTimeout);
        revealTimeout = setTimeout(() => {
            hideBtn(firstBtn);
            firstBtn = null;
        }, 1000);
    } else {
        secondBtn = btn;
        canClick = false;
        clearTimeout(revealTimeout);
        // 2秒内判断
        matchTimeout = setTimeout(() => {
            checkMatch();
        }, 200);
    }
}

function hideBtn(btn) {
    if (!btn) return;
    btn.classList.add('hidden');
    btn.textContent = '';
}

function checkMatch() {
    if (!firstBtn || !secondBtn) {
        canClick = true;
        return;
    }
    const idx1 = parseInt(firstBtn.dataset.idx);
    const idx2 = parseInt(secondBtn.dataset.idx);
    const kana1 = currentBoard[idx1];
    const kana2 = currentBoard[idx2];
    if (kana1 === kana2 && idx1 !== idx2) {
        // 配对成功
        firstBtn.classList.add('matched');
        secondBtn.classList.add('matched');
        audioCorrect.currentTime = 0;
        audioCorrect.play();
        setTimeout(() => {
            hideBtn(firstBtn);
            hideBtn(secondBtn);
            firstBtn.style.visibility = 'hidden';
            secondBtn.style.visibility = 'hidden';
            firstBtn = null;
            secondBtn = null;
            canClick = true;
            checkGameComplete();
        }, 500);
    } else {
        // 配对失败
        firstBtn.classList.add('incorrect');
        secondBtn.classList.add('incorrect');
        audioIncorrect.currentTime = 0;
        audioIncorrect.play();
        setTimeout(() => {
            hideBtn(firstBtn);
            hideBtn(secondBtn);
            firstBtn = null;
            secondBtn = null;
            canClick = true;
        }, 800);
    }
}

function showCompleteModal() {
    // 播放音效
    let audioSuccess = document.getElementById('audio-success');
    if (!audioSuccess) {
        audioSuccess = document.createElement('audio');
        audioSuccess.id = 'audio-success';
        audioSuccess.src = '../assets/audio/success.mp3';
        audioSuccess.preload = 'auto';
        document.body.appendChild(audioSuccess);
    }
    audioSuccess.currentTime = 0;
    audioSuccess.volume = 0.1;
   
    audioSuccess.play();
    // 避免重复弹窗
    if (document.querySelector('.match-modal-mask')) return;
    // 彩纸canvas
    if (!document.getElementById('confetti-canvas')) {
        const canvas = document.createElement('canvas');
        canvas.id = 'confetti-canvas';
        document.body.appendChild(canvas);
    }
    // 弹窗
    const mask = document.createElement('div');
    mask.className = 'match-modal-mask';
    mask.innerHTML = `
      <div class="match-modal">
        <h3>🎉 恭喜完成本局！</h3>
        <div style="margin-bottom:1.2rem;">全部配对完成！</div>
        <button class="modal-btn" id="modal-restart">再来一局</button>
      </div>
    `;
    document.body.appendChild(mask);
    // 彩纸动画
    setTimeout(() => {
        const modal = document.querySelector('.match-modal');
        if (!modal) return;
        const rect = modal.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const confettiSettings = {
            target: 'confetti-canvas',
            max: 150,
            size: 1.5,
            animate: true,
            props: ['circle', 'square', 'triangle', 'line'],
            colors: [[165,104,246],[230,61,135],[0,199,228],[253,214,126]],
            clock: 25,
            rotate: true,
            start_from_edge: false,
            respawn: false,
            spread: 50,
            origin: {
                x: centerX / window.innerWidth,
                y: centerY / window.innerHeight
            },
            angle: 270,
            startVelocity: 30,
            ticks: 300
        };
        const confetti = new ConfettiGenerator(confettiSettings);
        confetti.render();
        setTimeout(() => {
            confetti.clear();
            const canvas = document.getElementById('confetti-canvas');
            if (canvas) canvas.remove();
        }, 3000);
    }, 100);
    // 关闭/再来一局
    mask.querySelector('#modal-restart').onclick = () => {
        mask.remove();
        resetGame();
    };
    // 点击遮罩也可关闭
    mask.onclick = e => { if (e.target === mask) { mask.remove(); resetGame(); } };
}

function checkGameComplete() {
    const allMatched = Array.from(boardEl.children).every(btn => btn.style.visibility === 'hidden' || btn.disabled);
    if (allMatched) {
        showCompleteModal();
    }
}


function resetGame() {
    feedbackEl.textContent = '';
    firstBtn = null;
    secondBtn = null;
    canClick = true;
    clearTimeout(revealTimeout);
    clearTimeout(matchTimeout);
    const count = DIFFICULTY_MAP[difficulty];
    currentBoard = pickKanaPairs(count, mode);
    renderBoard();
}

function initGame() {
    difficulty = parseInt(difficultySelect.value);
    mode = modeSelect.value;
    resetGame();
}

difficultySelect.addEventListener('change', () => {
    difficulty = parseInt(difficultySelect.value);
    resetGame();
});
modeSelect.addEventListener('change', () => {
    mode = modeSelect.value;
    resetGame();
});
restartBtn.addEventListener('click', resetGame);

// 全屏按钮
const fullscreenBtn = document.getElementById('fullscreen-btn');
const exitFullscreenBtn = document.getElementById('exit-fullscreen-btn');
const boardSection = document.querySelector('.match-board-section');
fullscreenBtn.addEventListener('click', () => {
    boardSection.classList.add('fullscreen-board');
    fullscreenBtn.style.display = 'none';
    exitFullscreenBtn.style.display = 'block';
    // 将恢复按钮插入到boardSection内，确保全屏时在左上角
    boardSection.appendChild(exitFullscreenBtn);
});

exitFullscreenBtn.addEventListener('click', () => {
    boardSection.classList.remove('fullscreen-board');
    fullscreenBtn.style.display = '';
    exitFullscreenBtn.style.display = 'none';
    // 恢复按钮移回controls区
    document.querySelector('.match-controls').appendChild(exitFullscreenBtn);
});