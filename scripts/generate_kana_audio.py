#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
from gtts import gTTS
import time
from pathlib import Path

# 基本假名对照表（平假名：片假名：罗马字）
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

def generate_audio(kana, romaji, output_dir):
    """生成假名的音频文件"""
    filename = f"{output_dir}/{romaji}.mp3"
    
    # 如果文件已存在，跳过生成
    if os.path.exists(filename):
        print(f"跳过已存在的音频: {filename}")
        return
    
    try:
        tts = gTTS(text=kana, lang='ja')
        tts.save(filename)
        print(f"生成音频: {filename}")
        # 添加延迟以避免触发API限制
        time.sleep(1)
    except Exception as e:
        print(f"生成音频失败 {kana}: {str(e)}")

def generate_kana_set(kana_dict, output_dir):
    """生成一组假名的音频文件"""
    for hiragana, (katakana, romaji) in kana_dict.items():
        # 使用平假名生成音频
        generate_audio(hiragana, romaji, output_dir)

def create_mapping_file(output_dir):
    """创建假名到音频文件的映射JSON文件"""
    import json
    
    mapping = {
        'basic': {k: v[1] for k, v in KANA_BASIC.items()},
        'dakuon': {k: v[1] for k, v in KANA_DAKUON.items()},
        'youon': {k: v[1] for k, v in KANA_YOUON.items()},
        'katakana': {
            v[0]: v[1] 
            for d in [KANA_BASIC, KANA_DAKUON, KANA_YOUON] 
            for k, v in d.items()
        }
    }
    
    with open(f"{output_dir}/kana_mapping.json", 'w', encoding='utf-8') as f:
        json.dump(mapping, f, ensure_ascii=False, indent=2)
    
    print(f"生成映射文件: {output_dir}/kana_mapping.json")

def main():
    # 创建输出目录
    output_dir = Path("assets/audio/kana")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # 生成基本音
    print("正在生成基本音...")
    generate_kana_set(KANA_BASIC, output_dir)
    
    # 生成浊音和半浊音
    print("正在生成浊音和半浊音...")
    generate_kana_set(KANA_DAKUON, output_dir)
    
    # 生成拗音
    print("正在生成拗音...")
    generate_kana_set(KANA_YOUON, output_dir)
    
    # 创建映射文件
    create_mapping_file(output_dir)
    
    print("音频生成完成！")

if __name__ == "__main__":
    main() 