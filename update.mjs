import fs from 'node:fs/promises';

const URL = 'https://gamewith.jp/fefw/577115';

const res = await fetch(URL, {
  headers: {
    'User-Agent': 'Mozilla/5.0'
  }
});

if (!res.ok) {
  throw new Error(`ページ取得失敗: ${res.status}`);
}

const html = await res.text();

const text = html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<br\s*\/?\s*>/gi, '\n')
  .replace(/<\/?(?:p|div|li|h\d|tr|td|th|a)[^>]*>/gi, '\n')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&#x27;/g, "'")
  .replace(/[ \t]+/g, ' ')
  .replace(/\n\s*\n+/g, '\n');

const start = text.lastIndexOf('贈り物・好きなもの一覧');
const end = text.indexOf('贈り物の入手', start + 20);

if (start < 0 || end < 0 || end <= start) {
  throw new Error('対象範囲を検出できませんでした');
}

const section = text.slice(start, end);

const lines = section
  .split('\n')
  .map(s => s.trim())
  .filter(Boolean);

let chars = [];
let cur = null;
let mode = null;

function saveCurrent() {
  if (!cur) return;

  if (cur.love.length || cur.like.length || cur.things.length) {
    chars.push(cur);
  }
}

for (const line of lines) {

  const m = line.match(/^\s*(\d+)[.．]\s*(.+?)\s*$/);

  if (m) {
    saveCurrent();

    cur = {
      name: m[2].trim(),
      love: [],
      like: [],
      things: []
    };

    mode = null;
    continue;
  }

  if (!cur) continue;

  if (line === '大好き') {
    mode = 'love';
    continue;
  }

  if (line === '好き') {
    mode = 'like';
    continue;
  }

  if (line === '好きなもの') {
    mode = 'things';
    continue;
  }

  if (
    mode &&
    line !== '調査中' &&
    line !== '#N/A' &&
    !line.startsWith('#')
  ) {
    cur[mode].push(line);
  }
}

saveCurrent();

chars = chars.filter(c =>
  c.name &&
  c.name.length < 30 &&
  (c.love.length || c.like.length || c.things.length)
);

if (chars.length < 20) {
  throw new Error(`解析件数が少なすぎます: ${chars.length}`);
}

const um = text.match(/最終更新\s*[:：]?\s*([^\n]+)/);

const out = {
  updatedAt: new Date().toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo'
  }),
  sourceUpdatedAt: um?.[1]?.trim() || '',
  characters: chars
};

await fs.writeFile(
  'data.json',
  JSON.stringify(out, null, 2)
);

console.log(`updated ${chars.length} characters`);
