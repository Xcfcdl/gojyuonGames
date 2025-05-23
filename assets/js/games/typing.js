// 引入通用模块
import { getKanaList, getKanaTable, getPresetKana } from './common/dataLoader.js';
import SpeechManager from './common/speechManager.js';
import audioManager from './common/audioManager.js';

// DOM 元素
const modal = document.getElementById('game-instruction-modal');
const startBtn = document.getElementById('start-game-btn');
const kanaTableContainer = document.getElementById('kana-table-container');
const selectAllBtn = document.getElementById('select-all-btn');
const deselectAllBtn = document.getElementById('deselect-all-btn');
const presetBtns = document.querySelectorAll('.preset-btn');
const delayRange = document.getElementById('delay-range');
const delayValue = document.getElementById('delay-value');
const gameSection = document.getElementById('game-section');
const kanaSelectSection = document.getElementById('kana-select-section');
const settingsSection = document.getElementById('settings-section');
const header = document.querySelector('header');
const footer = document.querySelector('footer');
const currentKanaSpan = document.getElementById('current-kana');
const playAudioBtn = document.getElementById('play-audio-btn');
const romajiInput = document.getElementById('romaji-input');
const feedbackMsg = document.getElementById('feedback-msg');
const totalCountSpan = document.getElementById('total-count');
const correctCountSpan = document.getElementById('correct-count');
const accuracySpan = document.getElementById('accuracy');
const totalTimeSpan = document.getElementById('total-time');
const currentTimeSpan = document.getElementById('current-time');
const fastestTimeSpan = document.getElementById('fastest-time');
const slowestTimeSpan = document.getElementById('slowest-time');
const streakSpan = document.getElementById('streak');
const realStartBtn = document.getElementById('real-start-btn');
const expandHeaderBtn = document.getElementById('expand-header-btn');
const clearWrongListBtn = document.getElementById('clear-wrong-list-btn');
const endGameBtn = document.getElementById('end-game-btn');
const goHomeBtn = document.getElementById('go-home-btn');
const expandFooterBtn = document.getElementById('expand-footer-btn');

// 游戏状态
let selectedKana = [];
let kanaList = [];
let currentKana = null;
let stats = {
    total: 0,
    correct: 0,
    streak: 0,
    maxStreak: 0,
    totalTime: 0,
    fastest: null,
    slowest: null,
    perQuestion: [],
    wrongList: loadWrongListFromStorage() // 初始化时从本地加载
};
let questionStartTime = null;
let delay = 0.5;
let switching = false;
let audioDebounce = false;
let showKatakanaOnly = false;
let currentPreset = null;

// 创建 SpeechManager 实例
const speechManager = new SpeechManager();

// 本地存储 key
const WRONG_LIST_KEY = 'kana_typing_wrong_list';

// 载入本地错题本
function loadWrongListFromStorage() {
    try {
        const data = localStorage.getItem(WRONG_LIST_KEY);
        if (data) {
            return JSON.parse(data);
        }
    } catch (e) {}
    return [];
}
// 保存错题本到本地
function saveWrongListToStorage() {
    try {
        localStorage.setItem(WRONG_LIST_KEY, JSON.stringify(stats.wrongList));
    } catch (e) {}
}

// 说明弹窗逻辑
startBtn.onclick = () => {
    modal.classList.remove('show');
    modal.style.display = 'none';
};

// 切题延迟设置
if (delayRange) {
    delayRange.addEventListener('input', e => {
        delay = parseFloat(e.target.value);
        delayValue.textContent = delay;
    });
}

