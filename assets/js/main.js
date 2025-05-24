// 全局JavaScript功能
document.addEventListener('DOMContentLoaded', () => {
    // 这里可以添加全局功能
    console.log('五十音図ゲーム 已加载');

    // 初始化移动端菜单
    initMobileMenu();

    // 初始化3D悬停效果
    init3DCardEffects();

    // 初始化视差滚动效果
    initParallaxEffect();

    // 加载最新文章
    loadLatestArticles();
});

// 移动端菜单功能
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');

    if (!mobileMenuBtn || !mobileMenu) return;

    // 点击汉堡菜单按钮
    mobileMenuBtn.addEventListener('click', () => {
        toggleMobileMenu();
    });

    // 点击菜单背景关闭菜单
    mobileMenu.addEventListener('click', (e) => {
        if (e.target === mobileMenu) {
            closeMobileMenu();
        }
    });

    // 点击菜单项后关闭菜单
    const menuItems = mobileMenu.querySelectorAll('.mobile-menu-item:not(.lang-section)');
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            closeMobileMenu();
        });
    });
}

function toggleMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');

    if (!mobileMenuBtn || !mobileMenu) return;

    const isActive = mobileMenu.classList.contains('active');

    if (isActive) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

function openMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');

    if (!mobileMenuBtn || !mobileMenu) return;

    mobileMenuBtn.classList.add('active');
    mobileMenu.classList.add('active');
    document.body.style.overflow = 'hidden'; // 防止背景滚动
}

function closeMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');

    if (!mobileMenuBtn || !mobileMenu) return;

    mobileMenuBtn.classList.remove('active');
    mobileMenu.classList.remove('active');
    document.body.style.overflow = ''; // 恢复滚动
}

// 全局函数，供HTML调用
window.closeMobileMenu = closeMobileMenu;

// 视差滚动效果
function initParallaxEffect() {
    const parallaxBg = document.getElementById('parallaxBg');
    if (!parallaxBg) return;

    // 检测移动设备和低性能设备
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
    const isLowPerformance = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
    const hasReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isMobile || isLowPerformance || hasReducedMotion) {
        document.body.classList.add('mobile');
        return; // 在移动端、低性能设备或用户偏好减少动画时禁用视差效果
    }

    // 预计算常量，避免重复计算
    const windowHeight = window.innerHeight;
    const parallaxSpeed = -0.15; // 进一步降低速度，减少计算频率
    const bgMovableRange = windowHeight * 0.15; // 减少移动范围

    let ticking = false;
    let lastScrollY = 0;
    let lastTransform = '';

    function updateParallax() {
        const scrolled = window.scrollY;

        // 增加阈值，减少更新频率
        if (Math.abs(scrolled - lastScrollY) < 3) {
            ticking = false;
            return;
        }

        // 计算视差偏移量
        let parallaxOffset = scrolled * parallaxSpeed;

        // 限制在可移动范围内
        const clampedOffset = Math.max(Math.min(parallaxOffset, bgMovableRange), -bgMovableRange);

        // 只有当transform值真正改变时才更新DOM
        const newTransform = `translate3d(0, ${Math.round(clampedOffset)}px, 0)`;
        if (newTransform !== lastTransform) {
            parallaxBg.style.transform = newTransform;
            lastTransform = newTransform;
        }

        lastScrollY = scrolled;
        ticking = false;
    }

    // 简化的节流函数
    let rafId;
    function handleScroll() {
        if (rafId) {
            cancelAnimationFrame(rafId);
        }

        if (!ticking) {
            rafId = requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }

    // 监听滚动事件，使用passive提高性能
    window.addEventListener('scroll', handleScroll, { passive: true });

    // 初始化位置
    updateParallax();
}

