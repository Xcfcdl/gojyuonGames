// 博客列表页 JavaScript

(function() {
    let articles = [];
    let currentPage = 1;
    const articlesPerPage = 6;
    let currentLang = 'zh';

    // 初始化
    document.addEventListener('DOMContentLoaded', function() {
        // 监听语言变化
        document.addEventListener('langDataLoaded', function(event) {
            currentLang = event.detail.lang;
            loadArticles();
        });

        // 如果语言数据已经加载，直接开始
        if (window.currentLang) {
            currentLang = window.currentLang;
            loadArticles();
        }
    });

    // 加载文章列表
    async function loadArticles() {
        try {
            const response = await fetch('blog/index.json');
            if (!response.ok) {
                throw new Error('Failed to load articles');
            }
            
            const data = await response.json();
            articles = data.articles || [];
            
            // 过滤当前语言的文章
            const filteredArticles = articles.filter(article => {
                return article.title[currentLang] && 
                       article.desc[currentLang] && 
                       article.author[currentLang];
            });

            if (filteredArticles.length === 0) {
                showNoArticles();
                return;
            }

            articles = filteredArticles;
            currentPage = 1;
            renderArticles();
            renderPagination();
            
        } catch (error) {
            console.error('Error loading articles:', error);
            showNoArticles();
        }
    }

    // 渲染文章列表
    function renderArticles() {
        const articlesGrid = document.getElementById('articlesGrid');
        const noArticles = document.getElementById('noArticles');
        
        if (!articlesGrid) return;

        // 隐藏无文章提示
        noArticles.style.display = 'none';

        // 计算当前页的文章
        const startIndex = (currentPage - 1) * articlesPerPage;
        const endIndex = startIndex + articlesPerPage;
        const currentArticles = articles.slice(startIndex, endIndex);

        // 清空现有内容
        articlesGrid.innerHTML = '';

        // 渲染文章卡片
        currentArticles.forEach(article => {
            const articleCard = createArticleCard(article);
            articlesGrid.appendChild(articleCard);
        });
    }

    // 创建文章卡片
    function createArticleCard(article) {
        const card = document.createElement('div');
        card.className = 'article-card';
        card.onclick = () => {
            window.location.href = `blog-detail.html?id=${article.id}`;
        };

        // 获取标题首字符作为图标
        const title = article.title[currentLang] || '';
        const icon = title.charAt(0) || '文';

        // 格式化日期
        const updateTime = formatDate(article.updateTime);

        // 获取标签
        const tags = article.tags[currentLang] || [];

        card.innerHTML = `
            <div class="article-card-header">
                <div class="article-icon">${icon}</div>
                <div class="article-info">
                    <h3 class="article-title">${article.title[currentLang] || ''}</h3>
                    <div class="article-meta">
                        <span class="author">
                            <i class="fas fa-user"></i>
                            ${article.author[currentLang] || ''}
                        </span>
                        <span class="update-time">
                            <i class="fas fa-calendar-alt"></i>
                            ${updateTime}
                        </span>
                    </div>
                </div>
            </div>
            <p class="article-desc">${article.desc[currentLang] || ''}</p>
            <div class="article-tags">
                ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        `;

        return card;
    }

    // 渲染分页
    function renderPagination() {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;

        const totalPages = Math.ceil(articles.length / articlesPerPage);
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';

        // 上一页按钮
        paginationHTML += `
            <button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // 页码按钮
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
                paginationHTML += `
                    <button onclick="changePage(${i})" ${i === currentPage ? 'class="active"' : ''}>
                        ${i}
                    </button>
                `;
            } else if (i === currentPage - 3 || i === currentPage + 3) {
                paginationHTML += '<span>...</span>';
            }
        }

        // 下一页按钮
        paginationHTML += `
            <button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        pagination.innerHTML = paginationHTML;
    }

    // 切换页面
    window.changePage = function(page) {
        const totalPages = Math.ceil(articles.length / articlesPerPage);
        if (page < 1 || page > totalPages) return;
        
        currentPage = page;
        renderArticles();
        renderPagination();
        
        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // 显示无文章提示
    function showNoArticles() {
        const articlesGrid = document.getElementById('articlesGrid');
        const pagination = document.getElementById('pagination');
        const noArticles = document.getElementById('noArticles');
        
        if (articlesGrid) articlesGrid.innerHTML = '';
        if (pagination) pagination.innerHTML = '';
        if (noArticles) noArticles.style.display = 'block';
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
