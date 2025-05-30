#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

// 创建目录
const svgDir = path.join(__dirname, '../assets/svg/kana');
if (!fs.existsSync(svgDir)) {
    fs.mkdirSync(svgDir, { recursive: true });
}

// 所有假名字符
const kanaList = [
    // 基础假名
    'あ', 'い', 'う', 'え', 'お',
    'か', 'き', 'く', 'け', 'こ',
    'さ', 'し', 'す', 'せ', 'そ',
    'た', 'ち', 'つ', 'て', 'と',
    'な', 'に', 'ぬ', 'ね', 'の',
    'は', 'ひ', 'ふ', 'へ', 'ほ',
    'ま', 'み', 'む', 'め', 'も',
    'や', 'ゆ', 'よ',
    'ら', 'り', 'る', 'れ', 'ろ',
    'わ', 'を', 'ん',

    // 浊音
    'が', 'ぎ', 'ぐ', 'げ', 'ご',
    'ざ', 'じ', 'ず', 'ぜ', 'ぞ',
    'だ', 'ぢ', 'づ', 'で', 'ど',
    'ば', 'び', 'ぶ', 'べ', 'ぼ',
    'ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ',

    // 小假名
    'ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ',
    'ゃ', 'ゅ', 'ょ', 'っ',

    // 拗音
    'きゃ', 'きゅ', 'きょ',
    'しゃ', 'しゅ', 'しょ',
    'ちゃ', 'ちゅ', 'ちょ',
    'にゃ', 'にゅ', 'にょ',
    'ひゃ', 'ひゅ', 'ひょ',
    'みゃ', 'みゅ', 'みょ',
    'りゃ', 'りゅ', 'りょ',
    'ぎゃ', 'ぎゅ', 'ぎょ',
    'じゃ', 'じゅ', 'じょ',
    'びゃ', 'びゅ', 'びょ',
    'ぴゃ', 'ぴゅ', 'ぴょ',

    // 片假名
    'ア', 'イ', 'ウ', 'エ', 'オ',
    'カ', 'キ', 'ク', 'ケ', 'コ',
    'サ', 'シ', 'ス', 'セ', 'ソ',
    'タ', 'チ', 'ツ', 'テ', 'ト',
    'ナ', 'ニ', 'ヌ', 'ネ', 'ノ',
    'ハ', 'ヒ', 'フ', 'ヘ', 'ホ',
    'マ', 'ミ', 'ム', 'メ', 'モ',
    'ヤ', 'ユ', 'ヨ',
    'ラ', 'リ', 'ル', 'レ', 'ロ',
    'ワ', 'ヲ', 'ン',

    // 片假名小假名
    'ァ', 'ィ', 'ゥ', 'ェ', 'ォ',
    'ャ', 'ュ', 'ョ', 'ッ',

    // 片假名浊音
    'ガ', 'ギ', 'グ', 'ゲ', 'ゴ',
    'ザ', 'ジ', 'ズ', 'ゼ', 'ゾ',
    'ダ', 'ヂ', 'ヅ', 'デ', 'ド',
    'バ', 'ビ', 'ブ', 'ベ', 'ボ',
    'パ', 'ピ', 'プ', 'ペ', 'ポ'
];

// 下载函数
function downloadSVG(kana) {
    return new Promise((resolve, reject) => {
        const unicode = kana.charCodeAt(0).toString(16).padStart(5, '0');
        const url = `https://mbilbille.github.io/dmak/kanji/${unicode}.svg`;
        const filePath = path.join(svgDir, `${unicode}.svg`);

        // 检查文件是否已存在
        if (fs.existsSync(filePath)) {
            console.log(`✓ ${kana} (${unicode}) already exists`);
            resolve();
            return;
        }

        console.log(`Downloading ${kana} (${unicode})...`);

        const file = fs.createWriteStream(filePath);

        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Referer': 'https://mbilbille.github.io/dmak/'
            }
        }, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log(`✓ Downloaded ${kana} (${unicode})`);
                    resolve();
                });
            } else {
                fs.unlink(filePath, () => {}); // 删除空文件
                console.log(`✗ Failed to download ${kana} (${unicode}): ${response.statusCode}`);
                resolve(); // 继续下载其他文件
            }
        }).on('error', (err) => {
            fs.unlink(filePath, () => {}); // 删除空文件
            console.log(`✗ Error downloading ${kana} (${unicode}):`, err.message);
            resolve(); // 继续下载其他文件
        });
    });
}

// 批量下载
async function downloadAllKana() {
    console.log(`Starting download of ${kanaList.length} kana SVG files...`);
    console.log(`Target directory: ${svgDir}`);

    let completed = 0;
    const batchSize = 5; // 并发下载数量

    for (let i = 0; i < kanaList.length; i += batchSize) {
        const batch = kanaList.slice(i, i + batchSize);
        await Promise.all(batch.map(downloadSVG));
        completed += batch.length;
        console.log(`Progress: ${completed}/${kanaList.length} (${Math.round(completed/kanaList.length*100)}%)`);

        // 添加延迟避免请求过于频繁
        if (i + batchSize < kanaList.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    console.log('✅ Download completed!');

    // 检查下载结果
    const downloadedFiles = fs.readdirSync(svgDir);
    console.log(`📁 Downloaded ${downloadedFiles.length} SVG files`);

    // 创建索引文件
    createIndexFile(downloadedFiles);
}

// 创建索引文件
function createIndexFile(files) {
    const index = {};

    files.forEach(file => {
        if (file.endsWith('.svg')) {
            const unicode = file.replace('.svg', '');
            const codePoint = parseInt(unicode, 16);
            const kana = String.fromCharCode(codePoint);
            index[kana] = unicode;
        }
    });

    const indexPath = path.join(svgDir, 'index.json');
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
    console.log(`📋 Created index file: ${indexPath}`);
    console.log(`📊 Indexed ${Object.keys(index).length} kana characters`);
}

// 运行下载
if (require.main === module) {
    downloadAllKana().catch(console.error);
}

module.exports = { downloadAllKana, kanaList };
