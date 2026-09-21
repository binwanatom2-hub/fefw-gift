import fs from 'node:fs/promises';

const URL = 'https://gamewith.jp/fefw/577115';

const res = await fetch(URL, {
  headers: {
    'User-Agent': 'Mozilla/5.0',
    'Accept-Language': 'ja-JP,ja;q=0.9'
  }
});

if (!res.ok) {
  throw new Error(`ページ取得失敗: HTTP ${res.status}`);
}

const html = await res.text();

function decode(s) {
  return s
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&#x27;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function toLines(s) {
  return decode(
    s
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(
        /<\/?(?:p|div|h[1-6]|td|th|tr|a|span|strong)[^>]*>/gi,
        '\n'
      )
      .replace(/<[^>]+>/g, ' ')
  )
    .split('\n')
    .map(x => x.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

/*
  メニューではなく、本文の h2 を直接探す。
*/
const startMatch = html.match(
  /<h2[^>]*>\s*贈り物・好きなもの一覧\s*<\/h2>/i
);

if (!startMatch || startMatch.index === undefined) {
  throw new Error('本文の一覧見出しを検出できませんでした');
}

const start = startMatch.index + startMatch[0].length;

const rest = html.slice(start);

const endMatch = rest.match(
  /<h2[^>]*>\s*贈り物の入手[\s\S]*?<\/h2>/i
);

if (!endMatch || endMatch.index === undefined) {
  throw new Error('一覧の終了位置を検出できませんでした');
}

const section = rest.slice(0, endMatch.index);

/*
  番号の文字列ではなく、
  ordered list の li をキャラクター単位として読む。
*/
const blocks = [
  ...section.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)
];

console.log(`候補ブロック数: ${blocks.length}`);

const chars = [];

for (const match of blocks) {

  const lines = toLines(match[1]);

  if (!lines.length) continue;

  const lovePos = lines.indexOf('大好き');
  const likePos = lines.indexOf('好き');
  const thingsPos = lines.indexOf('好きなもの');

  /*
    キャラクターのブロックなら
    「大好き」と「好きなもの」が存在する。
  */
  if (lovePos < 0 || thingsPos < 0) continue;

  const name = lines[0]
    .replace(/^\d+[.．]?\s*/, '')
    .trim();

  if (!name || name.length > 30) continue;

  const loveEnd =
    likePos > lovePos && likePos < thingsPos
      ? likePos
      : thingsPos;

  const love = lines
    .slice(lovePos + 1, loveEnd)
    .filter(x => x !== '調査中' && x !== '#N/A');

  const like =
    likePos > lovePos && likePos < thingsPos
      ? lines
          .slice(likePos + 1, thingsPos)
          .filter(x => x !== '調査中' && x !== '#N/A')
      : [];

  const things = lines
    .slice(thingsPos + 1)
    .filter(x => x !== '調査中' && x !== '#N/A');

  chars.push({
    name,
    love,
    like,
    things
  });
}

console.log(`解析できたキャラクター数: ${chars.length}`);

if (chars.length) {
  console.log(
    '先頭キャラ:',
    chars.slice(0, 3).map(c => c.name).join(', ')
  );
}

if (chars.length < 20) {
  throw new Error(
    `解析件数が少なすぎます: ${chars.length}`
  );
}

const text = toLines(html).join('\n');

const um = text.match(
  /最終更新\s*[:：]?\s*([^\n]+)/
);

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
