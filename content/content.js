// 内容脚本：检测鼠标悬停的图片，在右上角显示浮动按钮。
// 使用 Shadow DOM 隔离样式，避免被站点 CSS 干扰。

(() => {
  if (window.top !== window) return; // 仅顶层框架

  // 扩展更新后，旧内容脚本的 DOM 可能仍留在未刷新的网页里，但其运行上下文已经失效。
  // 每次补注入都先清理本版本可管理的旧实例，再建立一套新的监听，避免按钮看得见却点不动。
  const previousRuntime = globalThis.__paiTongKuanContentReady;
  try { previousRuntime?.cleanup?.(); } catch { /* 旧扩展上下文可能已失效 */ }
  document.getElementById('ir-fab-host')?.remove();
  document.getElementById('ir-region-capture-host')?.remove();
  const contentRuntime = {};
  globalThis.__paiTongKuanContentReady = contentRuntime;

  const MIN_SIZE = 110; // 过小的图标/头像不处理
  const HOST_ID = 'ir-fab-host';

  let host = null;
  let btn = null;
  let currentImg = null;
  let hideTimer = 0;
  let rafId = 0;
  let lastX = 0;
  let lastY = 0;
  let magicButtonVisible = true;
  let regionCaptureHost = null;
  let regionCaptureCleanup = null;
  let uiLanguage = 'zh';
  const contentTexts = {
    en: {
      magic: 'Reconstruct prompt and generate', capture: 'Drag to select an area · Press Esc to cancel',
      small: 'Area too small. Drag again · Press Esc to cancel', cancelled: 'Area capture cancelled',
      captureFailed: 'Capture failed: {error}', saveFailed: 'Could not save capture: {error}',
      cropFailed: 'Could not crop capture: {error}', captured: 'Captured {width} × {height} area',
      noScreenshot: 'No page screenshot was returned', unknown: 'Unknown error',
      disconnected: 'The extension is not connected to this page. Refresh the page and try again.',
      permission: 'Capture permission is unavailable. Return to the page and try again.',
      unsupported: 'This page cannot be captured. Use a regular HTTP/HTTPS webpage.',
      invalidArea: 'The selected area is invalid. Select it again.',
      invalidCrop: 'The cropped screenshot is invalid.'
    },
    ja: {
      magic: 'プロンプトを解析して生成', capture: 'ドラッグして範囲を選択 · Escでキャンセル',
      small: '範囲が小さすぎます。もう一度ドラッグ · Escでキャンセル', cancelled: '範囲キャプチャをキャンセルしました',
      captureFailed: 'キャプチャに失敗しました：{error}', saveFailed: 'キャプチャを保存できませんでした：{error}',
      cropFailed: 'キャプチャの切り抜きに失敗しました：{error}', captured: '{width} × {height} の範囲をキャプチャしました',
      noScreenshot: 'ページのスクリーンショットを取得できませんでした', unknown: '不明なエラー',
      disconnected: '拡張機能がこのページに接続されていません。ページを再読み込みしてもう一度お試しください。',
      permission: 'キャプチャ権限を使用できません。ページに戻ってもう一度お試しください。',
      unsupported: 'このページはキャプチャできません。通常のHTTP/HTTPSページで使用してください。',
      invalidArea: '選択範囲が無効です。もう一度選択してください。',
      invalidCrop: '切り抜いたスクリーンショットが無効です。'
    },
    ko: {
      magic: '프롬프트 분석 및 생성', capture: '드래그하여 영역 선택 · Esc로 취소',
      small: '영역이 너무 작습니다. 다시 드래그 · Esc로 취소', cancelled: '영역 캡처를 취소했습니다',
      captureFailed: '캡처 실패: {error}', saveFailed: '캡처 저장 실패: {error}',
      cropFailed: '캡처 자르기 실패: {error}', captured: '{width} × {height} 영역을 캡처했습니다',
      noScreenshot: '페이지 스크린샷을 가져오지 못했습니다', unknown: '알 수 없는 오류',
      disconnected: '확장 프로그램이 이 페이지에 연결되지 않았습니다. 페이지를 새로고침한 후 다시 시도하세요.',
      permission: '캡처 권한을 사용할 수 없습니다. 페이지로 돌아가 다시 시도하세요.',
      unsupported: '이 페이지는 캡처할 수 없습니다. 일반 HTTP/HTTPS 웹페이지에서 사용하세요.',
      invalidArea: '선택 영역이 올바르지 않습니다. 다시 선택하세요.',
      invalidCrop: '잘라낸 스크린샷이 올바르지 않습니다.'
    },
    zh: {
      magic: '反推提示词并生成同款', capture: '拖动框选截图区域 · 按 Esc 取消',
      small: '区域太小，请重新拖动框选 · 按 Esc 取消', cancelled: '已取消区域截图',
      captureFailed: '截图失败：{error}', saveFailed: '截图保存失败：{error}',
      cropFailed: '截图裁切失败：{error}', captured: '已截取 {width} × {height} 区域',
      noScreenshot: '未取得页面截图', unknown: '未知错误',
      disconnected: '扩展尚未连接当前网页，请刷新页面后重试',
      permission: '当前页面截图权限不可用，请返回网页后重试',
      unsupported: '当前页面不支持截图，请在普通 HTTP/HTTPS 网页中使用',
      invalidArea: '截图区域无效，请重新框选',
      invalidCrop: '裁切后的截图数据无效'
    }
  };
  const uiText = (key) => contentTexts[uiLanguage]?.[key] || contentTexts.en[key];
  const uiFormat = (key, vars = {}) => {
    let value = uiText(key);
    for (const [name, replacement] of Object.entries(vars)) value = value.replaceAll(`{${name}}`, String(replacement));
    return value;
  };
  const localizeCaptureError = (error) => {
    const raw = String(error?.message || error || '').trim();
    if (!raw) return uiText('unknown');
    if (/Receiving end does not exist|Could not establish connection/i.test(raw)) return uiText('disconnected');
    if (/activeTab permission|permission.*(?:capture|active tab)|active tab.*permission/i.test(raw)) return uiText('permission');
    if (/普通 HTTP\/HTTPS|不支持截图|Cannot access|chrome:\/\/|edge:\/\//i.test(raw)) return uiText('unsupported');
    if (/截图区域无效|selected area is invalid/i.test(raw)) return uiText('invalidArea');
    if (/裁切后的截图(?:数据|尺寸)无效|cropped screenshot is invalid/i.test(raw)) return uiText('invalidCrop');
    return raw;
  };

  const WAND_SVG = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
      <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/>
      <path d="m14 7 3 3"/>
      <path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/>
      <path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/>
    </svg>`;

  function ensureFab() {
    if (host) return;
    host = document.createElement('div');
    host.id = HOST_ID;
    host.style.cssText =
      'position:fixed;z-index:2147483647;display:none;width:30px;height:30px;' +
      'pointer-events:none;top:0;left:0;';

    const shadow = host.attachShadow({ mode: 'closed' });
    const style = document.createElement('style');
    style.textContent = `
      .fab {
        pointer-events: auto;
        width: 30px; height: 30px;
        display: flex; align-items: center; justify-content: center;
        border: none; border-radius: 9px; cursor: pointer;
        color: #fff;
        background: linear-gradient(135deg, #7c5cf6, #de58ec);
        box-shadow: 0 2px 10px rgba(0,0,0,.35);
        opacity: .92;
        transform: scale(.9);
        transition: transform .12s ease, opacity .12s ease, box-shadow .12s ease;
        padding: 0; margin: 0;
      }
      .fab:hover {
        opacity: 1;
        transform: scale(1.08);
        box-shadow: 0 4px 14px rgba(124,92,246,.55);
      }
      .fab:active { transform: scale(.98); }
    `;
    btn = document.createElement('button');
    btn.className = 'fab';
    btn.type = 'button';
    btn.title = uiText('magic');
    btn.innerHTML = WAND_SVG;

    btn.addEventListener('click', onFabClick, true);
    btn.addEventListener('pointerdown', (e) => e.stopPropagation(), true);
    btn.addEventListener('mouseenter', () => clearTimeout(hideTimer));
    btn.addEventListener('mouseleave', scheduleHide);

    shadow.append(style, btn);
    (document.documentElement || document.body).appendChild(host);
  }

  // 找到坐标下第一张足够大的 <img>（跳过本插件的按钮，兼容图片上方有遮挡层的情况）
  function findImgAt(x, y) {
    const els = document.elementsFromPoint(x, y);
    for (const el of els) {
      if (el === host) continue;
      if (el.tagName === 'IMG') {
        const src = el.currentSrc || el.src;
        if (!src) continue;
        const r = el.getBoundingClientRect();
        if (r.width >= MIN_SIZE && r.height >= MIN_SIZE) return el;
      }
    }
    return null;
  }

  function positionFab(img) {
    const r = img.getBoundingClientRect();
    const size = 30;
    const left = Math.max(4, Math.min(r.right - size - 6, window.innerWidth - size - 4));
    const top = Math.max(4, Math.min(r.top + 6, window.innerHeight - size - 4));
    host.style.left = left + 'px';
    host.style.top = top + 'px';
  }

  function show(img) {
    if (!magicButtonVisible) return;
    ensureFab();
    if (currentImg !== img) {
      currentImg = img;
      host.style.display = 'none'; // 避免闪动，先定位再显示
      positionFab(img);
    }
    positionFab(img);
    host.style.display = 'block';
    clearTimeout(hideTimer);
  }

  function hide() {
    clearTimeout(hideTimer);
    currentImg = null;
    if (host) host.style.display = 'none';
  }

  function scheduleHide() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, 300);
  }

  function refreshMagicButton() {
    if (!magicButtonVisible) {
      hide();
      return;
    }
    const img = findImgAt(lastX, lastY);
    if (img) show(img);
    else hide();
  }

  // rAF 节流的鼠标追踪
  function onMouseMove(e) {
    lastX = e.clientX;
    lastY = e.clientY;
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  function tick() {
    rafId = 0;
    const img = findImgAt(lastX, lastY);
    if (img) show(img);
    else if (currentImg) scheduleHide();
  }

  function onFabClick(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    const img = currentImg;
    if (!img) return;
    const src = img.currentSrc || img.src;
    const payload = { src, previewUrl: src, pageUrl: location.href, pageTitle: document.title };
    // 第一时间通知后台打开侧边栏，不能在此之前执行 Canvas 或任何 await。
    // 后台打开侧边栏后会再向当前页面请求已解码像素，仍然不会重复下载普通图片。
    try {
      chrome.runtime.sendMessage({ type: 'ir.openPanel', payload }, () => {
        // 读取 lastError 以避免未捕获警告；SW 不可达时静默（用户可从右键菜单重试）
        void chrome.runtime.lastError;
      });
    } catch { /* 扩展上下文失效（如扩展刚更新），忽略 */ }
  }

  async function captureLoadedImg(img, maxDim = 2048) {
    if (img.decode) {
      try { await img.decode(); } catch { /* ignore */ }
    }
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    if (!width || !height) throw new Error('图片尚未完成解码');
    const scale = Math.min(1, maxDim / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    return {
      dataUrl: canvas.toDataURL('image/webp', 0.9),
      width,
      height
    };
  }

  function showPageNotice(text, error = false) {
    const notice = document.createElement('div');
    notice.style.cssText =
      'position:fixed;z-index:2147483647;left:50%;top:24px;transform:translateX(-50%);' +
      'box-sizing:border-box;width:max-content;max-width:min(420px,calc(100vw - 24px));padding:10px 14px;border-radius:10px;' +
      `background:${error ? '#b83232' : '#292437'};color:#fff;font:13px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;` +
      'box-shadow:0 8px 28px rgba(0,0,0,.28);overflow-wrap:anywhere;text-align:center;pointer-events:none;';
    notice.textContent = text;
    (document.documentElement || document.body).appendChild(notice);
    setTimeout(() => notice.remove(), 2600);
  }

  function startRegionCapture() {
    regionCaptureCleanup?.();
    hide();

    const captureHost = document.createElement('div');
    captureHost.id = 'ir-region-capture-host';
    captureHost.style.cssText = 'position:fixed;inset:0;z-index:2147483647;pointer-events:auto;';
    const shadow = captureHost.attachShadow({ mode: 'closed' });
    const style = document.createElement('style');
    style.textContent = `
      :host { all: initial; }
      .overlay { position: fixed; inset: 0; cursor: crosshair; user-select: none; touch-action: none; background: rgba(18, 16, 28, .38); }
      .tip { position: fixed; top: 22px; left: 50%; transform: translateX(-50%); padding: 9px 14px; border-radius: 999px; color: #fff; background: rgba(35, 30, 51, .92); box-shadow: 0 7px 24px rgba(0,0,0,.25); font: 600 13px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; white-space: nowrap; pointer-events: none; }
      .selection { position: fixed; display: none; box-sizing: border-box; border: 2px solid #a78bfa; border-radius: 4px; background: transparent; box-shadow: 0 0 0 9999px rgba(18, 16, 28, .52), 0 0 0 1px rgba(255,255,255,.85) inset; }
      .size { position: absolute; left: 0; bottom: -28px; padding: 4px 7px; border-radius: 6px; color: #fff; background: rgba(35, 30, 51, .92); font: 11px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace; white-space: nowrap; }
    `;
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.tabIndex = -1;
    overlay.innerHTML = `<div class="tip">${uiText('capture')}</div><div class="selection"><span class="size"></span></div>`;
    shadow.append(style, overlay);
    (document.documentElement || document.body).appendChild(captureHost);
    regionCaptureHost = captureHost;

    const selection = overlay.querySelector('.selection');
    const size = overlay.querySelector('.size');
    let startX = 0;
    let startY = 0;
    let selecting = false;

    const cleanup = () => {
      window.removeEventListener('keydown', onKeyDown, true);
      captureHost.remove();
      if (regionCaptureHost === captureHost) regionCaptureHost = null;
      if (regionCaptureCleanup === cleanup) regionCaptureCleanup = null;
    };
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      cleanup();
      showPageNotice(uiText('cancelled'));
      void chrome.runtime.sendMessage({ type: 'ir.regionCaptureCancelled' }).catch(() => {});
    };
    const selectionRect = (x, y) => ({
      x: Math.min(startX, x),
      y: Math.min(startY, y),
      width: Math.abs(x - startX),
      height: Math.abs(y - startY)
    });
    const renderSelection = (rect) => {
      selection.style.display = 'block';
      selection.style.left = `${rect.x}px`;
      selection.style.top = `${rect.y}px`;
      selection.style.width = `${rect.width}px`;
      selection.style.height = `${rect.height}px`;
      size.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
    };

    overlay.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      selecting = true;
      startX = event.clientX;
      startY = event.clientY;
      overlay.setPointerCapture?.(event.pointerId);
      renderSelection({ x: startX, y: startY, width: 0, height: 0 });
    }, true);
    overlay.addEventListener('pointermove', (event) => {
      if (!selecting) return;
      event.preventDefault();
      renderSelection(selectionRect(event.clientX, event.clientY));
    }, true);
    overlay.addEventListener('pointerup', (event) => {
      if (!selecting) return;
      event.preventDefault();
      event.stopPropagation();
      selecting = false;
      const rect = selectionRect(event.clientX, event.clientY);
      if (rect.width < 20 || rect.height < 20) {
        selection.style.display = 'none';
        overlay.querySelector('.tip').textContent = uiText('small');
        return;
      }
      cleanup();
      requestAnimationFrame(() => requestAnimationFrame(() => {
        chrome.runtime.sendMessage({
          type: 'ir.captureRegion',
          payload: { rect, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight }
        }, (response) => {
          const message = chrome.runtime.lastError?.message;
          if (message || !response?.ok || !response.dataUrl) {
            showPageNotice(uiFormat('captureFailed', {
              error: localizeCaptureError(message || response?.error || uiText('noScreenshot'))
            }), true);
            return;
          }
          void cropRegionScreenshot(response.dataUrl, rect, window.innerWidth, window.innerHeight)
            .then((cropped) => chrome.runtime.sendMessage({
              type: 'ir.submitRegionCapture',
              payload: cropped
            }, (submitResponse) => {
              const submitError = chrome.runtime.lastError?.message;
              if (submitError || !submitResponse?.ok) {
                showPageNotice(uiFormat('saveFailed', {
                  error: localizeCaptureError(submitError || submitResponse?.error || uiText('unknown'))
                }), true);
              } else {
                showPageNotice(uiFormat('captured', {
                  width: submitResponse.width,
                  height: submitResponse.height
                }));
              }
            }))
            .catch((error) => showPageNotice(uiFormat('cropFailed', {
              error: localizeCaptureError(error)
            }), true));
        });
      }));
    }, true);
    overlay.addEventListener('contextmenu', (event) => event.preventDefault(), true);
    overlay.addEventListener('wheel', (event) => event.preventDefault(), { passive: false });
    window.addEventListener('keydown', onKeyDown, true);
    regionCaptureCleanup = cleanup;
    queueMicrotask(() => overlay.focus({ preventScroll: true }));
  }

  function cropRegionScreenshot(dataUrl, rect, viewportWidth, viewportHeight, maxDim = 2048) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        try {
          const scaleX = image.naturalWidth / viewportWidth;
          const scaleY = image.naturalHeight / viewportHeight;
          const sx = Math.max(0, Math.min(image.naturalWidth - 1, Math.round(rect.x * scaleX)));
          const sy = Math.max(0, Math.min(image.naturalHeight - 1, Math.round(rect.y * scaleY)));
          const sw = Math.max(1, Math.min(image.naturalWidth - sx, Math.round(rect.width * scaleX)));
          const sh = Math.max(1, Math.min(image.naturalHeight - sy, Math.round(rect.height * scaleY)));
          const outputScale = Math.min(1, maxDim / Math.max(sw, sh));
          const outputWidth = Math.max(1, Math.round(sw * outputScale));
          const outputHeight = Math.max(1, Math.round(sh * outputScale));
          const canvas = document.createElement('canvas');
          canvas.width = outputWidth;
          canvas.height = outputHeight;
          canvas.getContext('2d').drawImage(image, sx, sy, sw, sh, 0, 0, outputWidth, outputHeight);
          resolve({
            dataUrl: canvas.toDataURL('image/webp', 0.92),
            width: sw,
            height: sh,
            mime: 'image/webp'
          });
        } catch (error) {
          reject(error);
        }
      };
      image.onerror = () => reject(new Error('无法读取当前页面截图'));
      image.src = dataUrl;
    });
  }

  // 右键菜单发生在后台；尽量回到页面上下文复用已经解码的图片。
  function onRuntimeMessage(msg, _sender, sendResponse) {
    if (msg?.type === 'ir.startRegionCapture') {
      startRegionCapture();
      sendResponse({ ok: true });
      return;
    }
    if (msg?.type === 'ir.cancelRegionCapture') {
      const cancelled = Boolean(regionCaptureCleanup);
      regionCaptureCleanup?.();
      if (cancelled) showPageNotice(uiText('cancelled'));
      sendResponse({ ok: true, cancelled });
      return;
    }
    if (msg?.type === 'ir.magicVisibility') {
      magicButtonVisible = msg.visible !== false;
      refreshMagicButton();
      sendResponse({ ok: true, visible: magicButtonVisible });
      return;
    }
    if (msg?.type === 'ir.languageChanged') {
      uiLanguage = ['zh', 'en', 'ja', 'ko'].includes(msg.language) ? msg.language : 'en';
      if (btn) btn.title = uiText('magic');
      sendResponse({ ok: true, language: uiLanguage });
      return;
    }
    if (msg?.type !== 'ir.captureImage' || !msg.src) return;
    const img = [...document.images].find((el) => (el.currentSrc || el.src) === msg.src);
    if (!img) {
      sendResponse({ ok: false, error: '页面中未找到目标图片' });
      return;
    }
    captureLoadedImg(img)
      .then((captured) => sendResponse({ ok: true, ...captured }))
      .catch((e) => sendResponse({ ok: false, error: e?.message || String(e) }));
    return true;
  }

  chrome.runtime.onMessage.addListener(onRuntimeMessage);

  // 滚动 / 缩放时重新定位，图片滚出视口则隐藏
  function onScrollOrResize() {
    if (!currentImg || !host || host.style.display === 'none') return;
    if (!document.contains(currentImg)) { hide(); return; }
    const r = currentImg.getBoundingClientRect();
    if (r.bottom < -20 || r.top > window.innerHeight + 20 ||
        r.right < -20 || r.left > window.innerWidth + 20) {
      hide();
      return;
    }
    positionFab(currentImg);
  }

  document.addEventListener('mousemove', onMouseMove, { passive: true, capture: true });
  window.addEventListener('scroll', onScrollOrResize, { passive: true, capture: true });
  window.addEventListener('resize', onScrollOrResize, { passive: true });

  function cleanupRuntime() {
    clearTimeout(hideTimer);
    if (rafId) cancelAnimationFrame(rafId);
    document.removeEventListener('mousemove', onMouseMove, true);
    window.removeEventListener('scroll', onScrollOrResize, true);
    window.removeEventListener('resize', onScrollOrResize);
    window.removeEventListener('pagehide', cleanupRuntime);
    regionCaptureCleanup?.();
    try { chrome.runtime.onMessage.removeListener(onRuntimeMessage); } catch { /* 扩展更新期间忽略 */ }
    host?.remove();
    host = null;
    btn = null;
    currentImg = null;
    if (globalThis.__paiTongKuanContentReady === contentRuntime) {
      delete globalThis.__paiTongKuanContentReady;
    }
  }

  contentRuntime.cleanup = cleanupRuntime;
  window.addEventListener('pagehide', cleanupRuntime);

  try {
    chrome.runtime.sendMessage({ type: 'ir.getUiPrefs' }, (resp) => {
      void chrome.runtime.lastError;
      magicButtonVisible = resp?.visible !== false;
      uiLanguage = ['zh', 'en', 'ja', 'ko'].includes(resp?.language) ? resp.language : 'en';
      if (btn) btn.title = uiText('magic');
      refreshMagicButton();
    });
  } catch { /* 扩展更新期间忽略 */ }
})();
