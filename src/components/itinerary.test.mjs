import test from 'node:test';
import assert from 'node:assert/strict';
import {renderItinerary} from './itinerary.js';
import {renderSoloNight} from '../screens/solo-night.js';
import {timingForNight} from './night-timing.js';
import {store} from '../domain/store.js';
const night={beats:[{name:'Dinner',desc:'A table'},{name:'Walk',desc:'Outside'}]};
test('shared photo renderer preserves labels and locks/hides edit controls',()=>{
 const editable=renderItinerary(night,night);
 assert.equal((editable.match(/data-customise-slot=/g)||[]).length,2);
 assert.equal((editable.match(/milo-beat-image/g)||[]).length,2);
 assert.match(renderItinerary(night,night,{lockedSlots:true}),/disabled/);
 assert.doesNotMatch(renderItinerary(night,night,{editable:false}),/data-customise-slot=/);
});
test('solo draft renders photo alternatives and timing without partner confirmation',()=>{
 store.reset();store.updateSession('aarav',{planningMode:'solo',intents:['intimate']});
 const html=renderSoloNight();
 assert.match(html,/data-customise-slot=/);assert.doesNotMatch(html,/milo-timing-form/);
 store.updateSession('aarav',{savedSoloNightId:'middle-ground',activeNightId:'middle-ground',soloTimingStep:'middle-ground'});
 assert.match(renderSoloNight(),/Your partner has not agreed/);assert.match(html,/Save this draft/);
 assert.doesNotMatch(html,/miloConfirmNight|miloSuggestNight|miloSharePlan/);
});
test('solo timing stays independent of shared timing',()=>{
 store.reset();const timing={nightId:'middle-ground',date:'2028-02-29',time:'18:00',timeZone:'Asia/Kolkata'};
 store.updateSession('aarav',{soloTimings:{'middle-ground':timing}});
 assert.deepEqual(timingForNight('middle-ground',{solo:true}),timing);
 assert.equal(timingForNight('middle-ground'),null);
 assert.equal(timingForNight('little-adventure',{solo:true}),null);
});
