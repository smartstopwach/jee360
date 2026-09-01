/* ============================================================
   JEE360 — Cloud Sync (Google login + Firestore, 100% free)
   - Google se login → saara progress Google (Firestore) pe save
   - Kisi bhi device se login karo → wahi data wapas
   - Config firebase-config.js mein; null ho toh local-only mode
   ============================================================ */
(function(){
  const KEYS = [
    'jee360.subjects', 'jee360.chapters', 'jee360.plan',
    'jee360.done', 'jee360.moves', 'jee360.replaced'
  ];

  /* ---- floating chip (top-right) ---- */
  const chip = document.createElement('div');
  chip.id = 'jeeSyncChip';
  chip.style.cssText =
    'position:fixed;top:12px;right:12px;z-index:9999;display:flex;align-items:center;gap:8px;' +
    'background:#fff;border:1px solid #e3e6f0;border-radius:99px;padding:7px 14px;' +
    'box-shadow:0 2px 12px rgba(20,30,80,.10);font-size:.8rem;font-weight:600;color:#333;' +
    'cursor:pointer;font-family:inherit;user-select:none;';
  function mountChip(){ document.body.appendChild(chip); }
  if(document.body) mountChip(); else document.addEventListener('DOMContentLoaded', mountChip);

  const CFG = window.JEE360_FIREBASE_CONFIG;
  if(!CFG || !window.firebase){
    chip.innerHTML = '☁️ Local mode';
    chip.title = 'Google sync setup baaki hai (firebase-config.js)';
    chip.style.opacity = '.65';
    chip.style.cursor = 'default';
    return;
  }

  firebase.initializeApp(CFG);
  const auth = firebase.auth();
  const db = firebase.firestore();
  let user = null, ready = false, pushTimer = null;

  const origSet = localStorage.setItem.bind(localStorage);
  const origDel = localStorage.removeItem.bind(localStorage);

  function localData(){
    const o = {};
    KEYS.forEach(k => { const v = localStorage.getItem(k); if(v != null) o[k] = v; });
    return o;
  }

  function pushCloud(){
    if(!user || !ready) return;
    clearTimeout(pushTimer);
    chip.dataset.state = 'saving';
    setLabel('… saving');
    pushTimer = setTimeout(() => {
      db.collection('users').doc(user.uid).set({
        data: localData(),
        updated: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => setLabel('✓ synced'))
        .catch(e => { console.warn('[sync] push fail', e); setLabel('⚠️ sync fail'); });
    }, 800);
  }

  /* har jee360.* save/remove pe cloud push (debounced) */
  localStorage.setItem = function(k, v){
    origSet(k, v);
    if(String(k).indexOf('jee360.') === 0) pushCloud();
  };
  localStorage.removeItem = function(k){
    origDel(k);
    if(String(k).indexOf('jee360.') === 0) pushCloud();
  };

  function applyCloud(data){
    let changed = false;
    KEYS.forEach(k => {
      if(data[k] != null && data[k] !== localStorage.getItem(k)){ origSet(k, data[k]); changed = true; }
    });
    return changed;
  }

  function setLabel(txt){
    const el = chip.querySelector('.sync-state');
    if(el) el.textContent = txt;
  }

  function loggedOutUI(){
    chip.innerHTML = '🔐 Google se login';
    chip.style.opacity = '1';
    chip.onclick = () => {
      const p = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(p).catch(e => {
        /* popup block hua toh redirect se */
        if(e && (e.code === 'auth/popup-blocked' || e.code === 'auth/cancelled-popup-request'))
          auth.signInWithRedirect(p);
        else alert('Login fail: ' + (e && e.message ? e.message : e));
      });
    };
  }

  function loggedInUI(u){
    const pic = u.photoURL
      ? '<img src="' + u.photoURL + '" style="width:20px;height:20px;border-radius:50%" referrerpolicy="no-referrer">'
      : '👤';
    const name = (u.displayName || u.email || '').split(' ')[0].split('@')[0];
    chip.innerHTML = pic +
      '<span>' + name + ' · <span class="sync-state">✓ synced</span></span>' +
      '<span id="jeeSyncOut" style="color:#e05b8a;font-weight:800;margin-left:4px">Logout</span>';
    chip.onclick = null;
    const out = chip.querySelector('#jeeSyncOut');
    if(out) out.onclick = e => { e.stopPropagation(); auth.signOut(); };
  }

  auth.onAuthStateChanged(async u => {
    user = u;
    if(!u){ ready = false; loggedOutUI(); return; }
    loggedInUI(u);
    try{
      const snap = await db.collection('users').doc(u.uid).get();
      const cloud = snap.exists && snap.data() && snap.data().data;
      if(cloud && Object.keys(cloud).length){
        const changed = applyCloud(cloud);
        ready = true;
        if(changed && !sessionStorage.getItem('jee360.justSynced')){
          sessionStorage.setItem('jee360.justSynced', '1');
          location.reload();
          return;
        }
      } else {
        /* cloud khali — pehli baar login: local data upar bhejo */
        ready = true;
        pushCloud();
      }
      sessionStorage.removeItem('jee360.justSynced');
    }catch(e){
      console.warn('[sync] pull fail', e);
      ready = true;
      setLabel('⚠️ sync fail');
    }
  });
})();
