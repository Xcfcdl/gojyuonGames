// 五十音点读游戏
class KanaReaderGame {
    constructor() {
        this.kanaMapping = {};
        this.kanaExamples = {};
        this.currentKana = 'あ';
        this.currentLang = 'zh';
        this.audioContext = null;
        this.lastScrollY = 0;
        this.isScrollingDown = false;
        this.scrollThreshold = window.innerWidth <= 768 ? 50 : 100;
        this.dmakInstance = null;
        this.dmakInstance2 = null; // 第二个字符的动画实例
        this.animationSpeed = this.loadSpeedPreference(); // 加载用户偏好速度
        this.isAnimating = false; // 动画状态标志
        this.animationQueue = []; // 动画队列
        this.isKatakana = false; // 当前是否为片假名模式
        this.speechVoices = []; // 可用的语音列表
        this.speechMode = 'smart'; // 语音模式：'smart' (仅智能发音), 'individual' (逐个假名), 'combined' (拼读模式)
        this.init();
    }

    loadSpeedPreference() {
        try {
            const saved = localStorage.getItem('kana-reader-speed');
            return saved ? parseFloat(saved) : 2.0;
        } catch (error) {
            console.warn('Failed to load speed preference:', error);
            return 2.0;
        }
    }

    saveSpeedPreference(speed) {
        try {
            localStorage.setItem('kana-reader-speed', speed.toString());
        } catch (error) {
            console.warn('Failed to save speed preference:', error);
        }
    }

    async init() {
        try {
            await this.loadData();
            this.setupEventListeners();
            this.renderKanaChart();

            // 等待dmak库加载完成
            await this.waitForLibraries();

            // 默认选中第一个假名并初始化控制栏
            this.selectKana('あ');
            // 确保控制栏内容正确显示
            this.updateMiniDisplay('あ');
        } catch (error) {
            console.error('初始化失败:', error);
            this.handleError(error, 'initialization');
        }
    }

    async waitForLibraries() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 50; // 5秒超时

            const checkLibraries = () => {
                if (typeof Dmak !== 'undefined' && typeof Raphael !== 'undefined') {
                    console.log('Libraries loaded successfully');
                    resolve();
                } else if (attempts < maxAttempts) {
                    attempts++;
                    setTimeout(checkLibraries, 100);
                } else {
                    console.warn('Libraries failed to load, using fallback');
                    resolve();
                }
            };