// 3D悬停效果
function init3DCardEffects() {
    // 为特性卡片添加3D悬停效果
    const featureCards = document.querySelectorAll('.feature-item');
    featureCards.forEach(card => {
        card.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;

            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px) scale(1.02)`;
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });

    // 为游戏卡片添加3D悬停效果
    const gameCards = document.querySelectorAll('.game-card');
    gameCards.forEach(card => {
        card.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 15;
            const rotateY = (centerX - x) / 15;

            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.02)`;
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
}

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
  try {
    console.log('Fetching games data...');
    // 检查当前页面路径，确定正确的相对路径
    const gamesJsonPath = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')
      ? 'games/games.json'
      : '../games/games.json';
    console.log('Games JSON path:', gamesJsonPath);
    const res = await fetch(gamesJsonPath + '?' + new Date().getTime()); // 添加时间戳避免缓存
    if (!res.ok) {
      throw new Error(`Failed to fetch games.json: ${res.status} ${res.statusText}`);
    }
    const games = await res.json();
    const grid = document.getElementById('gamesGrid');
    if (!grid) {
      console.error('Games grid element not found!');
      return;
    }
    console.log(`Found ${games.length} games to render`);
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
          <div class="game-card-header">
            <div class="game-card-icon">${icon}</div>
            <h2><span>${title}</span></h2>
          </div>
          <p>${desc}</p>
          <a href=\"${url}\" class=\"${btnClass}\" ${disabled} ${extraAttrs}>
            <span>${btnText}</span>
            <i class=\"fas fa-arrow-right\"></i>
          </a>
        </div>
      </article>
    `;
  });
  } catch (error) {
    console.error('Error rendering games:', error);
  }
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
    loadLatestArticles(); // 语言切换时也重新加载文章
  });
}

// 加载最新文章
async function loadLatestArticles() {
    try {
        // 获取当前语言
        const currentLanguage = window.currentLang || 'zh';

        // 获取博客索引数据
        const response = await fetch('blog/index.json?' + new Date().getTime());
        if (!response.ok) {
            throw new Error(`Failed to fetch blog index: ${response.status}`);
        }

        const blogData = await response.json();
        const articles = blogData.articles || [];

        // 按更新时间排序，获取最新的3篇文章
        const latestArticles = articles
            .sort((a, b) => new Date(b.updateTime) - new Date(a.updateTime))
            .slice(0, 3);

        // 渲染文章卡片
        renderLatestArticles(latestArticles, currentLanguage);

    } catch (error) {
        console.error('Error loading latest articles:', error);
        // 如果加载失败，隐藏整个区域
        const articlesSection = document.querySelector('.latest-articles-section');
        if (articlesSection) {
            articlesSection.style.display = 'none';
        }
    }
}

// 渲染最新文章
function renderLatestArticles(articles, language) {
    const grid = document.getElementById('latestArticlesGrid');
    if (!grid) return;

    if (articles.length === 0) {
        grid.innerHTML = `
            <div class="no-articles">
                <p data-i18n="no_articles">${getNoArticlesText(language)}</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = articles.map(article => {
        // 获取当前语言的内容，如果不存在则回退到中文
        const title = article.title?.[language] || article.title?.zh || '';
        const desc = article.desc?.[language] || article.desc?.zh || '';
        const author = article.author?.[language] || article.author?.zh || '';
        const tags = article.tags?.[language] || article.tags?.zh || [];

        // 获取标题首字符作为图标
        const firstChar = title.charAt(0) || '文';

        // 格式化日期
        const formattedDate = formatDate(article.updateTime, language);

        return `
            <article class="article-card">
                <div class="article-icon">${firstChar}</div>
                <h3>${title}</h3>
                <div class="article-meta">
                    <span><i class="fas fa-user"></i> ${author}</span>
                    <span><i class="fas fa-calendar"></i> ${formattedDate}</span>
                </div>
                <p class="article-desc">${desc}</p>
                <div class="article-tags">
                    ${tags.slice(0, 3).map(tag => `<span class="article-tag">${tag}</span>`).join('')}
                </div>
                <a href="blog-detail.html?id=${article.id}" class="article-link">
                    <span data-i18n="read_more">${getReadMoreText(language)}</span>
                    <i class="fas fa-arrow-right"></i>
                </a>
            </article>
        `;
    }).join('');
}

// 格式化日期
function formatDate(dateString, language) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };

    switch (language) {
        case 'ja':
            return date.toLocaleDateString('ja-JP', options);
        case 'en':
            return date.toLocaleDateString('en-US', options);
        default:
            return date.toLocaleDateString('zh-CN', options);
    }
}

// 获取"阅读更多"文本
function getReadMoreText(language) {
    const texts = {
        zh: '阅读更多',
        ja: '続きを読む',
        en: 'Read More'
    };
    return texts[language] || texts.zh;
}

// 获取"暂无文章"文本
function getNoArticlesText(language) {
    const texts = {
        zh: '暂无文章',
        ja: '記事がありません',
        en: 'No articles available'
    };
    return texts[language] || texts.zh;
}