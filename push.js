/* ============================================================
   JEE360 — Push Notifications (FCM)
   SIRF installed PWA app me chalta hai — browser site pe
   na permission popup, na token, na notification. Bilkul chup.

   Permission ke liye ab VISIBLE button hai (banner) — kyunki
   Chrome bina user-click ke popup ko chupke se daba deta hai
   (quiet prompt) aur user ko pata hi nahi chalta.
   ============================================================ */
(function(){
  var VAPID = 'BLS_irQFx2FHSBC1s-B2s6xNTTfUMNplr6Mjl_PEhQeoOOlIlhYGc5hNti-0h_x6kh_b_yzZ1SnHKMiGqAPlTuI';

  var isApp =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  if(!isApp) return;                                  // browser site: exit
  if(!('Notification' in window)) return;
  if(!('serviceWorker' in navigator)) return;
  if(!window.firebase || !window.JEE360_FIREBASE_CONFIG) return;

  var SDK = 'https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js';
  var sdkP = null;
  function loadSDK(){
    if(sdkP) return sdkP;
    sdkP = new Promise(function(res, rej){
      var s = document.createElement('script');
      s.src = SDK; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
    return sdkP;
  }

  function saveToken(user, cb){
    loadSDK().then(function(){
      return navigator.serviceWorker.ready;
    }).then(function(reg){
      return firebase.messaging().getToken({
        vapidKey: VAPID, serviceWorkerRegistration: reg
      });
    }).then(function(token){
      if(!token) throw new Error('no token');
      var t = { tokens: {} };
      t.tokens[token] = Date.now();
      return firebase.firestore()
        .collection('users').doc(user.uid)
        .collection('meta').doc('push')
        .set(t, { merge: true });
    }).then(function(){
      console.log('[push] token saved ✓');
      if(cb) cb(true);
    }).catch(function(e){
      console.warn('[push] fail', e);
      if(cb) cb(false);
    });
  }

  /* ---------- "Notifications on karo" banner ---------- */
  function showBanner(user){
    if(document.getElementById('jeePushBanner')) return;
    var b = document.createElement('div');
    b.id = 'jeePushBanner';
    b.style.cssText =
      'position:fixed;left:50%;transform:translateX(-50%);bottom:150px;z-index:9998;' +
      'background:#1c2340;color:#fff;border-radius:16px;padding:14px 18px;' +
      'box-shadow:0 8px 30px rgba(28,35,64,.35);display:flex;align-items:center;' +
      'gap:12px;font-size:.88rem;max-width:92vw;font-family:inherit;';
    b.innerHTML =
      '<span>🔔 Daily reminders chahiye?</span>' +
      '<button id="jeePushYes" style="background:#5b6cff;color:#fff;border:none;' +
      'border-radius:99px;padding:9px 16px;font-weight:700;font-size:.85rem;' +
      'cursor:pointer;font-family:inherit;white-space:nowrap;">On karo</button>' +
      '<button id="jeePushNo" style="background:none;border:none;color:#8a93b5;' +
      'font-size:1.1rem;cursor:pointer;padding:4px;">✕</button>';
    document.body.appendChild(b);

    document.getElementById('jeePushNo').onclick = function(){ b.remove(); };
    document.getElementById('jeePushYes').onclick = function(){
      /* user-click = pakka popup (quiet prompt nahi) */
      Notification.requestPermission().then(function(perm){
        if(perm !== 'granted'){ b.remove(); return; }
        b.innerHTML = '<span>⏳ Set ho raha hai…</span>';
        saveToken(user, function(ok){
          b.innerHTML = ok
            ? '<span>✅ Ho gaya! Roz 7:37 pe plan aayega 📲</span>'
            : '<span>❌ Kuch gadbad — baad me try karna</span>';
          setTimeout(function(){ b.remove(); }, 4000);
        });
      });
    };
  }

  function start(user){
    if(Notification.permission === 'granted'){ saveToken(user); return; }
    if(Notification.permission === 'denied'){
      console.log('[push] permission denied hai — settings se on karni hogi');
      return;
    }
    showBanner(user);                     // default → visible button
  }

  /* firebase auth ready hone ka wait (sync.js init karta hai) */
  var tries = 0;
  var iv = setInterval(function(){
    tries++;
    var u = (window.firebase && firebase.apps && firebase.apps.length)
      ? firebase.auth().currentUser : null;
    if(u){ clearInterval(iv); start(u); }
    else if(tries > 60) clearInterval(iv);            // ~30s tak try
  }, 500);
})();
