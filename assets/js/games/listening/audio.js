/**
 * 音效管理器
 */
class AudioManager {
    constructor() {
        // 音效
        this.sounds = {
            correct: new Audio('../assets/audio/correct.mp3'),
            incorrect: new Audio('../assets/audio/incorrect.mp3'),
            success: new Audio('../assets/audio/success.mp3')
        };

        // 背景音乐
        this.bgm = new Audio('../assets/audio/background.mp3');
        this.bgm.loop = true; // 循环播放
        this.bgm.volume = 0.3; // 设置音量为30%

        // 预加载所有音效
        Object.values(this.sounds).forEach(audio => {
            audio.load();
        });
        this.bgm.load();

        // 背景音乐状态
        this.isBgmPlaying = false;
    }

    /**
     * 播放正确答案音效
     */
    playCorrect() {
        this.sounds.correct.currentTime = 0;
        this.sounds.correct.play().catch(err => console.log('音效播放失败:', err));
    }

    /**
     * 播放错误答案音效
     */
    playIncorrect() {
        this.sounds.incorrect.currentTime = 0;
        this.sounds.incorrect.play().catch(err => console.log('音效播放失败:', err));
    }

    /**
     * 播放成功音效
     */
    playSuccess() {
        this.sounds.success.currentTime = 0;
        this.sounds.success.volume = 0.3;
        this.sounds.success.play().catch(err => console.log('音效播放失败:', err));
    }

    /**
     * 播放/暂停背景音乐
     * @returns {boolean} 当前播放状态
     */
    toggleBgm() {
        if (this.isBgmPlaying) {
            this.bgm.pause();
            this.isBgmPlaying = false;
        } else {
            this.bgm.play().catch(err => console.log('背景音乐播放失败:', err));
            this.isBgmPlaying = true;
        }
        return this.isBgmPlaying;
    }

    /**
     * 获取背景音乐播放状态
     * @returns {boolean}
     */
    isBgmActive() {
        return this.isBgmPlaying;
    }
}

// 创建全局音效管理器实例
const audioManager = new AudioManager(); 