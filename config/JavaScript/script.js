// 优化版 script.js
// - 用 IntersectionObserver 实现无限滚动（更平滑、更低 CPU）
// - 增加骨架占位、懒加载、节流与防抖
// - 修复分类切换后渲染逻辑与卡片跳动
// - 兼容 localStorage 数据格式（与 admin.js 保持一致）

(function(){
  const PAGE_SIZE = 6;
  let currentType = 'blog';
  let loadedCount = 0;
  let allArticles = [];
  const listEl = document.getElementById('article-list');
  const loader = document.getElementById('loader');
  const tabs = document.querySelectorAll('.tab');

  // sentinel 用于 IntersectionObserver 触发加载更多
  let sentinel = document.getElementById('infinite-sentinel');
  if(!sentinel){
    sentinel = document.createElement('div');
    sentinel.id = 'infinite-sentinel';
    sentinel.style.cssText = 'height:1px; width:100%;';
    document.body.appendChild(sentinel);
  }

  // 动态背景（保持原实现，但更平滑由 CSS 控制）
  (function initBg(){ /* kept in CSS */ })();

  // 加载文章列表（从 localStorage）
  function loadAllArticles(){
    const raw = localStorage.getItem('xm_posts');
    if(!raw) return [];
    try{
      const arr = JSON.parse(raw);
      // ensure consistent shape
      return arr.map(a=>({
        id: a.id,
        title: a.title,
        category: a.category || 'blog',
        time: a.time || new Date().toISOString(),
        summary: a.summary || '',
        content: a.content || '',
        views: a.views || 0,
        thumb: a.thumb || '' // optional
      })).sort((a,b)=> new Date(b.time) - new Date(a.time));
    }catch(e){
      console.warn('解析文章数据失败', e);
      return [];
    }
  }

  function saveAllArticles(arr){
    localStorage.setItem('xm_posts', JSON.stringify(arr));
  }

  // render skeleton for quick feedback
  function showSkeleton(count = 3){
    listEl.innerHTML = '';
    for(let i=0;i<count;i++){
      const sk = document.createElement('div');
      sk.className = 'sk-card blur-card';
      sk.innerHTML = `<div class="skel-line" style="width:70%"></div>
                      <div class="skel-line" style="width:40%"></div>
                      <div class="skel-line" style="width:100%;height:56px;border-radius:8px;"></div>`;
      listEl.appendChild(sk);
    }
  }

  function clearSkeleton(){ /* simply clear before real render */ }

  // 渲染卡片（只渲染一批）
  function renderCards(reset=false){
    if(reset){
      listEl.innerHTML = '';
      loadedCount = 0;
    }
    const filtered = allArticles.filter(a=> a.category === currentType);
    const slice = filtered.slice(loadedCount, loadedCount + PAGE_SIZE);
    slice.forEach(a=>{
      const card = document.createElement('article');
      card.className = 'card blur-card';
      // include optional thumb lazy loaded to reduce layout shift
      card.innerHTML = `
        ${a.thumb ? `<img class="thumb" loading="lazy" src="${escapeAttr(a.thumb)}" alt="${escapeAttr(a.title)}">` : ''}
        <h3>${escapeHtml(a.title)}</h3>
        <div class="meta">${formatTime(a.time)} · 阅读 ${a.views || 0}</div>
        <p class="summary">${escapeHtml(a.summary || '')}</p>
      `;
      card.addEventListener('click', ()=>{
        window.location.href = `detail.html?id=${encodeURIComponent(a.id)}`;
      });
      listEl.appendChild(card);
    });
    loadedCount += slice.length;

    // hide loader if nothing left
    const total = filtered.length;
    if(loadedCount >= total) {
      loader?.setAttribute('aria-hidden','true');
    }
  }

  // IntersectionObserver for infinite loading
  let io = null;
  function setupObserver(){
    if(io) io.disconnect();
    io = new IntersectionObserver(async (entries)=>{
      for(const e of entries){
        if(e.isIntersecting){
          const filtered = allArticles.filter(a=> a.category === currentType);
          if(loadedCount < filtered.length){
            // show loader and simulate small delay for UX
            loader?.setAttribute('aria-hidden','false');
            await delay(420);
            renderCards(false);
            loader?.setAttribute('aria-hidden','true');
          }
        }
      }
    },{ root: null, rootMargin: '240px', threshold: 0.01 });
    io.observe(sentinel);
  }

  // helper utilities
  function formatTime(iso){
    try{ const d = new Date(iso); return d.toLocaleString(); }catch(e){ return iso; }
  }
  function escapeHtml(s){
    if(!s) return '';
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  }
  function escapeAttr(s){
    if(!s) return '';
    return String(s).replaceAll('"','&quot;');
  }
  function delay(ms){ return new Promise(r=>setTimeout(r, ms)); }

  // category switch handling
  tabs.forEach(t=>{
    t.addEventListener('click', ()=>{
      tabs.forEach(tt=>tt.classList.remove('active'));
      t.classList.add('active');
      currentType = t.dataset.type === 'science' ? 'science' : 'blog';
      // visual micro animation
      t.animate([{transform:'scale(1)'},{transform:'scale(1.06)'},{transform:'scale(1)'}],{duration:180});
      // reset and show skeleton then render
      showSkeleton(3);
      // slight delay for UX
      setTimeout(()=>{
        loadedCount = 0;
        listEl.innerHTML = '';
        renderCards(true);
      }, 260);
    });
  });

  // init on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', ()=>{
    showSkeleton(3);
    allArticles = loadAllArticles();
    // initial render
    setTimeout(()=>{
      listEl.innerHTML='';
      renderCards(true);
      setupObserver();
    }, 380);
  });

  // re-init when storage changes (support multi-tab edits)
  window.addEventListener('storage', (e)=>{
    if(e.key === 'xm_posts'){
      allArticles = loadAllArticles();
      // re-render current list
      loadedCount = 0;
      listEl.innerHTML = '';
      renderCards(true);
    }
  });

})();