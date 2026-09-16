const fs = require('fs');
const html = fs.readFileSync('news18_test.html', 'utf8');

const regex = /<([a-z0-9]+)[^>]*>([^<]*[\u0D00-\u0D7F][^<]*)<\/\1>/gi;
const matches = [];
let m;
while((m = regex.exec(html)) !== null) {
  const text = m[2].trim();
  if (text.length > 50) {
    matches.push({ tag: m[1], textLen: text.length, textSnippet: text.substring(0, 30) });
  }
}
const scripts = html.match(/<script[\s\S]*?<\/script>/gi) || [];
const hydrationScripts = scripts.filter(s => s.includes('__NEXT_DATA__') || s.includes('window.__NUXT__') || s.includes('window.__INITIAL_STATE__') || s.includes('id="__state"'));

const result = {
  directTagMatchesFound: matches.length,
  top10: matches.slice(0, 10),
  hasHydrationScripts: hydrationScripts.length > 0
};
fs.writeFileSync('out.json', JSON.stringify(result, null, 2));
