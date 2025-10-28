// MD解析器配置
const converter = new showdown.Converter({
    simplifiedAutoLink: true,
    literalMidWordUnderscores: true,
    strikethrough: true,
    tables: true,
    tasklists: true,
    smoothLivePreview: true,
    prefixHeaderId: true,
    disableForced4SpacesIndentedSublists: true,
    parseImgDimensions: true,
    extensions: []
});

const sideContainer = document.getElementById('sideContainer');
const contentDisplay = document.getElementById('contentDisplay');
const optionItems = document.querySelectorAll('.option-item');

// 文章数据
const articles = [
    { id: 1, title: "我的第一篇博客：开始记录生活", type: "life", date: "2025-10-30", path: "mdFiles/life/1.md" },
    { id: 2, title: "网页解析分享", type: "tech", date: "2025-10-30", path: "mdFiles/tech/2.md" }
];

// 页面加载初始化
window.onload = function() {
    renderArticleList('all');
    bindOptionClick();
};

// 绑定选项栏点击
function bindOptionClick() {
    optionItems.forEach(item => {
        item.addEventListener('click', function() {
            optionItems.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            const type = this.getAttribute('data-type');
            if (type === 'about') {
                loadAboutSidebar();
                loadMdContent('mdFiles/MY.md');
            } else {
                renderArticleList(type);
                contentDisplay.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 80px 0;">选择左侧文章查看内容</p>';
            }
        });
    });
}

// 加载"关于我"侧边栏
function loadAboutSidebar() {
    sideContainer.innerHTML = `
        <div class="side-module">
            <h3 class="module-title">🔗 友情链接</h3>
            <ul class="module-list">
				        <li><a href="https://github.com" target="_blank" class="side-link">GitHub</a></li>
								<li><a href="https://mitce.net/login" target="_blank" class="side-link">Mitce_节点🚀</a></li>
								<li><a href="https://yjn.host/index.php/user/#" target="_blank" class="side-link">YJNHOST虚拟主机📦</a></li>
            </ul>
        </div>
        <div class="side-module">
            <h3 class="module-title">🔧 常用网站</h3>
            <ul class="module-list">
        <li><a href="https://www.photopea.com" target="_blank" class="side-link">Photopea</a> - 免费在线PS，支持PSD/AI格式，无需安装即可修图</li>
        <li><a href="https://www.ilovepdf.com" target="_blank" class="side-link">iLovePDF</a> - 全能PDF工具，合并/分割/压缩/转换一键操作，免费无水印</li>
        <li><a href="https://www.notion.so" target="_blank" class="side-link">Notion</a> - 全能工作空间，笔记、任务管理、知识库一体化，支持协作</li>
        <li><a href="https://leetcode.cn" target="_blank" class="side-link">LeetCode（中文站）</a> - 程序员算法刷题平台，含面试真题，提升编程能力</li>
        <li><a href="https://www.canva.cn" target="_blank" class="side-link">Canva可画</a> - 零基础设计平台，含海报/PPT/简历模板，拖拽式操作</li>
        <li><a href="https://www.zotero.org" target="_blank" class="side-link">Zotero</a> - 免费文献管理工具，自动抓取引文，支持论文参考文献排版</li>
        <li><a href="https://www.snipaste.com" target="_blank" class="side-link">Snipaste</a> - 轻量截图工具，支持贴图、标注，兼顾Windows/macOS</li>
        <li><a href="https://translate.google.cn" target="_blank" class="side-link">Google翻译</a> - 多语言精准翻译，支持文档/图片翻译，含专业术语库</li>
            </ul>
        </div>
        <div class="side-module">
            <h3 class="module-title">📱 联系我</h3>
            <ul class="module-list">
        <li><a href="mailto:Moji_Qr@icloud.com" target="_blank" class="side-link">邮箱：Moji_Qr@icloud.com</a> - 点击直接发送邮件，长期在线回复</li>
        <li><a href="https://qm.qq.com/q/lUTB5LsSQw" target="_blank" class="side-link">QQ：点击添加好友</a> - 跳转QQ添加页面，备注“小窝访客”优先通过</li>
        <li><a href="http://weibo.cn/qr/userinfo?featurecode=profile_qrcode&uid=8010601199" target="_blank" class="side-link">微博：@是墨晓陌</a> - 直达微博主页，可关注/私信互动</li>
        <li><a href="https://pd.qq.com/s/d0ebltnv3?b=9" target="_blank" class="side-link">QQ频道：XiaoMoer的精神病院</a> - 加入频道参与话题分享，找同好交流</li>
        <li><a href="https://t.me/MxMTG_CH" target="_blank" class="side-link">TG频道：MxMTG_CH</a> - 订阅频道获取最新动态，支持匿名交流</li>
        <li><a href="https://t.me/MxMTG_G" target="_blank" class="side-link">TG群聊：MxMTG_G</a> - 加入群聊实时互动，适合技术/生活话题讨论</li>
            </ul>
        </div>
        <div class="side-module">
            <h3 class="module-title">🏠 关于小窝</h3>
            <ul class="module-list">
                <li>记录生活感悟</li>
                <li>分享技术笔记</li>
                <li>收藏实用工具</li>
                <li>交流学习成长</li>
            </ul>
        </div>
    `;
}