            checkLibraries();
        });
    }

    async loadData() {
        try {
            // 加载假名映射数据
            const kanaResponse = await fetch('../assets/audio/kana/kana_mapping.json');
            this.kanaMapping = await kanaResponse.json();

            // 加载假名示例数据
            await this.loadKanaExamples();
        } catch (error) {
            console.error('数据加载失败:', error);
            throw error;
        }
    }

    async loadKanaExamples() {
        try {
            const examplesFile = this.isKatakana ?
                '../assets/data/kana-katakana-examples.json' :
                '../assets/data/kana-examples.json';

            const examplesResponse = await fetch(examplesFile);
            this.kanaExamples = await examplesResponse.json();
        } catch (error) {
            console.error('假名示例数据加载失败:', error);
            // 如果片假名数据加载失败，回退到平假名数据
            if (this.isKatakana) {
                console.warn('片假名数据加载失败，回退到平假名数据');
                const examplesResponse = await fetch('../assets/data/kana-examples.json');
                this.kanaExamples = await examplesResponse.json();
            }
        }
    }

    setupEventListeners() {
        // 语言切换事件
        document.addEventListener('langDataLoaded', (event) => {
            this.currentLang = event.detail.lang;
            this.updateMiniLangLabel();
            this.updateMiniDisplay(this.currentKana);
        });

        // 移除了原有的播放发音按钮，现在使用控制栏中的按钮

        // 迷你播放按钮
        const miniPlayButton = document.getElementById('mini-play-button');
        if (miniPlayButton) {
            miniPlayButton.addEventListener('click', () => {
                this.playKanaSound(this.currentKana);
            });
        }

        // 滚动检测
        this.setupScrollDetection();

        // 写法动画控制按钮
        this.setupWritingControls();

        // 速度控制
        this.setupSpeedControl();

        // 平假名/片假名切换
        this.setupKanaTypeToggle();

        // 初始化语音合成
        this.initializeSpeechSynthesis();

        // 语音模式切换
        this.setupSpeechModeToggle();
    }

    renderKanaChart() {
        this.renderBasicKana();
        this.renderDakuonKana();
        this.renderYouonKana();
    }

    renderBasicKana() {
        const grid = document.getElementById('basic-grid');
        if (!grid) return;

        // 基础五十音图布局
        const basicLayout = this.isKatakana ? [
            ['ア', 'イ', 'ウ', 'エ', 'オ'],
            ['カ', 'キ', 'ク', 'ケ', 'コ'],
            ['サ', 'シ', 'ス', 'セ', 'ソ'],
            ['タ', 'チ', 'ツ', 'テ', 'ト'],
            ['ナ', 'ニ', 'ヌ', 'ネ', 'ノ'],
            ['ハ', 'ヒ', 'フ', 'ヘ', 'ホ'],
            ['マ', 'ミ', 'ム', 'メ', 'モ'],
            ['ヤ', '', 'ユ', '', 'ヨ'],
            ['ラ', 'リ', 'ル', 'レ', 'ロ'],
            ['ワ', '', '', '', 'ヲ'],
            ['', '', '', '', 'ン']
        ] : [
            ['あ', 'い', 'う', 'え', 'お'],
            ['か', 'き', 'く', 'け', 'こ'],
            ['さ', 'し', 'す', 'せ', 'そ'],
            ['た', 'ち', 'つ', 'て', 'と'],
            ['な', 'に', 'ぬ', 'ね', 'の'],
            ['は', 'ひ', 'ふ', 'へ', 'ほ'],
            ['ま', 'み', 'む', 'め', 'も'],
            ['や', '', 'ゆ', '', 'よ'],
            ['ら', 'り', 'る', 'れ', 'ろ'],
            ['わ', '', '', '', 'を'],
            ['', '', '', '', 'ん']
        ];

        grid.innerHTML = '';
        basicLayout.forEach(row => {
            row.forEach(kana => {
                if (kana) {
                    const button = this.createKanaButton(kana);
                    grid.appendChild(button);
                } else {
                    const placeholder = document.createElement('div');
                    placeholder.className = 'kana-placeholder';
                    grid.appendChild(placeholder);
                }
            });
        });
    }

    renderDakuonKana() {
        const grid = document.getElementById('dakuon-grid');
        if (!grid) return;

        // 浊音布局
        const dakuonLayout = this.isKatakana ? [
            ['ガ', 'ギ', 'グ', 'ゲ', 'ゴ'],
            ['ザ', 'ジ', 'ズ', 'ゼ', 'ゾ'],
            ['ダ', 'ヂ', 'ヅ', 'デ', 'ド'],
            ['バ', 'ビ', 'ブ', 'ベ', 'ボ'],
            ['パ', 'ピ', 'プ', 'ペ', 'ポ']
        ] : [
            ['が', 'ぎ', 'ぐ', 'げ', 'ご'],
            ['ざ', 'じ', 'ず', 'ぜ', 'ぞ'],
            ['だ', 'ぢ', 'づ', 'で', 'ど'],
            ['ば', 'び', 'ぶ', 'べ', 'ぼ'],
            ['ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ']
        ];

        grid.innerHTML = '';
        dakuonLayout.forEach(row => {
            row.forEach(kana => {
                const button = this.createKanaButton(kana);
                grid.appendChild(button);
            });
        });
    }

    renderYouonKana() {
        const grid = document.getElementById('youon-grid');
        if (!grid) return;

        // 拗音布局
        const youonLayout = this.isKatakana ? [
            ['キャ', 'キュ', 'キョ'],
            ['シャ', 'シュ', 'ショ'],
            ['チャ', 'チュ', 'チョ'],
            ['ニャ', 'ニュ', 'ニョ'],
            ['ヒャ', 'ヒュ', 'ヒョ'],
            ['ミャ', 'ミュ', 'ミョ'],
            ['リャ', 'リュ', 'リョ'],
            ['ギャ', 'ギュ', 'ギョ'],
            ['ジャ', 'ジュ', 'ジョ'],
            ['ビャ', 'ビュ', 'ビョ'],
            ['ピャ', 'ピュ', 'ピョ']
        ] : [
            ['きゃ', 'きゅ', 'きょ'],
            ['しゃ', 'しゅ', 'しょ'],
            ['ちゃ', 'ちゅ', 'ちょ'],
            ['にゃ', 'にゅ', 'にょ'],
            ['ひゃ', 'ひゅ', 'ひょ'],
            ['みゃ', 'みゅ', 'みょ'],
            ['りゃ', 'りゅ', 'りょ'],
            ['ぎゃ', 'ぎゅ', 'ぎょ'],
            ['じゃ', 'じゅ', 'じょ'],
            ['びゃ', 'びゅ', 'びょ'],
            ['ぴゃ', 'ぴゅ', 'ぴょ']
        ];

        grid.innerHTML = '';
        youonLayout.forEach(row => {
            row.forEach(kana => {
                const button = this.createKanaButton(kana);
                grid.appendChild(button);
            });
        });
    }

    createKanaButton(kana) {
        const button = document.createElement('button');
        button.className = 'kana-button';
        button.textContent = kana;
        button.setAttribute('data-kana', kana);

        button.addEventListener('click', () => {
            this.selectKana(kana);
            this.playKanaSound(kana);
        });

        return button;
    }

    selectKana(kana) {
        // 移除之前的选中状态
        document.querySelectorAll('.kana-button.active').forEach(btn => {
            btn.classList.remove('active');
        });

        // 添加新的选中状态
        const selectedButton = document.querySelector(`[data-kana="${kana}"]`);
        if (selectedButton) {
            selectedButton.classList.add('active');
        }

        this.currentKana = kana;
        this.updateMiniDisplay(kana);
    }

    setupScrollDetection() {
        let ticking = false;

        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const currentScrollY = window.scrollY;
                    const isAtTop = currentScrollY <= this.scrollThreshold;
                    const isScrollingDown = currentScrollY > this.lastScrollY;

                    const header = document.querySelector('header');
                    const footer = document.querySelector('footer');
                    const controlBar = document.getElementById('game-control-bar');
                    const gameContainer = document.getElementById('game-container');

                    if (isAtTop) {
                        // 在顶部，显示header和footer，隐藏控制栏
                        header?.classList.remove('hidden');
                        footer?.classList.remove('hidden');
                        controlBar?.classList.remove('visible');
                        gameContainer?.classList.remove('with-control-bar');
                    } else {
                        // 不在顶部，隐藏header和footer，显示控制栏
                        header?.classList.add('hidden');
                        footer?.classList.add('hidden');
                        controlBar?.classList.add('visible');
                        gameContainer?.classList.add('with-control-bar');

                        // 动态调整游戏容器的上边距
                        this.adjustGameContainerMargin();
                    }

                    this.lastScrollY = currentScrollY;
                    this.isScrollingDown = isScrollingDown;
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        // 窗口大小变化时重新调整
        window.addEventListener('resize', () => {
            const controlBar = document.getElementById('game-control-bar');
            if (controlBar && controlBar.classList.contains('visible')) {
                this.adjustGameContainerMargin();
            }
        });
    }

    updateMiniDisplay(kana) {
        const miniKanaChar = document.getElementById('mini-kana-char');
        const miniKanaRomaji = document.getElementById('mini-kana-romaji');

        if (miniKanaChar) {
            miniKanaChar.textContent = kana;
        }

        if (miniKanaRomaji) {
            const romaji = this.getRomaji(kana);
            miniKanaRomaji.textContent = romaji;
        }

        // 更新迷你发音技巧和单词示例
        this.updateMiniPronunciationTips(kana);
        this.updateMiniWordExamples(kana);
        this.updateWritingAnimation(kana);
    }

    updateMiniPronunciationTips(kana) {
        const miniTipElement = document.getElementById('mini-pronunciation-tip-text');
        if (!miniTipElement) return;

        const exampleData = this.kanaExamples[kana];
        if (exampleData && exampleData.pronunciation_tips) {
            const tip = exampleData.pronunciation_tips[this.currentLang] ||
                       exampleData.pronunciation_tips['zh'] ||
                       '暂无发音技巧';
            miniTipElement.textContent = tip;
        } else {
            // 提供默认的发音技巧
            const defaultTips = {
                'zh': '点击播放按钮听取发音',
                'ja': '再生ボタンをクリックして発音を聞く',
                'en': 'Click play button to hear pronunciation'
            };
            miniTipElement.textContent = defaultTips[this.currentLang] || defaultTips['zh'];
        }
    }

    updateMiniWordExamples(kana) {
        const miniExamplesContainer = document.getElementById('mini-examples-list');
        if (!miniExamplesContainer) return;

        const exampleData = this.kanaExamples[kana];
        if (exampleData && exampleData.examples) {
            miniExamplesContainer.innerHTML = '';
            exampleData.examples.forEach(example => {
                const miniExampleElement = this.createMiniExampleElement(example);
                miniExamplesContainer.appendChild(miniExampleElement);
            });
        } else {
            // 提供默认的无示例消息
            const noExamplesMsg = {
                'zh': '暂无单词示例',
                'ja': '単語例がありません',
                'en': 'No word examples available'
            };
            miniExamplesContainer.innerHTML = `<p style="text-align: center; color: #999; padding: 0.5rem; font-size: 0.75rem;">${noExamplesMsg[this.currentLang] || noExamplesMsg['zh']}</p>`;
        }
    }

    createMiniExampleElement(example) {
        const div = document.createElement('div');
        div.className = 'mini-example-item';

        const meaning = example.meaning[this.currentLang] ||
                       example.meaning['zh'] ||
                       example.meaning['en'] ||
                       '未知含义';

        div.innerHTML = `
            <div class="mini-example-content">
                <span class="mini-example-word">${example.word}</span>
                <span class="mini-example-romaji">${example.romaji}</span>
                <span class="mini-example-meaning">${meaning}</span>
            </div>
            <button class="mini-example-play">
                <i class="fas fa-play"></i>
            </button>
        `;

        // 添加点击播放功能
        const playButton = div.querySelector('.mini-example-play');
        const itemContent = div.querySelector('.mini-example-content');

        const playWord = async () => {
            // 添加播放动画
            div.classList.add('playing');

            // 播放点击音效
            this.playClickSound();

            // 播放单词发音
            await this.playWordSound(example.word);

            // 移除播放动画
            setTimeout(() => {
                div.classList.remove('playing');
            }, 600);
        };

        playButton.addEventListener('click', (e) => {
            e.stopPropagation();
            playWord();
        });

        itemContent.addEventListener('click', playWord);

        return div;
    }

    setupWritingControls() {
        const playBtn = document.getElementById('play-writing-btn');
        const pauseBtn = document.getElementById('pause-writing-btn');
        const restartBtn = document.getElementById('restart-writing-btn');

        if (playBtn) {
            playBtn.addEventListener('click', () => {
                if (this.isAnimating) {
                    // 如果正在播放动画队列，继续播放
                    this.playAnimationQueue();
                } else if (this.dmakInstance) {
                    this.dmakInstance.render();
                } else if (this.dmakInstance2) {
                    this.dmakInstance2.render();
                } else {
                    // 重新播放动画
                    this.updateWritingAnimation(this.currentKana);
                }
            });
        }

        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                // 停止动画队列
                this.stopCurrentAnimation();

                // 显示静态状态
                const canvas1 = document.getElementById('kana-writing-animation-1');
                const canvas2 = document.getElementById('kana-writing-animation-2');

                if (this.isYouon(this.currentKana)) {
                    const [char1, char2] = this.splitYouon(this.currentKana);
                    if (canvas1) this.showStaticKana(canvas1, char1);
                    if (canvas2) this.showStaticKana(canvas2, char2);
                } else {
                    if (canvas1) this.showStaticKana(canvas1, this.currentKana);
                }
            });
        }

        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.updateWritingAnimation(this.currentKana);
            });
        }
    }

    setupSpeedControl() {
        const speedSlider = document.getElementById('speed-slider');
        const speedValue = document.getElementById('speed-value');

        if (speedSlider && speedValue) {
            // 初始化显示和滑块值
            speedSlider.value = this.animationSpeed;
            speedValue.textContent = `${this.animationSpeed.toFixed(1)}x`;

            speedSlider.addEventListener('input', (e) => {
                this.animationSpeed = parseFloat(e.target.value);
                speedValue.textContent = `${this.animationSpeed.toFixed(1)}x`;

                // 保存用户偏好
                this.saveSpeedPreference(this.animationSpeed);

                // 如果当前有动画实例，更新其速度
                if (this.dmakInstance) {
                    this.updateAnimationSpeed();
                }
            });
        }
    }

    updateAnimationSpeed() {
        if (this.dmakInstance && this.dmakInstance.options) {
            // 计算新的step值，速度越快step越大
            const baseStep = 0.03;
            this.dmakInstance.options.step = baseStep * this.animationSpeed;
        }
        if (this.dmakInstance2 && this.dmakInstance2.options) {
            // 同时更新第二个实例的速度
            const baseStep = 0.03;
            this.dmakInstance2.options.step = baseStep * this.animationSpeed;
        }
    }

    setupKanaTypeToggle() {
        const toggleButton = document.getElementById('kana-type-toggle');
        if (toggleButton) {
            toggleButton.addEventListener('click', async () => {
                await this.toggleKanaType();
            });
        }
    }

    async toggleKanaType() {
        const toggleButton = document.getElementById('kana-type-toggle');

        if (toggleButton) {
            toggleButton.classList.add('switching');
            toggleButton.disabled = true;
        }

        try {
            // 切换模式
            this.isKatakana = !this.isKatakana;

            // 重新加载示例数据
            await this.loadKanaExamples();

            // 重新渲染假名图表
            this.renderKanaChart();

            // 更新按钮文本
            this.updateToggleButtonText();

            // 设置默认选中的假名
            const defaultKana = this.isKatakana ? 'ア' : 'あ';
            this.selectKana(defaultKana);
            this.updateMiniDisplay(defaultKana);

            console.log(`切换到${this.isKatakana ? '片假名' : '平假名'}模式`);

        } catch (error) {
            console.error('切换假名类型失败:', error);
            // 如果切换失败，恢复原状态
            this.isKatakana = !this.isKatakana;
        } finally {
            if (toggleButton) {
                toggleButton.classList.remove('switching');
                toggleButton.disabled = false;
            }
        }
    }

    updateToggleButtonText() {
        const toggleLabel = document.getElementById('kana-type-label');
        if (toggleLabel) {
            if (this.isKatakana) {
                toggleLabel.textContent = '切换到平假名';
                toggleLabel.setAttribute('data-i18n', 'switch_to_hiragana');
            } else {
                toggleLabel.textContent = '切换到片假名';
                toggleLabel.setAttribute('data-i18n', 'switch_to_katakana');
            }

            // 如果国际化已加载，更新文本
            if (window.langData && this.currentLang) {
                const key = this.isKatakana ? 'switch_to_hiragana' : 'switch_to_katakana';
                if (window.langData[key]) {
                    toggleLabel.textContent = window.langData[key];
                }
            }
        }
    }

    setupSpeechModeToggle() {
        const toggleButton = document.getElementById('speech-mode-toggle');
        if (toggleButton) {
            // 初始化按钮状态
            this.updateSpeechModeButton();

            toggleButton.addEventListener('click', () => {
                this.toggleSpeechMode();
            });
        }
    }

    toggleSpeechMode() {
        const toggleButton = document.getElementById('speech-mode-toggle');

        if (toggleButton) {
            toggleButton.classList.add('switching');
            toggleButton.disabled = true;
        }

        try {
            // 循环切换三种模式：smart -> combined -> individual -> smart
            switch (this.speechMode) {
                case 'smart':
                    this.speechMode = 'combined';
                    break;
                case 'combined':
                    this.speechMode = 'individual';
                    break;
                case 'individual':
                    this.speechMode = 'smart';
                    break;
                default:
                    this.speechMode = 'smart';
            }

            // 更新按钮显示
            this.updateSpeechModeButton();

            console.log(`切换到${this.getSpeechModeDisplayName()}发音模式`);

        } catch (error) {
            console.error('切换语音模式失败:', error);
            // 如果切换失败，恢复到智能模式
            this.speechMode = 'smart';
        } finally {
            if (toggleButton) {
                toggleButton.classList.remove('switching');
                toggleButton.disabled = false;
            }
        }
    }

    getSpeechModeDisplayName() {
        switch (this.speechMode) {
            case 'smart': return '智能发音';
            case 'combined': return '拼读模式';
            case 'individual': return '逐个假名';
            default: return '智能发音';
        }
    }

    updateSpeechModeButton() {
        const toggleButton = document.getElementById('speech-mode-toggle');
        const toggleLabel = document.getElementById('speech-mode-label');

        if (toggleButton && toggleLabel) {
            // 移除所有模式类
            toggleButton.classList.remove('individual-mode', 'combined-mode');

            let displayText, dataI18nKey, titleText;

            switch (this.speechMode) {
                case 'smart':
                    displayText = '智能发音';
                    dataI18nKey = 'speech_mode_smart';
                    titleText = '当前：智能发音模式，点击切换到拼读模式';
                    break;
                case 'combined':
                    displayText = '拼读模式';
                    dataI18nKey = 'speech_mode_combined';
                    titleText = '当前：拼读模式（逐个假名+智能发音），点击切换到逐个假名模式';
                    toggleButton.classList.add('combined-mode');
                    break;
                case 'individual':
                    displayText = '逐个假名';
                    dataI18nKey = 'speech_mode_individual';
                    titleText = '当前：逐个假名模式，点击切换到智能发音模式';
                    toggleButton.classList.add('individual-mode');
                    break;
                default:
                    displayText = '智能发音';
                    dataI18nKey = 'speech_mode_smart';
                    titleText = '当前：智能发音模式';
            }

            toggleLabel.textContent = displayText;
            toggleLabel.setAttribute('data-i18n', dataI18nKey);
            toggleButton.title = titleText;

            // 如果国际化已加载，更新文本
            if (window.langData && this.currentLang && window.langData[dataI18nKey]) {
                toggleLabel.textContent = window.langData[dataI18nKey];
            }
        }
    }

    initializeSpeechSynthesis() {
        if ('speechSynthesis' in window) {
            // 等待语音列表加载
            const loadVoices = () => {
                this.speechVoices = speechSynthesis.getVoices();
                console.log('Available voices:', this.speechVoices.length);

                // 查找日语语音
                const japaneseVoices = this.speechVoices.filter(voice =>
                    voice.lang.startsWith('ja') ||
                    voice.name.includes('Japanese') ||
                    voice.name.includes('Japan')
                );

                if (japaneseVoices.length > 0) {
                    console.log('Japanese voices found:', japaneseVoices.map(v => v.name));
                } else {
                    console.warn('No Japanese voices found. TTS will use default voice.');
                }
            };

            // 语音列表可能需要时间加载
            if (speechSynthesis.getVoices().length > 0) {
                loadVoices();
            } else {
                speechSynthesis.addEventListener('voiceschanged', loadVoices);
                // 设置超时，防止无限等待
                setTimeout(loadVoices, 1000);
            }
        } else {
            console.warn('Speech synthesis not supported in this browser');
        }
    }

    isYouon(kana) {
        // 检测是否为拗音（两个字符组成）
        const hiraganaYouonList = [
            'きゃ', 'きゅ', 'きょ',
            'しゃ', 'しゅ', 'しょ',
            'ちゃ', 'ちゅ', 'ちょ',
            'にゃ', 'にゅ', 'にょ',
            'ひゃ', 'ひゅ', 'ひょ',
            'みゃ', 'みゅ', 'みょ',
            'りゃ', 'りゅ', 'りょ',
            'ぎゃ', 'ぎゅ', 'ぎょ',
            'じゃ', 'じゅ', 'じょ',
            'びゃ', 'びゅ', 'びょ',
            'ぴゃ', 'ぴゅ', 'ぴょ'
        ];

        const katakanaYouonList = [
            'キャ', 'キュ', 'キョ',
            'シャ', 'シュ', 'ショ',
            'チャ', 'チュ', 'チョ',
            'ニャ', 'ニュ', 'ニョ',
            'ヒャ', 'ヒュ', 'ヒョ',
            'ミャ', 'ミュ', 'ミョ',
            'リャ', 'リュ', 'リョ',
            'ギャ', 'ギュ', 'ギョ',
            'ジャ', 'ジュ', 'ジョ',
            'ビャ', 'ビュ', 'ビョ',
            'ピャ', 'ピュ', 'ピョ'
        ];

        return hiraganaYouonList.includes(kana) || katakanaYouonList.includes(kana);
    }

    splitYouon(kana) {
        // 将拗音分解为两个字符
        const youonMap = {
            // 平假名拗音
            'きゃ': ['き', 'ゃ'], 'きゅ': ['き', 'ゅ'], 'きょ': ['き', 'ょ'],
            'しゃ': ['し', 'ゃ'], 'しゅ': ['し', 'ゅ'], 'しょ': ['し', 'ょ'],
            'ちゃ': ['ち', 'ゃ'], 'ちゅ': ['ち', 'ゅ'], 'ちょ': ['ち', 'ょ'],
            'にゃ': ['に', 'ゃ'], 'にゅ': ['に', 'ゅ'], 'にょ': ['に', 'ょ'],
            'ひゃ': ['ひ', 'ゃ'], 'ひゅ': ['ひ', 'ゅ'], 'ひょ': ['ひ', 'ょ'],
            'みゃ': ['み', 'ゃ'], 'みゅ': ['み', 'ゅ'], 'みょ': ['み', 'ょ'],
            'りゃ': ['り', 'ゃ'], 'りゅ': ['り', 'ゅ'], 'りょ': ['り', 'ょ'],
            'ぎゃ': ['ぎ', 'ゃ'], 'ぎゅ': ['ぎ', 'ゅ'], 'ぎょ': ['ぎ', 'ょ'],
            'じゃ': ['じ', 'ゃ'], 'じゅ': ['じ', 'ゅ'], 'じょ': ['じ', 'ょ'],
            'びゃ': ['び', 'ゃ'], 'びゅ': ['び', 'ゅ'], 'びょ': ['び', 'ょ'],
            'ぴゃ': ['ぴ', 'ゃ'], 'ぴゅ': ['ぴ', 'ゅ'], 'ぴょ': ['ぴ', 'ょ'],
            // 片假名拗音
            'キャ': ['キ', 'ャ'], 'キュ': ['キ', 'ュ'], 'キョ': ['キ', 'ョ'],
            'シャ': ['シ', 'ャ'], 'シュ': ['シ', 'ュ'], 'ショ': ['シ', 'ョ'],
            'チャ': ['チ', 'ャ'], 'チュ': ['チ', 'ュ'], 'チョ': ['チ', 'ョ'],
            'ニャ': ['ニ', 'ャ'], 'ニュ': ['ニ', 'ュ'], 'ニョ': ['ニ', 'ョ'],
            'ヒャ': ['ヒ', 'ャ'], 'ヒュ': ['ヒ', 'ュ'], 'ヒョ': ['ヒ', 'ョ'],
            'ミャ': ['ミ', 'ャ'], 'ミュ': ['ミ', 'ュ'], 'ミョ': ['ミ', 'ョ'],
            'リャ': ['リ', 'ャ'], 'リュ': ['リ', 'ュ'], 'リョ': ['リ', 'ョ'],
            'ギャ': ['ギ', 'ャ'], 'ギュ': ['ギ', 'ュ'], 'ギョ': ['ギ', 'ョ'],
            'ジャ': ['ジ', 'ャ'], 'ジュ': ['ジ', 'ュ'], 'ジョ': ['ジ', 'ョ'],
            'ビャ': ['ビ', 'ャ'], 'ビュ': ['ビ', 'ュ'], 'ビョ': ['ビ', 'ョ'],
            'ピャ': ['ピ', 'ャ'], 'ピュ': ['ピ', 'ュ'], 'ピョ': ['ピ', 'ョ']
        };
        return youonMap[kana] || [kana];
    }

    updateWritingAnimation(kana) {
        // 停止当前动画
        this.stopCurrentAnimation();

        // 清除之前的动画
        const canvas1 = document.getElementById('kana-writing-animation-1');
        const canvas2 = document.getElementById('kana-writing-animation-2');

        if (!canvas1) return;

        // 清除之前的内容
        canvas1.innerHTML = '';
        if (canvas2) canvas2.innerHTML = '';

        // 检查是否为拗音
        if (this.isYouon(kana)) {
            // 拗音：显示两个字符，按顺序播放
            const [char1, char2] = this.splitYouon(kana);

            // 显示第二个画布
            if (canvas2) {
                canvas2.style.display = 'block';
            }

            // 设置动画队列
            this.animationQueue = [
                { canvas: canvas1, char: char1, elementId: 'kana-writing-animation-1' },
                { canvas: canvas2, char: char2, elementId: 'kana-writing-animation-2' }
            ];

            // 开始播放动画队列
            this.playAnimationQueue();
        } else {
            // 单个字符：隐藏第二个画布
            if (canvas2) {
                canvas2.style.display = 'none';
            }

            // 设置单个动画
            this.animationQueue = [
                { canvas: canvas1, char: kana, elementId: 'kana-writing-animation-1' }
            ];

            // 开始播放动画
            this.playAnimationQueue();
        }
    }

    stopCurrentAnimation() {
        this.isAnimating = false;
        this.animationQueue = [];

        // 停止现有的dmak实例
        if (this.dmakInstance) {
            try {
                this.dmakInstance.pause();
            } catch (error) {
                console.warn('Failed to pause dmak instance:', error);
            }
            this.dmakInstance = null;
        }

        if (this.dmakInstance2) {
            try {
                this.dmakInstance2.pause();
            } catch (error) {
                console.warn('Failed to pause dmak instance 2:', error);
            }
            this.dmakInstance2 = null;
        }
    }

    async playAnimationQueue() {
        if (this.animationQueue.length === 0 || this.isAnimating) {
            return;
        }

        this.isAnimating = true;

        for (let i = 0; i < this.animationQueue.length; i++) {
            const { canvas, char, elementId } = this.animationQueue[i];

            if (!this.isAnimating) {
                break; // 如果动画被停止，退出循环
            }

            // 等待当前字符动画完成
            await this.createCharacterAnimationAsync(canvas, char, elementId);

            // 在字符之间添加短暂停顿
            if (i < this.animationQueue.length - 1 && this.isAnimating) {
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }

        this.isAnimating = false;
    }

    createCharacterAnimation(canvas, kana, elementId) {
        // 尝试使用dmak库，如果不可用则使用简化版本
        if (typeof Dmak !== 'undefined' && typeof Raphael !== 'undefined') {
            console.log('Using dmak animation for:', kana);
            this.tryDmakAnimation(canvas, kana, elementId);
        } else {
            console.log('Dmak not available, using simple animation for:', kana);
            // 使用简化的Canvas动画
            this.createSimpleWritingAnimation(canvas, kana);
        }
    }

    async createCharacterAnimationAsync(canvas, kana, elementId) {
        return new Promise((resolve) => {
            // 尝试使用dmak库，如果不可用则使用简化版本
            if (typeof Dmak !== 'undefined' && typeof Raphael !== 'undefined') {
                console.log('Using dmak animation for:', kana);
                this.tryDmakAnimationAsync(canvas, kana, elementId, resolve);
            } else {
                console.log('Dmak not available, using simple animation for:', kana);
                // 使用简化的Canvas动画
                this.createSimpleWritingAnimationAsync(canvas, kana, resolve);
            }
        });
    }

    tryDmakAnimation(canvas, kana, elementId) {
        // 显示加载状态
        this.showLoadingState(canvas);

        // 直接尝试创建dmak实例
        this.createDmakInstance(canvas, kana, elementId);
    }

    tryDmakAnimationAsync(canvas, kana, elementId, resolve) {
        // 显示加载状态
        this.showLoadingState(canvas);

        // 直接尝试创建dmak实例，并在完成时调用resolve
        this.createDmakInstanceAsync(canvas, kana, elementId, resolve);
    }

    async testKanjiAvailability(kana) {
        try {
            // 获取假名的Unicode编码
            const unicode = kana.charCodeAt(0).toString(16).padStart(5, '0');
            const svgUrl = `https://mbilbille.github.io/dmak/kanji/${unicode}.svg`;

            console.log(`Testing availability for ${kana} (Unicode: ${unicode})`);
            console.log(`SVG URL: ${svgUrl}`);

            const response = await fetch(svgUrl, {
                method: 'GET',
                mode: 'cors',
                credentials: 'omit'
            });

            console.log(`Response status: ${response.status}`);
            return response.ok;
        } catch (error) {
            console.warn('Failed to test kanji availability:', error);
            return false;
        }
    }

    createDmakInstance(canvas, kana, elementId) {
        try {
            console.log(`Creating dmak instance for: ${kana} in element: ${elementId}`);
            console.log('Dmak available:', typeof Dmak !== 'undefined');
            console.log('Raphael available:', typeof Raphael !== 'undefined');
            console.log('Canvas element:', canvas);

            // 清除加载状态
            const loadingEl = canvas.querySelector('.loading-state');
            if (loadingEl) {
                loadingEl.remove();
            }

            // 创建新的dmak实例，使用本地SVG文件
            const dmakInstance = new Dmak(kana, {
                element: elementId,
                uri: '../assets/svg/kana/',
                width: 80,
                height: 80,
                autoplay: true,
                step: 0.03 * this.animationSpeed, // 使用当前速度设置
                stroke: {
                    order: {
                        visible: true,
                        attr: {
                            'font-size': 8,
                            'fill': '#999'
                        }
                    },
                    attr: {
                        'active': '#4C9F70',
                        'stroke': '#333',
                        'stroke-width': 3,
                        'stroke-linecap': 'round',
                        'stroke-linejoin': 'round'
                    }
                },
                grid: {
                    show: true,
                    attr: {
                        'stroke': '#DDD',
                        'stroke-width': 1
                    }
                },
                loaded: (strokes) => {
                    console.log(`Dmak loaded for ${kana}, strokes:`, strokes);
                },
                drew: (strokeNumber) => {
                    console.log(`Drew stroke ${strokeNumber} for ${kana}`);
                },
                erased: (strokeNumber) => {
                    console.log(`Erased stroke ${strokeNumber} for ${kana}`);
                }
            });

            // 根据元素ID保存实例
            if (elementId === 'kana-writing-animation-1') {
                this.dmakInstance = dmakInstance;
            } else if (elementId === 'kana-writing-animation-2') {
                this.dmakInstance2 = dmakInstance;
            }

            console.log('Dmak instance created successfully:', dmakInstance);

        } catch (error) {
            console.error('Failed to create dmak animation:', error);
            console.error('Error details:', error.message, error.stack);
            this.createSimpleWritingAnimation(canvas, kana);
        }
    }

    createDmakInstanceAsync(canvas, kana, elementId, resolve) {
        try {
            console.log(`Creating dmak instance for: ${kana} in element: ${elementId}`);
            console.log('Dmak available:', typeof Dmak !== 'undefined');
            console.log('Raphael available:', typeof Raphael !== 'undefined');
            console.log('Canvas element:', canvas);

            // 清除加载状态
            const loadingEl = canvas.querySelector('.loading-state');
            if (loadingEl) {
                loadingEl.remove();
            }

            // 计算动画持续时间（基于速度）
            const baseDuration = 2000; // 基础持续时间2秒
            const animationDuration = baseDuration / this.animationSpeed;

            // 创建新的dmak实例，使用本地SVG文件
            const dmakInstance = new Dmak(kana, {
                element: elementId,
                uri: '../assets/svg/kana/',
                width: window.innerWidth <= 480 ? 60 : 80,
                height: window.innerWidth <= 480 ? 60 : 80,
                autoplay: true,
                step: 0.03 * this.animationSpeed, // 使用当前速度设置
                stroke: {
                    order: {
                        visible: true,
                        attr: {
                            'font-size': 8,
                            'fill': '#999'
                        }
                    },
                    attr: {
                        'active': '#4C9F70',
                        'stroke': '#333',
                        'stroke-width': 3,
                        'stroke-linecap': 'round',
                        'stroke-linejoin': 'round'
                    }
                },
                grid: {
                    show: true,
                    attr: {
                        'stroke': '#DDD',
                        'stroke-width': 1
                    }
                },
                loaded: (strokes) => {
                    console.log(`Dmak loaded for ${kana}, strokes:`, strokes);
                },
                drew: (strokeNumber) => {
                    console.log(`Drew stroke ${strokeNumber} for ${kana}`);
                },
                erased: (strokeNumber) => {
                    console.log(`Erased stroke ${strokeNumber} for ${kana}`);
                },
                complete: () => {
                    console.log(`Animation complete for ${kana}`);
                    // 动画完成后调用resolve
                    setTimeout(() => {
                        resolve();
                    }, 100);
                }
            });

            // 根据元素ID保存实例
            if (elementId === 'kana-writing-animation-1') {
                this.dmakInstance = dmakInstance;
            } else if (elementId === 'kana-writing-animation-2') {
                this.dmakInstance2 = dmakInstance;
            }

            console.log('Dmak instance created successfully:', dmakInstance);

            // 如果dmak没有complete回调，使用定时器作为后备
            setTimeout(() => {
                resolve();
            }, animationDuration);

        } catch (error) {
            console.error('Failed to create dmak animation:', error);
            console.error('Error details:', error.message, error.stack);
            this.createSimpleWritingAnimationAsync(canvas, kana, resolve);
        }
    }

    createSimpleWritingAnimation(canvas, kana) {
        const size = window.innerWidth <= 480 ? 60 : 80;

        canvas.innerHTML = `
            <canvas id="simple-writing-canvas" width="${size}" height="${size}" style="
                border: 1px dashed #E0E0E0;
                border-radius: 4px;
                background: #FAFAFA;
            "></canvas>
        `;

        const canvasEl = canvas.querySelector('#simple-writing-canvas');
        const ctx = canvasEl.getContext('2d');

        // 绘制网格
        this.drawGrid(ctx, size);

        // 绘制假名
        this.drawKanaWithAnimation(ctx, kana, size);
    }

    drawGrid(ctx, size) {
        ctx.strokeStyle = '#E0E0E0';
        ctx.lineWidth = 0.5;
        ctx.setLineDash([2, 2]);

        // 绘制十字网格
        ctx.beginPath();
        ctx.moveTo(size / 2, 0);
        ctx.lineTo(size / 2, size);
        ctx.moveTo(0, size / 2);
        ctx.lineTo(size, size / 2);
        ctx.stroke();

        ctx.setLineDash([]);
    }

    drawKanaWithAnimation(ctx, kana, size) {
        // 设置字体样式
        ctx.font = `${size * 0.6}px serif`;
        ctx.fillStyle = '#4C9F70';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 创建渐现动画，速度受控制
        let opacity = 0;
        const baseSpeed = 0.02;
        const speedMultiplier = this.animationSpeed;

        const animate = () => {
            ctx.clearRect(0, 0, size, size);
            this.drawGrid(ctx, size);

            ctx.globalAlpha = opacity;
            ctx.fillText(kana, size / 2, size / 2);
            ctx.globalAlpha = 1;

            opacity += baseSpeed * speedMultiplier;
            if (opacity <= 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    createSimpleWritingAnimationAsync(canvas, kana, resolve) {
        const size = window.innerWidth <= 480 ? 60 : 80;

        canvas.innerHTML = `
            <canvas id="simple-writing-canvas" width="${size}" height="${size}" style="
                border: 1px dashed #E0E0E0;
                border-radius: 4px;
                background: #FAFAFA;
            "></canvas>
        `;

        const canvasEl = canvas.querySelector('#simple-writing-canvas');
        const ctx = canvasEl.getContext('2d');

        // 绘制网格
        this.drawGrid(ctx, size);

        // 绘制假名（异步版本）
        this.drawKanaWithAnimationAsync(ctx, kana, size, resolve);
    }

    drawKanaWithAnimationAsync(ctx, kana, size, resolve) {
        // 设置字体样式
        ctx.font = `${size * 0.6}px serif`;
        ctx.fillStyle = '#4C9F70';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 创建渐现动画，速度受控制
        let opacity = 0;
        const baseSpeed = 0.02;
        const speedMultiplier = this.animationSpeed;

        const animate = () => {
            ctx.clearRect(0, 0, size, size);
            this.drawGrid(ctx, size);

            ctx.globalAlpha = opacity;
            ctx.fillText(kana, size / 2, size / 2);
            ctx.globalAlpha = 1;

            opacity += baseSpeed * speedMultiplier;
            if (opacity <= 1) {
                requestAnimationFrame(animate);
            } else {
                // 动画完成，调用resolve
                setTimeout(() => {
                    resolve();
                }, 100);
            }
        };

        animate();
    }

    showLoadingState(canvas) {
        canvas.innerHTML = `
            <div class="loading-state" style="
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
                color: #999;
                font-size: 0.8rem;
            ">
                <i class="fas fa-spinner fa-spin" style="margin-right: 0.5rem;"></i>
                加载中...
            </div>
        `;
    }

    showStaticKana(canvas, kana) {
        // 显示静态假名作为回退
        canvas.innerHTML = `
            <div style="
                font-size: ${window.innerWidth <= 480 ? '1.8rem' : '2.2rem'};
                color: var(--primary-color);
                font-family: var(--japanese-font-stack);
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
                border: 1px dashed #E0E0E0;
                border-radius: 4px;
                background: #FAFAFA;
            ">${kana}</div>
        `;
    }

    adjustGameContainerMargin() {
        const controlBar = document.getElementById('game-control-bar');
        const gameContainer = document.getElementById('game-container');

        if (controlBar && gameContainer) {
            // 等待控制栏完全显示后再计算高度
            setTimeout(() => {
                const controlBarHeight = controlBar.offsetHeight;
                gameContainer.style.marginTop = `${controlBarHeight + 20}px`;
            }, 300);
        }
    }

    // 移除了原有的info-panel相关方法，现在完全使用控制栏

    getRomaji(kana) {
        // 从映射数据中查找罗马音
        // 首先检查片假名映射
        if (this.kanaMapping.katakana && this.kanaMapping.katakana[kana]) {
            return this.kanaMapping.katakana[kana];
        }

        // 然后检查其他分类
        for (const category in this.kanaMapping) {
            if (category !== 'katakana' && this.kanaMapping[category][kana]) {
                return this.kanaMapping[category][kana];
            }
        }
        return '';
    }

    async playKanaSound(kana) {
        try {
            const romaji = this.getRomaji(kana);
            if (!romaji) return;

            const audioPath = `../assets/audio/kana/${romaji}.mp3`;
            const audio = new Audio(audioPath);

            // 添加播放动画
            const button = document.querySelector(`[data-kana="${kana}"]`);
            if (button) {
                button.classList.add('playing');
                setTimeout(() => {
                    button.classList.remove('playing');
                }, 600);
            }

            await audio.play();
        } catch (error) {
            console.error('播放音频失败:', error);
        }
    }

    async playWordSound(word) {
        // 播放整个单词的发音
        if (!word || word.length === 0) return;

        try {
            switch (this.speechMode) {
                case 'smart':
                    // 仅使用Google TTS智能发音
                    const ttsSuccess = await this.playWordWithGoogleTTS(word);
                    if (!ttsSuccess) {
                        console.log('Google TTS failed, falling back to individual kana pronunciation');
                        await this.playWordWithIndividualKanaOnly(word);
                    }
                    break;

                case 'combined':
                    // 拼读模式：先逐个假名，再智能发音
                    await this.playWordWithIndividualKana(word);
                    break;

                case 'individual':
                    // 仅逐个假名播放
                    await this.playWordWithIndividualKanaOnly(word);
                    break;

                default:
                    // 默认使用智能发音
                    const defaultTtsSuccess = await this.playWordWithGoogleTTS(word);
                    if (!defaultTtsSuccess) {
                        await this.playWordWithIndividualKanaOnly(word);
                    }
            }
        } catch (error) {
            console.error('播放单词音频失败:', error);
            // 如果所有方法都失败，至少播放第一个假名
            if (word.length > 0) {
                await this.playKanaSound(word[0]);
            }
        }
    }

    async playWordWithGoogleTTS(word) {
        try {
            // 使用Google Text-to-Speech API
            const utterance = new SpeechSynthesisUtterance(word);

            // 设置日语语音
            utterance.lang = 'ja-JP';
            utterance.rate = 0.8; // 稍微慢一点，便于学习
            utterance.pitch = 1.0;
            utterance.volume = 0.8;

            // 尝试选择日语语音
            const voices = this.speechVoices.length > 0 ? this.speechVoices : speechSynthesis.getVoices();
            const japaneseVoice = voices.find(voice =>
                voice.lang.startsWith('ja') ||
                voice.name.includes('Japanese') ||
                voice.name.includes('Japan')
            );

            if (japaneseVoice) {
                utterance.voice = japaneseVoice;
                console.log('Using Japanese voice:', japaneseVoice.name);
            } else {
                console.log('No Japanese voice found, using default voice');
                // 如果没有日语语音，尝试使用最接近的语音
                const asianVoice = voices.find(voice =>
                    voice.lang.startsWith('zh') ||
                    voice.lang.startsWith('ko')
                );
                if (asianVoice) {
                    utterance.voice = asianVoice;
                    console.log('Using Asian voice as fallback:', asianVoice.name);
                }
            }

            return new Promise((resolve) => {
                utterance.onend = () => {
                    console.log('Google TTS playback completed for:', word);
                    resolve(true);
                };

                utterance.onerror = (event) => {
                    console.error('Google TTS error:', event.error);
                    resolve(false);
                };

                // 检查语音合成是否可用
                if ('speechSynthesis' in window) {
                    speechSynthesis.speak(utterance);
                } else {
                    console.warn('Speech synthesis not supported');
                    resolve(false);
                }
            });
        } catch (error) {
            console.error('Google TTS failed:', error);
            return false;
        }
    }

    async playWordWithIndividualKana(word) {
        // 逐个假名播放方法，播放完后跟上智能发音
        try {
            console.log('开始逐个假名播放:', word);

            // 第一步：逐个播放假名
            for (let i = 0; i < word.length; i++) {
                const kana = word[i];
                const romaji = this.getRomaji(kana);

                if (romaji) {
                    const audioPath = `../assets/audio/kana/${romaji}.mp3`;
                    const audio = new Audio(audioPath);

                    // 等待当前音频播放完成
                    await new Promise((resolve, reject) => {
                        audio.onended = resolve;
                        audio.onerror = reject;
                        audio.play().catch(reject);
                    });

                    // 在假名之间添加短暂停顿
                    if (i < word.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 200));
                    }
                }
            }

            // 第二步：逐个假名播放完成后，添加停顿，然后播放完整单词
            console.log('逐个假名播放完成，准备播放完整单词');
            await new Promise(resolve => setTimeout(resolve, 500)); // 停顿500ms

            // 第三步：播放完整单词的智能发音
            console.log('开始播放完整单词:', word);
            const ttsSuccess = await this.playWordWithGoogleTTS(word);

            if (!ttsSuccess) {
                console.log('智能发音播放失败，跳过');
            } else {
                console.log('完整单词播放完成');
            }

        } catch (error) {
            console.error('Individual kana playback failed:', error);
            throw error;
        }
    }

    async playWordWithIndividualKanaOnly(word) {
        // 仅逐个假名播放方法，不包含后续的智能发音
        try {
            console.log('开始仅逐个假名播放:', word);

            for (let i = 0; i < word.length; i++) {
                const kana = word[i];
                const romaji = this.getRomaji(kana);

                if (romaji) {
                    const audioPath = `../assets/audio/kana/${romaji}.mp3`;
                    const audio = new Audio(audioPath);

                    // 等待当前音频播放完成
                    await new Promise((resolve, reject) => {
                        audio.onended = resolve;
                        audio.onerror = reject;
                        audio.play().catch(reject);
                    });

                    // 在假名之间添加短暂停顿
                    if (i < word.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 200));
                    }
                }
            }

            console.log('仅逐个假名播放完成');

        } catch (error) {
            console.error('Individual kana only playback failed:', error);
            throw error;
        }
    }

    updateMiniLangLabel() {
        const miniLangLabel = document.getElementById('mini-current-lang-label');
        if (miniLangLabel && window.langData) {
            const langKey = 'lang_label_' + this.currentLang;
            if (window.langData[langKey]) {
                miniLangLabel.textContent = window.langData[langKey];
            }
        }
    }

    playClickSound() {
        try {
            // 播放轻微的点击音效
            const audio = new Audio('../assets/audio/correct.mp3');
            audio.volume = 0.3; // 降低音量
            audio.play().catch(error => {
                console.log('Click sound not available:', error);
            });
        } catch (error) {
            console.log('Click sound error:', error);
        }
    }

    // 添加背景音乐控制
    setupBGMControl() {
        const bgmToggle = document.getElementById('bgm-toggle');
        if (bgmToggle) {
            bgmToggle.addEventListener('click', () => {
                // 这里可以添加背景音乐控制逻辑
                console.log('BGM toggle clicked');
            });
        }
    }

    // 添加键盘支持
    setupKeyboardSupport() {
        document.addEventListener('keydown', (event) => {
            // 空格键播放当前假名发音
            if (event.code === 'Space') {
                event.preventDefault();
                this.playKanaSound(this.currentKana);
            }
        });
    }

    // 添加触摸支持
    setupTouchSupport() {
        // 为移动设备优化触摸体验
        document.addEventListener('touchstart', () => {}, { passive: true });
    }

    // 错误处理
    handleError(error, context = '') {
        console.error(`Error in ${context}:`, error);
        // 可以在这里添加用户友好的错误提示
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('Initializing Kana Reader Game...');
        const game = new KanaReaderGame();

        // 等待游戏初始化完成后再设置其他功能
        setTimeout(() => {
            game.setupBGMControl();
            game.setupKeyboardSupport();
            game.setupTouchSupport();
            console.log('Kana Reader Game initialized successfully');
        }, 100);
    } catch (error) {
        console.error('Failed to initialize Kana Reader Game:', error);
    }
});
