const fs = require('fs');
const html = fs.readFileSync('news18_test.html', 'utf8');

const regex = /<([a-z0-9]+)([^>]*)>([^<]*[\u0D00-\u0D7F][^<]*)<\/\1>/gi;
const matches = [];
let m;
while((m = regex.exec(html)) !== null) {
  const tag = m[1];
  const attrs = m[2];
  const text = m[3].trim();
  if (text.length > 30) {
    matches.push({ tag, attrs: attrs.trim(), textLen: text.length, textSnippet: text.substring(0, 30) });
  }
}
fs.writeFileSync('inspect_out.json', JSON.stringify({ count: matches.length, matches: matches }, null, 2));
