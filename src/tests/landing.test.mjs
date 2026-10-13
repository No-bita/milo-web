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
  test(`landing renders problem first, then solution, without sideways scroll (${width})`,async()=>{
    const p=await open(width);
    try{
      await p.locator('.lp-hero h1').waitFor();
      assert.match(await p.locator('.lp-hero h1').innerText(),/You picked the person\. Milo handles the plan\./);
      const order=await p.locator('main > section h2').allInnerTexts();
      assert.equal(order[0],'Sound familiar?');
      assert.ok(order.indexOf('Meet milo.')>0,'problem sections come before Meet milo.');
      assert.equal(await p.locator('.lp-scenes li').count(),6);
      assert.equal(await p.locator('.lp-steps > li').count(),4);
      assert.equal(await p.locator('.lp-phone .lp-bubble').count(),4);
      const firstChat=await p.locator('.lp-phone').boundingBox();assert.ok(firstChat.width<=width,'chat mockup fits the viewport');
      const over=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
      assert.ok(over<=0,'no horizontal overflow, got '+over);
      if(process.env.MILO_EVIDENCE_DIR)await p.screenshot({path:`${process.env.MILO_EVIDENCE_DIR}/landing-${width}.png`,fullPage:true});
    }finally{await p.close();}
  });
}

test('waitlist is an honest placeholder: nothing to type, nothing stored',async()=>{
  const p=await open(420);
  try{
    assert.equal(await p.locator('#lp-email').isDisabled(),true);
    assert.equal(await p.locator('.lp-form button').isDisabled(),true);
    assert.match(await p.locator('#waitlist').innerText(),/not collecting emails/i);
  }finally{await p.close();}
});

test('landing never promises group plans, and names booking only as coming soon',async()=>{
  const p=await open(420);
  try{
    const text=await p.locator('body').innerText();
    assert.doesNotMatch(text,/group/i);
    const booking=text.match(/[^.]*booking[^.]*\./gi)||[];
    assert.ok(booking.length>0&&booking.every(s=>/coming soon|next/i.test(s)),'booking only appears as coming soon');
  }finally{await p.close();}
});

test('landing CTAs go to the waitlist and the prototype opens at /app/',async()=>{
  const p=await open(420);
  try{
    assert.equal(await p.locator('.lp-hero .lp-btn').getAttribute('href'),'#waitlist');
    await p.locator('.lp-waitlist .lp-link').click();
    await p.waitForURL(/\/app\/$/);
    await p.locator('.milo-first-open, .milo-home').first().waitFor();
  }finally{await p.close();}
});

test('old shared links with app params still reach the app',async()=>{
  const p=await open(420,'/?as=sneha&screen=s1');
  try{
    await p.waitForURL(/\/app\/\?as=sneha/);
    await p.locator('.milo-viewport').waitFor();
  }finally{await p.close();}
});
