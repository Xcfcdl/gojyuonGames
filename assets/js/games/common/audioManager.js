// 通用音频管理器
// 支持：BGM、正确/错误音效、假名发音、音效静音、假名音频缓存
// 用法：const audioManager = new AudioManager(options)

class AudioManager {
    /**
     * @param {Object} options 可选配置项
     *   - basePath: 音频基础路径（默认 '../assets/audio/')
     *   - kanaMappingPath: 假名映射文件路径（默认 '../assets/audio/kana/kana_mapping.json'）
     *   - enableKana: 是否启用假名发音（默认 true）
     *   - enableBgm: 是否启用BGM（默认 true）
     */
    constructor(options = {}) {
        this.basePath = options.basePath || '../assets/audio/';
        this.kanaMappingPath = options.kanaMappingPath || this.basePath + 'kana/kana_mapping.json';
        this.enableKana = options.enableKana !== false;
        this.enableBgm = options.enableBgm !== false;

        // 音效
        this.sounds = {
            correct: new Audio(this.basePath + 'correct.mp3'),
            incorrect: new Audio(this.basePath + 'incorrect.mp3'),
            success: new Audio(this.basePath + 'success.mp3')
        };
        Object.values(this.sounds).forEach(audio => audio.load());

        // BGM
        this.bgm = new Audio(this.basePath + 'background.mp3');
        this.bgm.loop = true;
        this.bgm.volume = 0.3;
        this.bgm.load();
        this.isBgmPlaying = false;

        // 假名音频缓存
        this.kanaAudioCache = {};
        this.kanaMapping = null;
        this.kanaMappingLoaded = false;
        if (this.enableKana) this.loadKanaMapping();

        // 音效静音
        this.areSoundEffectsMuted = false;
    }

    // 加载假名映射
    loadKanaMapping() {
        fetch(this.kanaMappingPath)
            .then(res => res.json())
            .then(data => {
                this.kanaMapping = data;
                this.kanaMappingLoaded = true;
                // console.log('共用音频管理器假名数据加载成功');
            })
            .catch(err => console.error('加载假名数据失败:', err));
    }

    // BGM控制
    toggleBgm() {
        if (!this.enableBgm) return false;
        if (this.isBgmPlaying) {
            this.bgm.pause();
            this.isBgmPlaying = false;
        } else {
            this.bgm.play().catch(e => console.error('背景音乐播放失败:', e));
            this.isBgmPlaying = true;
        }
        return this.isBgmPlaying;
    }
    isBgmActive() {
        return this.isBgmPlaying;
    }

    // 音效静音
    toggleSoundEffects() {
        this.areSoundEffectsMuted = !this.areSoundEffectsMuted;
        return this.areSoundEffectsMuted;
    }
    isSoundEffectsMuted() {
        return this.areSoundEffectsMuted;
    }

    // 正确/错误/成功音效
    playCorrect() {
        if (this.areSoundEffectsMuted) return;
        this.sounds.correct.currentTime = 0;
        this.sounds.correct.play().catch(e => {});
    }
    playIncorrect() {
        if (this.areSoundEffectsMuted) return;
        this.sounds.incorrect.currentTime = 0;
        this.sounds.incorrect.play().catch(e => {});
    }
    playSuccess() {
        if (this.areSoundEffectsMuted) return;
        this.sounds.success.currentTime = 0;
        this.sounds.success.volume = 0.3;
        this.sounds.success.play().catch(e => {});
    }

    // 假名发音（支持平假名、片假名、浊音、拗音）
    playKanaSound(kana) {
        if (!this.enableKana || this.areSoundEffectsMuted) return;
        let romajiCode = kana;
        // 检查是否是日文假名字符
        if (/^[\u3040-\u309F\u30A0-\u30FF]$/.test(kana)) {
            // 是假名字符
            if (!this.kanaMappingLoaded) {
                this.loadKanaMapping();
                setTimeout(() => this.playKanaSound(kana), 200);
                return;
            }
            if (this.kanaMapping) {
                if (this.kanaMapping.basic && this.kanaMapping.basic[kana]) {
                    romajiCode = this.kanaMapping.basic[kana];
                } else if (this.kanaMapping.dakuon && this.kanaMapping.dakuon[kana]) {
                    romajiCode = this.kanaMapping.dakuon[kana];
                } else if (this.kanaMapping.youon && this.kanaMapping.youon[kana]) {
                    romajiCode = this.kanaMapping.youon[kana];
                } else if (this.kanaMapping.katakana && this.kanaMapping.katakana[kana]) {
                    romajiCode = this.kanaMapping.katakana[kana];
                } else {
                    // console.error(`未找到假名${kana}的罗马音映射`);
                    return;
                }
            }
        }
        // 检查缓存
        if (!this.kanaAudioCache[romajiCode]) {
            this.kanaAudioCache[romajiCode] = new Audio(this.basePath + 'kana/' + romajiCode + '.mp3');
        }
        this.kanaAudioCache[romajiCode].play().catch(e => {});
    }
}

// 推荐全局单例
window.audioManager = new AudioManager();
export default AudioManager; 