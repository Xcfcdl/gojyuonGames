/**
 * 假名数据结构
 * 按行分组存储平假名和对应的罗马音
 */
const kanaData = {
    // あ行
    'a': [
        { char: 'あ', romaji: 'a' },
        { char: 'い', romaji: 'i' },
        { char: 'う', romaji: 'u' },
        { char: 'え', romaji: 'e' },
        { char: 'お', romaji: 'o' }
    ],
    // か行
    'ka': [
        { char: 'か', romaji: 'ka' },
        { char: 'き', romaji: 'ki' },
        { char: 'く', romaji: 'ku' },
        { char: 'け', romaji: 'ke' },
        { char: 'こ', romaji: 'ko' }
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
    { 
        id: 1, 
        name: 'あ行练习', 
        rows: ['a'], 
        description: '学习あ行五个基本假名',
        requiredScore: 5
    },
    { 
        id: 2, 
        name: 'か行练习', 
        rows: ['ka'], 
        description: '学习か行五个基本假名',
        requiredScore: 5
    },
    { 
        id: 3, 
        name: 'あ行+か行混合', 
        rows: ['a', 'ka'], 
        description: '混合练习あ行和か行',
        requiredScore: 8
    },
    { 
        id: 4, 
        name: 'さ行练习', 
        rows: ['sa'], 
        description: '学习さ行五个基本假名',
        requiredScore: 5
    },
    { 
        id: 5, 
        name: 'あ~さ行混合', 
        rows: ['a', 'ka', 'sa'], 
        description: '混合练习あ、か、さ三行假名',
        requiredScore: 10
    },
    { 
        id: 6, 
        name: 'た行练习', 
        rows: ['ta'], 
        description: '学习た行五个基本假名',
        requiredScore: 5
    },
    { 
        id: 7, 
        name: 'な行练习', 
        rows: ['na'], 
        description: '学习な行五个基本假名',
        requiredScore: 5
    },
    { 
        id: 8, 
        name: 'た~な行混合', 
        rows: ['ta', 'na'], 
        description: '混合练习た行和な行',
        requiredScore: 8
    },
    { 
        id: 9, 
        name: 'あ~な行混合', 
        rows: ['a', 'ka', 'sa', 'ta', 'na'], 
        description: '综合练习前五行假名',
        requiredScore: 15
    },
    { 
        id: 10, 
        name: 'は行练习', 
        rows: ['ha'], 
        description: '学习は行五个基本假名',
        requiredScore: 5
    },
    { 
        id: 11, 
        name: 'ま行练习', 
        rows: ['ma'], 
        description: '学习ま行五个基本假名',
        requiredScore: 5
    },
    { 
        id: 12, 
        name: 'は~ま行混合', 
        rows: ['ha', 'ma'], 
        description: '混合练习は行和ま行',
        requiredScore: 8
    },
    { 
        id: 13, 
        name: 'や行练习', 
        rows: ['ya'], 
        description: '学习や行三个基本假名',
        requiredScore: 3
    },
    { 
        id: 14, 
        name: 'ら行练习', 
        rows: ['ra'], 
        description: '学习ら行五个基本假名',
        requiredScore: 5
    },
    { 
        id: 15, 
        name: 'わ行练习', 
        rows: ['wa'], 
        description: '学习わ行假名和ん',
        requiredScore: 3
    },
    { 
        id: 16, 
        name: '清音综合练习', 
        rows: ['a', 'ka', 'sa', 'ta', 'na', 'ha', 'ma', 'ya', 'ra', 'wa'], 
        description: '练习所有清音假名',
        requiredScore: 20
    },
    { 
        id: 17, 
        name: 'が行练习', 
        rows: ['ga'], 
        description: '学习が行浊音假名',
        requiredScore: 5
    },
    { 
        id: 18, 
        name: 'ざ行练习', 
        rows: ['za'], 
        description: '学习ざ行浊音假名',
        requiredScore: 5
    },
    { 
        id: 19, 
        name: 'だ行练习', 
        rows: ['da'], 
        description: '学习だ行浊音假名',
        requiredScore: 5
    },
    { 
        id: 20, 
        name: 'ば行练习', 
        rows: ['ba'], 
        description: '学习ば行浊音假名',
        requiredScore: 5
    },
    { 
        id: 21, 
        name: 'ぱ行练习', 
        rows: ['pa'], 
        description: '学习ぱ行半浊音假名',
        requiredScore: 5
    },
    { 
        id: 22, 
        name: '浊音综合练习', 
        rows: ['ga', 'za', 'da', 'ba', 'pa'], 
        description: '练习所有浊音和半浊音假名',
        requiredScore: 15
    },
    { 
        id: 23, 
        name: 'きゃ行练习', 
        rows: ['kya'], 
        description: '学习きゃ行拗音',
        requiredScore: 3
    },
    { 
        id: 24, 
        name: 'しゃ行练习', 
        rows: ['sha'], 
        description: '学习しゃ行拗音',
        requiredScore: 3
    },
    { 
        id: 25, 
        name: 'ちゃ行练习', 
        rows: ['cha'], 
        description: '学习ちゃ行拗音',
        requiredScore: 3
    },
    { 
        id: 26, 
        name: '基础拗音混合', 
        rows: ['kya', 'sha', 'cha'], 
        description: '练习基础拗音组合',
        requiredScore: 9
    },
    { 
        id: 27, 
        name: 'にゃ~みゃ行练习', 
        rows: ['nya', 'hya', 'mya'], 
        description: '学习にゃ、ひゃ、みゃ行拗音',
        requiredScore: 9
    },
    { 
        id: 28, 
        name: 'りゃ行练习', 
        rows: ['rya'], 
        description: '学习りゃ行拗音',
        requiredScore: 3
    },
    { 
        id: 29, 
        name: '清音拗音综合', 
        rows: ['kya', 'sha', 'cha', 'nya', 'hya', 'mya', 'rya'], 
        description: '练习所有清音拗音',
        requiredScore: 15
    },
    { 
        id: 30, 
        name: '浊音拗音练习', 
        rows: ['gya', 'ja', 'bya', 'pya'], 
        description: '练习浊音和半浊音拗音',
        requiredScore: 12
    },
    { 
        id: 31, 
        name: '促音练习', 
        rows: ['sokuon'], 
        description: '学习促音っ',
        requiredScore: 2
    },
    { 
        id: 32, 
        name: '终极挑战', 
        rows: ['a', 'ka', 'sa', 'ta', 'na', 'ha', 'ma', 'ya', 'ra', 'wa', 
               'ga', 'za', 'da', 'ba', 'pa', 
               'kya', 'sha', 'cha', 'nya', 'hya', 'mya', 'rya',
               'gya', 'ja', 'bya', 'pya',
               'sokuon'], 
        description: '测试所有假名的掌握程度',
        requiredScore: 30
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