// 题库表格渲染与选择逻辑
function renderKanaTable() {
    const table = getKanaTable();
    kanaTableContainer.innerHTML = '';
    table.forEach((row, rowIdx) => {
        const tr = document.createElement('div');
        tr.className = 'kana-row';
        row.forEach((cell, colIdx) => {
            if (!cell || !cell.romaji) return;
            const btn = document.createElement('button');
            btn.className = 'kana-cell';
            // 只在 katakana preset 下优先显示 katakana
            btn.textContent = (currentPreset === 'katakana')
                ? (cell.katakana || cell.hiragana || cell.romaji)
                : (cell.hiragana || cell.katakana || cell.romaji);
            btn.dataset.romaji = cell.romaji;
            btn.onclick = () => toggleKana(cell.romaji);
            if (selectedKana.includes(cell.romaji)) btn.classList.add('selected');
            tr.appendChild(btn);
        });
        // 行选择按钮
        const rowBtn = document.createElement('button');
        rowBtn.className = 'row-select-btn';
        rowBtn.textContent = '选中本行';
        rowBtn.onclick = () => selectRow(row);
        tr.appendChild(rowBtn);
        kanaTableContainer.appendChild(tr);
    });
}
function toggleKana(romaji) {
    if (selectedKana.includes(romaji)) {
        selectedKana = selectedKana.filter(k => k !== romaji);
    } else {
        selectedKana.push(romaji);
    }
    renderKanaTable();
}
function selectRow(row) {
    row.forEach(cell => {
        if (cell && cell.romaji && !selectedKana.includes(cell.romaji)) {
            selectedKana.push(cell.romaji);
        }
    });
    renderKanaTable();
}
function bindPresetBtns() {
    presetBtns.forEach(btn => {
        btn.onclick = () => {
            currentPreset = btn.dataset.preset;
            selectedKana = getPresetKana(btn.dataset.preset);
            renderKanaTable();
        };
    });
}
selectAllBtn.onclick = () => {
    selectedKana = getKanaList().map(k => k.romaji);
    renderKanaTable();
};
deselectAllBtn.onclick = () => {
    selectedKana = [];
    renderKanaTable();
};

// 游戏开始逻辑
function startGame() {
    if (!selectedKana.length) {
        alert('请至少选择一个假名！');
        return;
    }
    kanaList = selectedKana.slice();
    stats = {
        total: 0,
        correct: 0,
        streak: 0,
        maxStreak: 0,
        totalTime: 0,
        fastest: null,
        slowest: null,
        perQuestion: [],
        wrongList: loadWrongListFromStorage() // 新游戏时也从本地加载
    };
    gameSection.style.display = 'block';
    kanaSelectSection.style.display = 'none';
    settingsSection.style.display = 'none';
    header.classList.add('collapsed');
    updateHeaderCollapseState();
    footer.classList.add('collapsed');
    updateFooterCollapseState();
    nextQuestion();
    updateWrongList();
    // 显示结束游戏按钮
    endGameBtn.style.display = 'inline-block';
}

// 题目流程
function nextQuestion() {
    switching = false;
    romajiInput.value = '';
    feedbackMsg.textContent = '';
    romajiInput.className = '';
    currentKana = randomKana();
    currentKanaSpan.textContent = currentKana.hiragana || currentKana.katakana || currentKana.romaji;
    playCurrentAudio();
    questionStartTime = Date.now();
    romajiInput.focus();
}
function randomKana() {
    const idx = Math.floor(Math.random() * kanaList.length);
    const romaji = kanaList[idx];
    const kana = getKanaList().find(k => k.romaji === romaji);
    return kana || { hiragana: '', katakana: '', romaji: romaji };
}
function playCurrentAudio() {
    if (audioDebounce) return;
    audioDebounce = true;
    speechManager.speakKana(currentKana.romaji).finally(() => {
        setTimeout(() => { audioDebounce = false; }, 400);
    });
}
playAudioBtn.onclick = playCurrentAudio;

// 输入与判定
romajiInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !switching) {
        checkAnswer();
    }
});
function checkAnswer() {
    if (switching) return;
    switching = true;
    const userInput = romajiInput.value.trim().toLowerCase();
    const answer = currentKana.romaji;
    const timeUsed = (Date.now() - questionStartTime) / 1000;
    stats.total++;
    stats.perQuestion.push(timeUsed);
    stats.totalTime += timeUsed;
    if (stats.fastest === null || timeUsed < stats.fastest) stats.fastest = timeUsed;
    if (stats.slowest === null || timeUsed > stats.slowest) stats.slowest = timeUsed;
    if (userInput === answer) {
        stats.correct++;
        stats.streak++;
        if (stats.streak > stats.maxStreak) stats.maxStreak = stats.streak;
        audioManager.playCorrect();
        romajiInput.className = 'correct';
        feedbackMsg.textContent = '正确！';
        feedbackMsg.className = 'correct';
    } else {
        stats.streak = 0;
        if (audioManager && typeof audioManager.playIncorrect === 'function') {
            audioManager.playIncorrect();
        }
        romajiInput.className = 'incorrect';
        feedbackMsg.textContent = `错误，正确答案：${answer}`;
        feedbackMsg.className = 'incorrect';
        // 记录错题
        stats.wrongList.push({
            kana: currentKana.hiragana || currentKana.katakana || currentKana.romaji,
            romaji: currentKana.romaji,
            input: userInput
        });
        updateWrongList();
        saveWrongListToStorage();
    }
    updateStats();
    setTimeout(nextQuestion, delay * 1000);
}

