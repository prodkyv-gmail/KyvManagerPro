'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const c=require('../lib/kyv-google-calendar-oauth-server');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const key=Buffer.alloc(32,7);
const raw={refreshToken:'PRIVATE',userId:'test-user',email:'account@example.com'};
const sealed=c.encrypt(raw,key);
assert(!sealed.includes('PRIVATE'));
assert.deepEqual(c.decrypt(sealed,key),raw);
assert.equal(c.decrypt(sealed,Buffer.alloc(32,9)),null,'ciphertext must be bound to its key');
assert.equal(c.decrypt(sealed.slice(0,-3)+'abc',key),null,'modified ciphertext rejected');
assert.equal(c.decrypt('',key),null);
assert.deepEqual(
  [c.parsePeriod('2026-11-02','2026-11-09')?.startDate,c.parsePeriod('2026-11-02','2026-11-09')?.endDate],
  ['2026-11-02','2026-11-09']
);
for(const [start,end] of [
  ['2026-02-30','2026-03-02'],['2026-11-02','2026-11-02'],
  ['2026-11-09','2026-11-02'],['2026-11-01','2027-01-01'],
  ['invalid','2026-11-10']
])assert.equal(c.parsePeriod(start,end),null);
assert.equal(c.parsePeriod('2026-12-01','2027-01-01')?.endDate,'2027-01-01');
for(const route of ['start','callback','status','events','disconnect']){
  const module=require('../api/google-calendar/'+route);
  assert.equal(typeof module,'function',route+' must export a Vercel handler');
}
const start=read('api/google-calendar/start.js');
const callback=read('api/google-calendar/callback.js');
const events=read('api/google-calendar/events.js');
const page=read('kyv_calendar.html');
const client=read('kyv-google-calendar-oauth.js');
assert.match(start,/authenticate\(req\)/);
assert.match(start,/checkPostOrigin\(req\)/);
assert.match(start,/prompt:'consent'/);
assert.match(callback,/timingSafeEqual/);
assert.match(callback,/previous\.userId/);
assert.match(callback,/email_verified/);
assert.match(callback,/refresh_token/);
assert.match(callback,/calendar\.events\.readonly/);
assert.match(events,/authenticate\(req\)/);
assert.match(events,/record\.userId!==user\.id/);
assert.match(events,/singleEvents','true'/);
assert.match(events,/nextPageToken/);
assert.match(events,/truncated/);
assert.match(client,/Collega Google Calendar/);
assert.match(page,/KYV_GOOGLE_CALENDAR_API\?\.connected/);
assert.match(page,/kyv-google-calendar-oauth\.js/);
assert.doesNotMatch(client,/CLIENT_SECRET|refresh_token|service_role/);
assert(!fs.existsSync(path.join(root,'api/google-calendar/_shared.js')));
console.log('OAuth Calendar: encryption, range, routes, auth and fallback OK');
