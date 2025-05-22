// 简易i18n切换脚本
(function(){
  let currentLang = localStorage.getItem('currentLang') || 'zh';
  let langData = {};

  // 异步加载语言文件
  async function loadLangData(lang) {
    try {
      // 使用绝对路径加载语言文件
      const response = await fetch(`/lang/${lang}.json?v=${new Date().getTime()}`);
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
    if(langData.title) document.title = langData.title;
    updateLangLabel();
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