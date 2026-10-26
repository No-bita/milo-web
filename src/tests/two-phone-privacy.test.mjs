// The ONE new test authorized for Phase 1. No other test scenarios added.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { chromium } from 'playwright';
import { PGlite } from '@electric-sql/pglite';
import { createApi } from '../../server/phase1.js';
import { EXPERIENCE_POOL } from '../data/mockData.js';

test('two isolated phones never receive the other seat picks or derived leanings', async () => {
  const db = new PGlite();
  for (const file of ['schema.sql', 'gifts.sql', 'concierge.sql']) await db.exec(await readFile(new URL(`../../server/${file}`, import.meta.url), 'utf8'));
  // One SQL connection in PGlite: serialize requests, matching a connected
  // transaction client. Live Postgres plan locks handle real concurrency.
  let tail = Promise.resolve();
  const acquire = async () => {
    const previous = tail; let release;
    tail = new Promise(resolve => { release = resolve; }); await previous;
    return { query:(sql,args) => db.query(sql,args), release };
  };
  const env = { NODE_ENV:'test', MILO_PHASE1_ENABLED:'true', MILO_PUBLIC_ORIGIN:'http://127.0.0.1', RATE_LIMIT_SECRET:'local-test-only' };
  const api = createApi({ acquire, env, clientIp:() => '127.0.0.1' });
  const server = createServer(async (req,res) => {
    if (!req.url.startsWith('/api')) { res.setHeader('Content-Type','text/html'); res.end('<title>Privacy test</title>'); return; }
    const chunks = []; for await (const chunk of req) chunks.push(chunk);
    const request = new Request(`http://127.0.0.1${req.url}`, { method:req.method, headers:req.headers, ...(chunks.length ? { body:Buffer.concat(chunks) } : {}) });
    const result = await api(request); res.writeHead(result.status, Object.fromEntries(result.headers)); res.end(Buffer.from(await result.arrayBuffer()));
  });
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const site = `http://127.0.0.1:${server.address().port}`;
  // Invite URLs must point at THIS server so a recipient can follow them.
  env.MILO_PUBLIC_ORIGIN = site;
  let browser;
  try {
    browser = await chromium.launch({ ...(process.env.CHROME_BIN ? { executablePath:process.env.CHROME_BIN } : {}), headless:true });
    const phones = await Promise.all([browser.newContext(),browser.newContext()]);
    const pages = await Promise.all(phones.map(phone => phone.newPage()));
    await Promise.all(pages.map(page => page.goto(site)));
    const call = (page,path,method='GET',body) => page.evaluate(async ({path,method,body}) => {
      const key = localStorage.getItem('seat');
      const response = await fetch(path,{ method, headers:{ ...(key ? { Authorization:`Bearer ${key}` } : {}), ...(body ? { 'Content-Type':'application/json' } : {}) }, ...(body ? { body:JSON.stringify(body) } : {}) });
      return { status:response.status, data:await response.json() };
    },{path,method,body});
    const created = await call(pages[0],'/api/plans','POST',{ name:'PrivateAlpha',occasion:'date_night' });
    assert.equal(created.status,201); const id = created.data.plan_id;
    await pages[0].evaluate(key => localStorage.setItem('seat',key),created.data.seat_key);
    // The recipient follows the generated invite URL itself: the link must
    // resolve on the public origin and carry a usable invite token.
    assert.ok(created.data.invite_url.startsWith(`${site}/app/?invite=`));
    const followed = await pages[1].goto(created.data.invite_url);
    assert.equal(followed.status(),200);
    const invite = await pages[1].evaluate(() => new URL(window.location.href).searchParams.get('invite'));
    assert.ok(invite && /^[A-Za-z0-9_-]+$/.test(invite));
    const preview = await call(pages[1],`/api/invites/${invite}`);
    assert.equal(preview.status,200);
    assert.deepEqual(preview.data,{ status:'valid', initiator_name:'PrivateAlpha', occasion:'date_night' });
    const joined = await call(pages[1],`/api/invites/${invite}/join`,'POST',{ name:'PrivateBeta' });
    assert.equal(joined.status,201);
    await pages[1].evaluate(key => localStorage.setItem('seat',key),joined.data.seat_key);
    const own = [
      { intents:['intimate','low-key'],reactions:EXPERIENCE_POOL.slice(0,8).map(card => ({cardId:card.id,reaction:'into_it'})),finished:true },
      { intents:['fun','novelty'],reactions:EXPERIENCE_POOL.slice(4,12).map(card => ({cardId:card.id,reaction:'not_tonight'})),finished:true }
    ];
    const exactKeys = (object,expected) => assert.deepEqual(Object.keys(object).sort(),[...expected].sort());
    function inspect(view,index) {
      exactKeys(view,['id','occasion','city','status','me','partner','shared_result','suggestion','confirmed_night_id','timing']);
      exactKeys(view.me,['role','display_name','intents','reactions','finished']);
      assert.deepEqual(view.me.intents,own[index].intents); assert.deepEqual(view.me.reactions,own[index].reactions);
      exactKeys(view.partner,['display_name','finished']);
      assert.equal(view.partner.display_name,index === 0 ? 'PrivateBeta' : 'PrivateAlpha');
      const shared = view.shared_result;
      if (shared) {
        exactKeys(shared,['sharedRows','difference','bridgeSentence','selectedNights']);
        shared.sharedRows.forEach(row => exactKeys(row,['text']));
        if (shared.difference) exactKeys(shared.difference,['dim','copy']);
        shared.selectedNights.forEach(item => {
          exactKeys(item,['num','fitLine','whyItWorks','night']);
          exactKeys(item.night,['id','name','reasonLine','leanLine','skipIf','beats','defaultImage']);
          item.night.beats.forEach(beat => exactKeys(beat,['name','desc']));
        });
      }
      assert.doesNotMatch(JSON.stringify(view),/"(?:leaningsA|leaningsB|combined|valA|valB|gap|profile|seat_key_hash|invite_token)"/);
    }
    // Intercept EVERY private response on both profiles, including action views.
    const checked = [];
    pages.forEach((page,index) => page.on('response', response => {
      if (new URL(response.url()).pathname === `/api/plans/${id}` || response.url().endsWith('/actions')) {
        checked.push(response.json().then(view => inspect(view,index)));
      }
    }));
    for (let index=0; index<2; index++) {
      const saved = await call(pages[index],`/api/plans/${id}/me`,'PUT',own[index]); assert.equal(saved.status,200);
    }
    const views = await Promise.all(pages.map(page => call(page,`/api/plans/${id}`)));
    views.forEach((result,index) => { assert.equal(result.status,200); inspect(result.data,index); });
    assert.deepEqual(views[0].data.shared_result,views[1].data.shared_result);
    const night = views[0].data.shared_result.selectedNights[0].night.id;
    assert.equal((await call(pages[0],`/api/plans/${id}/actions`,'POST',{type:'suggest',night_id:night})).status,200);
    assert.equal((await call(pages[1],`/api/plans/${id}/actions`,'POST',{type:'confirm',night_id:night})).status,200);
    assert.equal((await call(pages[0],`/api/plans/${id}/actions`,'POST',{type:'set_time',timing:{date:'2026-11-01',time:'19:00',time_zone:'Asia/Kolkata'}})).status,200);
    await Promise.all(checked); assert.equal(checked.length,5);
    await Promise.all(phones.map(phone => phone.close()));
  } finally {
    await browser?.close(); await new Promise(resolve => server.close(resolve)); await db.close();
  }
});