// 渲染文章列表
function renderArticleList(type) {
    let listHtml = '';
    const showArticles = type === 'all' ? articles : articles.filter(a => a.type === type);
    
    if (showArticles.length === 0) {
        listHtml = '<p style="text-align: center; color: var(--text-secondary); padding: 50px 0;">暂无该分类文章</p>';
    } else {
        showArticles.forEach(art => {
            listHtml += `
                <div class="article-item" data-path="${art.path}" data-title="${art.title}">
                    <h3 class="article-title">${art.title}</h3>
                    <p class="article-meta">发布于 ${art.date} · 分类：${art.type === 'life' ? '生活随笔' : '技术分享'}</p>
                </div>
            `;
        });
    }
    
    sideContainer.innerHTML = listHtml;
    bindArticleClick();
}

// 绑定文章点击
function bindArticleClick() {
    document.querySelectorAll('.article-item').forEach(item => {
        item.addEventListener('click', function() {
            const path = this.getAttribute('data-path');
            const title = this.getAttribute('data-title');
            loadArticle(path, title);
        });
    });
}

// 加载文章内容
function loadArticle(mdPath, title) {
    contentDisplay.innerHTML = `
        <div class="article-header">
            <h1 class="article-content-title">${title}</h1>
        </div>
        <div style="text-align: center; color: var(--text-secondary); padding: 20px 0;">
            <span class="loading-spinner"></span>文章加载中...
        </div>
    `;

    fetch(mdPath)
        .then(response => {
            if (!response.ok) throw new Error(`文件没找到：${mdPath}`);
            return response.text();
        })
        .then(mdText => {
            let articleHtml = converter.makeHtml(mdText);
            
            contentDisplay.innerHTML = `
                <div class="article-header">
                    <h1 class="article-content-title">${title}</h1>
                </div>
                <div class="article-content">
                    ${articleHtml}
                </div>
            `;

            handleBlurImages();
            bindCircleTodoClick();
        })
        .catch(error => {
            console.error('加载文章失败:', error);
            contentDisplay.innerHTML = `
                <div class="article-header">
                    <h1 class="article-content-title">${title}</h1>
                </div>
                <div class="error-message">
                    <p>加载失败：${error.message}</p>
                    <p>请检查文件路径是否正确，或稍后重试。</p>
                </div>
            `;
        });
}

// 加载"关于我"MD
function loadMdContent(mdPath) {
    contentDisplay.innerHTML = `
        <div style="text-align: center; color: var(--text-secondary); padding: 20px 0;">
            <span class="loading-spinner"></span>加载中...
        </div>
    `;
    
    fetch(mdPath)
        .then(response => {
            if (!response.ok) throw new Error(`文件没找到：${mdPath}`);
            return response.text();
        })
        .then(mdText => {
            let articleHtml = converter.makeHtml(mdText);
            contentDisplay.innerHTML = `
                <div class="article-content">
                    ${articleHtml}
                </div>
            `;
            handleBlurImages();
            bindCircleTodoClick();
        })
        .catch(error => {
            console.error('加载关于我页面失败:', error);
            contentDisplay.innerHTML = `
                <div class="error-message">
                    <p>加载失败：${error.message}</p>
                    <p>请检查文件路径是否正确，或稍后重试。</p>
                </div>
            `;
        });
}

// 图片高斯模糊
function handleBlurImages() {
    const allImgs = contentDisplay.querySelectorAll('img');
    allImgs.forEach(img => {
        if (!img.parentElement.classList.contains('blur-img-container')) {
            const container = document.createElement('div');
            container.className = 'blur-img-container';
            img.className = 'blur-img';
            img.parentNode.insertBefore(container, img);
            container.appendChild(img);
        }

        img.onerror = function() {
            img.alt = '图片加载失败';
            img.style.filter = 'none !important';
            img.style.border = '1px dashed #ff4444';
            img.style.padding = '20px';
        };
    });

    let blurTimer = null;
    contentDisplay.querySelectorAll('.blur-img-container').forEach(container => {
        container.addEventListener('click', function() {
            if (blurTimer) clearTimeout(blurTimer);
            this.classList.add('active');
            blurTimer = setTimeout(() => {
                this.classList.remove('active');
            }, 3000);
        });
    });
}

// 绑定圆形勾选框点击
function bindCircleTodoClick() {
    contentDisplay.querySelectorAll('.circle-todo').forEach(item => {
        item.addEventListener('click', function() {
            this.classList.toggle('checked');
        });
    });
}