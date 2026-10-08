// Local production-browser regressions. No external sharing, booking or messages.
import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {createInvite, INVITE_LIFETIME_MS} from '../domain/invite.js';
const origin='http://127.0.0.1:4178';
const key='milo_prototype_v1_state';
let server,browser;
const errors=[];
before(async()=>{
  server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4178','--strictPort'],{stdio:'pipe'});
  let ready=false;
  for(let n=0;n<100;n++){try{ready=(await fetch(origin)).ok;}catch{}if(ready)break;await new Promise(r=>setTimeout(r,100));}
  assert.ok(ready,'Production preview must start on the dedicated port');
  browser=await chromium.launch({...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{}),headless:true});
  if(process.env.MILO_EVIDENCE_DIR)await mkdir(process.env.MILO_EVIDENCE_DIR,{recursive:true});
});
after(async()=>{await browser?.close();server?.kill();});
async function setup(width,query='?golden=1&screen=s7'){
  const context=await browser.newContext({viewport:{width,height:844},timezoneId:'Asia/Kolkata'});
  // Never open a real messaging service. Clipboard and popup outcomes are controlled.
  await context.addInitScript(()=>{window.open=()=>null;window.__copied=[];Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>window.__copied.push(text)}});});
  context.setDefaultTimeout(8000);const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+query);await page.locator('.milo-viewport').waitFor();
  return {context,page};
}
async function state(page){return page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);}
async function screen(page,session,expected){await page.waitForFunction(({key,session,expected})=>JSON.parse(localStorage.getItem(key))[session].screen===expected,{key,session,expected});}
async function capture(page,name,width){
  if(!process.env.MILO_EVIDENCE_DIR)return;
  await page.evaluate(async()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));
  await page.screenshot({path:`${process.env.MILO_EVIDENCE_DIR}/${name}-${width}.png`});
}
async function noOverflow(page,width){assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);}
for(const width of [320,420]){
 test(`partner Back routes, modal keyboard/focus and re-swipe boundary (${width})`,async()=>{
  const {context,page}=await setup(width,'?golden=1&as=sneha&screen=s7');
  try{
   const original=await state(page);
   await page.locator('#miloS7Back-sneha').click();await screen(page,'sessionB','s6');
   await page.locator('#miloS6Back-sneha').click();await screen(page,'sessionB','s5');
   await page.locator('#miloS5Back-sneha').click();
   assert.equal(await page.locator('[data-back-cancel]').evaluate(e=>e===document.activeElement),true);
   await capture(page,'partner-back',width);await noOverflow(page,width);
   await page.locator('[data-back-cancel]').click();await screen(page,'sessionB','s5');
   assert.equal(await page.locator('#miloS5Back-sneha').evaluate(e=>e===document.activeElement),true);
   await page.locator('#miloS5Back-sneha').click();await page.keyboard.press('Escape');await page.locator('dialog').waitFor({state:'detached'});
   await page.locator('#miloS5Back-sneha').click();await page.locator('[data-back-confirm]').click();await screen(page,'sessionB','s1');
   const moods=await state(page);assert.deepEqual(moods.sessionB.reactions,original.sessionB.reactions);assert.deepEqual(moods.sessionB.intents,original.sessionB.intents);assert.deepEqual(moods.sessionA,original.sessionA);assert.deepEqual(moods.shared,original.shared);
   assert.equal(await page.locator('h1').evaluate(e=>e===document.activeElement),true);
   await page.locator('#miloCta-sneha').click();await page.locator('.milo-threshold-container').click();await screen(page,'sessionB','s2');
   const restarted=await state(page);assert.deepEqual(restarted.sessionB.reactions,[]);assert.equal(restarted.sessionB.currentCardIndex,0);assert.deepEqual(restarted.sessionA,original.sessionA);
  }finally{await context.close();}
 });
 test(`invite failure UI, manual copy and recovery (${width})`,async()=>{
  const {context,page}=await setup(width,'?golden=1&screen=s4');
  try{
   await page.locator('#miloShareWhatsappBtn').click();await page.locator('#miloInviteFeedback').waitFor();
   assert.match(await page.locator('#miloInviteFeedbackTitle').textContent(),/couldn't open/);
   const link=await page.locator('#miloManualInviteLink').inputValue();assert.equal(new URL(link).searchParams.get('as'),'sneha');assert.ok(new URL(link).searchParams.get('invite'));
   await page.locator('#miloSelectInviteLink').click();assert.equal(await page.locator('#miloManualInviteLink').evaluate(e=>e.selectionEnd-e.selectionStart),link.length);
   await capture(page,'invite-popup-failure',width);await noOverflow(page,width);
   assert.equal((await state(page)).sessionA.screen,'s4_invite');assert.equal((await state(page)).shared.invitePrepared,undefined);
   await page.locator('#miloInviteFeedback button').last().click();await page.locator('dialog').waitFor({state:'detached'});
   for(const unavailable of [false,true]){
    await page.evaluate(unavailable=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:unavailable?undefined:{writeText:async()=>{throw new Error('Denied');}}}),unavailable);
    await page.locator('#miloCopyLinkBtn').click();await page.locator('#miloManualInviteLink').waitFor();assert.match(await page.locator('#miloInviteFeedbackTitle').textContent(),/Couldn't copy/);
    assert.equal((await state(page)).sessionA.screen,'s4_invite');await capture(page,'invite-copy-failure',width);await page.keyboard.press('Escape');await page.locator('dialog').waitFor({state:'detached'});
   }
   await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>window.__copied.push(text)}});window.__popup={};window.open=()=>window.__popup;});
   await page.locator('#miloShareWhatsappBtn').click();assert.equal(await page.evaluate(()=>window.__popup.opener),null);
   await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await screen(page,'sessionA','s4_waiting');assert.equal((await state(page)).shared.inviteMethod,'whatsapp');assert.equal((await state(page)).shared.inviteSent,false);
   await page.locator('#miloCopyLinkBtn').click();await page.waitForFunction(()=>window.__copied.length===1);assert.equal((await state(page)).shared.inviteMethod,'copy');
   assert.match(await page.locator('.milo-invite-status').textContent(),/Link copied/);assert.match(await page.locator('.milo-s4-reassure').textContent(),/No live delivery/);
  }finally{await context.close();}
 });
 test(`invalid and expired invitation entry (${width})`,async()=>{
  for(const [token,heading] of [['bad',"This invite isn't quite right."],[createInvite(Date.now()-INVITE_LIFETIME_MS-1000),'This invite has expired.']]){
   const {context,page}=await setup(width,`?as=sneha&invite=${token}`);
   try{assert.equal(await page.locator('h1').textContent(),heading);assert.match(await page.locator('.milo-invite-error-content').textContent(),/send a fresh invite/);assert.equal(await page.locator('#miloAcceptInviteBtn').count(),0);await capture(page,token==='bad'?'invite-invalid':'invite-expired',width);await noOverflow(page,width);}finally{await context.close();}
  }
 });
 test(`valid invite starts partner and preserves repeat-visit progress (${width})`,async()=>{
  const token=createInvite();const {context,page}=await setup(width,`?as=sneha&invite=${token}`);
  try{
   await page.locator('#miloAcceptInviteBtn').click();await screen(page,'sessionB','s1');
   await page.locator('[data-intent-id]').first().click();const picks=(await state(page)).sessionB.intents;
   await page.reload();await page.locator('.milo-s1-container').waitFor();assert.deepEqual((await state(page)).sessionB.intents,picks);
   assert.equal((await state(page)).shared.acceptedInviteToken,token);await noOverflow(page,width);
  }finally{await context.close();}
 });
 test(`real same-origin tabs: agreement, timing, reload, reset and no notification claim (${width})`,async()=>{
  const {context,page:a}=await setup(width);const b=await context.newPage();b.on('pageerror',e=>errors.push(e.message));
  try{
   await a.evaluate(()=>history.replaceState({},'','/'));await b.goto(origin+'/?as=sneha');await b.locator('#miloSuggestNight-sneha').waitFor();
   const before=await state(a);
   await a.locator('.milo-plan-tile').first().click();await a.locator('[data-pick]').click();
   await b.waitForFunction(k=>Boolean(JSON.parse(localStorage.getItem(k)).shared.itineraryOverrides),key);
   await b.locator('.milo-plan-tile').first().filter({hasText:'Courtyard dinner'}).waitFor();
   // Ignore unrelated and malformed events; valid remote updates are exercised by real pages above.
   await b.evaluate(k=>{window.dispatchEvent(new StorageEvent('storage',{key:'unrelated',newValue:'{}'}));window.dispatchEvent(new StorageEvent('storage',{key:k,newValue:'{broken'}));},key);
   assert.equal(await b.locator('.milo-plan-tile').count(),3);
   await a.locator('#miloSuggestNight-aarav').click();await b.locator('#miloConfirmNight-sneha').waitFor();
   assert.match(await a.locator('.milo-cta-suggested-notice').textContent(),/No notification will be sent/);
   assert.equal(await a.locator('.milo-plan-tile:disabled').count(),3);assert.equal(await b.locator('.milo-plan-tile:disabled').count(),3);
   await b.locator('#miloConfirmNight-sneha').click();await a.locator('.milo-closing-state').waitFor();await b.locator('.milo-closing-state').waitFor();
   assert.equal((await state(a)).shared.confirmedNightId,(await state(a)).shared.suggestion.nightId);assert.equal(await a.locator('[data-customise-slot]').count(),0);
   assert.deepEqual((await state(a)).sessionA.intents,before.sessionA.intents);assert.deepEqual((await state(a)).sessionB.reactions,before.sessionB.reactions);
   await capture(a,'confirmation',width);await noOverflow(a,width);
   await a.locator('input[name=date]').fill('2030-06-15');await a.locator('input[name=time]').fill('19:30');await a.locator('.milo-timing-form button[type=submit]').click();
   await b.locator('.milo-timing-saved:visible').waitFor();assert.equal((await state(b)).shared.timing.chosenBy,'aarav');assert.equal((await state(b)).shared.timing.time,'19:30');assert.match(await b.locator('.milo-timing-saved').textContent(),/19:30/);
   await b.reload();await b.locator('.milo-closing-state').waitFor();assert.equal((await state(b)).shared.timing.time,'19:30');
   // Reset is demo-only, exercised explicitly rather than exposed in the normal UI.
   await a.evaluate(()=>localStorage.setItem('milo_intro_seen_v1','1'));await a.goto(origin+'/?demo=1');await a.locator('#miloResetBtn-aarav').click();await a.locator('.milo-reset-no').click();assert.ok((await state(a)).shared.confirmedNightId);
   await a.locator('#miloResetBtn-aarav').click();await a.locator('.milo-reset-yes').click();await screen(b,'sessionB','s1');assert.equal((await state(b)).shared.confirmedNightId,null);
  }finally{await context.close();}
 });
}
test('no uncaught browser errors across the regression flows',()=>assert.deepEqual(errors,[]));
