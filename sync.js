/* ============================================================
   JEE360 — Cloud Sync (Google login + Firestore, 100% free)
   - Google se login → saara progress Google (Firestore) pe save
   - Kisi bhi device se login karo → wahi data wapas
   - index.html navbar ke #googleAuthSlot mein inline render hota
     hai; baaki pages pe floating top-right pill.
   ============================================================ */
(function(){
  const KEYS = [
    'jee360.subjects', 'jee360.chapters', 'jee360.plan',
    'jee360.done', 'jee360.moves', 'jee360.replaced'
  ];

  const G_LOGO =
    '<svg width="18" height="18" viewBox="0 0 48 48" style="flex:none">' +
    '<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>' +
    '<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>' +
    '<path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>' +
    '<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';

  /* ---- container: navbar slot (agar hai) ya floating ---- */
  const wrap = document.createElement('div');
  wrap.id = 'jeeSyncWrap';

  function mount(){
    const slot = document.getElementById('googleAuthSlot');
    if(slot){
      wrap.style.cssText = 'display:inline-flex;align-items:center;';
      slot.appendChild(wrap);
    } else {
      wrap.style.cssText =
        'position:fixed;top:14px;right:14px;z-index:9999;display:flex;align-items:center;';
      document.body.appendChild(wrap);
    }
  }
  if(document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', mount);
  else mount();

  const baseBtn =
    'display:inline-flex;align-items:center;gap:10px;background:#fff;color:#3c4043;' +
    'border:1px solid #dadce0;border-radius:99px;padding:9px 18px;font-size:.85rem;' +
    'font-weight:600;font-family:inherit;cursor:pointer;white-space:nowrap;' +
    'box-shadow:0 1px 3px rgba(0,0,0,.12);transition:box-shadow .15s,background .15s;';

  const CFG = window.JEE360_FIREBASE_CONFIG;
  if(!CFG || !window.firebase){
    wrap.innerHTML =
      '<span style="' + baseBtn + 'cursor:default;opacity:.6">☁️ Local mode</span>';
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

  function setDot(color, title){
    const d = wrap.querySelector('.sync-dot');
    if(d){ d.style.background = color; d.title = title || ''; }
  }

  function pushCloud(){
    if(!user || !ready) return;
    clearTimeout(pushTimer);
    setDot('#f5a623', 'Saving…');
    pushTimer = setTimeout(() => {
      db.collection('users').doc(user.uid).set({
        data: localData(),
        updated: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => setDot('#34A853', 'Synced — data Google pe safe hai'))
        .catch(e => { console.warn('[sync] push fail', e); setDot('#EA4335', 'Sync fail — internet check karo'); });
    }, 800);
  }

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

  function loggedOutUI(){
    wrap.innerHTML =
      '<button id="jeeSyncIn" style="' + baseBtn + '">' + G_LOGO +
      '<span>Sign in with Google</span></button>';
    const b = wrap.querySelector('#jeeSyncIn');
    b.onmouseenter = () => { b.style.boxShadow = '0 2px 8px rgba(66,133,244,.35)'; b.style.background = '#f8faff'; };
    b.onmouseleave = () => { b.style.boxShadow = '0 1px 3px rgba(0,0,0,.12)'; b.style.background = '#fff'; };
    b.onclick = () => {
      const p = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(p).catch(e => {
        if(e && (e.code === 'auth/popup-blocked' || e.code === 'auth/cancelled-popup-request'))
          auth.signInWithRedirect(p);
        else if(e && e.code !== 'auth/popup-closed-by-user')
          alert('Login fail: ' + (e && e.message ? e.message : e));
      });
    };
  }

  function loggedInUI(u){
    const name = (u.displayName || u.email || '').split(' ')[0].split('@')[0];
    const pic = u.photoURL
      ? '<img src="' + u.photoURL + '" referrerpolicy="no-referrer" style="width:26px;height:26px;border-radius:50%;flex:none">'
      : '<span style="width:26px;height:26px;border-radius:50%;background:#4285F4;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:700;flex:none">' +
        (name[0] || 'U').toUpperCase() + '</span>';
    wrap.innerHTML =
      '<div style="' + baseBtn + 'cursor:default;padding:5px 8px 5px 6px;gap:8px">' +
        pic +
        '<span style="display:flex;align-items:center;gap:6px">' +
          '<span class="sync-dot" title="Synced" style="width:8px;height:8px;border-radius:50%;background:#34A853;flex:none"></span>' +
          '<span style="max-width:90px;overflow:hidden;text-overflow:ellipsis">' + name + '</span>' +
        '</span>' +
        '<button id="jeeSyncOut" title="Logout" style="border:none;background:#f1f3f4;color:#5f6368;' +
          'border-radius:99px;width:26px;height:26px;cursor:pointer;font-size:.8rem;line-height:1;flex:none">⎋</button>' +
      '</div>';
    const out = wrap.querySelector('#jeeSyncOut');
    out.onmouseenter = () => { out.style.background = '#fce8e6'; out.style.color = '#c5221f'; };
    out.onmouseleave = () => { out.style.background = '#f1f3f4'; out.style.color = '#5f6368'; };
    out.onclick = () => { if(confirm('Logout karna hai? (Data Google pe safe rahega)')) auth.signOut(); };
  }

  let unsub = null;
  auth.onAuthStateChanged(u => {
    user = u;
    if(unsub){ unsub(); unsub = null; }
    if(!u){ ready = false; loggedOutUI(); return; }
    loggedInUI(u);
    let firstSnap = true;
    /* REAL-TIME sync: doosre device pe tick/untick karo →
       yahan turant apply hota hai (bina refresh ke) */
    unsub = db.collection('users').doc(u.uid).onSnapshot(snap => {
      if(snap.metadata.hasPendingWrites) return;   // apna hi write, ignore
      const cloud = snap.exists && snap.data() && snap.data().data;
      if(firstSnap){
        firstSnap = false;
        if(cloud && Object.keys(cloud).length){
          const changed = applyCloud(cloud);
          ready = true;
          if(changed){
            /* cloud ka data laga — dashboard live re-render, baaki pages reload */
            if(document.getElementById('taskList')){
              window.dispatchEvent(new Event('jee360:cloudchange'));
            } else if(!sessionStorage.getItem('jee360.justSynced')){
              sessionStorage.setItem('jee360.justSynced', '1');
              location.reload();
              return;
            }
          }
          sessionStorage.removeItem('jee360.justSynced');
        } else {
          ready = true;
          pushCloud();   // cloud khali — pehli baar: local data upar
        }
        return;
      }
      /* live update from another device */
      if(cloud && Object.keys(cloud).length){
        const changed = applyCloud(cloud);
        if(changed){
          setDot('#34A853', 'Doosre device se update aaya');
          window.dispatchEvent(new Event('jee360:cloudchange'));
        }
      }
    }, e => {
      console.warn('[sync] listener fail', e);
      ready = true;
      setDot('#EA4335', 'Sync fail');
    });
  });
})();
