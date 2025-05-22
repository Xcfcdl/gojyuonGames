// 全局JavaScript功能
document.addEventListener('DOMContentLoaded', () => {
    // 这里可以添加全局功能
    console.log('五十音図ゲーム 已加载');
});

async function renderGames() {
  // 等待 window.langData 加载
  if (!window.langData) {
    // 最多等待 500ms
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 50));
      if (window.langData) break;
    }
  }

  // 确保 renderGames 总是使用当前的语言状态
  const currentLanguage = window.currentLang || 'zh'; 

  // **确保每次都 fetch 最新的 games.json 数据**
  const res = await fetch('games/games.json?' + new Date().getTime()); // 添加时间戳避免缓存
  const games = await res.json();
  const grid = document.getElementById('gamesGrid');
  if (!grid) return;
  grid.innerHTML = '';

  games.forEach(game => {
    let badge = '';
    let badgeClass = 'game-card-badge';

    if (game.status === 'normal') {
        badge = (window.langData && window.langData.badge_recommend) || '推荐';
        badgeClass += ' normal';
    } else if (game.status === 'coming') {
        badge = (window.langData && window.langData.badge_coming) || '即将推出';
        badgeClass += ' coming';
    } else if (game.status === 'pending') {
        badge = (window.langData && window.langData.badge_pending) || '待定';
        badgeClass += ' pending';
    }

    // 使用 currentLanguage 来获取游戏卡片的多语言内容
    const title = game.title?.[currentLanguage] || ''; 
    const desc = game.desc?.[currentLanguage] || '';   

    const icon = game.icon ? `<i class=\"fas ${game.icon}\"></i>` : '';
    
    // 按钮文本也从 window.langData 获取
    let btnText = (window.langData && window.langData.start_game) || '开始游戏'; 
    let btnClass = 'start-button';
    let url = game.url || '#';
    let disabled = '';
    let extraAttrs = '';

    if (game.status === 'coming') {
      btnText = (window.langData && window.langData.coming_soon_btn) || '敬请期待';
      btnClass += ' disabled';
      url = 'javascript:void(0)';
      disabled = 'disabled';
      extraAttrs = 'aria-disabled="true" tabindex="-1"';
    } else if (game.status === 'pending') {
      btnText = (window.langData && window.langData.pending_btn) || '待定';
      btnClass += ' disabled';
      url = 'javascript:void(0)';
      disabled = 'disabled';
      extraAttrs = 'aria-disabled="true" tabindex="-1"';
    }

    grid.innerHTML += `
      <article class=\"game-card${game.status ? ' ' + game.status : ''}\">
        <div class=\"${badgeClass}\">${badge}</div>
        <div class=\"game-card-content\">
          <h2>${icon} <span>${title}</span></h2>
          <p>${desc}</p>
          <a href=\"${url}\" class=\"${btnClass}\" ${disabled} ${extraAttrs}>${btnText} <i class=\"fas fa-arrow-right\"></i></a>
        </div>
      </article>
    `;
  });
}

// 页面加载和语言切换时都渲染
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderGames);
} else {
  renderGames();
}

// 监听语言切换（假设setLang会触发window.langData变更）
window._oldSetLang = window.setLang;
window.setLang = function(lang) {
  return window._oldSetLang(lang).then(() => {
    renderGames();
  });
} 