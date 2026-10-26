import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {INTENTS} from '../data/mockData.js';
const site='http://127.0.0.1:4184';const origin=site+'/app/';let browser,server;
before(async()=>{server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4184','--strictPort']);let ready=false;for(let n=0;n<100;n++){try{ready=(await fetch(site)).ok;}catch{}if(ready)break;await new Promise(r=>setTimeout(r,100));}assert.ok(ready);browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true});});
after(async()=>{await browser?.close();server?.kill();});
for(const width of [320,420])for(const actor of ['aarav','sneha'])test(`Photo-card moods, three-pick gate and keyboard (${actor},${width})`,async()=>{
 const context=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce'});const p=await context.newPage();p.setDefaultTimeout(30000);const errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{
 await p.goto(origin+'?screen=s1'+(actor==='sneha'?'&as=sneha':''));const cta=p.locator(`#miloCta-${actor}`);const options=p.locator('.milo-tile');await options.first().waitFor();assert.equal(await options.count(),8);assert.equal(await p.locator('h1').textContent(),'How do you want tonight to feel?');assert.match(await p.locator('.milo-subline').textContent(),/Pick three moods/);assert.equal(await cta.isDisabled(),true);assert.equal(await p.locator('.milo-subline-text').textContent(),'0/3');
 assert.deepEqual(await options.evaluateAll(es=>es.map(e=>e.querySelector('img').getAttribute('src'))),INTENTS.map(i=>i.image));
 // The approved A layout uses rectangular photo-fill cards, not circular portraits.
 const photos=p.locator('.milo-tile-img');assert.equal(await photos.count(),8);
 const geometry=await options.evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect(),img=e.querySelector('.milo-tile-img'),photo=img.getBoundingClientRect(),style=getComputedStyle(img);return {x:r.x,y:r.y,width:r.width,height:r.height,photoX:photo.x,photoY:photo.y,photoWidth:photo.width,photoHeight:photo.height,fit:style.objectFit,radius:parseFloat(style.borderTopLeftRadius)};}));
 for(const card of geometry){assert.ok(card.width>card.height,'approved cards stay rectangular');assert.ok(Math.abs(card.photoWidth-card.width)<3&&Math.abs(card.photoHeight-card.height)<3,'photos fill their cards');assert.ok(Math.abs(card.photoX-card.x)<2&&Math.abs(card.photoY-card.y)<2,'photos align with their cards');assert.equal(card.fit,'cover');assert.ok(card.radius<Math.min(card.photoWidth,card.photoHeight)/2,'photos are not circular');}
 for(let row=0;row<4;row++){const left=geometry[row*2],right=geometry[row*2+1];assert.ok(Math.abs(left.y-right.y)<2,'each row contains two aligned cards');assert.ok(right.x>=left.x+left.width,'columns do not overlap');assert.ok(Math.abs(left.width-right.width)<2,'columns have equal widths');if(row){assert.ok(left.y>=geometry[(row-1)*2].y+geometry[(row-1)*2].height,'rows do not overlap');assert.ok(Math.abs(left.x-geometry[0].x)<2&&Math.abs(right.x-geometry[1].x)<2,'all rows fill the same columns');}}
 for(let i=0;i<3;i++){await options.nth(i).focus();await p.keyboard.press(i===0?'Enter':'Space');assert.equal(await options.nth(i).getAttribute('aria-pressed'),'true');assert.equal(await p.locator('.milo-mood-dots .is-filled').count(),i+1);assert.equal(await p.locator('.milo-subline-text').textContent(),`${i+1}/3`);assert.equal(await cta.isDisabled(),i<2);assert.equal(await cta.textContent(),i===0?'Ooh. Two more.':i===1?'Last one, make it count':'Show me what fits →');}
 await options.nth(3).click();assert.equal(await options.nth(3).getAttribute('aria-pressed'),'false');assert.equal(await p.locator('.milo-tile.selected').count(),3);assert.equal(await p.locator('.milo-subline-text').textContent(),'3/3');
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth),width);
 assert.equal(await p.locator('.milo-wordmark').evaluate(e=>{const h=e.parentElement.getBoundingClientRect(),r=e.getBoundingClientRect();return Math.abs((h.left+h.right)/2-(r.left+r.right)/2)<2;}),true);
 if(process.env.MILO_EVIDENCE_DIR){await mkdir(process.env.MILO_EVIDENCE_DIR,{recursive:true});await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});await p.screenshot({path:`${process.env.MILO_EVIDENCE_DIR}/moods-after-${actor}-${width}.png`});}
 await options.nth(0).click();assert.equal(await cta.isDisabled(),true);assert.equal(await cta.textContent(),'Last one, make it count');assert.equal(await p.locator('.milo-mood-dots .is-filled').count(),2);assert.equal(await p.locator('.milo-subline-text').textContent(),'2/3');await options.nth(3).click();assert.equal(await cta.isDisabled(),false);assert.equal(await cta.textContent(),'Show me what fits →');assert.equal(await p.locator('.milo-subline-text').textContent(),'3/3');
 await cta.click();await p.locator('.milo-path-container,.milo-threshold-container,.milo-s2-container').first().waitFor();assert.deepEqual(errors,[]);
 }finally{await context.close();}
});
test('small-height mood page scrolls all choices and CTA into reach',async()=>{const p=await browser.newPage({viewport:{width:320,height:568}});try{await p.goto(origin+'?screen=s1');await p.locator('[data-intent-id=outdoors]').scrollIntoViewIfNeeded();await p.locator('[data-intent-id=outdoors]').click();await p.locator('#miloCta-aarav').scrollIntoViewIfNeeded();const r=await p.locator('#miloCta-aarav').boundingBox();assert.ok(r.y>=0&&r.y+r.height<=569);}finally{await p.close();}});
