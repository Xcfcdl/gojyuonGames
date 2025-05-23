import audioManager from '../common/audioManager.js';
import WritingCanvas from '../common/writingCanvas.js';
import SpeechManager from '../common/speechManager.js';

const speechManager = new SpeechManager();

class WhackAKanaGame {
    constructor() {
        // 游戏状态
        this.score = 0;
        this.timeLeft = 0;
        this.timer = null;
        this.isGameActive = false;
        this.currentDifficulty = null;
        this.activeHoles = [];
        this.currentKanas = [];
        this.comboCount = 0;
        this.isMobile = window.innerWidth <= 768; // 判断是否为移动设备

        // 元素引用
        this.scoreDisplay = document.getElementById('score');
        this.timerDisplay = document.getElementById('timer');
        this.whackArea = document.getElementById('whack-area');
        this.startButton = document.getElementById('start-game');
        this.soundButton = document.getElementById('sound-toggle');
        this.difficultyButtons = document.querySelectorAll('.difficulty-btn');
        this.writingArea = document.querySelector('.writing-area');
        this.footer = document.querySelector('.game-footer');
        this.footerExpandBtn = document.querySelector('.footer-expand-btn');

        // 绑定事件
        this.bindEvents();

        // 初始化游戏
        this.init();
    }

    init() {
        // 检测开发者工具
        this.checkDevTools();

        // 初始化游戏数据
        this.loadGameData();

        // 设置默认难度
        this.setDifficulty('easy');
    }

