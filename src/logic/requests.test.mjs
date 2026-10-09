import test from 'node:test';
import assert from 'node:assert/strict';
import { addStarter, REQUEST_STARTERS } from '../screens/requests.js';

test('chips add starter text without replacing what is there', () => {
  assert.equal(addStarter('', 'Window seat if possible.'), 'Window seat if possible.');
  assert.equal(addStarter('Peonies please.  ', 'Flowers at the table: '), 'Peonies please.\nFlowers at the table: ');
});

test('there are three chips and no dietary chip', () => {
  assert.deepEqual(REQUEST_STARTERS.map((c) => c.label), ['Flowers at the table', 'Dessert with a message', 'Window seat']);
});
