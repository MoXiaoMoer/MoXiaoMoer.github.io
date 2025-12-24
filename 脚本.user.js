.// ==UserScript==

// @name         𝑾𝑷𝑬𝑺 𝑻𝒐𝒐𝒍

// @namespace    http://tampermonkey.net/

// @version      22.3

// @description  网页缩放工具

// @author       𝑿𝒊𝒂𝒐𝑴𝒐𝒆𝒓.

// @match        *://*/*

// @grant        GM_setValue

// @grant        GM_getValue

// @grant        GM_deleteValue

// @run-at       document-end

// @icon         https://thirdqq.qlogo.cn/ek_qqapp/AQLYvLHM7JcY7afntTXbEicJq2E3hFPW3sCqjWXniahKZT4ho3P6MnicibPICYTKwFlIJwj21b5AtH2XvJFZ1ZU3Afia3TDhrxlibC13Q7v604ibIDjlFumFB8/0
// ==/UserScript==

(function() {

    'use strict';

    const CONFIG = {

        idleTime: 3000,

        toggleBtnWidth: 100,

        toggleBtnHeight: 28,

        panelGap: 8,

        screenEdgeMargin: 20,

        scaleRange: [0.5, 2],

        scaleStep: 0.05,

        longPressTime: 1000,

        bounceOffset: 5,

        zIndex: 9999, // 降低层级，避免穿透iframe

        arrowLen: 14,

        arrowThick: 3,

        arrowRadius: 2,

        arrowAngle: 45,

        arrowRotate: 0

    };

    const VERSION_INFO = {

        name: "网页缩放控制器",

        version: "𝟮𝟮.𝟯",

        author: "𝑿𝒊𝒂𝒐𝑴𝒐𝒆𝒓.",

        functions: ["重叠展开45°V形箭头", "缩放调节", "回弹动画", "长按美化弹窗", "邮箱跳转", "遮罩层关闭", "防iframe穿透", "样式隔离", "深色模式适配"],

        email: "MoJi_Qr@icloud.com",

        libs: ["原生JavaScript", "CSS3 Transform", "CSS3 Transition", "Tampermonkey API"],

        coreCode: ["DOM动态创建", "本地存储GM_setValue", "事件监听", "深色模式媒体查询", "iframe层级隔离"]

    };

    // ========== 核心样式：新增防iframe穿透+层级隔离 ==========

    const coreStyle = document.createElement('style');

    coreStyle.textContent = `

        /* 根容器：仅在主页面显示，禁止穿透iframe */

        #scale-control-root {

            position: fixed !important;

            top: 0 !important;

            right: ${CONFIG.screenEdgeMargin}px !important;

            z-index: ${CONFIG.zIndex} !important;

            pointer-events: auto !important;

            -webkit-user-select: none !important;

            user-select: none !important;

            /* 关键：限制为顶级窗口渲染，iframe内不显示 */

            display: ${window.top === window.self ? 'flex' : 'none'} !important;

            flex-direction: column !important;

            align-items: flex-end !important;

        }

        #scale-toggle-btn {

            width: ${CONFIG.toggleBtnWidth}px !important;

            height: ${CONFIG.toggleBtnHeight}px !important;

            border: none !important;

            border-radius: 0 0 20px 20px !important;

            background: #f5f5f5 !important;

            cursor: pointer !important;

            display: flex !important;

            align-items: center !important;

            justify-content: center !important;

            box-shadow: 0 3px 8px rgba(0,0,0,0.2) !important;

            transition: background 0.2s ease !important;

        }

        #scale-toggle-btn:hover {

            background: #f0f0f0 !important;

        }

        #scale-panel-container {

            position: absolute !important;

            top: ${CONFIG.toggleBtnHeight + CONFIG.panelGap}px !important;

            right: 0 !important;

            display: flex !important;

            flex-direction: column !important;

            align-items: center !important;

            gap: 4px !important;

            opacity: 0 !important;

            pointer-events: none !important;

            transition: opacity 0.3s ease, transform 0.3s ease !important;

            transform: translateY(${CONFIG.bounceOffset}px) !important;

        }

        #scale-panel-container.show {

            opacity: 1 !important;

            pointer-events: auto !important;

            transform: translateY(0) !important;

        }

        #scale-panel-container.hide {

            opacity: 0 !important;

            pointer-events: none !important;

            transform: translateY(-${CONFIG.bounceOffset}px) !important;

        }

        #scale-control-panel {

            padding: 12px 20px !important;

            border-radius: 28px !important;

            background: #fff !important;

            border: 1px solid #eee !important;

            box-shadow: 0 4px 15px rgba(0,0,0,0.15) !important;

            display: flex !important;

            align-items: center !important;

            gap: 12px !important;

        }

        .scale-btn {

            border: none !important;

            background: transparent !important;

            cursor: pointer !important;

            display: flex !important;

            align-items: center !important;

            justify-content: center !important;

        }

        #scale-reset-btn {

            width: 32px !important;

            height: 32px !important;

            border-radius: 50% !important;

            border: 2px solid #e0e0e0 !important;

            transition: border-color 0.2s ease !important;

        }

        #scale-reset-btn:hover {

            border-color: #666 !important;

        }

        #scale-minus-btn, #scale-plus-btn {

            width: 34px !important;

            height: 34px !important;

            border-radius: 10px !important;

            font-size: 18px !important;

            color: #555 !important;

            transition: background 0.2s ease !important;

        }

        #scale-minus-btn:hover, #scale-plus-btn:hover {

            background: #f0f0f0 !important;

        }

        #scale-text {

            min-width: 50px !important;

            text-align: center !important;

            font-size: 15px !important;

            font-weight: 600 !important;

            color: #555 !important;

        }

        .scale-tip {

            font-size: 11px !important;

            color: #666 !important;

            white-space: nowrap !important;

        }

        /* ========== 固定遮罩层：同样防iframe穿透 ========== */

        #modal-mask {

            position: fixed !important;

            top: 0 !important;

            left: 0 !important;

            width: 100vw !important;

            height: 100vh !important;

            background: rgba(0, 0, 0, 0.5) !important;

            z-index: ${CONFIG.zIndex + 9} !important;

            opacity: 0 !important;

            pointer-events: none !important;

            transition: opacity 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;

            transform: none !important;

            resize: none !important;

            display: ${window.top === window.self ? 'block' : 'none'} !important;

        }

        #modal-mask.show {

            opacity: 1 !important;

            pointer-events: auto !important;

        }

        /* ========== 版本弹窗：防iframe穿透 ========== */

        #scale-version-modal {

            position: fixed !important;

            top: 50% !important;

            left: 50% !important;

            transform: translate(-50%, -50%) scale(0.9) !important;

            z-index: ${CONFIG.zIndex + 10} !important;

            opacity: 0 !important;

            pointer-events: none !important;

            padding: 25px 30px !important;

            border-radius: 20px !important;

            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important;

            box-shadow: 0 8px 32px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.8) inset !important;

            max-width: 350px !important;

            width: 90% !important;

            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;

            line-height: 1.6 !important;

            font-family: "Microsoft YaHei", sans-serif !important;

            resize: none !important;

            display: ${window.top === window.self ? 'block' : 'none'} !important;

        }

        #scale-version-modal.show {

            opacity: 1 !important;

            pointer-events: auto !important;

            transform: translate(-50%, -50%) scale(1) !important;

        }

        /* 标题渐变 */

        .modal-title {

            text-align: center !important;

            font-size: 18px !important;

            font-weight: bold !important;

            margin: 0 0 15px 0 !important;

            background: linear-gradient(90deg, #6a85b6, #bac8e0) !important;

            -webkit-background-clip: text !important;

            -webkit-text-fill-color: transparent !important;

            position: relative !important;

        }

        .modal-title::after {

            content: "" !important;

            display: block !important;

            width: 50px !important;

            height: 2px !important;

            background: linear-gradient(90deg, #6a85b6, transparent) !important;

            margin: 8px auto 0 auto !important;

        }

        /* 信息行样式 */

        .info-row {

            margin: 8px 0 !important;

            font-size: 14px !important;

        }

        .info-label {

            font-weight: 600 !important;

            color: #495057 !important;

            margin-right: 5px !important;

        }

        /* 邮箱链接样式 */

        .email-link {

            color: #6a85b6 !important;

            text-decoration: none !important;

            position: relative !important;

            padding-bottom: 2px !important;

        }

        .email-link::after {

            content: "" !important;

            position: absolute !important;

            bottom: 0 !important;

            left: 0 !important;

            width: 0 !important;

            height: 1px !important;

            background: #6a85b6 !important;

            transition: width 0.3s ease !important;

        }

        .email-link:hover::after {

            width: 100% !important;

        }

        /* 功能列表样式 */

        .func-list, .lib-list, .code-list {

            margin: 10px 0 0 0 !important;

            padding-left: 15px !important;

        }

        .list-title {

            font-size: 14px !important;

            font-weight: 600 !important;

            color: #495057 !important;

            margin: 10px 0 5px 0 !important;

        }

        .list-item {

            display: block !important;

            margin: 3px 0 !important;

            font-size: 13px !important;

            color: #6c757d !important;

            position: relative !important;

            padding-left: 15px !important;

        }

        .list-item::before {

            content: "✦" !important;

            position: absolute !important;

            left: 0 !important;

            color: #6a85b6 !important;

            font-size: 10px !important;

        }

        /* 箭头容器：中心定位 */

        #arrow-container {

            position: relative !important;

            width: ${CONFIG.arrowLen}px !important;

            height: ${CONFIG.arrowLen}px !important;

        }

        .arrow-bar {

            position: absolute !important;

            width: ${CONFIG.arrowLen}px !important;

            height: ${CONFIG.arrowThick}px !important;

            border-radius: ${CONFIG.arrowRadius}px !important;

            background: #555 !important;

            top: 50% !important;

            left: 50% !important;

            transform-origin: center center !important;

            transition: transform 0.3s ease !important;

        }

        .arrow-bar-left, .arrow-bar-right {

            transform: translate(-50%, -50%) rotate(90deg) !important;

        }

        #arrow-container.expand .arrow-bar-left {

            transform: translate(-50%, -50%) rotate(${90 - CONFIG.arrowAngle}deg) !important;

        }

        #arrow-container.expand .arrow-bar-right {

            transform: translate(-50%, -50%) rotate(${90 + CONFIG.arrowAngle}deg) !important;

        }

        /* ========== 深色模式适配 ========== */

        @media (prefers-color-scheme: dark) {

            #scale-toggle-btn { background: #2d2d2d !important; }

            #scale-toggle-btn:hover { background: #383838 !important; }

            #scale-control-panel { background: #2d2d2d !important; border-color: #444 !important; }

            #scale-reset-btn { border-color: #555 !important; }

            #scale-reset-btn:hover { border-color: #888 !important; }

            #scale-minus-btn, #scale-plus-btn { color: #eee !important; }

            #scale-minus-btn:hover, #scale-plus-btn:hover { background: #383838 !important; }

            #scale-text { color: #eee !important; }

            .scale-tip { color: #aaa !important; }

            .arrow-bar { background: #eee !important; }

            #modal-mask { background: rgba(0, 0, 0, 0.7) !important; }

            #scale-version-modal {

                background: linear-gradient(135deg, #2d2d2d 0%, #1f1f1f 100%) !important;

                box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1) inset !important;

            }

            .modal-title {

                background: linear-gradient(90deg, #8ba4d0, #bac8e0) !important;

                -webkit-background-clip: text !important;

                -webkit-text-fill-color: transparent !important;

            }

            .modal-title::after { background: linear-gradient(90deg, #8ba4d0, transparent) !important; }

            .info-label { color: #ddd !important; }

            .info-value { color: #ccc !important; }

            .email-link { color: #8ba4d0 !important; }

            .email-link::after { background: #8ba4d0 !important; }

            .list-title { color: #ddd !important; }

            .list-item { color: #aaa !important; }

            .list-item::before { color: #8ba4d0 !important; }

        }

    `;

    document.head.appendChild(coreStyle);

    // ========== 1. 独立根容器 ==========

    const controlRoot = document.createElement('div');

    controlRoot.id = 'scale-control-root';

    document.body.appendChild(controlRoot);

    // ========== 2. 触发按钮 + 重叠展开式箭头 ==========

    const toggleBtn = document.createElement('button');

    toggleBtn.id = 'scale-toggle-btn';

    

    const arrowContainer = document.createElement('div');

    arrowContainer.id = 'arrow-container';

    

    const barLeft = document.createElement('div');

    barLeft.className = 'arrow-bar arrow-bar-left';

    const barRight = document.createElement('div');

    barRight.className = 'arrow-bar arrow-bar-right';

    arrowContainer.append(barLeft, barRight);

    toggleBtn.appendChild(arrowContainer);

    controlRoot.appendChild(toggleBtn);

    // ========== 3. 缩放面板 ==========

    const panelContainer = document.createElement('div');

    panelContainer.id = 'scale-panel-container';

    controlRoot.appendChild(panelContainer);

    const controlPanel = document.createElement('div');

    controlPanel.id = 'scale-control-panel';

    panelContainer.appendChild(controlPanel);

    const resetBtn = document.createElement('button');

    resetBtn.id = 'scale-reset-btn';

    resetBtn.className = 'scale-btn';

    controlPanel.appendChild(resetBtn);

    const btnBox = document.createElement('div');

    btnBox.style.display = 'flex';

    btnBox.style.alignItems = 'center';

    btnBox.style.gap = '6px';

    btnBox.style.padding = '4px';

    btnBox.style.background = window.matchMedia('(prefers-color-scheme: dark)').matches ? '#3a3a3a' : '#f8f8f8';

    btnBox.style.borderRadius = '16px';

    const minusBtn = document.createElement('button');

    minusBtn.id = 'scale-minus-btn';

    minusBtn.className = 'scale-btn';

    minusBtn.innerText = '-';

    const scaleText = document.createElement('span');

    scaleText.id = 'scale-text';

    const plusBtn = document.createElement('button');

    plusBtn.id = 'scale-plus-btn';

    plusBtn.className = 'scale-btn';

    plusBtn.innerText = '+';

    btnBox.append(minusBtn, scaleText, plusBtn);

    controlPanel.appendChild(btnBox);

    const tipText = document.createElement('div');

    tipText.className = 'scale-tip';

    tipText.innerText = `长按还原按钮 ${CONFIG.longPressTime/1000} 秒查看版本`;

    panelContainer.appendChild(tipText);

    // ========== 4. 遮罩层 + 版本弹窗 ==========

    const modalMask = document.createElement('div');

    modalMask.id = 'modal-mask';

    document.body.appendChild(modalMask);

    const versionModal = document.createElement('div');

    versionModal.id = 'scale-version-modal';

    

    const funcHtml = VERSION_INFO.functions.map(func => `<span class="list-item">${func}</span>`).join('');

    const libsHtml = VERSION_INFO.libs.map(lib => `<span class="list-item">${lib}</span>`).join('');

    const codeHtml = VERSION_INFO.coreCode.map(code => `<span class="list-item">${code}</span>`).join('');

    versionModal.innerHTML = `

        <h3 class="modal-title">${VERSION_INFO.name}</h3>

        <div class="info-row">

            <span class="info-label">版本：</span>

            <span class="info-value">${VERSION_INFO.version}</span>

        </div>

        <div class="info-row">

            <span class="info-label">作者：</span>

            <span class="info-value">${VERSION_INFO.author}</span>

        </div>

        <div class="info-row">

            <span class="info-label">邮箱：</span>

            <a href="mailto:${VERSION_INFO.email}" class="email-link info-value">${VERSION_INFO.email}</a>

        </div>

        

        <div class="list-title">核心功能</div>

        <div class="func-list">${funcHtml}</div>

        

        <div class="list-title">使用技术</div>

        <div class="lib-list">${libsHtml}</div>

        

        <div class="list-title">关键代码</div>

        <div class="code-list">${codeHtml}</div>

    `;

    document.body.appendChild(versionModal);

    // ========== 5. 缩放逻辑 ==========

    let currentScale = GM_getValue('pageScale', 1);

    let isPanelOpen = false;

    let idleTimer = null;

    let longPressTimer = null;

    let pressStartTime = 0;

    const scaleWrapper = document.createElement('div');

    scaleWrapper.id = 'scale-content-wrapper';

    scaleWrapper.style.transform = `scale(${currentScale})`;

    scaleWrapper.style.transformOrigin = '0 0';

    scaleWrapper.style.transition = 'transform 0.15s ease-out';

    scaleWrapper.style.width = '100%';

    scaleWrapper.style.minHeight = '100vh';

    const bodyChildren = Array.from(document.body.children);

    bodyChildren.forEach(child => {

        if (child.id !== 'scale-control-root' && child.id !== 'scale-version-modal' && child.id !== 'modal-mask') {

            scaleWrapper.appendChild(child);

        }

    });

    document.body.insertBefore(scaleWrapper, document.body.firstChild);

    scaleText.innerText = `${Math.round(currentScale * 100)}%`;

    function updateScale(newScale) {

        newScale = Math.max(CONFIG.scaleRange[0], Math.min(CONFIG.scaleRange[1], newScale));

        currentScale = newScale;

        scaleWrapper.style.transform = `scale(${currentScale})`;

        scaleText.innerText = `${Math.round(currentScale * 100)}%`;

        GM_setValue('pageScale', currentScale);

    }

    // ========== 6. 箭头动画 + 面板切换 ==========

    function togglePanel() {

        isPanelOpen = !isPanelOpen;

        if (isPanelOpen) {

            panelContainer.classList.remove('hide');

            panelContainer.classList.add('show');

            arrowContainer.classList.add('expand');

            resetIdleTimer();

        } else {

            panelContainer.classList.remove('show');

            panelContainer.classList.add('hide');

            arrowContainer.classList.remove('expand');

        }

    }

    function resetIdleTimer() {

        clearTimeout(idleTimer);

        idleTimer = setTimeout(togglePanel, CONFIG.idleTime);

    }

    // ========== 7. 弹窗显隐逻辑 ==========

    function showModal() {

        if (window.top === window.self) { // 仅顶级窗口显示

            versionModal.classList.add('show');

            modalMask.classList.add('show');

        }

    }

    function hideModal() {

        versionModal.classList.remove('show');

        modalMask.classList.remove('show');

    }

    resetBtn.addEventListener('pointerdown', function(e) {

        e.preventDefault();

        e.stopPropagation();

        pressStartTime = Date.now();

        if (longPressTimer) clearTimeout(longPressTimer);

        longPressTimer = setTimeout(() => {

            const duration = Date.now() - pressStartTime;

            if (duration >= CONFIG.longPressTime) {

                showModal();

            }

        }, CONFIG.longPressTime);

    });

    function handlePressEnd() {

        clearTimeout(longPressTimer);

        const duration = Date.now() - pressStartTime;

        if (duration < CONFIG.longPressTime && duration > 50) {

            updateScale(1);

            GM_deleteValue('pageScale');

        }

        pressStartTime = 0;

    }

    document.addEventListener('pointerup', handlePressEnd);

    document.addEventListener('pointercancel', handlePressEnd);

    resetBtn.addEventListener('pointerleave', handlePressEnd);

    modalMask.addEventListener('click', hideModal);

    versionModal.addEventListener('click', (e) => e.stopPropagation());

    // ========== 8. 禁止文本选择 ==========

    document.addEventListener('selectstart', function(e) {

        if (e.target.closest('#scale-control-root') || e.target.closest('#scale-version-modal') || e.target.closest('#modal-mask')) {

            e.preventDefault();

        }

    });

    // ========== 9. 事件绑定 ==========

    toggleBtn.addEventListener('click', togglePanel);

    minusBtn.addEventListener('click', () => updateScale(currentScale - CONFIG.scaleStep));

    plusBtn.addEventListener('click', () => updateScale(currentScale + CONFIG.scaleStep));

    [resetBtn, minusBtn, plusBtn].forEach(el => el.addEventListener('mouseover', resetIdleTimer));

    // ========== 10. 深色模式监听 + 兜底 ==========

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {

        btnBox.style.background = e.matches ? '#3a3a3a' : '#f8f8f8';

    });

    setInterval(() => {

        if (!document.body.contains(controlRoot)) document.body.appendChild(controlRoot);

        if (!document.body.contains(versionModal)) document.body.appendChild(versionModal);

        if (!document.body.contains(modalMask)) document.body.appendChild(modalMask);

    }, 1000);

    window.addEventListener('resize', () => {

        controlRoot.style.right = `${CONFIG.screenEdgeMargin}px`;

    });

})();
