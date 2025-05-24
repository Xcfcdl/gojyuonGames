// 博客详情页 JavaScript

(function() {
    let currentArticle = null;
    let allArticles = [];
    let currentLang = 'zh';

    // 初始化
    document.addEventListener('DOMContentLoaded', function() {
        // 监听语言变化
        document.addEventListener('langDataLoaded', function(event) {
            currentLang = event.detail.lang;
            loadArticle();
        });

        // 如果语言数据已经加载，直接开始
        if (window.currentLang) {
            currentLang = window.currentLang;
            loadArticle();
        }

        // 初始化目录切换
        initTocToggle();
    });

    // 加载文章
    async function loadArticle() {
        const urlParams = new URLSearchParams(window.location.search);
        const articleId = urlParams.get('id');

        if (!articleId) {
            showError();
            return;
        }

        try {
            // 加载文章索引
            const indexResponse = await fetch('blog/index.json');
            if (!indexResponse.ok) {
                throw new Error('Failed to load article index');
            }
            
            const indexData = await indexResponse.json();
            allArticles = indexData.articles || [];

            // 加载具体文章
            const articleResponse = await fetch(`blog/articles/${articleId}.json`);
            if (!articleResponse.ok) {
                throw new Error('Failed to load article');
            }

            const articleData = await articleResponse.json();
            
            // 检查当前语言是否有内容
            if (!articleData.title[currentLang] || !articleData.content[currentLang]) {
                showError();
                return;
            }

            currentArticle = articleData;
            renderArticle();
            renderNavigation();
            
        } catch (error) {
            console.error('Error loading article:', error);
            showError();
        }
    }

    // 渲染文章
    function renderArticle() {
        if (!currentArticle) return;

        // 更新页面标题
        const pageTitle = document.getElementById('pageTitle');
        const title = currentArticle.title[currentLang] || '';
        if (pageTitle) {
            pageTitle.textContent = `${title} - 五十音图游戏集`;
        }

        // 更新文章图标
        const articleIcon = document.getElementById('articleIcon');
        if (articleIcon) {
            articleIcon.textContent = title.charAt(0) || '文';
        }

        // 更新文章标题
        const articleTitle = document.getElementById('articleTitle');
        if (articleTitle) {
            articleTitle.textContent = title;
        }

        // 更新作者
        const articleAuthor = document.getElementById('articleAuthor');
        if (articleAuthor) {
            articleAuthor.textContent = currentArticle.author[currentLang] || '';
        }

        // 更新更新时间
        const articleUpdateTime = document.getElementById('articleUpdateTime');
        if (articleUpdateTime) {
            articleUpdateTime.textContent = formatDate(currentArticle.updateTime);
        }

        // 更新标签
        const articleTags = document.getElementById('articleTags');
        if (articleTags) {
            const tags = currentArticle.tags[currentLang] || [];
            articleTags.innerHTML = tags.map(tag => 
                `<span class="tag">${tag}</span>`
            ).join('');
        }

        // 渲染文章内容
        const articleContent = document.getElementById('articleContent');
        if (articleContent && currentArticle.content[currentLang]) {
            const markdownContent = currentArticle.content[currentLang];
            const htmlContent = marked.parse(markdownContent);
            articleContent.innerHTML = htmlContent;
            
            // 生成目录
            generateToc();
            
            // 添加标题 ID
            addHeadingIds();
            
            // 初始化滚动监听
            initScrollSpy();
        }
    }

    // 生成目录
    function generateToc() {
        const tocContent = document.getElementById('tocContent');
        const articleContent = document.getElementById('articleContent');
        
        if (!tocContent || !articleContent) return;

        const headings = articleContent.querySelectorAll('h1, h2, h3, h4');
        
        if (headings.length === 0) {
            document.getElementById('tocContainer').style.display = 'none';
            return;
        }

        let tocHTML = '<ul>';
        
        headings.forEach((heading, index) => {
            const level = heading.tagName.toLowerCase();
            const text = heading.textContent;
            const id = `heading-${index}`;
            heading.id = id;
            
            tocHTML += `
                <li>
                    <a href="#${id}" class="toc-${level}" onclick="scrollToHeading('${id}')">${text}</a>
                </li>
            `;
        });
        
        tocHTML += '</ul>';
        tocContent.innerHTML = tocHTML;
    }

    // 添加标题 ID
    function addHeadingIds() {
        const articleContent = document.getElementById('articleContent');
        if (!articleContent) return;

        const headings = articleContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach((heading, index) => {
            if (!heading.id) {
                heading.id = `heading-${index}`;
            }
        });
    }

    // 滚动到指定标题
    window.scrollToHeading = function(id) {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // 初始化滚动监听
    function initScrollSpy() {
        const tocLinks = document.querySelectorAll('.toc-content a');
        
        window.addEventListener('scroll', function() {
            const headings = document.querySelectorAll('#articleContent h1, #articleContent h2, #articleContent h3, #articleContent h4');
            let currentHeading = null;
            
            headings.forEach(heading => {
                const rect = heading.getBoundingClientRect();
                if (rect.top <= 100) {
                    currentHeading = heading;
                }
            });
            
            // 更新目录高亮
            tocLinks.forEach(link => link.classList.remove('active'));
            
            if (currentHeading) {
                const activeLink = document.querySelector(`.toc-content a[href="#${currentHeading.id}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                }
            }
        });
    }

    // 渲染导航
    function renderNavigation() {
        const articleNavigation = document.getElementById('articleNavigation');
        if (!articleNavigation || !currentArticle) return;

        const currentIndex = allArticles.findIndex(article => article.id === currentArticle.id);
        const prevArticle = currentIndex > 0 ? allArticles[currentIndex - 1] : null;
        const nextArticle = currentIndex < allArticles.length - 1 ? allArticles[currentIndex + 1] : null;

        let navigationHTML = '';

        if (prevArticle && prevArticle.title[currentLang]) {
            navigationHTML += `
                <a href="blog-detail.html?id=${prevArticle.id}" class="nav-button prev">
                    <i class="fas fa-chevron-left"></i>
                    <div class="nav-button-text">
                        <span class="nav-button-label">上一篇</span>
                        <span class="nav-button-title">${prevArticle.title[currentLang]}</span>
                    </div>
                </a>
            `;
        } else {
            navigationHTML += '<div></div>';
        }

        if (nextArticle && nextArticle.title[currentLang]) {
            navigationHTML += `
                <a href="blog-detail.html?id=${nextArticle.id}" class="nav-button next">
                    <div class="nav-button-text">
                        <span class="nav-button-label">下一篇</span>
                        <span class="nav-button-title">${nextArticle.title[currentLang]}</span>
                    </div>
                    <i class="fas fa-chevron-right"></i>
                </a>
            `;
        } else {
            navigationHTML += '<div></div>';
        }

        articleNavigation.innerHTML = navigationHTML;
    }

    // 初始化目录切换
    function initTocToggle() {
        const tocToggle = document.getElementById('tocToggle');
        const tocContent = document.getElementById('tocContent');
        
        if (tocToggle && tocContent) {
            tocToggle.addEventListener('click', function() {
                tocContent.classList.toggle('collapsed');
                const icon = tocToggle.querySelector('i');
                if (tocContent.classList.contains('collapsed')) {
                    icon.className = 'fas fa-chevron-down';
                } else {
                    icon.className = 'fas fa-chevron-up';
                }
            });
        }
    }

    // 显示错误
    function showError() {
        const articleContainer = document.querySelector('.article-container');
        const tocContainer = document.getElementById('tocContainer');
        const errorMessage = document.getElementById('errorMessage');
        
        if (articleContainer) articleContainer.style.display = 'none';
        if (tocContainer) tocContainer.style.display = 'none';
        if (errorMessage) errorMessage.style.display = 'block';
    }

    // 格式化日期
    function formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
})();
