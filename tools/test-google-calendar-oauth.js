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
assert.doesNotMatch(client,/KYV_GOOGLE_OAUTH_CLIENT_SECRET|token\.refresh_token|service_role/);
assert(!fs.existsSync(path.join(root,'api/google-calendar/_shared.js')));

// Status diagnostics: expose only names/codes after authentication, never secrets.
const status=read('api/google-calendar/status.js');
const server=read('lib/kyv-google-calendar-oauth-server.js');
assert.match(status,/configurationStatus\(\)/);
assert.ok(status.indexOf('authenticate(req)')<status.indexOf('configurationStatus()'));
assert.match(server,/reason:'invalid_cookie_key'/);
assert.match(server,/reason:'missing_variables'/);
const current=read('kyv-google-calendar-oauth.js');
assert.match(current,/data\.reason === 'invalid_cookie_key'/);
assert.match(current,/64 caratteri esadecimali/);
assert.doesNotMatch(status,/clientSecret|process\.env\.KYV_GOOGLE_OAUTH_CLIENT_SECRET/);

// Regression: ordinary email must pass; malformed values and whitespace must fail.
const oauthEnvKeys=['KYV_GOOGLE_OAUTH_CLIENT_ID','KYV_GOOGLE_OAUTH_CLIENT_SECRET','KYV_GOOGLE_OAUTH_COOKIE_KEY','KYV_GOOGLE_CALENDAR_EMAIL'];
const savedOauthEnv=Object.fromEntries(oauthEnvKeys.map(key=>[key,process.env[key]]));
try {
  process.env.KYV_GOOGLE_OAUTH_CLIENT_ID='test-client';
  process.env.KYV_GOOGLE_OAUTH_CLIENT_SECRET='test-secret';
  process.env.KYV_GOOGLE_OAUTH_COOKIE_KEY='a'.repeat(64);
  process.env.KYV_GOOGLE_CALENDAR_EMAIL='prodkyv@gmail.com';
  assert.deepEqual(c.configurationStatus(),{configured:true},'valid email must not be rejected');
  for(const invalid of ['prodkyv@gmail com','prodkyv@gmail\\com',' prodkyv@gmail.com','prodkyv@gmail.com ','prodkyv@@gmail.com','prodkyv@gmailcom']){
    process.env.KYV_GOOGLE_CALENDAR_EMAIL=invalid;
    assert.equal(c.configurationStatus().reason,'invalid_calendar_email', 'malformed email must be rejected');
  }
} finally {
  for(const key of oauthEnvKeys){
    if(savedOauthEnv[key]===undefined)delete process.env[key];else process.env[key]=savedOauthEnv[key];
  }
}

// Same-origin CSRF guard: strict Origin and safe fallback when reverse proxies strip it.
const canonicalHost=new URL(c.ORIGIN).host;
const originRequest=headers=>({headers:{host:canonicalHost,...headers}});
assert.equal(c.checkPostOrigin(originRequest({origin:c.ORIGIN,'sec-fetch-site':'same-origin'})),true);
assert.equal(c.checkPostOrigin(originRequest({referer:c.ORIGIN+'/kyv_calendar.html','sec-fetch-site':'same-origin'})),true);
assert.equal(c.checkPostOrigin(originRequest({origin:'https://evil.example',referer:c.ORIGIN+'/kyv_calendar.html','sec-fetch-site':'same-origin'})),false,'Origin overrides Referer');
assert.equal(c.checkPostOrigin(originRequest({referer:'https://evil.example/','sec-fetch-site':'same-origin'})),false);
assert.equal(c.checkPostOrigin(originRequest({referer:c.ORIGIN+'/kyv_calendar.html','sec-fetch-site':'cross-site'})),false);
assert.equal(c.checkPostOrigin(originRequest({origin:c.ORIGIN,'sec-fetch-site':'same-site'})),false,'subdomain is not same origin');
assert.equal(c.checkPostOrigin(originRequest({referer:c.ORIGIN+'/kyv_calendar.html'})),true,'legacy browser valid Referer');
assert.equal(c.checkPostOrigin(originRequest({})),false,'no source proof must be rejected');
assert.equal(c.checkPostOrigin({headers:{host:'attacker.vercel.app',origin:c.ORIGIN,'sec-fetch-site':'same-origin'}}),false);
assert.equal(c.checkPostOrigin(originRequest({origin:'null'})),false);

// Callback must never expose one-time code or tokens and must diagnose denied Calendar scope.
assert.match(callback,/missing_calendar_scope/);
assert.match(callback,/missing_refresh_token/);
assert.match(callback,/token_exchange/);
assert.match(callback,/google_calendar=/);
assert.match(callback,/split\(\/\\s\+\/\)/);
assert.match(client,/data\.reason === 'invalid_cookie_key'/);
assert.match(client,/missing_calendar_scope/);
assert.match(client,/Google Auth Platform/);
assert.doesNotMatch(callback,/c\.json\(res,502,\{ok:false,error:.*err\.message/);

console.log('OAuth Calendar: encryption, range, routes, auth and fallback OK');
