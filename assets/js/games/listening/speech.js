/**
 * 语音合成模块
 * 使用Web Speech API实现假名发音
 */

class SpeechManager {
    constructor() {
        this.synth = window.speechSynthesis;
        this.voices = [];
        this.japaneseVoice = null;
        this.isVoicesLoaded = false;
        this.fallbackMode = false;

        // 语音参数设置
        this.defaultRate = 0.8;  // 语速稍慢一点，更清晰
        this.defaultPitch = 1.0; // 默认音调
        
        // 初始化
        this.init();
    }

    /**
     * 初始化语音系统
     */
    init() {
        // 检查浏览器是否支持语音合成API
        if (!('speechSynthesis' in window)) {
            console.error('您的浏览器不支持语音合成API');
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
        } else {
            console.warn('未找到日语语音，将使用默认语音');
            // 使用默认语音或第一个可用语音
            this.japaneseVoice = this.voices[0];
        }

        this.isVoicesLoaded = true;
    }

    /**
     * 播放文本
     * @param {string} text 要播放的文本
     * @returns {Promise} 播放完成的Promise
     */
    speak(text) {
        return new Promise((resolve, reject) => {
            // 检查是否处于回退模式
            if (this.fallbackMode) {
                console.warn('语音合成不可用，无法播放');
                reject(new Error('语音合成不可用'));
                return;
            }

            // 检查语音是否已加载
            if (!this.isVoicesLoaded) {
                console.warn('语音尚未加载完成，稍后再试');
                setTimeout(() => {
                    this.speak(text).then(resolve).catch(reject);
                }, 1000);
                return;
            }

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
            utterance.onend = () => {
                resolve();
            };
            
            utterance.onerror = (event) => {
                console.error('语音合成错误:', event);
                reject(new Error('语音合成错误'));
            };
            
            // 播放语音
            this.synth.speak(utterance);
        });
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
        return this.isVoicesLoaded && !this.fallbackMode;
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
            voiceName: this.japaneseVoice ? this.japaneseVoice.name : null
        };
    }
}

// 创建语音管理器实例
const speechManager = new SpeechManager(); 