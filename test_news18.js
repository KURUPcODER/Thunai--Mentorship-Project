const fs = require('fs');
const html = fs.readFileSync('news18_test.html', 'utf8');

console.log('Total HTML length:', html.length);
console.log('Has <article>?:', /<article/i.test(html));
console.log('Has <main>?:', /<main/i.test(html));

// Real logic to find text:
const pTags = html.match(/<[a-z0-9\-]+[^>]*>([\s\S]*?)<\/[a-z0-9\-]+>/gi) || [];
const malayalamPTags = pTags.filter(p => /[\u0D00-\u0D7F]/.test(p) && p.length > 100);
console.log('Malayalam deep tags > 100 chars:', malayalamPTags.length);

if (malayalamPTags.length > 0) {
  const firstP = malayalamPTags[1] || malayalamPTags[0];
  const firstMalayalamPIdx = html.indexOf(firstP);
  const substringBefore = html.substring(0, firstMalayalamPIdx);
  const parents = substringBefore.match(/<([a-z0-9\-]+)[^>]*>/gi);
  if (parents) {
    console.log('Leading container tags:', parents.slice(-10).join('\n'));
  }
}
