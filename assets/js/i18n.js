// 简易i18n切换脚本
(function(){
  let currentLang = localStorage.getItem('currentLang') || 'zh';
  let langData = {};

  // 异步加载语言文件
  async function loadLangData(lang) {
    try {
      // 获取当前路径的基础URL
      const baseUrl = window.location.pathname.includes('/games/') ? '../' : '';
      // 使用相对路径加载语言文件
      const response = await fetch(`${baseUrl}lang/${lang}.json?v=${new Date().getTime()}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      langData = data;
      window.langData = data;
      currentLang = lang;
      window.currentLang = lang;
      localStorage.setItem('currentLang', lang);
      updateLang();

      // 语言数据加载并更新后触发自定义事件
      document.dispatchEvent(new CustomEvent('langDataLoaded', { detail: { lang: currentLang, langData: langData } }));

    } catch (error) {
      console.error('Error loading language data:', error);
    }
  }

  function updateLang() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (langData[key]) el.textContent = langData[key];
    });

    // 处理特定ID的HTML内容
    const specialElements = {
      'type-kana-credit': 'type_kana_credit'
    };

    // 遍历特殊元素并设置HTML内容
    for (const [id, key] of Object.entries(specialElements)) {
      const el = document.getElementById(id);
      if (el && langData[key]) {
        el.innerHTML = langData[key];
      }
    }

    if(langData.title) document.title = langData.title;
    updateLangLabel();

    // 更新SEO meta标签（仅在主页）
    if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
      updateSEOMetaTags(currentLang);
    }
  }

  function updateLangLabel() {
    var label = document.getElementById('current-lang-label');
    if(label && langData['lang_label_' + currentLang]) {
      label.textContent = langData['lang_label_' + currentLang];
    }
  }

  // 页面加载时自动切换
  document.addEventListener('DOMContentLoaded', function(){
    loadLangData(currentLang);
  });

  // 更新SEO meta标签
  function updateSEOMetaTags(lang) {
    const seoData = {
      'zh': {
        title: '五十音图游戏集 - 免费在线日语假名学习平台 | 五十音図ゲーム',
        description: '免费在线五十音图学习游戏平台，通过互动游戏轻松掌握日语平假名和片假名。包含记忆游戏、打地鼠、配对练习等多种趣味学习方式，适合日语初学者。',
        keywords: '五十音图,日语学习,假名练习,平假名,片假名,日语游戏,在线学习,免费日语,五十音図,ひらがな,カタカナ',
        ogTitle: '五十音图游戏集 - 免费在线日语假名学习平台',
        ogDescription: '免费在线五十音图学习游戏平台，通过互动游戏轻松掌握日语平假名和片假名。包含记忆游戏、打地鼠、配对练习等多种趣味学习方式。'
      },
      'ja': {
        title: '五十音図ゲーム集 - 無料オンライン日本語仮名学習プラットフォーム',
        description: '無料オンライン五十音図学習ゲームプラットフォーム。インタラクティブなゲームで楽しくひらがな・カタカナをマスター。記憶ゲーム、もぐらたたき、マッチングなど多様な学習方法。',
        keywords: '五十音図,日本語学習,仮名練習,ひらがな,カタカナ,日本語ゲーム,オンライン学習,無料日本語',
        ogTitle: '五十音図ゲーム集 - 無料オンライン日本語仮名学習プラットフォーム',
        ogDescription: '無料オンライン五十音図学習ゲームプラットフォーム。インタラクティブなゲームで楽しくひらがな・カタカナをマスター。'
      },
      'en': {
        title: 'Gojuon Games - Free Online Japanese Kana Learning Platform',
        description: 'Free online Gojuon learning game platform. Master Japanese Hiragana and Katakana through interactive games. Includes memory games, whack-a-mole, matching exercises and more fun learning methods.',
        keywords: 'Gojuon,Japanese learning,Kana practice,Hiragana,Katakana,Japanese games,online learning,free Japanese',
        ogTitle: 'Gojuon Games - Free Online Japanese Kana Learning Platform',
        ogDescription: 'Free online Gojuon learning game platform. Master Japanese Hiragana and Katakana through interactive games.'
      }
    };

    const data = seoData[lang] || seoData['zh'];

    // 更新页面标题
    document.title = data.title;

    // 更新meta标签
    updateMetaTag('description', data.description);
    updateMetaTag('keywords', data.keywords);

    // 更新Open Graph标签
    updateMetaProperty('og:title', data.ogTitle);
    updateMetaProperty('og:description', data.ogDescription);

    // 更新Twitter标签
    updateMetaProperty('twitter:title', data.ogTitle);
    updateMetaProperty('twitter:description', data.ogDescription);

    // 更新HTML lang属性
    const langMap = {
      'zh': 'zh-CN',
      'ja': 'ja',
      'en': 'en'
    };
    document.documentElement.lang = langMap[lang] || 'zh-CN';
  }

  // 更新meta标签
  function updateMetaTag(name, content) {
    let meta = document.querySelector(`meta[name="${name}"]`);
    if (meta) {
      meta.setAttribute('content', content);
    }
  }

  // 更新meta property标签
  function updateMetaProperty(property, content) {
    let meta = document.querySelector(`meta[property="${property}"]`);
    if (meta) {
      meta.setAttribute('content', content);
    }
  }

  // 将 setLang 函数挂载到 window 对象上，以便全局调用
  // setLang 函数现在返回一个 Promise，以便调用者知道语言数据何时加载完成
  window.setLang = async (lang) => {
    if (currentLang === lang && Object.keys(langData).length > 0) {
      updateLang();
      // 语言已加载且是当前语言，仍然触发事件以便其他组件更新
      document.dispatchEvent(new CustomEvent('langDataLoaded', { detail: { lang: currentLang, langData: langData } }));
    } else {
      await loadLangData(lang);
    }
  }
})();