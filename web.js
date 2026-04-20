function createDiv(...classes) {
  const div = document.createElement('div');
  div.classList.add(...classes);
  return div;
}

function insertPreview(anchor, el) {
  const div = createDiv('richcontent');
  div.appendChild(el);
  anchor.parentNode.insertBefore(div, anchor.nextSibling);
}

function createLazyImageEl(src) {
  const imgEl = createImageEl(src);
  imgEl.loading = 'lazy';
  return imgEl;
}

function fixBrokenPreview(anchor) {
  const next = anchor.nextElementSibling;
  if (next?.classList.contains('richcontent')) {
    next.firstChild.src = anchor.href;
  } else {
    insertPreview(anchor, createLazyImageEl(anchor.href));
  }
}

const rules = [
  {
    name: 'imgur-album',
    match: (a) => a.href.match(/https?:\/\/(?:[mi]\.)?imgur.com\/(?:a|gallery)\/(\w+)/),
    apply: async (a, match) => {
      const hash = match[1];
      const links = await resolveAlbum(hash);
      for (const link of links.reverse()) {
        insertPreview(a, createLazyImageEl(link));
      }
    },
  },
  {
    name: 'mopix',
    match: (a) => a.href.match(/^https?:\/\/i\.mopix\.cc\/(.*)/),
    apply: (a, match) => {
      const path = match[1];
      insertPreview(a, createLazyImageEl(`https://i-mopix-cc.translate.goog/${path}`));
    },
  },
  {
    name: 'meee',
    match: (a) => a.href.match(/^https:\/\/meee\.com\.tw\/(\w+)$/),
    apply: (a) => {
      const url = new URL(a.href);
      url.host = `i.${url.host}`;
      url.pathname += '.jpg';
      insertPreview(a, createLazyImageEl(url.toString()));
    },
  },
  {
    name: 'twitch',
    match: (a) => a.href.match(/^https:\/\/clips\.twitch\.tv\/([\w-]+)/),
    apply: (a, match) => {
      const id = match[1];
      const iframe = document.createElement('iframe');
      iframe.classList.add('youtube-player');
      iframe.type = 'text/html';
      iframe.src = `https://clips.twitch.tv/embed?clip=${id}&parent=www.ptt.cc`;
      iframe.allowFullscreen = true;
      iframe.style.border = 'none';
      const contentDiv = createDiv('resize-content');
      contentDiv.appendChild(iframe);
      const container = createDiv('resize-container');
      container.appendChild(contentDiv);
      insertPreview(a, container);
    },
  },
  {
    name: 'twitter-media',
    match: (a) => a.href.match(/^https:\/\/pbs\.twimg\.com\/media\/.*format=/),
    apply: (a) => {
      insertPreview(a, createLazyImageEl(a.href));
    },
  },
  {
    name: 'youtube-start-time',
    match: (a) => a.href.match(/^https:\/\/youtu\.be\/.*[?&]t=/),
    apply: (a) => {
      const url = new URL(a.href);
      const start = url.searchParams.get('t');
      const iframe = document.querySelector(`iframe.youtube-player[src*="${url.pathname}"]`);
      if (iframe && !iframe.src.includes('start=')) {
        iframe.src += (iframe.src.includes('?') ? '&' : '?') + `start=${start}`;
      }
    },
  },
  {
    name: 'standard-image',
    match: (a) => /(png|jpeg|jpg|gif|webp)$/i.test(a.href),
    apply: (a) => {
      fixBrokenPreview(a);
    },
  },
  {
    name: 'imgur-unknown',
    match: (a) => a.href.match(/https?:\/\/(?:[mi]\.)?imgur.com\/(\w+)$/),
    apply: async (a, match) => {
      const hash = match[1];
      const { type, link } = await resolveUnknown(hash);
      let el = null;
      if (type.startsWith('video/')) {
        el = createVideoEl(link);
      } else if (type.startsWith('image/')) {
        el = createLazyImageEl(link);
      }
      if (el) {
        insertPreview(a, el);
      }
    },
  },
];

const as = document.querySelectorAll('a');
for (const a of as) {
  for (const rule of rules) {
    const match = rule.match(a);
    if (match) {
      rule.apply(a, match);
      break;
    }
  }
}
