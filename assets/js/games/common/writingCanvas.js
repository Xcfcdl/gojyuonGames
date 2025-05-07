// 通用手写假名识别模块
// 用法：const writingCanvas = new WritingCanvas(canvasId, options)

class WritingCanvas {
    constructor(canvasId, options = {}) {
        this.handwritingCanvas = new handwriting.Canvas(document.getElementById(canvasId));
        this.canvas = document.getElementById(canvasId);
        this.handwritingCanvas.setOptions({
            language: options.language || 'ja',
            numOfReturn: options.numOfReturn || 5
        });
        this.handwritingCanvas.setLineWidth(options.lineWidth || 3);
        this.kanaMapping = null;
        this.kanaMappingPath = options.kanaMappingPath || '../assets/audio/kana/kana_mapping.json';
        this.loadKanaData();
        this.handwritingCanvas.setCallBack(this.handleRecognitionResult.bind(this));
    }
    handleRecognitionResult(results, err) {
        if (err) return null;
        if (!results || results.length === 0 || !this.kanaMapping) return null;
        const kana = results[0];
        let romaji = '';
        if (this.kanaMapping) {
            if (this.kanaMapping.basic && this.kanaMapping.basic[kana]) {
                romaji = this.kanaMapping.basic[kana];
            } else if (this.kanaMapping.dakuon && this.kanaMapping.dakuon[kana]) {
                romaji = this.kanaMapping.dakuon[kana];
            } else if (this.kanaMapping.youon && this.kanaMapping.youon[kana]) {
                romaji = this.kanaMapping.youon[kana];
            }
        }
        return {
            kana: kana,
            romaji: romaji,
            confidence: 0.8
        };
    }
    loadKanaData() {
        fetch(this.kanaMappingPath)
            .then(res => res.json())
            .then(data => { this.kanaMapping = data; })
            .catch(err => {});
    }
    clear() {
        this.handwritingCanvas.erase();
    }
    recognizeKana() {
        if (!this.kanaMapping) return null;
        this.handwritingCanvas.recognize();
        return null;
    }
    setCallBack(cb) {
        this.handwritingCanvas.setCallBack(cb);
    }
}

// 推荐全局单例（如需）
// window.writingCanvas = new WritingCanvas('writing-canvas');
export default WritingCanvas; 