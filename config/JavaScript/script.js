// script.js
// 负责前台：读取文章数据（localStorage 为主），渲染卡片、分类切换、无限滚动、骨架/加载动画、跳转 detail

(function(){
  // 配置
  const PAGE_SIZE = 6;
  let currentType = 'blog';
  let loadedCount = 0;
  let allArticles = []; // article objects loaded from storage
  const listEl = document.getElementById('article-list');
  const loader = document.getElementById('loader');
  const tabs = document.querySelectorAll('.tab');

  // 动态背景每15秒切换一次方向，营造“起点终点切换”
  (function animateBg(){
    const bg = document.getElementById('dynamic-bg');
    let togg = 0;
    bg.classList.add('anim-1');
    setInterval(()=>{
      togg = 1 - togg;
      bg.classList.toggle('anim-1', togg === 0);
      bg.classList.toggle('anim-2', togg === 1);
    },15000);
  })();

  // 读取文章数据（从 localStorage）
  function loadAllArticles(){
    const raw = localStorage.getItem('xm_posts');
    if(!raw) return [];
    try{
      return JSON.parse(raw).sort((a,b)=> new Date(b.time) - new Date(a.time));
    }catch(e){
      return [];
    }
  }

  function saveAllArticles(arr){
    localStorage.setItem('xm_posts', JSON.stringify(arr));
  }

  // 渲染卡片
  function renderCards(reset=false){
    if(reset){
      listEl.innerHTML='';
      loadedCount=0;
    }
    const filtered = allArticles.filter(a=> a.category === currentType);
    const slice = filtered.slice(loadedCount, loadedCount + PAGE_SIZE);
    slice.forEach(a=>{
      const card = document.createElement('article');
      card.className='card blur-card';
      card.innerHTML = `
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
  }

  // 初始加载
  function init(){
    allArticles = loadAllArticles();
    // if no data, create sample (not required, so leave empty)
    renderCards(true);
  }

  // infinite scroll
  window.addEventListener('scroll', ()=>{
    const nearBottom = (window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 120);
    if(nearBottom){
      // show loader if more to load
      const filtered = allArticles.filter(a=> a.category === currentType);
      if(loadedCount < filtered.length){
        loader.setAttribute('aria-hidden','false');
        setTimeout(()=>{ // simulate fetch delay
          renderCards(false);
          loader.setAttribute('aria-hidden','true');
        }, 600);
      }
    }
  });

  // category switch
  tabs.forEach(t=>{
    t.addEventListener('click', ()=>{
      tabs.forEach(tt=>tt.classList.remove('active'));
      t.classList.add('active');
      currentType = t.dataset.type === 'science' ? 'science' : 'blog';
      // micro animation
      t.animate([{transform:'scale(1)'},{transform:'scale(1.05)'},{transform:'scale(1)'}],{duration:180});
      // re-render
      loadedCount = 0;
      listEl.innerHTML='';
      renderCards(true);
    });
  });

  // helper: format time
  function formatTime(iso){
    try{ const d = new Date(iso); return d.toLocaleString(); }catch(e){ return iso; }
  }

  // escape html to prevent injection in this static demo
  function escapeHtml(s){
    if(!s) return '';
    return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  }

  // on load
  document.addEventListener('DOMContentLoaded', init);
})();