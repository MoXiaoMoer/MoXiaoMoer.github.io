// detail.js
// 从 localStorage 读取对应文章 id，渲染内容（支持 Markdown + Highlight.js），并增加阅读数与保存回 storage

(function(){
  const contentEl = document.getElementById('detail-content');
  const titleEl = document.getElementById('detail-title');
  const timeEl = document.getElementById('detail-time');
  const viewsEl = document.getElementById('detail-views');
  const backBtn = document.getElementById('backBtn');

  function getQueryParam(name){
    const p = new URLSearchParams(window.location.search);
    return p.get(name);
  }

  function loadArticle(id){
    const raw = localStorage.getItem('xm_posts');
    if(!raw) return null;
    try{
      const arr = JSON.parse(raw);
      return arr.find(x=> x.id === id) || null;
    }catch(e){
      return null;
    }
  }

  function saveArticle(updated){
    const raw = localStorage.getItem('xm_posts');
    if(!raw) return;
    try{
      const arr = JSON.parse(raw);
      const idx = arr.findIndex(x=> x.id === updated.id);
      if(idx>=0){ arr[idx] = updated; localStorage.setItem('xm_posts', JSON.stringify(arr)); }
    }catch(e){}
  }

  function render(article){
    if(!article){
      titleEl.textContent='文章未找到';
      contentEl.innerHTML = '<p>没有找到对应文章。</p>';
      return;
    }
    titleEl.textContent = article.title;
    timeEl.textContent = new Date(article.time).toLocaleString();
    viewsEl.textContent = article.views || 0;
    // 支持 Markdown：使用 marked 渲染
    const md = article.content || '';
    contentEl.innerHTML = marked.parse(md);
    // 高亮代码块
    document.querySelectorAll('pre code').forEach((block) => {
      try{ hljs.highlightElement(block); }catch(e){}
    });
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    const id = getQueryParam('id');
    const article = loadArticle(id);
    if(article){
      // 增加阅读数
      article.views = (article.views || 0) + 1;
      saveArticle(article);
    }
    render(article);
  });

  if(backBtn){
    backBtn.addEventListener('click', ()=> window.location.href='index.html');
  }
})();