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
            document.querySelector('.game-footer').classList.add('minimized');
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
        
        // 在移动设备上显示写字面板
        if (this.isMobile) {
          
            document.querySelector('.game-footer').classList.remove('minimized');
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
        mole.textContent = kana;
        mole.dataset.kana = kana;
        
        // 添加到坑位
        document.getElementById(holeId).appendChild(mole);
        
        // 播放假名发音
        audioManager.playKanaSound(kana);
        
        // 记录活动地鼠
        this.activeHoles.push(holeId);
        
        // 设置地鼠消失计时器
        setTimeout(() => {
            this.removeMole(holeId);
        }, this.getMoleDuration());
    }
    
    removeMole(holeId) {
        if (!this.isGameActive) return;
        
        const hole = document.getElementById(holeId);
        if (hole && hole.querySelector('.mole')) {
            hole.innerHTML = '';
            
            // 从活动地鼠列表中移除
            this.activeHoles = this.activeHoles.filter(id => id !== holeId);
            
            
            // 生成新地鼠
            setTimeout(() => {
                this.spawnMole();
            }, 1000);
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
            easy: 5000,
            medium: 3000,
            hard: 2000,
            expert: 1000
        };
        return durations[this.currentDifficulty];
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
                
                // 移除地鼠
                this.removeMole(matchedHoleId);
                
                // 生成新地鼠
                setTimeout(() => this.spawnMole(), 500);
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
            
            // 播放正确音效
            audioManager.playCorrectSound();
        } else {
            this.comboCount = 0;
            
            // 播放错误音效
            audioManager.playIncorrectSound();
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
};