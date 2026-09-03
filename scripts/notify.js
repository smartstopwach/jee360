/* ============================================================
   JEE360 — Daily push notify script (GitHub Actions pe chalta hai)
   - Firestore se har user ka LIVE data padhta hai
   - Dashboard ka EXACT wahi scheduler code chala ke aaj ka
     summary nikalta hai (100% accurate — wahi numbers jo app me)
   - Slot ke hisaab se message bana ke FCM v1 se bhejta hai
   Zero dependencies — sirf Node 20 built-ins.
   ============================================================ */
process.env.TZ = 'Asia/Kolkata';           // sab time IST me

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const PROJECT = 'jee360-0';

/* ---------------- slot decide ----------------
   Purana logic galat tha: ghante ke BAND se slot decide hota tha
   (h<10 → morning). Backup crons 45-90 min baad chalte hain, isliye
   woh agli ghante me ghus jaate aur GALAT slot bhej dete — jaise
   21:37 wala backup 21:52 ko chal ke 'night' ka dobara bhej sakta tha
   (raat 10 ke baad silence wala waada toot raha tha).
   Ab: har slot ki apni scheduled IST time + tolerance window.
   Koi window match na kare → null → ek bhi notification nahi jayegi. */
const SLOTS = [                                  // [name, hh, mm, minutes-tolerance]
  ['morning',  7, 37, 90],
  ['mid1',    10, 37, 90],
  ['mid2',    13, 37, 90],
  ['mid3',    16, 37, 90],
  ['mid4',    19, 37, 90],
  ['night',   21, 37, 45]                        // last call — raat 10 ke baad chup
];
function currentSlot(){
  if(process.env.SLOT) return process.env.SLOT;   // manual dispatch = jo bola wahi
  const n = new Date();
  const mins = n.getHours()*60 + n.getMinutes();
  for(const [name,h,m,tol] of SLOTS){
    const at = h*60 + m;
    if(mins >= at && mins <= at + tol) return name;
  }
  return null;                                    // koi slot nahi — send mat karo
}

/* ---------------- Google OAuth (service account JWT) ---------------- */
function b64url(buf){
  return Buffer.from(buf).toString('base64')
    .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
async function accessToken(sa){
  const now = Math.floor(Date.now()/1000);
  const header = b64url(JSON.stringify({ alg:'RS256', typ:'JWT' }));
  const claims = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600
  }));
  const input = header + '.' + claims;
  const sig = crypto.createSign('RSA-SHA256').update(input).sign(sa.private_key);
  const jwt = input + '.' + b64url(sig);
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') +
          '&assertion=' + jwt
  });
  const j = await r.json();
  if(!j.access_token) throw new Error('OAuth fail: ' + JSON.stringify(j));
  return j.access_token;
}

/* ---------------- Firestore REST helpers ---------------- */
const FS_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
async function fsGet(tok, p){
  const r = await fetch(FS_BASE + p, { headers: { Authorization: 'Bearer ' + tok } });
  if(r.status === 404) return null;
  return r.json();
}
function mapFields(doc, field){
  const f = doc && doc.fields && doc.fields[field];
  if(!f || !f.mapValue || !f.mapValue.fields) return {};
  const out = {};
  for(const [k,v] of Object.entries(f.mapValue.fields))
    out[k] = v.stringValue !== undefined ? v.stringValue
           : v.integerValue !== undefined ? v.integerValue : null;
  return out;
}

/* ---------------- dashboard scheduler ko sandbox me chalana ---------------- */
const DASH_JS = (() => {
  const html = fs.readFileSync(path.join(ROOT, 'dashboard.html'), 'utf8');
  const m = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  return m[m.length - 1][1];
})();
const DATA_JS = fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8');

