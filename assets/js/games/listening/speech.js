/**
 * 语音合成模块
 * 使用Web Speech API实现假名发音，本地音频作为备用
 */

class SpeechManager {
    constructor() {
        this.synth = window.speechSynthesis;
        this.voices = [];
        this.japaneseVoice = null;
        this.isVoicesLoaded = false;
        this.fallbackMode = false;
        this.kanaMapping = null;
        this.audioContext = null;

        // 语音参数设置
        this.defaultRate = 0.8;  // 语速稍慢一点，更清晰
        this.defaultPitch = 1.0; // 默认音调
        
        // 初始化
        this.init();
    }

    /**
     * 初始化语音系统
     */
    async init() {
        try {
            // 加载假名映射文件
            await this.loadKanaMapping();
            
            // 检查浏览器是否支持语音合成API
            if (!('speechSynthesis' in window)) {
                console.warn('浏览器不支持语音合成API，将使用本地音频');
                this.fallbackMode = true;
                return;
            }

            // 加载可用的语音
            this.loadVoices();

            // 如果语音列表已加载，直接处理；否则添加事件监听器等待加载
            if (this.synth.getVoices().length > 0) {
                this.processVoices(this.synth.getVoices());
            } else {
                // Chrome需要等待voiceschanged事件
                this.synth.addEventListener('voiceschanged', () => {
                    this.processVoices(this.synth.getVoices());
                });
            }

            // 初始化音频上下文（用于本地音频播放）
            this.initAudioContext();
        } catch (error) {
            console.error('语音系统初始化失败:', error);
            this.fallbackMode = true;
        }
    }

    /**
     * 加载假名映射文件
     */
    async loadKanaMapping() {
        try {
            const response = await fetch('/assets/audio/kana/kana_mapping.json');
            this.kanaMapping = await response.json();
            console.log('假名映射加载成功');
        } catch (error) {
            console.error('加载假名映射失败:', error);
            throw error;
        }
    }

    /**
     * 初始化音频上下文
     */
    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.error('创建音频上下文失败:', error);
        }
    }

    /**
     * 加载语音列表
     */
    loadVoices() {
        try {
            this.voices = this.synth.getVoices();
        } catch (error) {
            console.error('加载语音失败:', error);
            this.fallbackMode = true;
        }
    }

    /**
     * 处理语音列表，查找日语语音
     * @param {Array} voices 语音列表
     */
    processVoices(voices) {
        this.voices = voices;
        
        // 查找日语语音
        this.japaneseVoice = this.voices.find(voice => 
            voice.lang === 'ja-JP' || 
            voice.lang === 'ja' || 
            voice.name.toLowerCase().includes('japanese')
        );

        if (this.japaneseVoice) {
            console.log('已找到日语语音:', this.japaneseVoice.name);
            this.isVoicesLoaded = true;
        } else {
            console.warn('未找到日语语音，将使用本地音频');
            this.fallbackMode = true;
        }
    }

    /**
     * 获取假名对应的音频文件路径
     * @param {string} kana 假名字符
     * @returns {string|null} 音频文件路径
     */
    getAudioPath(kana) {
        if (!this.kanaMapping) return null;

        // 检查是否是片假名
        const isKatakana = this.kanaMapping.katakana[kana];
        if (isKatakana) {
            return `/assets/audio/kana/${isKatakana}.mp3`;
        }

        // 检查基本假名
        const basicRomaji = this.kanaMapping.basic[kana];
        if (basicRomaji) {
            return `/assets/audio/kana/${basicRomaji}.mp3`;
        }

        // 检查浊音
        const dakuonRomaji = this.kanaMapping.dakuon[kana];
        if (dakuonRomaji) {
            return `/assets/audio/kana/${dakuonRomaji}.mp3`;
        }

        // 检查拗音
        const youonRomaji = this.kanaMapping.youon[kana];
        if (youonRomaji) {
            return `/assets/audio/kana/${youonRomaji}.mp3`;
        }

        return null;
    }

    /**
     * 播放本地音频文件
     * @param {string} audioPath 音频文件路径
     * @returns {Promise} 播放完成的Promise
     */
    async playLocalAudio(audioPath) {
        return new Promise((resolve, reject) => {
            const audio = new Audio(audioPath);
            
            audio.onended = () => {
                resolve();
            };
            
            audio.onerror = (error) => {
                console.error('播放本地音频失败:', error);
                reject(error);
            };
            
            audio.play().catch(reject);
        });
    }

    /**
     * 使用Web Speech API播放文本
     * @param {string} text 要播放的文本
     * @returns {Promise} 播放完成的Promise
     */
    speakWithAPI(text) {
        return new Promise((resolve, reject) => {
            // 取消所有正在播放的内容
            this.cancel();

            // 创建语音对象
            const utterance = new SpeechSynthesisUtterance(text);
            
            // 设置语音参数
            utterance.voice = this.japaneseVoice;
            utterance.lang = 'ja-JP';
            utterance.rate = this.defaultRate;
            utterance.pitch = this.defaultPitch;
            
            // 设置事件处理
            utterance.onend = () => resolve();
            utterance.onerror = (event) => reject(new Error('语音合成错误'));
            
            // 播放语音
            this.synth.speak(utterance);
        });
    }

    /**
     * 播放文本
     * @param {string} text 要播放的文本
     * @returns {Promise} 播放完成的Promise
     */
    async speak(text) {
        try {
            // 优先使用Web Speech API
            if (!this.fallbackMode && this.isVoicesLoaded) {
                await this.speakWithAPI(text);
                return;
            }

            // 如果Web Speech API不可用或失败，使用本地音频
            const audioPath = this.getAudioPath(text);
            if (audioPath) {
                await this.playLocalAudio(audioPath);
            } else {
                throw new Error('找不到对应的音频文件');
            }
        } catch (error) {
            console.error('播放失败:', error);
            throw error;
        }
    }

    /**
     * 取消当前播放
     */
    cancel() {
        if (this.synth) {
            this.synth.cancel();
        }
    }

    /**
     * 检查语音系统是否准备就绪
     * @returns {boolean} 是否可用
     */
    isReady() {
        return (this.isVoicesLoaded || this.fallbackMode) && this.kanaMapping !== null;
    }

    /**
     * 获取语音状态信息
     * @returns {Object} 状态信息对象
     */
    getStatus() {
        return {
            isReady: this.isReady(),
            fallbackMode: this.fallbackMode,
            voicesLoaded: this.isVoicesLoaded,
            japaneseVoiceAvailable: !!this.japaneseVoice,
            voiceName: this.japaneseVoice ? this.japaneseVoice.name : null,
            hasKanaMapping: !!this.kanaMapping
        };
    }
}

// 创建语音管理器实例
const speechManager = new SpeechManager(); 