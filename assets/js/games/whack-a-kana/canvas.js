// 使用handwriting.js库实现手写假名识别
class WritingCanvas {
    constructor(canvasId) {
        // 初始化handwriting.js的Canvas对象
        this.handwritingCanvas = new handwriting.Canvas(document.getElementById(canvasId));
        this.canvas = document.getElementById(canvasId);
        
        // 设置handwriting.js的选项
        this.handwritingCanvas.setOptions({
            language: "ja", // 日语
            numOfReturn: 5  // 返回5个可能的结果
        });
        
        // 设置线条宽度
        this.handwritingCanvas.setLineWidth(3);
        
        // 假名数据
        this.kanaMapping = null;
        
        // 加载假名数据
        this.loadKanaData();
        
        // 设置回调函数
        this.handwritingCanvas.setCallBack(this.handleRecognitionResult.bind(this));
    }
    
    // 处理识别结果的回调函数
    handleRecognitionResult(results, err) {
        if (err) {
            console.error('识别错误:', err);
            return null;
        }
        
        if (!results || results.length === 0 || !this.kanaMapping) {
            return null;
        }
        
        // 获取第一个结果（最可能的假名）
        const kana = results[0];
        let romaji = '';
        
        // 查找对应的罗马音
        if (this.kanaMapping) {
            if (this.kanaMapping.basic[kana]) {
                romaji = this.kanaMapping.basic[kana];
            } else if (this.kanaMapping.dakuon[kana]) {
                romaji = this.kanaMapping.dakuon[kana];
            } else if (this.kanaMapping.youon[kana]) {
                romaji = this.kanaMapping.youon[kana];
            }
        }
        
        // 播放对应的假名音频
        if (audioManager && typeof audioManager.playKanaSound === 'function' && romaji) {
            audioManager.playKanaSound(romaji);
        }
        
        // 返回识别结果
        return {
            kana: kana,
            romaji: romaji,
            confidence: 0.8 // 固定置信度，因为handwriting.js没有提供置信度
        };
    }
    
    loadKanaData() {
        // 加载假名映射数据
        fetch('../assets/audio/kana/kana_mapping.json')
            .then(res => res.json())
            .then(data => {
                this.kanaMapping = data;
                console.log('假名数据加载成功');
            })
            .catch(err => console.error('加载假名数据失败:', err));
    }
    
    clear() {
        // 使用handwriting.js的erase方法清除画布
        this.handwritingCanvas.erase();
    }
    
    /**
     * 识别手写假名
     * @returns {Object} 识别结果，包含假名和罗马音
     */
    recognizeKana() {
        // 检查数据是否已加载
        if (!this.kanaMapping) {
            console.warn('假名数据尚未加载完成，请稍后再试');
            return null;
        }
        
        // 使用handwriting.js的recognize方法进行识别
        this.handwritingCanvas.recognize();
        
        // 注意：实际的识别结果会在回调函数中处理
        // 这里返回null，因为识别是异步的
        return null;
    }
}

// 初始化手写板
const writingCanvas = new WritingCanvas('writing-canvas');

// 清除按钮
document.getElementById('clear-canvas').addEventListener('click', () => {
    writingCanvas.clear();
});

// 识别按钮
document.getElementById('recognize-kana').addEventListener('click', () => {
    // 调用识别方法
    writingCanvas.recognizeKana();
    
    // 由于handwriting.js的识别是异步的，我们需要在回调中处理结果
    // 修改handwritingCanvas的回调函数来处理识别结果
    writingCanvas.handwritingCanvas.setCallBack((results, err) => {
        const resultDisplay = document.getElementById('recognition-result');
        
        if (err || !results || results.length === 0) {
            resultDisplay.textContent = '无法识别，请重试';
            resultDisplay.classList.add('error');
            setTimeout(() => resultDisplay.classList.remove('error'), 1500);
            return;
        }
        
        // 获取第一个结果（最可能的假名）
        const kana = results[0];
        let romaji = '';
        
        // 查找对应的罗马音
        if (writingCanvas.kanaMapping) {
            if (writingCanvas.kanaMapping.basic[kana]) {
                romaji = writingCanvas.kanaMapping.basic[kana];
            } else if (writingCanvas.kanaMapping.dakuon[kana]) {
                romaji = writingCanvas.kanaMapping.dakuon[kana];
            } else if (writingCanvas.kanaMapping.youon[kana]) {
                romaji = writingCanvas.kanaMapping.youon[kana];
            }
        }
        
        // 显示识别结果
        resultDisplay.textContent = `识别结果: ${kana} (${romaji || '未知'})`;
        resultDisplay.classList.add('success');
        setTimeout(() => resultDisplay.classList.remove('success'), 1500);
        
        // 播放对应的假名音频
        if (audioManager && typeof audioManager.playKanaSound === 'function' && romaji) {
            audioManager.playKanaSound(romaji);
        }
        
        // 检查是否与当前游戏中的假名匹配
        if (window.game && typeof window.game.checkAnswer === 'function') {
            const isCorrect = window.game.checkAnswer(kana);
            
            // 识别完成后自动清除画布
            setTimeout(() => {
                writingCanvas.clear();
            }, 500); // 延迟500毫秒后清除，让用户有时间看到结果
        }
    });
});

// 导出给游戏使用
window.writingCanvas = writingCanvas;