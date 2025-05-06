class AudioManager {
    constructor() {
        // 音频元素
        this.bgmAudio = new Audio('../assets/audio/background.mp3');
        this.correctAudio = new Audio('../assets/audio/correct.mp3');
        this.incorrectAudio = new Audio('../assets/audio/incorrect.mp3');
        
        // 音频状态
        this.isBgmPlaying = false;
        this.areSoundEffectsMuted = false;
        
        // 假名音频缓存
        this.kanaAudioCache = {};
        
        // 假名映射数据
        this.kanaMapping = null;
        
        // 初始化音频
        this.initAudio();
        
        // 加载假名映射数据
        this.loadKanaMapping();
    }
    
    initAudio() {
        // 设置背景音乐循环
        this.bgmAudio.loop = true;
        this.bgmAudio.volume = 0.3; // 设置音量为30%
        this.correctAudio.volume = 0.2; // 设置音量为50%
        this.incorrectAudio.volume = 0.2; // 设置音量为50%
        // 预加载音效
        this.preloadAudio();
    }
    
    loadKanaMapping() {
        // 加载假名映射数据
        fetch('../assets/audio/kana/kana_mapping.json')
            .then(res => res.json())
            .then(data => {
                this.kanaMapping = data;
                console.log('音频管理器假名数据加载成功');
            })
            .catch(err => console.error('加载假名数据失败:', err));
    }
    
    preloadAudio() {
        // 预加载常用音效
        this.correctAudio.load();
        this.incorrectAudio.load();
    }
    
    toggleBgm() {
        if (this.isBgmPlaying) {
            this.bgmAudio.pause();
            this.isBgmPlaying = false;
        } else {
            this.bgmAudio.play().catch(e => console.error('背景音乐播放失败:', e));
            this.isBgmPlaying = true;
        }
        return this.isBgmPlaying;
    }
    
    toggleSoundEffects() {
        this.areSoundEffectsMuted = !this.areSoundEffectsMuted;
        return this.areSoundEffectsMuted;
    }
    
    playKanaSound(kana) {
        if (this.areSoundEffectsMuted) return;
        
        // 如果传入的是假名字符，需要查找对应的罗马音
        let romajiCode = kana;
        
        // 检查是否是日文假名字符
        if (/[\u3040-\u309F\u30A0-\u30FF]/.test(kana)) {
            // 加载假名映射数据（如果尚未加载）
            if (!this.kanaMapping) {
                fetch('../assets/audio/kana/kana_mapping.json')
                    .then(res => res.json())
                    .then(data => {
                        this.kanaMapping = data;
                        // 重新尝试播放
                        this.playKanaSound(kana);
                    })
                    .catch(err => console.error('加载假名数据失败:', err));
                return;
            }
            
            // 查找对应的罗马音
            if (this.kanaMapping) {
                if (this.kanaMapping.basic[kana]) {
                    romajiCode = this.kanaMapping.basic[kana];
                } else if (this.kanaMapping.dakuon[kana]) {
                    romajiCode = this.kanaMapping.dakuon[kana];
                } else if (this.kanaMapping.youon[kana]) {
                    romajiCode = this.kanaMapping.youon[kana];
                } else if (this.kanaMapping.katakana[kana]) {
                    romajiCode = this.kanaMapping.katakana[kana];
                } else {
                    console.error(`未找到假名${kana}的罗马音映射`);
                    return;
                }
            }
        }
        
        // 检查缓存
        if (!this.kanaAudioCache[romajiCode]) {
            this.kanaAudioCache[romajiCode] = new Audio(`../assets/audio/kana/${romajiCode}.mp3`);
        }
        
        // 播放音频
        this.kanaAudioCache[romajiCode].play().catch(e => console.error(`假名${kana}(${romajiCode})发音播放失败:`, e));
    }
    
    playCorrectSound() {
        if (this.areSoundEffectsMuted) return;
        this.correctAudio.currentTime = 0;
        this.correctAudio.play().catch(e => console.error('正确音效播放失败:', e));
    }
    
    playIncorrectSound() {
        if (this.areSoundEffectsMuted) return;
        this.incorrectAudio.currentTime = 0;
        this.incorrectAudio.play().catch(e => console.error('错误音效播放失败:', e));
    }
    
    areSoundEffectsMuted() {
        return this.areSoundEffectsMuted;
    }
}

// 全局音频管理器
const audioManager = new AudioManager();