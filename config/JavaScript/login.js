// login.js
// 负责登录模态、Alt+M 快捷唤醒、登录验证逻辑（Base64 编码 + 简单替换），并生成 token 存入 localStorage

(function(){
  const modal = document.getElementById('loginModal');
  const manageBtn = document.getElementById('manageBtn') || document.getElementById('loginBtn');
  const loginUser = document.getElementById('loginUser');
  const loginPass = document.getElementById('loginPass');
  const loginSubmit = document.getElementById('loginSubmit');
  const loginCancel = document.getElementById('loginCancel');
  const loginError = document.getElementById('loginError');

  // 约定用户名与密码（服务端在真实场景不应写在前端）
  const VALID_USER = 'XiaoMoer';
  // 密码明文：Ww85868788
  // 存储/比对规则：先 Base64 编码，再做简单字符替换（+ -> -, / -> _）
  const processedStoredPassword = (function(){
    const raw = 'Ww85868788';
    const b = btoa(raw);
    return b.replace(/\+/g,'-').replace(/\//g,'_');
  })();

  function showModal(){
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden','false');
    loginUser.focus();
  }
  function hideModal(){
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden','true');
    clearForm();
  }
  function clearForm(){
    loginUser.value='';
    loginPass.value='';
    loginError.classList.add('hidden');
  }

  function processPassword(pw){
    // 先 base64 编码，再替换
    try{
      const b = btoa(pw);
      return b.replace(/\+/g,'-').replace(/\//g,'_');
    }catch(e){
      return '';
    }
  }

  function generateToken(){
    // 简单 token
    return 'token_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function handleLogin(){
    const user = loginUser.value.trim();
    const pw = loginPass.value;
    if(user !== VALID_USER || processPassword(pw) !== processedStoredPassword){
      loginError.classList.remove('hidden');
      loginUser.classList.toggle('invalid', true);
      loginPass.classList.toggle('invalid', true);
      return;
    }
    const token = generateToken();
    localStorage.setItem('xm_token', token);
    // 登录成功跳转到后台
    window.location.href = 'admin.html';
  }

  // open modal when clicking manage button (index.html)
  if(manageBtn){
    manageBtn.addEventListener('click', (e)=> {
      showModal();
    });
  }

  if(loginSubmit) loginSubmit.addEventListener('click', handleLogin);
  if(loginCancel) loginCancel.addEventListener('click', hideModal);

  // Alt+M 快捷键唤醒
  window.addEventListener('keydown', (e)=>{
    if(e.altKey && (e.key === 'm' || e.key === 'M')){
      e.preventDefault();
      // 判断是否已经在 admin 页面
      if(window.location.pathname.endsWith('/admin.html')){
        // do nothing
      } else {
        showModal();
      }
    }
  });

  // expose for admin page to check login
  window.xmAuth = {
    isLoggedIn: () => !!localStorage.getItem('xm_token'),
    logout: () => { localStorage.removeItem('xm_token'); },
  };
})();