function computeToday(userData){
  const store = Object.assign({}, userData);
  if(!store['jee360.plan']) return null;
  const mk = () => ({
    innerHTML:'', textContent:'', style:{}, dataset:{}, value:'',
    classList:{ add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    appendChild(){}, addEventListener(){}, setAttribute(){},
    querySelector(){ return null; }, querySelectorAll(){ return []; }
  });
  const els = {};
  const sandbox = {
    window: {}, els,
    localStorage: {
      getItem: k => store[k] !== undefined ? store[k] : null,
      setItem: (k,v) => { store[k] = String(v); },
      removeItem: k => { delete store[k]; }
    },
    document: {
      getElementById: id => els[id] || (els[id] = mk()),
      querySelector: () => mk(), querySelectorAll: () => [],
      createElement: () => mk(), addEventListener(){}, body: mk()
    },
    location: { href:'' },
    navigator: { serviceWorker: { register(){ return Promise.resolve(); } } },
    alert(){}, confirm(){ return true; }, prompt(){ return null; },
    matchMedia: () => ({ matches:false, addListener(){}, addEventListener(){} }),
    Event: class { constructor(t){ this.type = t; } }
  };
  sandbox.window.addEventListener = () => {};
  sandbox.window.dispatchEvent = () => true;
  sandbox.window.matchMedia = sandbox.matchMedia;
  sandbox.window.location = sandbox.location;
  try{
    const fn = new Function(
      'window','localStorage','document','location','navigator',
      'alert','confirm','prompt','matchMedia','Event',
      DATA_JS + '\n;(function(){\n' + DASH_JS + '\n})();\nreturn window.__today;'
    );
    return fn(
      sandbox.window, sandbox.localStorage, sandbox.document, sandbox.location,
      sandbox.navigator, sandbox.alert, sandbox.confirm, sandbox.prompt,
      sandbox.matchMedia, sandbox.Event
    ) || sandbox.window.__today || null;
  }catch(e){
    console.error('  scheduler run fail:', e.message);
    return null;
  }
}

/* ---------------- message compose (slot rules) ---------------- */
function hm(m){
  m = Math.round(m);
  const h = Math.floor(m/60), mm = m % 60;
  return h ? (h + 'h' + (mm ? ' ' + mm + 'm' : '')) : (mm + 'm');
}
function compose(t, slot){
  if(!t || t.day > t.days) return null;               // plan khatam
  const tasks = t.pendingLec + t.pendingDpp;
  const lecStr = t.pendingLec + ' lecture' + (t.pendingLec === 1 ? '' : 's') +
                 (t.pendingDpp ? ' + ' + t.pendingDpp + ' DPP' : '');

  if(slot === 'morning'){
    if(!tasks) return null;                           // sab pehle se done
    let body = lecStr + ' · ' + hm(t.leftMins) +
      (t.subjects.length ? '\n📚 ' + t.subjects.join(', ') : '');
    if(t.backlog) body += '\n🔴 ' + t.backlog + ' backlog bhi isme shamil hai';
    return { title: '🎯 Day ' + t.day + '/' + t.days + ' — aaj ka plan taiyar',
             body, tag: 'jee360-morning' };
  }
  if(slot.indexOf('mid') === 0){
    if(!tasks) return null;                           // sab done = silence (shabashi raat ko)
    const p = t.pctAll;
    let title;
    if(p === 0)      title = '😴 Abhi tak kuch nahi hua';
    else if(p < 40)  title = '⏳ Sirf ' + p + '% hua — thoda tez chalo';
    else if(p < 80)  title = '💪 ' + p + '% ho gaya — lage raho';
    else             title = '🔥 ' + p + '% done — bas thoda sa bacha!';
    return { title,
             body: lecStr + ' · ' + hm(t.leftMins) + ' baaki',
             tag: 'jee360-' + slot };
  }
  /* night */
  if(!tasks)
    return { title: '🎉 Aaj ka 100% complete!',
             body: t.schedDone + '/' + t.schedTotal + ' lectures done · ' +
                   hm(t.doneMins) + ' padha. Streak on! 🔥',
             tag: 'jee360-night' };
  return { title: '⚠️ ' + lecStr + ' baaki',
           body: 'Subah 3 baje tak time hai (' + hm(t.leftMins) + ' ka kaam) — ' +
                 'nahi kiya toh kal BACKLOG banega 🔴',
           tag: 'jee360-night' };
}

/* ---------------- FCM v1 send ---------------- */
async function sendFCM(tok, token, msg){
  const r = await fetch(`https://fcm.googleapis.com/v1/projects/${PROJECT}/messages:send`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: {
      token,
      data: { title: msg.title, body: msg.body, tag: msg.tag, url: './dashboard.html' },
      webpush: { headers: { TTL: '21600', Urgency: 'high' } }
    }})
  });
  if(r.ok) return 'ok';
  const j = await r.json().catch(() => ({}));
  const code = j.error && j.error.status;
  return (code === 'NOT_FOUND' || code === 'UNREGISTERED' || code === 'INVALID_ARGUMENT')
    ? 'dead' : 'fail:' + code;
}

