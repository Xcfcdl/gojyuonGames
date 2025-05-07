// 通用语音合成与假名发音管理器
// 用法：const speechManager = new SpeechManager(options)

class SpeechManager {
    constructor(options = {}) {
        this.synth = window.speechSynthesis;
        this.voices = [];
        this.japaneseVoice = null;
        this.isVoicesLoaded = false;
        this.fallbackMode = false;
        this.kanaMapping = null;
        this.audioContext = null;
        this.defaultRate = options.defaultRate || 0.8;
        this.defaultPitch = options.defaultPitch || 1.0;
        this.kanaMappingPath = options.kanaMappingPath || '/assets/audio/kana/kana_mapping.json';
        this.init();
    }
    async init() {
        try {
            await this.loadKanaMapping();
            if (!('speechSynthesis' in window)) {
                this.fallbackMode = true;
                return;
            }
            this.loadVoices();
            if (this.synth.getVoices().length > 0) {
                this.processVoices(this.synth.getVoices());
            } else {
                this.synth.addEventListener('voiceschanged', () => {
                    this.processVoices(this.synth.getVoices());
                });
            }
            this.initAudioContext();
        } catch (error) {
            this.fallbackMode = true;
        }
    }
    async loadKanaMapping() {
        try {
            const response = await fetch(this.kanaMappingPath);
            this.kanaMapping = await response.json();
        } catch (error) {
            throw error;
        }
    }
    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {}
    }
    loadVoices() {
        try {
            this.voices = this.synth.getVoices();
        } catch (error) {
            this.fallbackMode = true;
        }
    }
    processVoices(voices) {
        this.voices = voices;
        this.japaneseVoice = this.voices.find(voice =>
            voice.lang === 'ja-JP' ||
            voice.lang === 'ja' ||
            voice.name.toLowerCase().includes('japanese')
        );
        if (this.japaneseVoice) {
            this.isVoicesLoaded = true;
        } else {
            this.fallbackMode = true;
        }
    }
    getAudioPath(kana) {
        if (!this.kanaMapping) return null;
        const isKatakana = this.kanaMapping.katakana && this.kanaMapping.katakana[kana];
        if (isKatakana) {
            return `/assets/audio/kana/${isKatakana}.mp3`;
        }
        const basicRomaji = this.kanaMapping.basic && this.kanaMapping.basic[kana];
        if (basicRomaji) {
            return `/assets/audio/kana/${basicRomaji}.mp3`;
        }
        const dakuonRomaji = this.kanaMapping.dakuon && this.kanaMapping.dakuon[kana];
        if (dakuonRomaji) {
            return `/assets/audio/kana/${dakuonRomaji}.mp3`;
        }
        const youonRomaji = this.kanaMapping.youon && this.kanaMapping.youon[kana];
        if (youonRomaji) {
            return `/assets/audio/kana/${youonRomaji}.mp3`;
        }
        return null;
    }
    async playLocalAudio(audioPath) {
        return new Promise((resolve, reject) => {
            const audio = new Audio(audioPath);
            audio.onended = () => resolve();
            audio.onerror = (error) => reject(error);
            audio.play().catch(reject);
        });
    }
    speakWithAPI(text) {
        return new Promise((resolve, reject) => {
            this.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.voice = this.japaneseVoice;
            utterance.lang = 'ja-JP';
            utterance.rate = this.defaultRate;
            utterance.pitch = this.defaultPitch;
            utterance.onend = () => resolve();
            utterance.onerror = () => reject(new Error('语音合成错误'));
            this.synth.speak(utterance);
        });
    }
    async speak(text) {
        try {
            if (!this.fallbackMode && this.isVoicesLoaded) {
                await this.speakWithAPI(text);
                return;
            }
            const audioPath = this.getAudioPath(text);
            if (audioPath) {
                await this.playLocalAudio(audioPath);
            } else {
                throw new Error('找不到对应的音频文件');
            }
        } catch (error) {
            throw error;
        }
    }
    cancel() {
        if (this.synth) {
            this.synth.cancel();
        }
    }
    isReady() {
        return (this.isVoicesLoaded || this.fallbackMode) && this.kanaMapping !== null;
    }
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

// 推荐全局单例
window.speechManager = new SpeechManager();
export default SpeechManager; 