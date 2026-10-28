// Accounts API client: off by default, strict about shapes, honest about signed out.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { accountsEnabled, refreshAccount, cleanPeople, cleanNights, yourPerson, personName, pastNights, accountData, localToday } from './account-api.js';
import { store } from './store.js';

const ME = { account: { id: 'a_asha', email: 'asha@example.com', name: 'Asha' } };
const PEOPLE = { people: [{ id: 'p_ravi', display_name: 'Ravi', since: '2026-10-03', nights: { booked: 3, planned: 1 } }, { id: 'p_kabir', display_name: 'Kabir', nights: {} }] };
const NIGHTS = { nights: [
  { plan_id: 'a1', mode: 'together', night_id: 'slow-one', date: '2026-10-11', time: '19:30', person_id: 'p_ravi', status: 'booked' },
  { plan_id: 'a2', mode: 'solo', night_id: 'slow-one', date: '2026-10-20', time: '20:00', person_id: null, status: 'planned' },
  { plan_id: 'a3', mode: 'together', night_id: 'slow-one', date: '2030-01-01', time: '20:00', person_id: 'p_ravi', status: 'planned' }
] };
const reply = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const fakeFetch = (map) => { const calls = []; const f = async (path, init) => { calls.push({ path, init }); const r = map[path]; if (r instanceof Error) throw r; return r; }; f.calls = calls; return f; };
const fresh = () => store.setState({ ...store.getState(), account: undefined, sessionA: { ...store.getState().sessionA, personNames: {} } }, false);

test('the switch is off by default and nothing is called', async () => {
  fresh();
  assert.equal(accountsEnabled(), false);
  const f = fakeFetch({});
  assert.equal(await refreshAccount(store, { fetchImpl: f }), null);
  assert.equal(f.calls.length, 0);
  assert.deepEqual(accountData(store.getState()), { status: 'off', me: null, people: [], nights: [] });
  assert.equal(yourPerson(store.getState()), null);
});

test('two good answers are stored; your person is the first one; cookies only', async () => {
  fresh();
  const f = fakeFetch({ '/api/me': reply(200, ME), '/api/me/people': reply(200, PEOPLE), '/api/me/nights': reply(200, NIGHTS) });
  await refreshAccount(store, { enabled: true, fetchImpl: f });
  assert.deepEqual(f.calls.map(c => c.path).sort(), ['/api/me', '/api/me/nights', '/api/me/people']);
  for (const c of f.calls) { assert.equal(c.init.credentials, 'same-origin'); assert.ok(!('authorization' in c.init.headers)); }
  const s = store.getState();
  assert.equal(s.account.status, 'ok');
  assert.deepEqual(s.account.me, ME.account);
  assert.equal(yourPerson(s, true).display_name, 'Ravi');
  assert.deepEqual(s.account.people[1], { id: 'p_kabir', display_name: 'Kabir', since: null, nights: { booked: 0, planned: 0 } });
});

test('signed out clears the copy; other failures keep the last good copy', async () => {
  fresh();
  await refreshAccount(store, { enabled: true, fetchImpl: fakeFetch({ '/api/me': reply(200, ME), '/api/me/people': reply(200, PEOPLE), '/api/me/nights': reply(200, NIGHTS) }) });
  await refreshAccount(store, { enabled: true, fetchImpl: fakeFetch({ '/api/me': reply(200, ME), '/api/me/people': reply(500, {}), '/api/me/nights': new Error('offline') }) });
  assert.equal(store.getState().account.status, 'error');
  assert.equal(yourPerson(store.getState(), true).id, 'p_ravi', 'offline keeps the last copy');
  await refreshAccount(store, { enabled: true, fetchImpl: fakeFetch({ '/api/me': reply(401, {}), '/api/me/people': reply(401, {}), '/api/me/nights': reply(200, NIGHTS) }) });
  assert.deepEqual(store.getState().account, { status: 'signed_out', me: null, people: [], nights: [] });
  assert.equal(yourPerson(store.getState(), true), null);
});

test('malformed rows are dropped, not shown half-filled', () => {
  assert.deepEqual(cleanPeople({ people: [{ id: 'bad id!', display_name: 'X' }, { id: 'ok', display_name: '  ' }, { id: 'ok2', display_name: '<b>Riya</b>', since: '03/10/2026', nights: { booked: -1, planned: 2.5 } }, null] }),
    [{ id: 'ok2', display_name: 'bRiya/b', since: null, nights: { booked: 0, planned: 0 } }]);
  assert.deepEqual(cleanPeople({}), []);
  assert.deepEqual(cleanNights({ nights: [{ plan_id: 'a', mode: 'group', night_id: 'n', date: '2026-10-01', time: '19:00', status: 'booked' },
    { plan_id: 'b', mode: 'solo', night_id: 'n', date: '2026-10-01', time: '7pm', status: 'booked' },
    { plan_id: 'c', mode: 'solo', night_id: 'n', date: '2026-10-01', time: '19:00', status: 'done' }] }), []);
  assert.equal(cleanPeople({ people: Array.from({ length: 30 }, (_, i) => ({ id: `p${i}`, display_name: 'A' })) }).length, 20);
});

test('past nights: before today only, newest first; nicknames win on this phone', async () => {
  fresh();
  await refreshAccount(store, { enabled: true, fetchImpl: fakeFetch({ '/api/me': reply(200, ME), '/api/me/people': reply(200, PEOPLE), '/api/me/nights': reply(200, NIGHTS) }) });
  const s = store.getState();
  assert.deepEqual(pastNights(s, '2026-10-27', true).map(n => n.plan_id), ['a2', 'a1']);
  assert.deepEqual(pastNights(s, '2026-10-20', true).map(n => n.plan_id), ['a1'], 'today is not past');
  const ravi = yourPerson(s, true);
  assert.equal(personName(s, ravi), 'Ravi');
  assert.equal(personName({ ...s, sessionA: { ...s.sessionA, personNames: { p_ravi: 'Ravs' } } }, ravi), 'Ravs');
  assert.equal(localToday(new Date(2026, 0, 5, 23, 30)), '2026-01-05');
});
