/**
 * 听音选字游戏核心逻辑
 */
import audioManager from '../common/audioManager.js';
import SpeechManager from '../common/speechManager.js';
import DataLoader from '../common/dataLoader.js';

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
        this.scoreValueDisplay = document.getElementById('score-value');
        this.totalQuestionsDisplay = document.getElementById('total-questions');
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
     * 初始化游戏 (异步加载数据部分)
     */
    async init() {
        try {
            // 加载数据
            const { kanaData, levels } = await window.dataLoader.init();
            console.log('初始化游戏数据:', {
                kanaGroups: Object.keys(kanaData),
                totalLevels: levels.length
            });

            this.kanaData = kanaData;
            this.levels = levels;

            // 验证数据完整性
            if (!this.validateGameData()) {
                // 如果数据验证失败，尝试显示多语言错误信息
                 const errorMessage = window.langData?.[window.currentLang]?.game_data_validation_error || '游戏数据验证失败';
                 this.showMessage(errorMessage, 'error');
                throw new Error('游戏数据验证失败');
            }

            // 数据加载完成后，等待语言数据加载并在 langDataLoaded 事件中更新UI
            // 设置初始关卡 (数据已加载，可以在此设置)
            this.currentLevelIndex = 0;
            this.loadLevel(this.currentLevelIndex);

            // 初始化背景音乐按钮状态
            this.updateBgmButtonState();

            // 启用重新开始按钮（不受游戏活跃状态影响）
            this.restartButton.disabled = false;

        } catch (error) {
            console.error('游戏初始化失败:', error);
            // 在这里调用 showMessage 可能会在语言数据未加载时出错
            // 更好的做法是，如果在数据加载阶段就失败，显示一个硬编码的错误消息或等待语言加载
             const errorMessage = window.langData?.[window.currentLang]?.game_data_load_error || '游戏数据加载失败，请刷新页面重试';
             this.showMessage(errorMessage, 'error');
        }
    }

    /**
     * 在语言数据加载或切换后更新游戏UI
     */
    updateGameUIForLang() {
        console.log('Function: updateGameUIForLang called', { currentLang: window.currentLang });
        // 设置初始界面 (语言数据加载后执行)
        this.updateLevelDisplay();
        // this.updateScoreDisplay(); // 分数显示不依赖语言，不需要在这里更新
        this.disableGameControls(); // 禁用控制按钮，显示开始提示

        // 生成关卡列表 (依赖语言数据)
        this.generateLevelList();

        // 更新加载状态/placeholder文本 (依赖语言数据)
        this.optionsArea.innerHTML = `<div class="placeholder-text"><p>${window.langData[window.currentLang]?.listening_placeholder || 'はじめをクリックして開始'}</p></div>`;

        // 更新下一关按钮状态 (不依赖语言，但在初始化时需要)
        this.updateNextLevelButton();

        // 更新开始按钮文本 (非游戏活跃状态下的文本)
        this.startButton.innerHTML = `<i class="fas fa-play"></i> ${window.langData[window.currentLang]?.start_game || 'はじめ'}`;
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
        // 游戏开始后的按钮文本可能也需要多语言
        this.startButton.innerHTML = `<i class="fas fa-volume-up"></i> ${window.langData[window.currentLang]?.listening_start_btn || 'はじめ'}`;

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
        this.isGameActive = false; // 重新开始后游戏应该暂停，等待点击开始
        this.currentKana = null; // 重置当前题目

        // 更新界面
        this.updateScoreDisplay();
        // 禁用游戏控制，但保持开始按钮可用
        this.disableGameControls();
        // 重新开始按钮文本应该显示"开始"的多语言文本
        this.startButton.innerHTML = `<i class="fas fa-play"></i> ${window.langData[window.currentLang]?.start_game || 'はじめ'}`;
        this.feedbackArea.innerHTML = ''; // 清空反馈区
        this.optionsArea.innerHTML = `<div class="placeholder-text"><p>${window.langData[window.currentLang]?.listening_placeholder || 'はじめをクリックして開始'}</p></div>`; // 显示placeholder

        // 不立即开始新的一题，等待用户点击开始按钮
        // this.nextQuestion();
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

            console.log('开始加载关卡:', this.currentLevel[`name_${window.currentLang}`] || this.currentLevel.name);
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
                console.warn('警告：現在のレベルには何もデータがありません！');
                console.warn('利用可能なデータ：', Object.keys(this.kanaData));
            }
        } else {
            console.error('无效的关卡索引:', levelIndex);
            // 显示错误信息，需要多语言化
            this.showMessage((window.langData && window.langData.invalid_level_index_error) || '无效的关卡索引', 'error');
        }
    }

    /**
     * 获取对应的浊音行ID
     * @param {string} basicRow 基本假名行ID
     * @returns {string|null} 浊音行ID
     */
    getDakuonRow(basicRow) {
        const mapping = {
            'ka': 'ga',
            'sa': 'za',
            'ta': 'da',
            'ha': 'ba'
        };
        return mapping[basicRow] || null;
    }

    /**
     * 获取对应的拗音行ID
     * @param {string} basicRow 基本假名行ID
     * @returns {string|null} 拗音行ID
     */
    getYouonRow(basicRow) {
        const mapping = {
            'ki': 'kya',
            'shi': 'sha',
            'chi': 'cha'
        };
        return mapping[basicRow] || null;
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

        console.log(`現在の問題：${displayChar} (${this.currentKana.romaji})`);

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
        window.speechManager.speak(kanaToSpeak)
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

        // 首先添加正确答案
        const correctChar = this.getKanaChar(this.currentKana);
        options.push(correctChar);

        // 从当前关卡的所有假名中随机选择干扰项
        // 确保干扰项与正确答案不同，并且不重复
        const maxOptions = Math.min(6, this.levelKanas.length); // 最多显示6个选项，但不超过当前关卡总假名数

        while (options.length < maxOptions) {
            const randomKana = this.getRandomKana(this.levelKanas);
            const kanaChar = this.getKanaChar(randomKana);

            // 确保干扰项存在且与正确答案不同，并且不重复
            if (kanaChar && kanaChar !== correctChar && !options.includes(kanaChar)) {
                options.push(kanaChar);
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
        const correctRomaji = this.currentKana.romaji;

        let correctOption = null;
        let selectedOption = null;

        // 找到正确选项和用户选择的选项
        options.forEach(option => {
            if (option.textContent.trim() === correctChar.trim()) {
                correctOption = option;
            }
            if (option.textContent.trim() === selectedChar.trim()) {
                selectedOption = option;
            }
        });

        // 获取用户选择的假名对象
        let selectedKana = null;
        for (const row of Object.values(this.kanaData)) {
            for (const kana of row) {
                if (kana.char === selectedChar || kana.katakana === selectedChar) {
                    selectedKana = kana;
                    break;
                }
            }
            if (selectedKana) break;
        }
        const selectedRomaji = selectedKana ? selectedKana.romaji : null;

        // 判断是否答对（用罗马音比较）
        const isCorrect = selectedRomaji && (selectedRomaji === correctRomaji);

        // 更新分数
        if (isCorrect) {
            this.score++;
            audioManager.playCorrect(); // 播放正确音效
            this.showMessage(window.langData[window.currentLang]?.listening_feedback_correct || '正确！', 'success');
        } else {
            audioManager.playIncorrect(); // 播放错误音效
            const feedbackText = (window.langData[window.currentLang]?.listening_feedback_incorrect || '错误，正确答案是') + ` ${correctChar}`;
            this.showMessage(feedbackText, 'error');
        }

        // 更新分数显示
        this.updateScoreDisplay();

        // 提供视觉反馈
        if (isCorrect) {
            if (selectedOption) selectedOption.classList.add('correct');
            this.feedbackArea.innerHTML = '<div class="feedback-correct">正解！</div>';
        } else {
            if (selectedOption) selectedOption.classList.add('incorrect');
            if (correctOption) correctOption.classList.add('highlight');
            this.feedbackArea.innerHTML = '<div class="feedback-incorrect">ミス！正解は：' + correctChar + '</div>';
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
                <h3>完成しました！</h3>
                <p>正解数/回答数: ${this.score}/${this.totalQuestions}</p>
                <p>正解率: ${Math.round((this.score / this.totalQuestions) * 100)}%</p>
            </div>
        `;

        // 清空选项区域
        this.optionsArea.innerHTML = '';

        // 更新按钮状态
        this.startButton.innerHTML = '<i class="fas fa-play"></i> はじめ';

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
        } else {
            // 所有关卡完成，需要多语言化
            this.showMessage((window.langData && window.langData.all_levels_complete_message) || '恭喜你，完成了所有关卡！', 'info');
            this.disableGameControls();
            // 隐藏下一关按钮
        }
    }

    /**
     * 更新关卡显示
     */
    updateLevelDisplay() {
        // 显示当前关卡名称 (使用多语言)
        if (this.currentLevel) {
            // 使用多语言关卡名称，增加健壮的 fallback 逻辑
            const levelName = this.currentLevel.name?.[window.currentLang] || this.currentLevel.name?.zh || this.currentLevel.name?.en || this.currentLevel.name?.ja || '未知关卡名称';
            this.levelDisplay.textContent = levelName;
        } else {
            // 使用多语言加载中文本或默认值
            this.levelDisplay.textContent = window.langData?.[window.currentLang]?.loading || '加载中...';
        }
    }

    /**
     * 更新分数显示
     */
    updateScoreDisplay() {
        if (this.scoreValueDisplay && this.totalQuestionsDisplay) {
            this.scoreValueDisplay.textContent = this.score;
            this.totalQuestionsDisplay.textContent = this.totalQuestions;
        }
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
        this.startButton.innerHTML = '<i class="fas fa-play"></i> はじめ';
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
        // 显示多语言消息 (message 可能已经是多语言文本，或者是一个key)
        let displayMessage = message;
        if (window.langData[window.currentLang]?.[message]) {
             displayMessage = window.langData[window.currentLang][message];
        }

        const messageElement = document.createElement('div');
        messageElement.classList.add('feedback-message', type);
        messageElement.textContent = displayMessage;
        this.feedbackArea.appendChild(messageElement);

        // 自动移除消息
        setTimeout(() => {
            messageElement.remove();
        }, 3000);
    }

    /**
     * 更新背景音乐按钮状态
     * @param {boolean} isPlaying 是否正在播放
     */
    updateBgmButtonState(isPlaying = false) {
        if (isPlaying) {
            this.bgmButton.classList.add('playing');
            this.bgmButton.title = '背景音楽を一時停止';
        } else {
            this.bgmButton.classList.remove('playing');
            this.bgmButton.title = '背景音楽を再生';
        }
    }

    /**
     * 生成关卡列表
     * @param {string} category 关卡分类
     */
    generateLevelList(category = 'all') {
        const levelListContent = document.createElement('div');
        levelListContent.classList.add('level-list-content');

        // 添加分类标签 (如果需要)
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

        // 生成关卡列表项
        this.levels.forEach((level, index) => {
            // 检查关卡是否属于当前分类
            const filteredLevels = category === 'all'
                ? this.levels
                : this.levels.filter(l => l.category === category);

            if (filteredLevels.includes(level)) {
                const levelItem = document.createElement('div');
                levelItem.classList.add('level-item');
                if (index === this.currentLevelIndex) {
                    levelItem.classList.add('active');
                }
                // 使用多语言关卡名称和描述，增加健壮的 fallback 逻辑
                const levelName = level.name?.[window.currentLang] || level.name?.zh || level.name?.en || level.name?.ja || '未知关卡名称';
                const levelDescription = level.description?.[window.currentLang] || level.description?.zh || level.description?.en || level.description?.ja || '无描述';

                console.log(`Rendering level: ${level.id}, type: ${level.type}, category: ${level.category}`, { lang: window.currentLang, name: levelName, description: levelDescription });

                levelItem.innerHTML = `
                    <h4>${levelName}</h4>
                    <p>${levelDescription}</p>
                    <span class="level-type">${this.getLevelTypeText(level.type)}</span>
                `;
                levelItem.addEventListener('click', () => {
                    this.switchLevel(index);
                    this.hideLevelSelector();
                });
                levelListContent.appendChild(levelItem);
            }
        });

        // 清空并添加新的列表
        this.levelList.innerHTML = '';
        this.levelList.appendChild(levelListContent);
    }

    /**
     * 获取关卡类型显示文本
     * @param {string} type 关卡类型
     * @returns {string} 显示文本
     */
    getLevelTypeText(type) {
        // 根据类型返回多语言文本
        switch (type) {
            case 'basic':
                return window.langData[window.currentLang]?.level_type_basic || '基本';
            case 'dakuon':
                return window.langData[window.currentLang]?.level_type_dakuon || '浊音/半浊音';
            case 'youon':
                return window.langData[window.currentLang]?.level_type_youon || '拗音';
            case 'mixed':
                return window.langData[window.currentLang]?.level_type_mixed || '混合';
            default:
                return window.langData[window.currentLang]?.level_type_unknown || '未知';
        }
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
            // 使用多语言支持的确认对话框
            const confirmMessage = (window.langData && window.langData.confirm_level_switch) || '关卡切换将丢失当前进度，确定要切换吗？';
            if (!confirm(confirmMessage)) {
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
        this.optionsArea.innerHTML = '<div class="placeholder-text"><p>はじめをクリックして開始</p></div>';
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

    // 监听语言数据加载完成事件，然后更新UI
    document.addEventListener('langDataLoaded', () => {
        console.log('Event: langDataLoaded triggered', { currentLang: window.currentLang, langDataExists: !!window.langData, langDataKeys: window.langData ? Object.keys(window.langData).length : 0 });
        // 检查 game 实例是否已成功创建且数据已加载，然后更新UI
        if (game && game.levels && game.kanaData) {
             console.log('langDataLoaded: Calling updateGameUIForLang');
             game.updateGameUIForLang();
        }
    });

    // 首次加载时，如果语言数据已经就绪，也要更新UI
    // 检查 window.langData 是否已存在（由i18n.js在DOMContentLoaded之前加载）
    if (window.langData && Object.keys(window.langData).length > 0) {
        console.log('DOMContentLoaded: window.langData already exists, calling updateGameUIForLang');
        game.updateGameUIForLang();
    }
});