/* ---------------- main ---------------- */
(async () => {
  const slot = currentSlot();
  console.log('slot =', slot, '| IST =', new Date().toString());

  /* local test mode: TEST_DATA=path to JSON of localStorage map
     (silence-check se PEHLE — bina network ke slot/summary test karne ke liye) */
  if(process.env.TEST_DATA){
    const data = JSON.parse(fs.readFileSync(process.env.TEST_DATA, 'utf8'));
    const t = computeToday(data);
    console.log('__today =', JSON.stringify(t, null, 2));
    for(const s of ['morning','mid1','mid2','mid3','mid4','night'])
      console.log(s, '→', JSON.stringify(compose(t, s)));
    return;
  }

  if(!slot){ console.log('koi slot window me nahi — silence ✓'); return; }

  if(!process.env.FCM_SA){
    console.log('FCM_SA secret abhi set nahi hai — kuch nahi bheja. (Setup pending)');
    return;
  }
  const sa = JSON.parse(process.env.FCM_SA);
  const tok = await accessToken(sa);

  /* dedupe: ek slot din me sirf EK baar jaaye (backup cron ke liye) */
  const todayStr = new Date().toLocaleDateString('en-CA');   // YYYY-MM-DD IST
  const state = await fsGet(tok, '/system/notify');
  const lastSent = state && state.fields && state.fields[slot]
    && state.fields[slot].stringValue;
  if(lastSent === todayStr){
    console.log('aaj ka', slot, 'pehle hi ja chuka (' + todayStr + ') — skip');
    return;
  }

  const list = await fsGet(tok, '/users?pageSize=300');
  const docs = (list && list.documents) || [];
  console.log('users:', docs.length);

  for(const doc of docs){
    const uid = doc.name.split('/').pop();
    const pushDoc = await fsGet(tok, `/users/${uid}/meta/push`);
    const tokens = Object.keys(mapFields(pushDoc, 'tokens'));
    if(!tokens.length){ console.log(uid, '— no tokens, skip'); continue; }

    const data = mapFields(doc, 'data');
    const today = computeToday(data);
    const msg = compose(today, slot);
    if(!msg){ console.log(uid, '— no message needed (smart skip)'); continue; }

    let sent = 0; const dead = [];
    for(const t of tokens){
      const res = await sendFCM(tok, t, msg);
      if(res === 'ok') sent++;
      else if(res === 'dead') dead.push(t);
      else console.log(uid, '— send', res);
    }
    console.log(uid, '—', msg.tag, '→ sent', sent + '/' + tokens.length,
                dead.length ? ('(' + dead.length + ' dead removed)') : '');

    /* mare hue tokens saaf karo */
    if(dead.length){
      const keep = {};
      const all = mapFields(pushDoc, 'tokens');
      for(const [k,v] of Object.entries(all))
        if(!dead.includes(k)) keep[k] = { integerValue: String(v || 0) };
      await fetch(FS_BASE + `/users/${uid}/meta/push?updateMask.fieldPaths=tokens`, {
        method: 'PATCH',
        headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { tokens: { mapValue: { fields: keep } } } })
      });
    }
  }
  /* is slot ko aaj ke liye "sent" mark karo */
  await fetch(FS_BASE + '/system/notify?updateMask.fieldPaths=' + slot, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { [slot]: { stringValue: todayStr } } })
  });
  console.log('done ✓');
})().catch(e => { console.error(e); process.exit(1); });
