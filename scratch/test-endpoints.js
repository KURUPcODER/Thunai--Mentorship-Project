const testText = "केरल भारत का एक राज्य है। इसकी राजधानी तिरुवनंतपुरम है। केरल में मलयालम बोली जाती है।";

async function testEndpoints() {
  console.log("=== Testing Google Dict-Chrome-Ex ===");
  const googleUrl = new URL('https://translate.googleapis.com/translate_a/single');
  googleUrl.searchParams.set('client', 'dict-chrome-ex');
  googleUrl.searchParams.set('sl', 'hi');
  googleUrl.searchParams.set('tl', 'ml');
  googleUrl.searchParams.set('dt', 't');
  googleUrl.searchParams.set('q', testText);
  console.log("Google URL:", googleUrl.toString());

  try {
    const res = await fetch(googleUrl.toString(), {
      headers: {
        'Accept': 'application/json, text/plain, */*'
      }
    });
    console.log("Google HTTP status:", res.status);
    console.log("Google headers:", Object.fromEntries(res.headers.entries()));
    const body = await res.text();
    console.log("Google body raw:", body);
    const parsed = JSON.parse(body);
    const translated = parsed?.[0]?.map(p => p?.[0]).join('');
    console.log("Google translated:", translated);
  } catch (e) {
    console.error("Google error:", e);
  }

  console.log("\n=== Testing Google gtx ===");
  const gtxUrl = new URL('https://translate.googleapis.com/translate_a/single');
  gtxUrl.searchParams.set('client', 'gtx');
  gtxUrl.searchParams.set('sl', 'hi');
  gtxUrl.searchParams.set('tl', 'ml');
  gtxUrl.searchParams.set('dt', 't');
  gtxUrl.searchParams.set('q', testText);
  console.log("GTX URL:", gtxUrl.toString());

  try {
    const res = await fetch(gtxUrl.toString());
    console.log("GTX HTTP status:", res.status);
    const body = await res.text();
    console.log("GTX body raw:", body);
  } catch (e) {
    console.error("GTX error:", e);
  }

  console.log("\n=== Testing MyMemory ===");
  const mmUrl = new URL('https://api.mymemory.translated.net/get');
  mmUrl.searchParams.set('q', testText.slice(0, 500));
  mmUrl.searchParams.set('langpair', 'hi|ml');
  console.log("MyMemory URL:", mmUrl.toString());

  try {
    const res = await fetch(mmUrl.toString());
    console.log("MyMemory HTTP status:", res.status);
    const body = await res.text();
    console.log("MyMemory body raw:", body);
  } catch (e) {
    console.error("MyMemory error:", e);
  }
}

testEndpoints();
