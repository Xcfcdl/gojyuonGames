// 通用假名与关卡数据加载模块
// 用法：const dataLoader = new DataLoader(options)

class DataLoader {
    constructor(options = {}) {
        this.kanaData = {};
        this.levels = [];
        this.kanaCsvPath = options.kanaCsvPath || '../assets/data/kana.csv';
        this.levelsCsvPath = options.levelsCsvPath || '../assets/data/levels.csv';
    }
    parseCSV(csv) {
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const values = lines[i].split(',').map(v => v.trim());
            const entry = {};
            headers.forEach((header, index) => {
                let value = values[index];
                if (value && value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                }
                entry[header] = value;
            });
            data.push(entry);
        }
        return data;
    }
    async loadKanaData() {
        try {
            const response = await fetch(this.kanaCsvPath);
            const csv = await response.text();
            const data = this.parseCSV(csv);
            data.forEach(item => {
                if (!this.kanaData[item.row_group]) {
                    this.kanaData[item.row_group] = [];
                }
                const kanaEntry = {
                    char: item.hiragana || '',
                    katakana: item.katakana || '',
                    romaji: item.romaji || '',
                    type: item.type || 'basic'
                };
                if (kanaEntry.char || kanaEntry.katakana) {
                    this.kanaData[item.row_group].push(kanaEntry);
                }
            });
            return this.kanaData;
        } catch (error) {
            throw error;
        }
    }
    async loadLevelData() {
        try {
            const response = await fetch(this.levelsCsvPath);
            const csv = await response.text();
            const data = this.parseCSV(csv);
            this.levels = data.map(item => {
                const rows = item.rows.split(/[\s,]+/).filter(row => row.trim());
                return {
                    id: parseInt(item.id),
                    category: item.category,
                    type: item.type,
                    name: {
                        zh: item.name_zh || item.name,
                        ja: item.name_ja || item.name,
                        en: item.name_en || item.name
                    },
                    rows: rows,
                    description: {
                        zh: item.description_zh || item.description,
                        ja: item.description_ja || item.description,
                        en: item.description_en || item.description
                    },
                    requiredScore: parseInt(item.required_score),
                    useKatakana: item.use_katakana === 'true',
                    useMixed: item.use_mixed === 'true'
                };
            });
            return this.levels;
        } catch (error) {
            throw error;
        }
    }
    async init() {
        await Promise.all([
            this.loadKanaData(),
            this.loadLevelData()
        ]);
        return {
            kanaData: this.kanaData,
            levels: this.levels
        };
    }
}

// 推荐全局单例
window.dataLoader = new DataLoader();
export default DataLoader;

export function getKanaList() {
    // 展平成一维数组
    if (!window.dataLoader.kanaData) return [];
    return Object.values(window.dataLoader.kanaData).flat();
}

export function getKanaTable() {
    // 返回二维数组
    if (!window.dataLoader.kanaData) return [];
    return Object.values(window.dataLoader.kanaData);
}

export function getPresetKana(preset) {
    // 这里只做简单示例，实际可根据 preset 筛选
    return getKanaList().map(k => k.romaji);
} 