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
        
        // 数据
        this.kanaData = null;
        this.levels = null;
        
        // 元素引用
        this.levelDisplay = document.getElementById('current-level');
        this.scoreDisplay = document.getElementById('current-score');
        this.optionsArea = document.getElementById('options-area');
        this.feedbackArea = document.getElementById('feedback-area');
        this.startButton = document.getElementById('start-game');
        this.repeatButton = document.getElementById('repeat-sound');
        this.nextLevelButton = document.getElementById('next-level');
        this.restartButton = document.getElementById('restart-game');
        this.bgmButton = document.getElementById('bgm-toggle');
        this.levelSelector = document.getElementById('level-selector');
        this.levelList = document.getElementById('level-list');
        
        // 绑定事件处理程序
        this.bindEvents();
        
        // 初始化游戏
        this.init();
    }
    
    /**
     * 初始化游戏
     */
    async init() {
        try {
            // 加载数据
            const { kanaData, levels } = await dataLoader.init();
            console.log('初始化游戏数据:', {
                kanaGroups: Object.keys(kanaData),
                totalLevels: levels.length
            });
            
            this.kanaData = kanaData;
            this.levels = levels;
            
            // 验证数据完整性
            if (!this.validateGameData()) {
                throw new Error('游戏数据验证失败');
            }
            
            // 设置初始关卡
            this.currentLevelIndex = 0;
            this.loadLevel(this.currentLevelIndex);
            
            // 设置初始界面
            this.updateLevelDisplay();
            this.updateScoreDisplay();
            this.disableGameControls();
            
            // 生成关卡列表
            this.generateLevelList();
            
            // 绑定分类标签事件
            this.bindCategoryEvents();
            
            // 检查语音系统是否可用
            setTimeout(() => {
                if (!speechManager.isReady()) {
                    this.showTTSWarning();
                } else {
                    this.enableGameStart();
                }
            }, 1000);

            // 初始化背景音乐按钮状态
            this.updateBgmButtonState();
            
            // 更新加载状态
            this.optionsArea.innerHTML = '<div class="placeholder-text"><p>点击"开始游戏"按钮开始</p></div>';
            
            // 启用重新开始和下一关按钮
            this.restartButton.disabled = false;
            this.updateNextLevelButton();
            
        } catch (error) {
            console.error('游戏初始化失败:', error);
            this.showMessage('游戏数据加载失败，请刷新页面重试', 'error');
        }
    }
    
    /**
     * 验证游戏数据完整性
     * @returns {boolean} 数据是否有效
     */
    validateGameData() {
        // 检查假名数据
        if (!this.kanaData || Object.keys(this.kanaData).length === 0) {
            console.error('假名数据无效');
            return false;
        }

        // 检查关卡数据
        if (!this.levels || this.levels.length === 0) {
            console.error('关卡数据无效');
            return false;
        }

        // 检查每个关卡的行是否存在
        for (const level of this.levels) {
            for (const rowId of level.rows) {
                if (!this.kanaData[rowId]) {
                    console.error(`关卡 ${level.name} 中的行 ${rowId} 不存在`);
                    return false;
                }
            }
        }

        return true;
    }
    
    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 开始游戏按钮
        this.startButton.addEventListener('click', () => {
            if (!this.isGameActive) {
                this.startGame();
            } else {
                this.playCurrentKana();
            }
        });
        
        // 重听按钮
        this.repeatButton.addEventListener('click', () => {
            if (!this.isAnswering && this.currentKana) {
                this.playCurrentKana();
            }
        });
        
        // 重新开始按钮
        this.restartButton.addEventListener('click', () => {
            this.restartGame();
        });
        
        // 下一关按钮
        this.nextLevelButton.addEventListener('click', () => {
            this.goToNextLevel();
        });

        // 背景音乐按钮
        this.bgmButton.addEventListener('click', () => {
            const isPlaying = audioManager.toggleBgm();
            this.updateBgmButtonState(isPlaying);
        });

        // 关卡选择按钮
        this.levelDisplay.addEventListener('click', () => {
            this.showLevelSelector();
        });

        // 关闭关卡选择器
        document.querySelector('.level-selector-close').addEventListener('click', () => {
            this.hideLevelSelector();
        });

        // 点击外部关闭关卡选择器
        this.levelSelector.addEventListener('click', (e) => {
            if (e.target === this.levelSelector) {
                this.hideLevelSelector();
            }
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
        
        // 如果没有加载关卡，则加载当前选择的关卡
        if (!this.currentLevel) {
            this.loadLevel(this.currentLevelIndex);
        }
        
        // 更新界面
        this.updateScoreDisplay();
        this.enableGameControls();
        this.startButton.innerHTML = '<i class="fas fa-volume-up"></i> 播放';
        
        // 开始第一题
        this.nextQuestion();
    }
    
    /**
     * 重新开始游戏
     */
    restartGame() {
        // 重置游戏状态
        this.score = 0;
        this.totalQuestions = 0;
        this.isGameActive = true;
        
        // 更新界面
        this.updateScoreDisplay();
        this.enableGameControls();
        this.startButton.innerHTML = '<i class="fas fa-volume-up"></i> 播放';
        this.feedbackArea.innerHTML = '';
        
        // 开始新的一题
        this.nextQuestion();
    }
    
    /**
     * 加载指定关卡
     * @param {number} levelIndex 关卡索引
     */
    loadLevel(levelIndex) {
        if (levelIndex >= 0 && levelIndex < this.levels.length) {
            this.currentLevelIndex = levelIndex;
            this.currentLevel = this.levels[levelIndex];
            
            // 获取该关卡所有假名
            this.levelKanas = [];
            
            // 基本假名
            const basicRows = ['a', 'ka', 'sa', 'ta', 'na', 'ha', 'ma', 'ya', 'ra', 'wa'];
            // 浊音和半浊音
            const dakuonRows = ['ga', 'za', 'da', 'ba', 'pa'];
            // 拗音
            const youonRows = ['kya', 'sha', 'cha', 'nya', 'hya', 'mya', 'rya', 'gya', 'ja', 'bya', 'pya'];
            
            console.log('开始加载关卡:', this.currentLevel.name);
            console.log('关卡行:', this.currentLevel.rows);
            
            // 根据关卡类型添加相应的假名
            this.currentLevel.rows.forEach(rowId => {
                // 移除可能的空格
                rowId = rowId.trim();
                console.log('处理假名行:', rowId);
                
                if (this.kanaData[rowId]) {
                    // 添加指定行的假名
                    const rowKanas = this.kanaData[rowId];
                    console.log(`${rowId}行包含 ${rowKanas.length} 个假名`);
                    this.levelKanas = this.levelKanas.concat(rowKanas);
                    
                    // 如果是基本假名行，也添加对应的浊音和拗音
                    if (basicRows.includes(rowId)) {
                        // 获取对应的浊音行
                        const dakuonRow = this.getDakuonRow(rowId);
                        if (dakuonRow && this.kanaData[dakuonRow]) {
                            const dakuonKanas = this.kanaData[dakuonRow];
                            console.log(`添加浊音行 ${dakuonRow}，包含 ${dakuonKanas.length} 个假名`);
                            this.levelKanas = this.levelKanas.concat(dakuonKanas);
                        }
                        
                        // 获取对应的拗音行
                        const youonRow = this.getYouonRow(rowId);
                        if (youonRow && this.kanaData[youonRow]) {
                            const youonKanas = this.kanaData[youonRow];
                            console.log(`添加拗音行 ${youonRow}，包含 ${youonKanas.length} 个假名`);
                            this.levelKanas = this.levelKanas.concat(youonKanas);
                        }
                    }
                } else {
                    console.warn(`未找到假名行: ${rowId}`);
                }
            });
            
            // 更新关卡显示
            this.updateLevelDisplay();
            
            console.log(`加载关卡：${this.currentLevel.name}，包含 ${this.levelKanas.length} 个假名`);
            
            // 如果没有加载到假名，输出警告
            if (this.levelKanas.length === 0) {
                console.warn('警告：当前关卡没有加载到任何假名！');
                console.warn('可用的假名组：', Object.keys(this.kanaData));
            }
        }
    }
    
    /**
     * 获取对应的浊音行ID
     * @param {string} basicRow 基本假名行ID
     * @returns {string|null} 浊音行ID
     */
    getDakuonRow(basicRow) {
        const dakuonMap = {
            'ka': 'ga',
            'sa': 'za',
            'ta': 'da',
            'ha': 'ba'
        };
        return dakuonMap[basicRow] || null;
    }
    
    /**
     * 获取对应的拗音行ID
     * @param {string} basicRow 基本假名行ID
     * @returns {string|null} 拗音行ID
     */
    getYouonRow(basicRow) {
        const youonMap = {
            'ka': 'kya',
            'sa': 'sha',
            'ta': 'cha',
            'na': 'nya',
            'ha': 'hya',
            'ma': 'mya',
            'ra': 'rya'
        };
        return youonMap[basicRow] || null;
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
        
        // 获取要显示的假名字符
        const displayChar = this.currentLevel.useKatakana ? 
            (this.currentKana.katakana || this.currentKana.char) : 
            this.currentKana.char;
        
        console.log(`当前问题：${displayChar} (${this.currentKana.romaji})`);
        
        // 生成选项
        this.generateOptions();
        
        // 播放当前假名发音
        setTimeout(() => {
            this.playCurrentKana();
        }, 500);
    }
    
    /**
     * 从给定的假名数组中随机选择一个
     * @param {Array} kanas 假名数组
     * @returns {Object} 随机选择的假名对象
     */
    getRandomKana(kanas) {
        const randomIndex = Math.floor(Math.random() * kanas.length);
        return kanas[randomIndex];
    }
    
    /**
     * 获取当前问题的随机假名
     * @returns {Object} 假名对象
     */
    getRandomKanaForQuestion() {
        // 从当前关卡的假名列表中随机选择一个
        let randomKana = this.getRandomKana(this.levelKanas);
        
        // 获取当前和随机假名的比较字符
        const getCurrentChar = (kana) => {
            if (this.currentLevel.useKatakana) {
                return kana.katakana || kana.char;
            }
            if (this.currentLevel.useMixed) {
                return Math.random() < 0.5 && kana.katakana ? kana.katakana : kana.char;
            }
            return kana.char;
        };

        // 避免连续出现相同的假名
        if (this.currentKana && 
            getCurrentChar(randomKana) === getCurrentChar(this.currentKana) && 
            this.levelKanas.length > 1) {
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
        this.startButton.disabled = true;
        this.repeatButton.disabled = true;
        
        // 获取要播放的假名字符
        const kanaToSpeak = this.getKanaChar(this.currentKana);
        
        // 使用语音合成播放
        speechManager.speak(kanaToSpeak)
            .then(() => {
                // 播放完成后启用按钮
                this.startButton.disabled = false;
                this.repeatButton.disabled = false;
            })
            .catch(error => {
                console.error('播放发音失败:', error);
                this.startButton.disabled = false;
                this.repeatButton.disabled = false;
                this.showMessage('播放失败，请重试', 'error');
            });
    }
    
    /**
     * 工具函数：打乱数组顺序
     * @param {Array} array 要打乱的数组
     * @returns {Array} 打乱后的数组
     */
    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }
    
    /**
     * 生成选项按钮
     */
    generateOptions() {
        // 清空选项区域
        this.optionsArea.innerHTML = '';
        
        // 准备选项列表
        let options = [];
        
        // 单行练习：显示该行的所有假名
        if (this.currentLevel.rows.length === 1) {
            if (this.currentLevel.type === 'mixed') {
                // 混合模式：同时显示平假名和片假名选项
                this.kanaData[this.currentLevel.rows[0]].forEach(kana => {
                    if (kana.char) options.push(kana.char);
                    if (kana.katakana) options.push(kana.katakana);
                });
            } else if (this.currentLevel.type === 'katakana') {
                // 片假名模式：只显示片假名
                options = this.kanaData[this.currentLevel.rows[0]]
                    .filter(kana => kana.katakana)
                    .map(kana => kana.katakana);
            } else {
                // 平假名模式：只显示平假名
                options = this.kanaData[this.currentLevel.rows[0]]
                    .filter(kana => kana.char)
                    .map(kana => kana.char);
            }
        } 
        // 多行混合练习：正确答案 + 随机干扰项
        else {
            // 首先添加正确答案
            const correctChar = this.getKanaChar(this.currentKana);
            options.push(correctChar);
            
            // 随机选择不同的干扰项，总共显示6个选项
            const maxOptions = Math.min(6, this.levelKanas.length);
            
            while (options.length < maxOptions) {
                const randomKana = this.getRandomKana(this.levelKanas);
                const kanaChar = this.getKanaChar(randomKana);
                
                if (kanaChar && !options.includes(kanaChar)) {
                    options.push(kanaChar);
                }
            }
        }
        
        // 打乱选项顺序
        options = this.shuffleArray(options);
        
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
        const correctChar = this.getKanaChar(this.currentKana);
        
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
        
        // 判断是否答对（使用romaji比对）
        const isCorrect = this.currentKana.romaji === this.currentKana.romaji;
        
        // 更新分数
        if (isCorrect) {
            this.score++;
            audioManager.playCorrect(); // 播放正确音效
        } else {
            audioManager.playIncorrect(); // 播放错误音效
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
        
        // 播放成功音效
        audioManager.playSuccess();
        
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
        
        // 更新按钮状态
        this.startButton.innerHTML = '<i class="fas fa-play"></i> 开始游戏';
        
        celebrateLevelComplete();
    }
    
    /**
     * 进入下一关
     */
    goToNextLevel() {
        if (this.currentLevelIndex < this.levels.length - 1) {
            this.loadLevel(this.currentLevelIndex + 1);
            this.score = 0;
            this.totalQuestions = 0;
            this.isGameActive = true;
            this.updateScoreDisplay();
            this.updateNextLevelButton();
            this.nextQuestion();
        }
    }
    
    /**
     * 更新关卡显示
     */
    updateLevelDisplay() {
        if (this.currentLevel) {
            this.levelDisplay.querySelector('span').textContent = this.currentLevel.name;
        } else {
            this.levelDisplay.querySelector('span').textContent = "未开始";
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
        this.repeatButton.disabled = false;
        this.startButton.disabled = false;
    }
    
    /**
     * 禁用游戏控制按钮
     */
    disableGameControls() {
        this.repeatButton.disabled = true;
        this.startButton.disabled = false;
        this.startButton.innerHTML = '<i class="fas fa-play"></i> 开始游戏';
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

    /**
     * 更新背景音乐按钮状态
     * @param {boolean} isPlaying 是否正在播放
     */
    updateBgmButtonState(isPlaying = false) {
        if (isPlaying) {
            this.bgmButton.classList.add('playing');
            this.bgmButton.title = '点击暂停背景音乐';
        } else {
            this.bgmButton.classList.remove('playing');
            this.bgmButton.title = '点击播放背景音乐';
        }
    }

    /**
     * 生成关卡列表
     * @param {string} category 关卡分类
     */
    generateLevelList(category = 'all') {
        const filteredLevels = category === 'all' 
            ? this.levels 
            : this.levels.filter(level => level.category === category);

        this.levelList.innerHTML = filteredLevels.map((level, index) => `
            <div class="level-item ${level.id === this.currentLevel?.id ? 'current' : ''}" 
                 data-level="${level.id - 1}">
                <div class="level-type ${level.type}">
                    ${this.getLevelTypeText(level.type)}
                </div>
                <h4>${level.name}</h4>
                <p>${level.description}</p>
                <div class="level-progress">
                    <i class="fas fa-star"></i>
                    目标分数：${level.requiredScore}分
                </div>
            </div>
        `).join('');

        // 添加关卡点击事件
        this.levelList.querySelectorAll('.level-item').forEach(item => {
            item.addEventListener('click', () => {
                const levelIndex = parseInt(item.dataset.level);
                this.switchLevel(levelIndex);
                this.hideLevelSelector();
            });
        });
    }

    /**
     * 获取关卡类型显示文本
     * @param {string} type 关卡类型
     * @returns {string} 显示文本
     */
    getLevelTypeText(type) {
        const types = {
            'hiragana': '平假名',
            'katakana': '片假名',
            'mixed': '混合'
        };
        return types[type] || '';
    }

    /**
     * 显示关卡选择器
     */
    showLevelSelector() {
        this.levelSelector.classList.add('active');
        this.generateLevelList(); // 更新关卡列表状态
    }

    /**
     * 隐藏关卡选择器
     */
    hideLevelSelector() {
        this.levelSelector.classList.remove('active');
    }

    /**
     * 切换到指定关卡
     * @param {number} levelIndex 关卡索引
     */
    switchLevel(levelIndex) {
        if (this.isGameActive) {
            if (!confirm('切换关卡将丢失当前进度，确定要切换吗？')) {
                return;
            }
        }

        // 更新当前关卡索引和数据
        this.currentLevelIndex = levelIndex;
        this.loadLevel(levelIndex);

        // 重置游戏状态
        this.score = 0;
        this.totalQuestions = 0;
        this.isGameActive = false;
        this.currentKana = null;

        // 更新界面
        this.updateScoreDisplay();
        this.startButton.disabled = false;
        this.updateNextLevelButton();
        this.optionsArea.innerHTML = '<div class="placeholder-text"><p>点击"开始游戏"按钮开始</p></div>';
        this.feedbackArea.innerHTML = '';
        
        // 禁用游戏控制
        this.disableGameControls();
    }

    /**
     * 绑定分类标签事件
     */
    bindCategoryEvents() {
        const categoryTabs = document.querySelectorAll('.category-tab');
        categoryTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // 更新标签状态
                categoryTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // 更新关卡列表
                const category = tab.dataset.category;
                this.generateLevelList(category);
            });
        });
    }

    /**
     * 获取假名字符
     * @param {Object} kana 假名对象
     * @returns {string} 假名字符
     */
    getKanaChar(kana) {
        switch (this.currentLevel.type) {
            case 'katakana':
                return kana.katakana || kana.char; // 如果没有片假名，则返回平假名
            case 'mixed':
                // 混合模式：50%概率显示片假名（如果有的话）
                return (kana.katakana && Math.random() < 0.5) ? kana.katakana : kana.char;
            case 'hiragana':
            default:
                return kana.char;
        }
    }

    /**
     * 更新下一关按钮状态
     */
    updateNextLevelButton() {
        // 只有在不是最后一关时才启用下一关按钮
        this.nextLevelButton.disabled = this.currentLevelIndex >= this.levels.length - 1;
    }
}

/**
 * 关卡完成庆祝效果
 */
function celebrateLevelComplete() {
    // 等待 DOM 更新完成后再计算位置
    setTimeout(() => {
        const levelCompleteEl = document.querySelector('.level-complete');
        if (!levelCompleteEl) return;

        // 获取元素的位置和尺寸
        const rect = levelCompleteEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // 配置彩纸效果
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
            angle: 270, // 向上发射
            startVelocity: 30,
            ticks: 300
        };
        
        const confetti = new ConfettiGenerator(confettiSettings);
        confetti.render();
        
        // 3秒后停止彩纸效果
        setTimeout(() => {
            confetti.clear();
        }, 3000);
    }, 100); // 给予一点时间让 DOM 更新完成
}

// 等待DOM加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    // 创建游戏实例
    const game = new KanaListeningGame();
}); 