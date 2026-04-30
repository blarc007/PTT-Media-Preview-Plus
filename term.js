function getConfig() {
  const raw = localStorage['pttchrome.pref.v1'];
  const config = {
    isEasyReadingEnabled: false,
    isPicPreviewEnabled: true,
  };
  if (!raw) {
    return config;
  }
  try {
    const pref = JSON.parse(raw);
    config.isEasyReadingEnabled = !!pref.values.enableEasyReading;
    config.isPicPreviewEnabled = !!pref.values.enablePicPreview;
  } catch (e) {
    console.error(e);
  }
  return config;
}

let { isEasyReadingEnabled, isPicPreviewEnabled } = getConfig();

new MutationObserver((records) => {
  for (const record of records) {
    for (const node of record.removedNodes) {
      if (node.role === 'dialog') {
        const config = getConfig();
        isEasyReadingEnabled = config.isEasyReadingEnabled;
        isPicPreviewEnabled = config.isPicPreviewEnabled;
        return;
      }
    }
  }
}).observe(document.body, { childList: true });

(function registerObserver() {
  const mainContainer = document.getElementById('mainContainer');
  if (!mainContainer) {
    setTimeout(registerObserver, 1000);
    return;
  }

  function isMail() {
    return mainContainer.lastChild?.querySelector('.q0.b7')?.textContent === '回信 ';
  }

  const config = {
    childList: true,
    subtree: true,
  };

  // 建立懸浮預覽容器
  const hoverPreview = document.createElement('div');
  hoverPreview.style.cssText = `
    position: fixed;
    z-index: 10000;
    pointer-events: none;
    display: none;
    max-width: 80vw;
    max-height: 80vh;
    border: 1px solid #888;
    background: #000;
    box-shadow: 0 0 20px rgba(0,0,0,0.8);
    opacity: 0;
    transition: opacity 0.15s ease-in-out;
    overflow: hidden;
  `;
  const hoverImg = document.createElement('img');
  hoverImg.style.cssText = 'max-width: 80vw; max-height: 80vh; display: block; object-fit: contain;';
  hoverPreview.appendChild(hoverImg);
  document.body.appendChild(hoverPreview);

  function showHover(e, url) {
    if (!isPicPreviewEnabled) return;
    hoverImg.src = url;
    hoverPreview.style.display = 'block';
    // 稍微延遲一點點讓 opacity 變化產生動畫效果
    setTimeout(() => {
      hoverPreview.style.opacity = '1';
    }, 10);
    updateHoverPos(e);
  }

  function hideHover() {
    if (hoverPreview.style.display === 'none') return;
    hoverPreview.style.opacity = '0';
    // 等動畫結束後再隱藏並清空 src
    setTimeout(() => {
      if (hoverPreview.style.opacity === '0') {
        hoverPreview.style.display = 'none';
        hoverImg.src = '';
      }
    }, 150);
  }

  // 鍵盤操作時立即隱藏預覽（解決按下 <- 離開文章時預覽圖殘留的問題）
  window.addEventListener('keydown', hideHover, true);
  // 視窗失去焦點時也隱藏
  window.addEventListener('blur', hideHover);

  function updateHoverPos(e) {
    const offset = 20;
    let x = e.clientX + offset;
    let y = e.clientY + offset;
    
    const pw = hoverPreview.offsetWidth;
    const ph = hoverPreview.offsetHeight;
    const ww = window.innerWidth;
    const wh = window.innerHeight;

    // 水平位置調整
    if (x + pw > ww) {
      x = e.clientX - pw - offset;
    }
    // 垂直位置調整
    if (y + ph > wh) {
      y = e.clientY - ph - offset;
    }

    // 最終邊界檢查：確保不會超出螢幕四周
    x = Math.max(5, Math.min(x, ww - pw - 5));
    y = Math.max(5, Math.min(y, wh - ph - 5));
    
    hoverPreview.style.left = x + 'px';
    hoverPreview.style.top = y + 'px';
  }

  // 事件委派：監聽 mainContainer 上的滑鼠事件
  mainContainer.addEventListener('mouseover', (e) => {
    if (!isPicPreviewEnabled) return;
    const a = e.target.closest('a');
    if (!a) return;

    const isImgur = a.hostname.includes('imgur.com');

    for (const rule of rules) {
      const match = rule.match(a);
      if (match) {
        // 如果是影片規則，或者是由 PttChrome 原生支援的 Imgur 規則，則跳過自定義懸浮
        if (['youtube', 'twitch'].includes(rule.name)) return;
        if (isImgur && ['standard-image', 'imgur-album'].includes(rule.name)) return;
        
        let previewUrl = a.href;
        if (rule.name === 'google-proxy') {
          previewUrl = `https://${match[1].replaceAll('.', '-')}.translate.goog/${match[2]}`;
        } else if (rule.name === 'meee') {
          const url = new URL(a.href);
          url.host = `i.${url.host}`;
          url.pathname += '.jpg';
          previewUrl = url.toString();
        }
        showHover(e, previewUrl);
        break;
      }
    }
  });

  mainContainer.addEventListener('mousemove', (e) => {
    if (hoverPreview.style.display === 'block') {
      updateHoverPos(e);
    }
  });

  mainContainer.addEventListener('mouseout', (e) => {
    const a = e.target.closest('a');
    if (a) {
      hideHover();
    }
  });

  function createImage(url) {
    const img = createImageEl(url);
    img.classList.add('easyReadingImg', 'hyperLinkPreview');
    return img;
  }

  function createImgurGif(url) {
    const video = document.createElement('video');
    video.classList.add('easyReadingImg', 'hyperLinkPreview');
    video.src = url.replace(/\.gif$/, '.mp4');
    video.loop = true;
    video.autoplay = true;
    video.controls = false;
    return video;
  }

  function createIframe(src) {
    const container = document.createElement('div');
    container.style.margin = '0.5em auto';
    container.style.maxWidth = '800px';
    container.style.height = '450px';

    const iframe = document.createElement('iframe');
    iframe.type = 'text/html';
    iframe.src = src;
    iframe.style.border = 'none';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'origin-when-cross-origin';
    container.appendChild(iframe);
    return container;
  }

  const processed = new WeakSet();

  function getNewElements(elements) {
    const results = [];
    for (const e of elements) {
      if (!processed.has(e)) {
        processed.add(e);
        results.push(e);
      }
    }
    return results;
  }

  function getPreviewContainer(a) {
    return a.parentNode.nextSibling;
  }

  const rules = [
    {
      name: 'imgur-album',
      match: (a) => a.href.match(/https?:\/\/(?:[mi]\.)?imgur.com\/(?:a|gallery)\/(\w+)/),
      apply: async (a, match) => {
        const hash = match[1];
        const div = getPreviewContainer(a);
        if (!div || div.firstChild) return;
        while (div.firstChild) {
          div.removeChild(div.lastChild);
        }
        const links = await resolveAlbum(hash);
        for (const link of links) {
          div.appendChild(
            link.endsWith('.gif') ? createImgurGif(link) : createImage(link),
          );
        }
      },
    },
    {
      name: 'google-proxy',
      match: (a) => a.href.match(/^https?:\/\/(i\.mopix\.cc|i\.ibb\.co)\/(.*)/),
      apply: (a, match) => {
        const domain = match[1];
        const path = match[2];
        const newUrl = `https://${domain.replaceAll('.', '-')}.translate.goog/${path}`;
        const div = getPreviewContainer(a);
        if (div && !div.firstChild) {
          div.appendChild(createImage(newUrl));
        }
      },
    },
    {
      name: 'meee',
      match: (a) => a.href.match(/^https:\/\/meee\.com\.tw\/(\w+)$/),
      apply: (a) => {
        const url = new URL(a.href);
        url.host = `i.${url.host}`;
        url.pathname += '.jpg';
        const imageUrl = url.toString();
        const div = getPreviewContainer(a);
        if (div && !div.firstChild) {
          div.appendChild(createImage(imageUrl));
        }
      },
    },
    {
      name: 'twitter-media',
      match: (a) => a.href.startsWith('https://pbs.twimg.com/media/'),
      apply: (a) => {
        const div = getPreviewContainer(a);
        if (div && !div.firstChild) {
          div.appendChild(createImage(a.href));
        }
      },
    },
    {
      name: 'youtube',
      match: (a) => a.href.match(/https:\/\/(?:youtu\.be\/|www\.youtube\.com\/watch\?v=)([\w-]+)/),
      apply: (a, match) => {
        const id = match[1];
        const div = getPreviewContainer(a);
        if (!div || div.childNodes.length !== 0) return;
        const url = new URL(a.href);
        let src = `https://www.youtube.com/embed/${id}`;
        if (url.searchParams.has('t')) {
          src += `?start=${url.searchParams.get('t')}`;
        }
        div.appendChild(createIframe(src));
      },
    },
    {
      name: 'twitch',
      match: (a) => a.href.match(/https:\/\/clips\.twitch\.tv\/([\w-]+)/),
      apply: (a, match) => {
        const id = match[1];
        const div = getPreviewContainer(a);
        if (!div || div.childNodes.length !== 0) return;
        div.appendChild(createIframe(`https://clips.twitch.tv/embed?clip=${id}&parent=term.ptt.cc`));
      },
    },
    {
      name: 'standard-image',
      match: (a) => /(png|jpeg|jpg|gif|webp)$/i.test(a.href),
      apply: (a) => {
        const div = getPreviewContainer(a);
        if (div && !div.firstChild) {
          div.appendChild(createImage(a.href));
        }
      },
    },
  ];

  function onUpdate() {
    if (!isEasyReadingEnabled) {
      return;
    }

    if (!mainContainer.querySelector('.q4.b7') || isMail()) {
      return;
    }

    const as = getNewElements(mainContainer.querySelectorAll('a'));
    const videoImgs = getNewElements(
      mainContainer.querySelectorAll('img.hyperLinkPreview[src$=".mp4"]'),
    );

    if (as.length === 0 && videoImgs.length === 0) {
      return;
    }

    observer.disconnect();

    as.forEach((a) => {
      for (const rule of rules) {
        const match = rule.match(a);
        if (match) {
          rule.apply(a, match);
          break;
        }
      }
    });

    videoImgs.forEach((img) => {
      const videoEl = document.createElement('video');
      videoEl.src = img.src;
      videoEl.classList.add('easyReadingImg', 'hyperLinkPreview');
      videoEl.controls = true;
      img.parentNode.replaceChild(videoEl, img);
    });

    observer.observe(mainContainer, config);
  }

  let timer = null;
  const observer = new MutationObserver(function() {
    if (!timer) {
      timer = setTimeout(() => {
        onUpdate();
        timer = null;
      }, 50);
    }
  });
  observer.observe(mainContainer, config);
})();
