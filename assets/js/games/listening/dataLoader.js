/**
 * 数据加载器
 * 负责从CSV文件加载假名和关卡数据
 */
class DataLoader {
    constructor() {
        this.kanaData = {};
        this.levels = [];
    }

    /**
     * 解析CSV文本
     * @param {string} csv CSV文本内容
     * @returns {Array} 解析后的数据数组
     */
    parseCSV(csv) {
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            const values = lines[i].split(',').map(v => v.trim());
            const entry = {};
            
            headers.forEach((header, index) => {
                // 处理带引号的值（例如包含逗号的数组）
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

    /**
     * 加载假名数据
     * @returns {Promise} 加载完成的Promise
     */
    async loadKanaData() {
        try {
            const response = await fetch('../assets/data/kana.csv');
            const csv = await response.text();
            const data = this.parseCSV(csv);
            
            console.log('解析到的CSV数据条数:', data.length);
            
            // 按行组织假名数据
            data.forEach(item => {
                if (!this.kanaData[item.row_group]) {
                    this.kanaData[item.row_group] = [];
                    console.log('创建新的假名组:', item.row_group);
                }
                
                // 确保所有必要的字段都存在
                const kanaEntry = {
                    char: item.hiragana || '',
                    katakana: item.katakana || '',
                    romaji: item.romaji || '',
                    type: item.type || 'basic'
                };
                
                // 只有当假名数据有效时才添加
                if (kanaEntry.char || kanaEntry.katakana) {
                    this.kanaData[item.row_group].push(kanaEntry);
                } else {
                    console.warn('跳过无效的假名数据:', item);
                }
            });
            
            // 检查每个假名组的数据
            Object.entries(this.kanaData).forEach(([group, kanas]) => {
                console.log(`假名组 ${group} 包含 ${kanas.length} 个假名`);
            });
            
            // 添加拗音数据
            const youonGroups = ['kya', 'sha', 'cha', 'nya', 'hya', 'mya', 'rya', 'gya', 'ja', 'bya', 'pya'];
            youonGroups.forEach(group => {
                if (!this.kanaData[group]) {
                    console.warn(`拗音组 ${group} 未找到`);
                }
            });
            
            console.log('加载的假名数据:', this.kanaData);
            return this.kanaData;
        } catch (error) {
            console.error('加载假名数据失败:', error);
            throw error;
        }
    }

    /**
     * 加载关卡数据
     * @returns {Promise} 加载完成的Promise
     */
    async loadLevelData() {
        try {
            const response = await fetch('../assets/data/levels.csv');
            const csv = await response.text();
            const data = this.parseCSV(csv);
            
            // 处理关卡数据
            this.levels = data.map(item => {
                // 分割行ID并移除空格
                const rows = item.rows.split(/[\s,]+/).filter(row => row.trim());
                console.log(`关卡 ${item.name} 的行ID:`, rows);
                
                return {
                    id: parseInt(item.id),
                    category: item.category,
                    type: item.type,
                    name: item.name,
                    rows: rows,
                    description: item.description,
                    requiredScore: parseInt(item.required_score),
                    useKatakana: item.use_katakana === 'true',
                    useMixed: item.use_mixed === 'true'
                };
            });
            
            return this.levels;
        } catch (error) {
            console.error('加载关卡数据失败:', error);
            throw error;
        }
    }

    /**
     * 初始化所有数据
     * @returns {Promise} 加载完成的Promise
     */
    async init() {
        try {
            await Promise.all([
                this.loadKanaData(),
                this.loadLevelData()
            ]);
            
            return {
                kanaData: this.kanaData,
                levels: this.levels
            };
        } catch (error) {
            console.error('初始化数据失败:', error);
            throw error;
        }
    }
}

// 导出数据加载器实例
const dataLoader = new DataLoader(); 