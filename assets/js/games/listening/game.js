/**
 * 听音选字游戏核心逻辑
 */
class KanaListeningGame {
    constructor() {
        // 游戏状态
        this.currentLevel = null;
        this.currentLevelIndex = 0;
        this.currentKana = null;
        this.levelKanas = [];
        this.score = 0;
        this.totalQuestions = 0;
        this.isGameActive = false;
        this.isAnswering = false;
        
        // 元素引用
        this.levelDisplay = document.getElementById('current-level');
        this.scoreDisplay = document.getElementById('current-score');
        this.optionsArea = document.getElementById('options-area');
        this.feedbackArea = document.getElementById('feedback-area');
        this.playButton = document.getElementById('play-sound');
        this.repeatButton = document.getElementById('repeat-sound');
        this.startButton = document.getElementById('start-game');
        this.nextLevelButton = document.getElementById('next-level');
        
        // 绑定事件处理程序
        this.bindEvents();
        
        // 初始化游戏
        this.init();
    }
    
    /**
     * 初始化游戏
     */
    init() {
        // 设置初始界面
        this.updateLevelDisplay();
        this.updateScoreDisplay();
        this.disableGameControls();
        
        // 检查语音系统是否可用
        setTimeout(() => {
            if (!speechManager.isReady()) {
                this.showTTSWarning();
            } else {
                this.enableGameStart();
            }
        }, 1000);
    }
    
    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 播放按钮
        this.playButton.addEventListener('click', () => {
            if (!this.isAnswering && this.currentKana) {
                this.playCurrentKana();
            }
        });
        
        // 重听按钮
        this.repeatButton.addEventListener('click', () => {
            if (!this.isAnswering && this.currentKana) {
                this.playCurrentKana();
            }
        });
        
        // 开始游戏按钮
        this.startButton.addEventListener('click', () => {
            this.startGame();
        });
        
