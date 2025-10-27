// admin.js
// 后台管理逻辑：鉴权（localStorage token）、TinyMCE 配置（富文本 + Markdown 兼容）、发布/编辑/删除、以及 TXT 文件保存策略
//
// 文章存储结构（保存在 localStorage 的 xm_posts 数组）:
// {
//   id: "uuid",
//   title: "...",
//   category: "blog" | "science",
//   time: ISOString,
//   summary: "...",
//   content: "...", // Markdown 或 HTML（我们推荐 Markdown）
//   views: number,
//   filename: "id_title.txt" // 推荐文件名
// }

(function(){
  // 检查登录
  if(!window.xmAuth || !window.xmAuth.isLoggedIn()){
    alert('未登录或登录已过期，请先登录。');
    window.location.href = 'index.html';
  }

  // DOM refs
  const postTitle = document.getElementById('postTitle');
  const postCategory = document.getElementById('postCategory');
  const postSummary = document.getElementById('postSummary');
  const postTime = document.getElementById('postTime');
  const postEditor = document.getElementById('postEditor');
  const savePost = document.getElementById('savePost');
  const postsTableBody = document.querySelector('#postsTable tbody');
  const logoutBtn = document.getElementById('logoutBtn');
  const backFront = document.getElementById('backFront');
  const saveMsg = document.getElementById('saveMsg');
  const downloadDirBtn = document.getElementById('downloadDir');

  // File System Access API directory handle (if user selected)
  let dirHandle = null;

  // init TinyMCE
  tinymce.init({
    selector: '#postEditor',
    height: 360,
    plugins: 'code table image lists link media paste',
    toolbar: 'undo redo | bold italic underline | alignleft aligncenter alignright | bullist numlist | table | code | image | link',
    menubar: false,
    paste_as_text: true,
    setup: function(editor){
      // 限制插入图片尺寸（当用户使用插入图片时，提醒）
      editor.on('PasteChange', function(e){ /* optional */ });
    }
  });

  function uuid(){
    return 'id_' + Math.random().toString(36).slice(2,9) + Date.now().toString(36);
  }

  function loadAll(){
    const raw = localStorage.getItem('xm_posts');
    try{ return raw ? JSON.parse(raw) : []; }catch(e){ return []; }
  }
  function saveAll(arr){ localStorage.setItem('xm_posts', JSON.stringify(arr)); }

  function refreshTable(){
    const arr = loadAll().sort((a,b)=> new Date(b.time)-new Date(a.time));
    postsTableBody.innerHTML = '';
    arr.forEach(a=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${escapeHtml(a.title)}</td>
                      <td>${a.category}</td>
                      <td>${new Date(a.time).toLocaleString()}</td>
                      <td>${a.views || 0}</td>
                      <td>
                        <button class="btn tiny edit" data-id="${a.id}">编辑</button>
                        <button class="btn tiny delete" data-id="${a.id}">删除</button>
                      </td>`;
      postsTableBody.appendChild(tr);
    });
    // bind edit/delete
    postsTableBody.querySelectorAll('.edit').forEach(btn=>{
      btn.addEventListener('click',(e)=> loadToEditor(btn.dataset.id));
    });
    postsTableBody.querySelectorAll('.delete').forEach(btn=>{
      btn.addEventListener('click',(e)=> deletePost(btn.dataset.id));
    });
  }

  function loadToEditor(id){
    const arr = loadAll();
    const it = arr.find(x=> x.id === id);
    if(!it) return;
    postTitle.value = it.title;
    postCategory.value = it.category;
    postSummary.value = it.summary;
    postTime.value = (new Date(it.time)).toISOString().slice(0,16);
    tinymce.get('postEditor').setContent(it.content || '');
    // store editing id
    savePost.dataset.editing = it.id;
    window.scrollTo({top:0,behavior:'smooth'});
  }

  async function deletePost(id){
    if(!confirm('确认删除这篇文章及其 TXT 文件吗？该操作不可恢复。')) return;
    let arr = loadAll();
    const idx = arr.findIndex(x=> x.id === id);
    if(idx >= 0){
      const fileName = arr[idx].filename;
      arr.splice(idx,1);
      saveAll(arr);
      // 尝试在用户选定目录删除文件（需要 File System Access permission）
      if(dirHandle && fileName){
        try{
          await dirHandle.removeEntry(fileName);
        }catch(e){
          // 无法删除则忽略（浏览器安全限制）
        }
      }
      refreshTable();
      saveMsg.textContent = '删除成功。';
    }
  }

  // 保存文章：优先尝试使用 File System Access API 写入 config/TXT/{filename}
  // 备份：同时会写入 localStorage（保证前台可读）
  savePost.addEventListener('click', async ()=>{
    const title = postTitle.value.trim();
    const category = postCategory.value;
    const summary = postSummary.value.trim();
    const timeVal = postTime.value ? new Date(postTime.value).toISOString() : new Date().toISOString();
    const contentHtml = tinymce.get('postEditor').getContent();
    // 推荐使用 Markdown in content — 这里用户可能直接写 HTML 或 TinyMCE 输出
    if(!title){ alert('请输入标题'); return; }
    // 构建 article object
    let arr = loadAll();
    const editingId = savePost.dataset.editing;
    let id = editingId || uuid();
    const filename = `${id}_${title.replace(/\s+/g,'_').replace(/[^\w\-_.]/g,'')}.txt`;
    const article = {
      id, title, category, time: timeVal, summary, content: contentHtml, views: 0, filename
    };
    if(editingId){
      const idx = arr.findIndex(x=> x.id === editingId);
      if(idx >= 0) arr[idx] = article;
      delete savePost.dataset.editing;
    }else{
      arr.push(article);
    }
    // 写本地 storage
    saveAll(arr);

    // TXT 文件内容约定：标题、分类、发布时间、阅读量、摘要、正文（以 Markdown/HTML）
    const txtContent = [
      `标题：${article.title}`,
      `分类：${article.category}`,
      `发布时间：${article.time}`,
      `阅读量：${article.views || 0}`,
      `摘要：${article.summary || ''}`,
      `正文：`,
      `${article.content || ''}`
    ].join('\n\n');

    // 尝试使用 File System Access API (需要用户授权目录句柄)
    if(window.showDirectoryPicker && dirHandle){
      try{
        const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(txtContent);
        await writable.close();
        saveMsg.textContent = `已保存到 ${filename}`;
      }catch(e){
        console.warn('无法写入目录：', e);
        // fallback to download
        triggerDownload(filename, txtContent);
        saveMsg.textContent = '已保存（降级为下载）。';
      }
    }else{
      // 提示用户选择目录或直接下载
      triggerDownload(filename, txtContent);
      saveMsg.textContent = '已保存（下载）。若需写入本地目录，请点击“选择保存目录 (File System API)”并授权。';
    }

    refreshTable();
  });

  // 让用户选择目录：记住 dirHandle 以便后续写入/删除
  if(downloadDirBtn){
    downloadDirBtn.addEventListener('click', async ()=>{
      if(!window.showDirectoryPicker){
        alert('当前浏览器不支持 File System Access API，无法直接在本地写入目录。请使用 Chrome / Edge 并在安全上下文中尝试。');
        return;
      }
      try{
        dirHandle = await window.showDirectoryPicker();
        saveMsg.textContent = '已授权目录写入权限。后续保存将写入该目录下。';
      }catch(e){
        console.warn(e);
        saveMsg.textContent = '未选择目录或授权失败。';
      }
    });
  }

  function triggerDownload(filename, content){
    const blob = new Blob([content], {type:'text/plain;charset=utf-8'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `config/TXT/${filename}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=> URL.revokeObjectURL(a.href), 1000);
  }

  function escapeHtml(s){
    if(!s) return '';
    return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  }

  logoutBtn.addEventListener('click', ()=>{
    window.xmAuth.logout();
    window.location.href = 'index.html';
  });
  backFront.addEventListener('click', ()=> window.location.href='index.html');

  // init
  refreshTable();
})();