function updateStats() {
    totalCountSpan.textContent = stats.total;
    correctCountSpan.textContent = stats.correct;
    accuracySpan.textContent = stats.total ? ((stats.correct / stats.total * 100).toFixed(1) + '%') : '0%';
    totalTimeSpan.textContent = stats.totalTime.toFixed(1);
    currentTimeSpan.textContent = stats.perQuestion.length ? stats.perQuestion[stats.perQuestion.length - 1].toFixed(1) : '0.0';
    fastestTimeSpan.textContent = stats.fastest ? stats.fastest.toFixed(1) : '-';
    slowestTimeSpan.textContent = stats.slowest ? stats.slowest.toFixed(1) : '-';
    streakSpan.textContent = stats.streak;
}

// header/footer 折叠样式
// 在 style.css/typing.css 中添加 .collapsed { display: none; } 或高度为0

// 移动端适配：监听输入框 focus/blur，自动滚动到输入区
romajiInput.addEventListener('focus', () => {
    setTimeout(() => {
        romajiInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
});

// 更新 header 折叠状态时显示/隐藏展开按钮
function updateHeaderCollapseState() {
    if (header.classList.contains('collapsed')) {
        expandHeaderBtn.style.display = 'block';
    } else {
        expandHeaderBtn.style.display = 'none';
    }
}
expandHeaderBtn.onclick = () => {
    header.classList.remove('collapsed');
    updateHeaderCollapseState();
};

// 更新 footer 折叠状态时显示/隐藏展开按钮
function updateFooterCollapseState() {
    if (footer.classList.contains('collapsed')) {
        expandFooterBtn.style.display = 'block';
    } else {
        expandFooterBtn.style.display = 'none';
    }
}
expandFooterBtn.onclick = () => {
    footer.classList.remove('collapsed');
    updateFooterCollapseState();
};

// 初始化
window.dataLoader.init().then(() => {
    bindPresetBtns();
    renderKanaTable();
    realStartBtn.onclick = startGame;
});

function updateWrongList() {
    const tbody = document.querySelector('#wrong-list-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    stats.wrongList.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${item.kana}</td><td>${item.romaji}</td><td>${item.input}</td>`;
        tbody.appendChild(tr);
    });
}

// 清空错题本按钮
if (clearWrongListBtn) {
    clearWrongListBtn.onclick = () => {
        // 使用多语言支持的确认对话框
        const confirmMessage = (window.langData && window.langData.confirm_clear_wrong_list) || '确定要清空错题本吗？';
        if (confirm(confirmMessage)) {
            stats.wrongList = [];
            saveWrongListToStorage();
            updateWrongList();
        }
    };
}

// 在每次 header 折叠/展开时调用
updateHeaderCollapseState();

// 在每次 footer 折叠/展开时调用
updateFooterCollapseState();

// 页面加载时渲染错题本
updateWrongList();

// 结束游戏并返回题库选择区
function endGameAndReturnToSelect() {
    gameSection.style.display = 'none';
    kanaSelectSection.style.display = 'block';
    settingsSection.style.display = 'block';
    header.classList.remove('collapsed');
    updateHeaderCollapseState();
    footer.classList.remove('collapsed');
    updateFooterCollapseState();
    endGameBtn.style.display = 'none';
}

// 主页跳转
if (goHomeBtn) {
    goHomeBtn.onclick = () => {
        window.location.href = '/';
    };
}

if (endGameBtn) {
    endGameBtn.onclick = endGameAndReturnToSelect;
}