        // 下一关按钮
        this.nextLevelButton.addEventListener('click', () => {
            this.goToNextLevel();
        });
    }
    
    /**
     * 开始游戏
     */
    startGame() {
        // 重置游戏状态
        this.score = 0;
        this.totalQuestions = 0;
        this.isGameActive = true;
        
        // 加载第一关
        this.loadLevel(0);
        
        // 更新界面
        this.updateScoreDisplay();
        this.enableGameControls();
        this.startButton.disabled = true;
        
        // 开始第一题
        this.nextQuestion();
    }
    
    /**
     * 加载指定关卡
     * @param {number} levelIndex 关卡索引
     */
    loadLevel(levelIndex) {
        if (levelIndex >= 0 && levelIndex < levels.length) {
            this.currentLevelIndex = levelIndex;
            this.currentLevel = levels[levelIndex];
            
            // 获取该关卡所有假名
            this.levelKanas = getKanasByRows(this.currentLevel.rows);
            
            // 更新关卡显示
            this.updateLevelDisplay();
            
            console.log(`加载关卡：${this.currentLevel.name}，包含 ${this.levelKanas.length} 个假名`);
        }
    }
    
    /**
     * 出下一道题
     */
    nextQuestion() {
        if (!this.isGameActive) return;
        
        // 重置状态
        this.isAnswering = false;
        this.feedbackArea.innerHTML = '';
        
        // 随机选择一个假名
        this.currentKana = this.getRandomKanaForQuestion();
        console.log(`当前问题：${this.currentKana.char} (${this.currentKana.romaji})`);
        
        // 生成选项
        this.generateOptions();
        
        // 播放当前假名发音
        setTimeout(() => {
            this.playCurrentKana();
        }, 500);
    }
    
    /**
     * 获取当前问题的随机假名
     * @returns {Object} 假名对象
     */
    getRandomKanaForQuestion() {
        // 从当前关卡的假名列表中随机选择一个
        let randomKana = getRandomKana(this.levelKanas);
        
        // 避免连续出现相同的假名
        if (this.currentKana && randomKana.char === this.currentKana.char && this.levelKanas.length > 1) {
            return this.getRandomKanaForQuestion();
        }
        
        return randomKana;
    }
    
    /**
     * 播放当前假名的发音
     */
    playCurrentKana() {
        if (!this.currentKana) return;
        
        // 播放音频前禁用按钮，防止重复点击
        this.playButton.disabled = true;
        this.repeatButton.disabled = true;
        
        // 使用语音合成播放
        speechManager.speak(this.currentKana.char)
            .then(() => {
                // 播放完成后启用按钮
                this.playButton.disabled = false;
                this.repeatButton.disabled = false;
            })
            .catch(error => {
                console.error('播放发音失败:', error);
                this.playButton.disabled = false;
                this.repeatButton.disabled = false;
                this.showMessage('播放失败，请重试', 'error');
            });
    }
    
    /**
     * 生成选项按钮
     */
    generateOptions() {
        // 清空选项区域
        this.optionsArea.innerHTML = '';
        
        // 保存当前正确选项
        const correctChar = this.currentKana.char;
        
        // 准备选项列表
        let options = [];
        
        // 单行练习：显示该行的所有假名
        if (this.currentLevel.rows.length === 1) {
            options = kanaData[this.currentLevel.rows[0]].map(kana => kana.char);
        } 
        // 多行混合练习：正确答案 + 随机干扰项
        else {
            // 首先添加正确答案
            options.push(correctChar);
            
            // 随机选择不同的干扰项，总共显示5个选项
            const maxOptions = Math.min(6, this.levelKanas.length);
            
            while (options.length < maxOptions) {
                const randomKana = getRandomKana(this.levelKanas);
                if (!options.includes(randomKana.char) && randomKana.char !== correctChar) {
                    options.push(randomKana.char);
                }
            }
        }
        
        // 打乱选项顺序
        options = shuffleArray(options);
        
        // 创建选项按钮
        options.forEach(char => {
            const option = document.createElement('div');
            option.className = 'kana-option';
            option.textContent = char;
            
            // 添加点击事件
            option.addEventListener('click', () => {
                if (!this.isAnswering) {
                    this.checkAnswer(char);
                }
            });
            
            this.optionsArea.appendChild(option);
        });
    }
    
    /**
     * 检查用户选择的答案
     * @param {string} selectedChar 用户选择的假名
     */
    checkAnswer(selectedChar) {
        if (this.isAnswering) return;
        
        this.isAnswering = true;
        this.totalQuestions++;
        
        // 获取所有选项元素
        const options = document.querySelectorAll('.kana-option');
        const correctChar = this.currentKana.char;
        let correctOption = null;
        let selectedOption = null;
        
        // 找到正确选项和用户选择的选项
        options.forEach(option => {
            if (option.textContent === correctChar) {
                correctOption = option;
            }
            if (option.textContent === selectedChar) {
                selectedOption = option;
            }
        });
        
        // 判断是否答对
        const isCorrect = selectedChar === correctChar;
        
        // 更新分数
        if (isCorrect) {
            this.score++;
        }
        
        // 更新分数显示
        this.updateScoreDisplay();
        
        // 提供视觉反馈
        if (isCorrect) {
            selectedOption.classList.add('correct');
            this.feedbackArea.innerHTML = '<div class="feedback-correct">正确！</div>';
        } else {
            selectedOption.classList.add('incorrect');
            correctOption.classList.add('highlight');
            this.feedbackArea.innerHTML = '<div class="feedback-incorrect">错误！正确答案是：' + correctChar + '</div>';
        }
        
        // 延迟后进入下一题或结束关卡
        setTimeout(() => {
            // 检查是否达到关卡要求分数
            if (this.score >= this.currentLevel.requiredScore) {
                this.completeLevel();
            } else {
                this.nextQuestion();
            }
        }, 1500);
    }
    
    /**
     * 完成当前关卡
     */
    completeLevel() {
        this.isGameActive = false;
        
        // 显示完成消息
        this.feedbackArea.innerHTML = `
            <div class="level-complete">
                <h3>恭喜！关卡完成</h3>
                <p>得分: ${this.score}/${this.totalQuestions}</p>
                <p>正确率: ${Math.round((this.score / this.totalQuestions) * 100)}%</p>
            </div>
        `;
        
        // 清空选项区域
        this.optionsArea.innerHTML = '';
        
        // 启用下一关按钮（如果有下一关）
        if (this.currentLevelIndex < levels.length - 1) {
            this.nextLevelButton.disabled = false;
        } else {
            this.feedbackArea.innerHTML += '<p>你已完成所有关卡！</p>';
            this.startButton.disabled = false;
        }
    }
    
    /**
     * 进入下一关
     */
    goToNextLevel() {
        if (this.currentLevelIndex < levels.length - 1) {
            this.loadLevel(this.currentLevelIndex + 1);
            this.score = 0;
            this.totalQuestions = 0;
            this.isGameActive = true;
            this.updateScoreDisplay();
            this.nextLevelButton.disabled = true;
            this.nextQuestion();
        }
    }
    
    /**
     * 更新关卡显示
     */
    updateLevelDisplay() {
        if (this.currentLevel) {
            this.levelDisplay.textContent = this.currentLevel.name;
        } else {
            this.levelDisplay.textContent = "未开始";
        }
    }
    
    /**
     * 更新分数显示
     */
    updateScoreDisplay() {
        this.scoreDisplay.textContent = `得分: ${this.score}/${this.totalQuestions} (目标: ${this.currentLevel ? this.currentLevel.requiredScore : 0})`;
    }
    
    /**
     * 启用游戏控制按钮
     */
    enableGameControls() {
        this.playButton.disabled = false;
        this.repeatButton.disabled = false;
    }
    
    /**
     * 禁用游戏控制按钮
     */
    disableGameControls() {
        this.playButton.disabled = true;
        this.repeatButton.disabled = true;
        this.nextLevelButton.disabled = true;
    }
    
    /**
     * 启用开始游戏按钮
     */
    enableGameStart() {
        this.startButton.disabled = false;
    }
    
    /**
     * 显示TTS警告信息
     */
    showTTSWarning() {
        this.feedbackArea.innerHTML = `
            <div class="warning-message">
                <p>⚠️ 您的浏览器可能不支持语音功能或无法找到日语语音包</p>
                <p>建议使用Chrome浏览器以获得最佳体验</p>
            </div>
        `;
        this.enableGameStart();
    }
    
    /**
     * 显示一般消息
     * @param {string} message 消息内容 
     * @param {string} type 消息类型 (info, error, success)
     */
    showMessage(message, type = 'info') {
        this.feedbackArea.innerHTML = `<div class="message ${type}">${message}</div>`;
    }
}

// 等待DOM加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    // 创建游戏实例
    const game = new KanaListeningGame();
}); 