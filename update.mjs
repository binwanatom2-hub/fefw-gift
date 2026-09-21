const URL = 'https://gamewith.jp/fefw/577115';

const res = await fetch(URL, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
    'Accept-Language': 'ja-JP,ja;q=0.9'
  }
});

console.log('HTTP status:', res.status);

const html = await res.text();

console.log('HTML length:', html.length);

const checks = [
  '贈り物・好きなもの一覧',
  '贈り物の入手',
  '救世主',
  'カイ',
  '大好き',
  '好きなもの'
];

console.log('----- CHECK -----');

for (const word of checks) {
  console.log(
    word,
    '=>',
    html.includes(word) ? 'FOUND' : 'NOT FOUND'
  );
}

console.log('----- TITLE -----');

const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

console.log(
  title
    ? title[1].replace(/<[^>]+>/g, ' ').trim()
    : 'TITLE NOT FOUND'
);

console.log('----- AROUND 救世主 -----');

const pos = html.indexOf('救世主');

if (pos >= 0) {
  console.log(
    html
      .slice(Math.max(0, pos - 1000), pos + 3000)
      .replace(/\s+/g, ' ')
  );
} else {
  console.log('救世主 NOT FOUND');
}

console.log('----- END -----');

if (!res.ok) {
  throw new Error(`ページ取得失敗: HTTP ${res.status}`);
}

throw new Error('診断完了：上のログを確認してください');
