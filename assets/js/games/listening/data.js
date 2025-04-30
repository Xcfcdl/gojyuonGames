/**
 * 假名数据结构
 * 按行分组存储平假名和片假名及对应的罗马音
 */
const kanaData = {
    // あ行
    'a': [
        { char: 'あ', katakana: 'ア', romaji: 'a' },
        { char: 'い', katakana: 'イ', romaji: 'i' },
        { char: 'う', katakana: 'ウ', romaji: 'u' },
        { char: 'え', katakana: 'エ', romaji: 'e' },
        { char: 'お', katakana: 'オ', romaji: 'o' }
    ],
    // か行
    'ka': [
        { char: 'か', katakana: 'カ', romaji: 'ka' },
        { char: 'き', katakana: 'キ', romaji: 'ki' },
        { char: 'く', katakana: 'ク', romaji: 'ku' },
        { char: 'け', katakana: 'ケ', romaji: 'ke' },
        { char: 'こ', katakana: 'コ', romaji: 'ko' }
    ],
    // さ行
    'sa': [
        { char: 'さ', romaji: 'sa' },
        { char: 'し', romaji: 'shi' },
        { char: 'す', romaji: 'su' },
        { char: 'せ', romaji: 'se' },
        { char: 'そ', romaji: 'so' }
    ],
    // た行
    'ta': [
        { char: 'た', romaji: 'ta' },
        { char: 'ち', romaji: 'chi' },
        { char: 'つ', romaji: 'tsu' },
        { char: 'て', romaji: 'te' },
        { char: 'と', romaji: 'to' }
    ],
    // な行
    'na': [
        { char: 'な', romaji: 'na' },
        { char: 'に', romaji: 'ni' },
        { char: 'ぬ', romaji: 'nu' },
        { char: 'ね', romaji: 'ne' },
        { char: 'の', romaji: 'no' }
    ],
    // は行
    'ha': [
        { char: 'は', romaji: 'ha' },
        { char: 'ひ', romaji: 'hi' },
        { char: 'ふ', romaji: 'fu' },
        { char: 'へ', romaji: 'he' },
        { char: 'ほ', romaji: 'ho' }
    ],
    // ま行
    'ma': [
        { char: 'ま', romaji: 'ma' },
        { char: 'み', romaji: 'mi' },
        { char: 'む', romaji: 'mu' },
        { char: 'め', romaji: 'me' },
        { char: 'も', romaji: 'mo' }
    ],
    // や行
    'ya': [
        { char: 'や', romaji: 'ya' },
        { char: 'ゆ', romaji: 'yu' },
        { char: 'よ', romaji: 'yo' }
    ],
    // ら行
    'ra': [
        { char: 'ら', romaji: 'ra' },
        { char: 'り', romaji: 'ri' },
        { char: 'る', romaji: 'ru' },
        { char: 'れ', romaji: 're' },
        { char: 'ろ', romaji: 'ro' }
    ],
    // わ行
    'wa': [
        { char: 'わ', romaji: 'wa' },
        { char: 'を', romaji: 'wo' },
        { char: 'ん', romaji: 'n' }
    ],
    // 浊音（が行）
    'ga': [
        { char: 'が', romaji: 'ga' },
        { char: 'ぎ', romaji: 'gi' },
        { char: 'ぐ', romaji: 'gu' },
        { char: 'げ', romaji: 'ge' },
        { char: 'ご', romaji: 'go' }
    ],
    // 浊音（ざ行）
    'za': [
        { char: 'ざ', romaji: 'za' },
        { char: 'じ', romaji: 'ji' },
        { char: 'ず', romaji: 'zu' },
        { char: 'ぜ', romaji: 'ze' },
        { char: 'ぞ', romaji: 'zo' }
    ],
    // 浊音（だ行）
    'da': [
        { char: 'だ', romaji: 'da' },
        { char: 'ぢ', romaji: 'ji' },
        { char: 'づ', romaji: 'zu' },
        { char: 'で', romaji: 'de' },
        { char: 'ど', romaji: 'do' }
    ],
    // 浊音（ば行）
    'ba': [
        { char: 'ば', romaji: 'ba' },
        { char: 'び', romaji: 'bi' },
        { char: 'ぶ', romaji: 'bu' },
        { char: 'べ', romaji: 'be' },
        { char: 'ぼ', romaji: 'bo' }
    ],
    // 半浊音（ぱ行）
    'pa': [
        { char: 'ぱ', romaji: 'pa' },
        { char: 'ぴ', romaji: 'pi' },
        { char: 'ぷ', romaji: 'pu' },
        { char: 'ぺ', romaji: 'pe' },
        { char: 'ぽ', romaji: 'po' }
    ],
    // 拗音（きゃ行）
    'kya': [
        { char: 'きゃ', romaji: 'kya' },
        { char: 'きゅ', romaji: 'kyu' },
        { char: 'きょ', romaji: 'kyo' }
    ],
    // 拗音（しゃ行）
    'sha': [
        { char: 'しゃ', romaji: 'sha' },
        { char: 'しゅ', romaji: 'shu' },
        { char: 'しょ', romaji: 'sho' }
    ],
    // 拗音（ちゃ行）
    'cha': [
        { char: 'ちゃ', romaji: 'cha' },
        { char: 'ちゅ', romaji: 'chu' },
        { char: 'ちょ', romaji: 'cho' }
    ],
    // 拗音（にゃ行）
    'nya': [
        { char: 'にゃ', romaji: 'nya' },
        { char: 'にゅ', romaji: 'nyu' },
        { char: 'にょ', romaji: 'nyo' }
    ],
    // 拗音（ひゃ行）
    'hya': [
        { char: 'ひゃ', romaji: 'hya' },
        { char: 'ひゅ', romaji: 'hyu' },
        { char: 'ひょ', romaji: 'hyo' }
    ],
    // 拗音（みゃ行）
    'mya': [
        { char: 'みゃ', romaji: 'mya' },
        { char: 'みゅ', romaji: 'myu' },
        { char: 'みょ', romaji: 'myo' }
    ],
    // 拗音（りゃ行）
    'rya': [
        { char: 'りゃ', romaji: 'rya' },
        { char: 'りゅ', romaji: 'ryu' },
        { char: 'りょ', romaji: 'ryo' }
    ],
    // 浊音拗音（ぎゃ行）
    'gya': [
        { char: 'ぎゃ', romaji: 'gya' },
        { char: 'ぎゅ', romaji: 'gyu' },
        { char: 'ぎょ', romaji: 'gyo' }
    ],
    // 浊音拗音（じゃ行）
    'ja': [
        { char: 'じゃ', romaji: 'ja' },
        { char: 'じゅ', romaji: 'ju' },
        { char: 'じょ', romaji: 'jo' }
    ],
    // 浊音拗音（びゃ行）
    'bya': [
        { char: 'びゃ', romaji: 'bya' },
        { char: 'びゅ', romaji: 'byu' },
        { char: 'びょ', romaji: 'byo' }
    ],
    // 半浊音拗音（ぴゃ行）
    'pya': [
        { char: 'ぴゃ', romaji: 'pya' },
        { char: 'ぴゅ', romaji: 'pyu' },
        { char: 'ぴょ', romaji: 'pyo' }
    ],
    // 促音
    'sokuon': [
        { char: 'っ', romaji: '(っ)' }
    ]
};

