// Landing page at / and the planner at /app/. No external requests are made beyond fonts (blocked in test).
import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
const origin='http://127.0.0.1:4185';
let server,browser;
before(async()=>{
  server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4185','--strictPort'],{stdio:'pipe'});
  let ready=false;
  for(let n=0;n<100;n++){try{ready=(await fetch(origin)).ok;}catch{}if(ready)break;await new Promise(r=>setTimeout(r,100));}
  assert.ok(ready,'Production preview must start on the dedicated port');
  browser=await chromium.launch({...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{}),headless:true});
  if(process.env.MILO_EVIDENCE_DIR)await mkdir(process.env.MILO_EVIDENCE_DIR,{recursive:true});
});
after(async()=>{await browser?.close();server?.kill();});
async function open(width,path='/'){const page=await browser.newPage({viewport:{width,height:844}});page.setDefaultTimeout(6000);await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());await page.goto(origin+path);return page;}

for(const width of [320,420,1280]){
  test(`landing renders its sections in order, without sideways scroll (${width})`,async()=>{
    const p=await open(width);
    try{
      await p.locator('.hero h1').waitFor();
      assert.match(await p.locator('.hero h1').innerText(),/You make/);
      assert.match(await p.locator('.hero h1').innerText(),/them happen\./);
      const ids=await p.locator('main > section').evaluateAll(els=>els.map(e=>e.id||e.className));
      const at=(name)=>ids.findIndex(x=>x.includes(name));
      assert.ok(at('top')===0,'hero comes first');
      assert.ok(at('how-it-works')>at('top'),'how-it-works after hero');
      assert.ok(at('moments')>at('how-it-works'),'moments after how-it-works');
      assert.ok(at('our-promise')>at('moments'),'our-promise after moments');
      assert.ok(at('faq')>at('our-promise'),'faq after our-promise');
      assert.equal(await p.locator('.stages > li').count(),5);
      assert.equal(await p.locator('.rail .occ').count(),5);
      const over=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
      assert.ok(over<=0,'no horizontal overflow, got '+over);
      if(process.env.MILO_EVIDENCE_DIR)await p.screenshot({path:`${process.env.MILO_EVIDENCE_DIR}/landing-${width}.png`,fullPage:true});
    }finally{await p.close();}
  });
}

test('landing collects no emails: no input and no form anywhere',async()=>{
  const p=await open(420);
  try{
    assert.equal(await p.locator('input').count(),0);
    assert.equal(await p.locator('form').count(),0);
  }finally{await p.close();}
});

test('booking copy keeps the manual-vs-in-app distinction',async()=>{
  const p=await open(420);
  try{
    const faq=await p.locator('#faq').innerText();
    assert.match(faq,/real people handle the bookings/i);
    assert.match(faq,/In-app booking is not live yet/i);
    assert.ok(!/you book it/i.test(faq),'retired self-booking claim is gone');
    const body=await p.locator('body').innerText();
    assert.ok(!/book(ing)? (is )?(now )?(live|available) in the app/i.test(body),'no in-app-booking-live claim');
  }finally{await p.close();}
});


test('every landing CTA opens the planner at /app/',async()=>{
  const p=await open(420);
  try{
    const hrefs=await p.locator('a.cta:not(.outline)').evaluateAll(els=>els.map(e=>e.getAttribute('href')));
    assert.ok(hrefs.length>=4,'expected at least 4 CTAs, got '+hrefs.length);
    assert.ok(hrefs.every(h=>h==='./app/'),'every CTA goes to ./app/, got '+hrefs.join(' | '));
    await p.locator('.hero a.cta').first().click();
    await p.waitForURL(/\/app\/$/);
    await p.locator('.milo-first-open, .milo-home').first().waitFor();
  }finally{await p.close();}
});

test('old shared links keep every param and the fragment when they redirect to the app',async()=>{
  const p=await browser.newPage({viewport:{width:420,height:844}});
  const hops=[];p.on('framenavigated',f=>hops.push(f.url()));
  await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  await p.goto(origin+'/?as=sneha&screen=s1#details');
  try{
    await p.waitForURL(/\/app\//);
    assert.ok(hops.includes(origin+'/app/?as=sneha&screen=s1#details'),'redirect kept both params and the fragment: '+hops.join(' | '));
    await p.locator('.milo-viewport').waitFor();
  }finally{await p.close();}
});
