#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
from pathlib import Path

# 基本假名对照表
KANA_BASIC = {
    'あ': ['ア', 'a'], 'い': ['イ', 'i'], 'う': ['ウ', 'u'], 'え': ['エ', 'e'], 'お': ['オ', 'o'],
    'か': ['カ', 'ka'], 'き': ['キ', 'ki'], 'く': ['ク', 'ku'], 'け': ['ケ', 'ke'], 'こ': ['コ', 'ko'],
    'さ': ['サ', 'sa'], 'し': ['シ', 'shi'], 'す': ['ス', 'su'], 'せ': ['セ', 'se'], 'そ': ['ソ', 'so'],
    'た': ['タ', 'ta'], 'ち': ['チ', 'chi'], 'つ': ['ツ', 'tsu'], 'て': ['テ', 'te'], 'と': ['ト', 'to'],
    'な': ['ナ', 'na'], 'に': ['ニ', 'ni'], 'ぬ': ['ヌ', 'nu'], 'ね': ['ネ', 'ne'], 'の': ['ノ', 'no'],
    'は': ['ハ', 'ha'], 'ひ': ['ヒ', 'hi'], 'ふ': ['フ', 'fu'], 'へ': ['ヘ', 'he'], 'ほ': ['ホ', 'ho'],
    'ま': ['マ', 'ma'], 'み': ['ミ', 'mi'], 'む': ['ム', 'mu'], 'め': ['メ', 'me'], 'も': ['モ', 'mo'],
    'や': ['ヤ', 'ya'], 'ゆ': ['ユ', 'yu'], 'よ': ['ヨ', 'yo'],
    'ら': ['ラ', 'ra'], 'り': ['リ', 'ri'], 'る': ['ル', 'ru'], 'れ': ['レ', 're'], 'ろ': ['ロ', 'ro'],
    'わ': ['ワ', 'wa'], 'を': ['ヲ', 'wo'], 'ん': ['ン', 'n']
}

# 浊音和半浊音对照表
KANA_DAKUON = {
    'が': ['ガ', 'ga'], 'ぎ': ['ギ', 'gi'], 'ぐ': ['グ', 'gu'], 'げ': ['ゲ', 'ge'], 'ご': ['ゴ', 'go'],
    'ざ': ['ザ', 'za'], 'じ': ['ジ', 'ji'], 'ず': ['ズ', 'zu'], 'ぜ': ['ゼ', 'ze'], 'ぞ': ['ゾ', 'zo'],
    'だ': ['ダ', 'da'], 'ぢ': ['ヂ', 'ji'], 'づ': ['ヅ', 'zu'], 'で': ['デ', 'de'], 'ど': ['ド', 'do'],
    'ば': ['バ', 'ba'], 'び': ['ビ', 'bi'], 'ぶ': ['ブ', 'bu'], 'べ': ['ベ', 'be'], 'ぼ': ['ボ', 'bo'],
    'ぱ': ['パ', 'pa'], 'ぴ': ['ピ', 'pi'], 'ぷ': ['プ', 'pu'], 'ぺ': ['ペ', 'pe'], 'ぽ': ['ポ', 'po']
}

# 拗音对照表
KANA_YOUON = {
    'きゃ': ['キャ', 'kya'], 'きゅ': ['キュ', 'kyu'], 'きょ': ['キョ', 'kyo'],
    'しゃ': ['シャ', 'sha'], 'しゅ': ['シュ', 'shu'], 'しょ': ['ショ', 'sho'],
    'ちゃ': ['チャ', 'cha'], 'ちゅ': ['チュ', 'chu'], 'ちょ': ['チョ', 'cho'],
    'にゃ': ['ニャ', 'nya'], 'にゅ': ['ニュ', 'nyu'], 'にょ': ['ニョ', 'nyo'],
    'ひゃ': ['ヒャ', 'hya'], 'ひゅ': ['ヒュ', 'hyu'], 'ひょ': ['ヒョ', 'hyo'],
    'みゃ': ['ミャ', 'mya'], 'みゅ': ['ミュ', 'myu'], 'みょ': ['ミョ', 'myo'],
    'りゃ': ['リャ', 'rya'], 'りゅ': ['リュ', 'ryu'], 'りょ': ['リョ', 'ryo'],
    'ぎゃ': ['ギャ', 'gya'], 'ぎゅ': ['ギュ', 'gyu'], 'ぎょ': ['ギョ', 'gyo'],
    'じゃ': ['ジャ', 'ja'], 'じゅ': ['ジュ', 'ju'], 'じょ': ['ジョ', 'jo'],
    'びゃ': ['ビャ', 'bya'], 'びゅ': ['ビュ', 'byu'], 'びょ': ['ビョ', 'byo'],
    'ぴゃ': ['ピャ', 'pya'], 'ぴゅ': ['ピュ', 'pyu'], 'ぴょ': ['ピョ', 'pyo']
}

def generate_mapping():
    """生成假名到音频文件的映射"""
    mapping = {
        # 基本假名映射
        'basic': {hiragana: romaji for hiragana, (_, romaji) in KANA_BASIC.items()},
        
        # 浊音和半浊音映射
        'dakuon': {hiragana: romaji for hiragana, (_, romaji) in KANA_DAKUON.items()},
        
        # 拗音映射
        'youon': {hiragana: romaji for hiragana, (_, romaji) in KANA_YOUON.items()},
        
        # 片假名映射（包含所有类型）
        'katakana': {}
    }
    
    # 添加所有片假名映射
    for kana_dict in [KANA_BASIC, KANA_DAKUON, KANA_YOUON]:
        for _, (katakana, romaji) in kana_dict.items():
            mapping['katakana'][katakana] = romaji
    
    return mapping

def save_mapping(mapping, output_dir):
    """保存映射到JSON文件"""
    output_path = Path(output_dir) / 'kana_mapping.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(mapping, f, ensure_ascii=False, indent=2)
    print(f'生成映射文件: {output_path}')

def main():
    # 生成映射
    mapping = generate_mapping()
    
    # 创建输出目录
    output_dir = Path("assets/audio/kana")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # 保存映射文件
    save_mapping(mapping, output_dir)
    
    # 打印统计信息
    print('\n映射统计:')
    print(f'基本假名: {len(mapping["basic"])} 个')
    print(f'浊音和半浊音: {len(mapping["dakuon"])} 个')
    print(f'拗音: {len(mapping["youon"])} 个')
    print(f'片假名: {len(mapping["katakana"])} 个')

if __name__ == "__main__":
    main() 