    bindEvents() {
        // 游戏说明按钮
        document.getElementById('instructions-btn').addEventListener('click', () => {
            this.showInstructions();
        });

        // 关闭弹窗按钮
        document.getElementById('close-modal').addEventListener('click', () => {
            this.hideInstructions();
        });

        // 开始游戏按钮
        this.startButton.addEventListener('click', () => {
            if (!this.isGameActive) {
                this.startGame();
            } else {
                this.endGame();
            }
        });

        // 难度选择按钮
        this.difficultyButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setDifficulty(btn.dataset.level);
            });
        });

        // 音效切换按钮
        this.soundButton.addEventListener('click', () => {
            audioManager.toggleSoundEffects();
            this.updateSoundButtonState();
            // 更新按钮文本
            const isMuted = audioManager.areSoundEffectsMuted();
            this.soundButton.textContent = isMuted ? '开启音效' : '关闭音效';
        });

        // footer 展开按钮
        if (this.footerExpandBtn) {
            this.footerExpandBtn.addEventListener('click', () => {
                this.footer.classList.remove('minimized');
                this.footerExpandBtn.style.display = 'none';
            });
        }
    }

    loadGameData() {
        // 加载假名数据
        fetch('../assets/audio/kana/kana_mapping.json')
            .then(res => res.json())
            .then(data => {
                this.kanaMapping = data;
                console.log('游戏假名数据加载成功');
            })
            .catch(err => console.error('加载假名数据失败:', err));
    }

    setDifficulty(level) {
        this.currentDifficulty = level;

        // 更新UI
        this.difficultyButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.level === level);
        });
    }

    startGame() {
        // 重置游戏状态
        this.score = 0;
        this.comboCount = 0;
        this.activeHoles = [];
        this.isGameActive = true;

        // 更新UI
        this.updateScoreDisplay();
        this.startButton.textContent = '结束游戏';

        // 在移动端最小化footer
        if (this.isMobile) {
            this.footer.classList.add('minimized');
            this.footerExpandBtn.style.display = '';
            document.querySelector('.game-main').style.marginBottom = '8px';
        }

        // 开始计时
        this.startTimer();

        // 开始生成地鼠
        this.spawnMole();
    }

    endGame() {
        // 停止游戏
        this.isGameActive = false;

        // 清除计时器
        clearInterval(this.timer);

        // 清除所有活动地鼠
        this.clearAllMoles();

        // 在移动设备上显示footer
        if (this.isMobile) {
            this.footer.classList.remove('minimized');
            this.footerExpandBtn.style.display = 'none';
            document.querySelector('.game-main').style.marginBottom = '';
        }

        // 更新UI
        this.startButton.textContent = '开始游戏';
        this.timerDisplay.textContent = '--';
    }

    startTimer() {
        // 根据难度设置时间
        const timeLimits = {
            easy: Infinity,
            medium: 60,
            hard: 30,
            expert: 15
        };

        this.timeLeft = timeLimits[this.currentDifficulty];

        // 更新计时器显示
        this.updateTimerDisplay();

        // 启动计时器
        this.timer = setInterval(() => {
            if (this.timeLeft > 0) {
                this.timeLeft--;
                this.updateTimerDisplay();
            } else {
                this.endGame();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        if (this.timeLeft === Infinity) {
            this.timerDisplay.textContent = '∞';
        } else {
            this.timerDisplay.textContent = this.timeLeft;
        }
    }

    updateScoreDisplay() {
        this.scoreDisplay.textContent = this.score;
    }

    updateSoundButtonState() {
        const isMuted = audioManager.areSoundEffectsMuted();
        this.soundButton.textContent = isMuted ? '开启音效' : '关闭音效';
    }

    spawnMole() {
        if (!this.isGameActive) return;

        // 随机选择一个坑位
        const holeId = this.getRandomHole();
        if (!holeId) return; // 所有坑位都已占用

        // 随机选择一个假名
        const kana = this.getRandomKana();

        // 创建地鼠元素
        const mole = document.createElement('div');
        mole.className = 'mole';

        // 创建假名元素
        const kanaSpan = document.createElement('span');
        kanaSpan.className = 'kana-on-mole';
        kanaSpan.textContent = kana;

        // 将假名添加到地鼠上
        mole.appendChild(kanaSpan);
        mole.dataset.kana = kana;

        // 添加到坑位
        document.getElementById(holeId).appendChild(mole);

        // 播放假名发音
        speechManager.speakKana(kana);

        // 记录活动地鼠
        this.activeHoles.push(holeId);

        // 设置地鼠消失计时器
        setTimeout(() => {
            this.removeMole(holeId);
        }, this.getMoleDuration());
    }

    removeMole(holeId, wasHit = false) {
        if (!this.isGameActive) return;

        const hole = document.getElementById(holeId);
        const mole = hole?.querySelector('.mole');

        if (hole && mole) {
            if (wasHit) {
                // 添加被打中的效果
                mole.classList.add('hit');

                // 播放打中音效
                audioManager.playCorrect();

                // 短暂延迟后移除老鼠
                setTimeout(() => {
                    hole.innerHTML = '';

                    // 从活动地鼠列表中移除
                    this.activeHoles = this.activeHoles.filter(id => id !== holeId);

                    // 使用新的间隔时间生成新地鼠
                    setTimeout(() => {
                        this.spawnMole();
                    }, this.getMoleInterval());
                }, 500); // 500ms后移除老鼠，给动画留出时间
            } else {
                // 正常消失
                hole.innerHTML = '';

                // 从活动地鼠列表中移除
                this.activeHoles = this.activeHoles.filter(id => id !== holeId);

                // 使用新的间隔时间生成新地鼠
                setTimeout(() => {
                    this.spawnMole();
                }, this.getMoleInterval());
            }
        }
    }

    clearAllMoles() {
        this.activeHoles.forEach(holeId => {
            document.getElementById(holeId).innerHTML = '';
        });
        this.activeHoles = [];
    }

    getRandomHole() {
        const allHoles = ['hole-1', 'hole-2', 'hole-3', 'hole-4', 'hole-5'];
        const availableHoles = allHoles.filter(hole => !this.activeHoles.includes(hole));

        if (availableHoles.length === 0) return null;

        return availableHoles[Math.floor(Math.random() * availableHoles.length)];
    }

    getRandomKana() {
        if (!this.kanaMapping || !this.kanaMapping.basic) {
            console.warn('假名数据尚未加载完成，使用默认假名');
            return 'あ';
        }

        // 根据难度选择不同的假名集合
        let kanaSet = [];

        switch(this.currentDifficulty) {
            case 'easy':
                // 简单模式：只使用基本假名中的元音和部分辅音
                kanaSet = ['あ', 'い', 'う', 'え', 'お', 'か', 'き', 'く', 'け', 'こ'];
                break;
            case 'medium':
                // 中等模式：使用所有基本假名
                kanaSet = Object.keys(this.kanaMapping.basic);
                break;
            case 'hard':
                // 困难模式：基本假名 + 浊音
                kanaSet = [
                    ...Object.keys(this.kanaMapping.basic),
                    ...Object.keys(this.kanaMapping.dakuon)
                ];
                break;
            case 'expert':
                // 专家模式：所有假名
                kanaSet = [
                    ...Object.keys(this.kanaMapping.basic),
                    ...Object.keys(this.kanaMapping.dakuon),
                    ...Object.keys(this.kanaMapping.youon)
                ];
                break;
            default:
                kanaSet = Object.keys(this.kanaMapping.basic);
        }

        // 随机选择一个假名
        return kanaSet[Math.floor(Math.random() * kanaSet.length)];
    }

    getMoleDuration() {
        const durations = {
            easy: 7000,      // 增加到7秒
            medium: 5000,    // 增加到5秒
            hard: 3500,      // 增加到3.5秒
            expert: 2000     // 增加到2秒
        };
        return durations[this.currentDifficulty];
    }

    // 获取老鼠生成的间隔时间
    getMoleInterval() {
        const intervals = {
            easy: 2000,      // 2秒间隔
            medium: 1500,    // 1.5秒间隔
            hard: 1000,      // 1秒间隔
            expert: 700      // 0.7秒间隔
        };
        return intervals[this.currentDifficulty];
    }

    checkAnswer(inputKana) {
        if (!this.kanaMapping || !this.activeHoles || this.activeHoles.length === 0) {
            console.warn('游戏数据尚未加载完成或没有活动地鼠，无法检查答案');
            return false;
        }

        // 获取所有活动地鼠的假名
        const activeKanas = this.activeHoles.map(holeId => {
            const hole = document.getElementById(holeId);
            if (!hole) return null;
            const mole = hole.querySelector('.mole');
            return mole ? mole.dataset.kana : null;
        }).filter(kana => kana !== null);

        if (activeKanas.length === 0) return false;
        // 检查输入的假名是否匹配任何活动地鼠
        const isCorrect = activeKanas.includes(inputKana);

        if (isCorrect) {
            // 找到匹配的地鼠并移除
            const matchedHoleId = this.activeHoles.find(holeId => {
                const hole = document.getElementById(holeId);
                const mole = hole.querySelector('.mole');
                return mole && mole.dataset.kana === inputKana;
            });

            if (matchedHoleId) {
                // 添加得分
                this.addScore(true);

                // 移除地鼠，传入 wasHit=true 表示被打中
                this.removeMole(matchedHoleId, true);
            }
        } else {
            // 答案错误
            this.addScore(false);
        }

        return isCorrect;
    }

    addScore(isCorrect) {
        if (isCorrect) {
            this.score += 5;
            this.comboCount++;

            // 连击奖励
            if (this.comboCount >= 3) {
                this.score += this.comboCount;
            }

            // 注意：正确音效已经在 removeMole 方法中播放
        } else {
            this.comboCount = 0;

            // 播放错误音效
            audioManager.playIncorrect();
        }

        this.updateScoreDisplay();
    }

    checkDevTools() {
        // 检测开发者工具是否打开
        const devtools = /./;
        devtools.toString = function() {
            console.warn('开发者工具已打开，某些功能可能受限');
            return '';
        };
        console.log('%c', devtools);
    }

    initInstructionsModal() {
        // 页面加载时显示游戏说明
        setTimeout(() => {
            this.showInstructions();
        }, 500);
    }

    showInstructions() {
        document.getElementById('instructions-modal').classList.add('active');
    }

    hideInstructions() {
        document.getElementById('instructions-modal').classList.remove('active');
    }
}

// 初始化游戏
window.onload = () => {
    window.game = new WhackAKanaGame();
    // 初始化手写识别
    window.writingCanvas = new WritingCanvas('writing-canvas');
    // 绑定清除按钮
    const clearBtn = document.getElementById('clear-canvas');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => window.writingCanvas.clear());
    }
    // 绑定识别按钮
    const recognizeBtn = document.getElementById('recognize-kana');
    if (recognizeBtn) {
        // 添加自动识别功能
        let autoRecognizeTimeout = null;

        // 监听画布上的绘画事件，自动触发识别
        const canvas = document.getElementById('writing-canvas');
        if (canvas) {
            // 触摸结束或鼠标抬起时自动识别
            canvas.addEventListener('mouseup', startAutoRecognize);
            canvas.addEventListener('touchend', startAutoRecognize);

            function startAutoRecognize() {
                // 清除之前的定时器
                if (autoRecognizeTimeout) {
                    clearTimeout(autoRecognizeTimeout);
                }

                // 设置短暂延迟后自动识别
                autoRecognizeTimeout = setTimeout(() => {
                    if (window.writingCanvas && window.writingCanvas.trace.length > 0) {
                        performRecognition();
                    }
                }, 300); // 300ms 延迟，可以根据需要调整
            }
        }

        // 点击识别按钮时也触发识别
        recognizeBtn.addEventListener('click', performRecognition);

        function performRecognition() {
            // 显示识别中状态
            const resultDisplay = document.getElementById('recognition-result');
            resultDisplay.textContent = '识别中...';
            resultDisplay.classList.remove('error', 'success');

            window.writingCanvas.recognizeKana();
            window.writingCanvas.setCallBack((results, err) => {
                if (err || !results || results.length === 0) {
                    resultDisplay.textContent = '无法识别，请重试';
                    resultDisplay.classList.add('error');
                    setTimeout(() => resultDisplay.classList.remove('error'), 1500);
                    return;
                }
                const kana = results[0];
                let romaji = '';
                if (window.writingCanvas.kanaMapping) {
                    if (window.writingCanvas.kanaMapping.basic[kana]) {
                        romaji = window.writingCanvas.kanaMapping.basic[kana];
                    } else if (window.writingCanvas.kanaMapping.dakuon[kana]) {
                        romaji = window.writingCanvas.kanaMapping.dakuon[kana];
                    } else if (window.writingCanvas.kanaMapping.youon[kana]) {
                        romaji = window.writingCanvas.kanaMapping.youon[kana];
                    }
                }
                resultDisplay.textContent = `识别结果: ${kana} (${romaji || '未知'})`;
                resultDisplay.classList.add('success');

                // 播放假名音频
                if (speechManager && typeof speechManager.speakKana === 'function' && romaji) {
                    speechManager.speakKana(romaji);
                }

                // 检查是否与当前游戏中的假名匹配
                if (window.game && typeof window.game.checkAnswer === 'function') {
                    window.game.checkAnswer(kana);
                    // 延迟清除画布，给用户一些视觉反馈时间
                    setTimeout(() => window.writingCanvas.clear(), 500);
                }
            });
        }
    }
};