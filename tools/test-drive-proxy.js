const assert = require('assert');
const handler = require('../api/drive-proxy');

function responseCapture(){
  return {
    headers:{}, statusCode:200, body:'',
    setHeader(name, value){ this.headers[name] = value; },
    end(value=''){ this.body = String(value); }
  };
}

async function invoke({headers={}, query={}}){
  const req = { method:'GET', headers:{ host:'kyvmanagerpro.test', ...headers }, query };
  const res = responseCapture();
  await handler(req, res);
  return { status:res.statusCode, data:JSON.parse(res.body) };
}

(async () => {
  const originalFetch = global.fetch;
  try {
    global.fetch = async () => { throw new Error('fetch non deve essere chiamato senza sessione'); };
    const anonymous = await invoke({});
    assert.strictEqual(anonymous.status, 401);

    let calls = 0;
    global.fetch = async () => {
      calls += 1;
      return { ok:true, json:async () => ({ id:'test-user' }) };
    };
    const denied = await invoke({
      headers:{ authorization:'Bearer test-token' },
      query:{ target:'https://script.google.com/macros/s/not-allowed/exec', action:'ping' }
    });
    assert.strictEqual(denied.status, 400);
    assert.strictEqual(calls, 1);

    calls = 0;
    global.fetch = async (url) => {
      calls += 1;
      if(calls === 1) return { ok:true, json:async () => ({ id:'test-user' }) };
      assert(String(url).includes('action=ping'));
      return { ok:true, text:async () => JSON.stringify({ ok:true, service:'KYV Drive script' }), url:String(url), status:200 };
    };
    const allowed = await invoke({
      headers:{ authorization:'Bearer test-token' },
      query:{
        target:'https://script.google.com/macros/s/AKfycbw4S8LZ-LLDewzv3uAEJkLaEjGTfFD1XRJppV0Oy1pOkmK_3exDpp0j_Bw6jmSGjeU0UA/exec',
        action:'ping'
      }
    });
    assert.strictEqual(allowed.status, 200);
    assert.strictEqual(allowed.data.ok, true);
    assert.strictEqual(calls, 2);
    console.log('Proxy Drive: autenticazione e allowlist OK');
  } finally {
    global.fetch = originalFetch;
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