/**
 * 关卡定义，从简单到复杂
 */
const levels = [
    // 基础入门关卡
    { 
        id: 1,
        category: 'basic',
        type: 'hiragana',
        name: 'あ行平假名', 
        rows: ['a'],
        description: '学习あ行五个基本平假名',
        requiredScore: 5
    },
    {
        id: 2,
        category: 'basic',
        type: 'katakana',
        name: 'ア行片假名',
        rows: ['a'],
        description: '学习ア行五个基本片假名',
        requiredScore: 5,
        useKatakana: true
    },
    {
        id: 3,
        category: 'basic',
        type: 'mixed',
        name: 'あ/ア行混合',
        rows: ['a'],
        description: '混合练习あ/ア行假名',
        requiredScore: 8,
        useMixed: true
    },
    {
        id: 4,
        category: 'basic',
        type: 'hiragana',
        name: 'か行平假名',
        rows: ['ka'],
        description: '学习か行五个基本平假名',
        requiredScore: 5
    },
    {
        id: 5,
        category: 'basic',
        type: 'katakana',
        name: 'カ行片假名',
        rows: ['ka'],
        description: '学习カ行五个基本片假名',
        requiredScore: 5,
        useKatakana: true
    },

    // 进阶练习关卡
    {
        id: 6,
        category: 'intermediate',
        type: 'hiragana',
        name: 'あ～か行平假名',
        rows: ['a', 'ka'],
        description: '混合练习あ行和か行平假名',
        requiredScore: 8
    },
    {
        id: 7,
        category: 'intermediate',
        type: 'katakana',
        name: 'ア～カ行片假名',
        rows: ['a', 'ka'],
        description: '混合练习ア行和カ行片假名',
        requiredScore: 8,
        useKatakana: true
    },
    {
        id: 8,
        category: 'intermediate',
        type: 'mixed',
        name: 'あ～か行混合挑战',
        rows: ['a', 'ka'],
        description: '综合练习平假名和片假名',
        requiredScore: 10,
        useMixed: true
    },
    {
        id: 9,
        category: 'intermediate',
        type: 'hiragana',
        name: 'さ～な行平假名',
        rows: ['sa', 'ta', 'na'],
        description: '学习さ、た、な行平假名',
        requiredScore: 12
    },
    {
        id: 10,
        category: 'intermediate',
        type: 'katakana',
        name: 'サ～ナ行片假名',
        rows: ['sa', 'ta', 'na'],
        description: '学习サ、タ、ナ行片假名',
        requiredScore: 12,
        useKatakana: true
    },
    {
        id: 11,
        category: 'intermediate',
        type: 'mixed',
        name: 'さ～な行混合挑战',
        rows: ['sa', 'ta', 'na'],
        description: '混合练习平假名和片假名',
        requiredScore: 15,
        useMixed: true
    },
    {
        id: 12,
        category: 'intermediate',
        type: 'hiragana',
        name: 'は～わ行平假名',
        rows: ['ha', 'ma', 'ya', 'ra', 'wa'],
        description: '学习は～わ行平假名',
        requiredScore: 15
    },
    {
        id: 13,
        category: 'intermediate',
        type: 'katakana',
        name: 'ハ～ワ行片假名',
        rows: ['ha', 'ma', 'ya', 'ra', 'wa'],
        description: '学习ハ～ワ行片假名',
        requiredScore: 15,
        useKatakana: true
    },
    {
        id: 14,
        category: 'intermediate',
        type: 'mixed',
        name: 'は～わ行混合挑战',
        rows: ['ha', 'ma', 'ya', 'ra', 'wa'],
        description: '混合练习平假名和片假名',
        requiredScore: 18,
        useMixed: true
    },

    // 高级挑战关卡
    {
        id: 15,
        category: 'advanced',
        type: 'hiragana',
        name: '平假名综合练习',
        rows: ['a', 'ka', 'sa', 'ta', 'na', 'ha', 'ma', 'ya', 'ra', 'wa'],
        description: '练习所有平假名',
        requiredScore: 20
    },
    {
        id: 16,
        category: 'advanced',
        type: 'katakana',
        name: '片假名综合练习',
        rows: ['a', 'ka', 'sa', 'ta', 'na', 'ha', 'ma', 'ya', 'ra', 'wa'],
        description: '练习所有片假名',
        requiredScore: 20,
        useKatakana: true
    },
    {
        id: 17,
        category: 'advanced',
        type: 'mixed',
        name: '综合假名挑战',
        rows: ['a', 'ka', 'sa', 'ta', 'na', 'ha', 'ma', 'ya', 'ra', 'wa'],
        description: '混合练习所有平假名和片假名',
        requiredScore: 25,
        useMixed: true
    },

    // 大师级关卡
    {
        id: 18,
        category: 'master',
        type: 'mixed',
        name: '假名大师挑战',
        rows: ['a', 'ka', 'sa', 'ta', 'na', 'ha', 'ma', 'ya', 'ra', 'wa'],
        description: '终极挑战：完全掌握所有假名',
        requiredScore: 30,
        useMixed: true
    }
];

/**
 * 工具函数：根据关卡获取所有该关卡包含的假名
 * @param {Array} rowIds 关卡包含的行ID数组
 * @returns {Array} 该关卡所有假名对象的数组
 */
function getKanasByRows(rowIds) {
    let result = [];
    rowIds.forEach(rowId => {
        if (kanaData[rowId]) {
            result = result.concat(kanaData[rowId]);
        }
    });
    return result;
}

/**
 * 工具函数：获取随机假名
 * @param {Array} kanas 假名数组
 * @returns {Object} 随机选择的假名对象
 */
function getRandomKana(kanas) {
    const randomIndex = Math.floor(Math.random() * kanas.length);
    return kanas[randomIndex];
}

/**
 * 工具函数：打乱数组顺序
 * @param {Array} array 要打乱的数组
 * @returns {Array} 打乱后的数组
 */
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
} 