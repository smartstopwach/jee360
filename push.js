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

  /* ---------- "Notifications on karo" banner (styled) ---------- */
  function showBanner(user){
    if(document.getElementById('jeePushBanner')) return;

    var css = document.createElement('style');
    css.textContent =
      '@keyframes jeePushUp{from{opacity:0;transform:translate(-50%,24px)}' +
      'to{opacity:1;transform:translate(-50%,0)}}' +
      '#jeePushBanner{position:fixed;left:50%;bottom:150px;z-index:9998;' +
      'transform:translateX(-50%);width:min(400px,92vw);background:#fff;' +
      'border:1px solid #e4e9f4;border-radius:20px;padding:16px;' +
      'box-shadow:0 18px 50px rgba(28,35,64,.22);font-family:inherit;' +
      'animation:jeePushUp .35s cubic-bezier(.2,.9,.3,1.2)}' +
      '#jeePushBanner .jp-row{display:flex;gap:13px;align-items:flex-start}' +
      '#jeePushBanner .jp-bell{flex:none;width:44px;height:44px;border-radius:14px;' +
      'background:linear-gradient(135deg,#22d3ee,#3b82f6);display:flex;align-items:center;' +
      'justify-content:center;font-size:1.35rem;box-shadow:0 6px 16px rgba(59,130,246,.35)}' +
      '#jeePushBanner .jp-t{font-weight:800;color:#1c2340;font-size:.95rem;margin-bottom:3px}' +
      '#jeePushBanner .jp-s{color:#8a93b5;font-size:.8rem;line-height:1.45}' +
      '#jeePushBanner .jp-btns{display:flex;gap:10px;margin-top:13px}' +
      '#jeePushBanner .jp-on{flex:1;background:linear-gradient(135deg,#22d3ee,#3b82f6);' +
      'color:#fff;border:none;border-radius:12px;padding:11px 0;font-weight:800;' +
      'font-size:.88rem;cursor:pointer;font-family:inherit;' +
      'box-shadow:0 6px 16px rgba(59,130,246,.3)}' +
      '#jeePushBanner .jp-on:active{transform:scale(.97)}' +
      '#jeePushBanner .jp-off{background:#f3f5fb;color:#8a93b5;border:none;' +
      'border-radius:12px;padding:11px 18px;font-weight:700;font-size:.88rem;' +
      'cursor:pointer;font-family:inherit}' +
      '#jeePushBanner .jp-done{display:flex;align-items:center;gap:10px;' +
      'font-weight:700;color:#1c2340;font-size:.9rem;padding:6px 2px}';
    document.head.appendChild(css);

    var b = document.createElement('div');
    b.id = 'jeePushBanner';
    b.innerHTML =
      '<div class="jp-row">' +
        '<div class="jp-bell">🔔</div>' +
        '<div>' +
          '<div class="jp-t">Daily reminders on karo</div>' +
          '<div class="jp-s">Subah aaj ka plan, peeche ho toh nudge,' +
          ' raat ko last call — sab automatic 📲</div>' +
        '</div>' +
      '</div>' +
      '<div class="jp-btns">' +
        '<button class="jp-on" id="jeePushYes">🔔 On karo</button>' +
        '<button class="jp-off" id="jeePushNo">Baad me</button>' +
      '</div>';
    document.body.appendChild(b);

    document.getElementById('jeePushNo').onclick = function(){ b.remove(); };
    document.getElementById('jeePushYes').onclick = function(){
      /* user-click = pakka popup (quiet prompt nahi) */
      Notification.requestPermission().then(function(perm){
        if(perm !== 'granted'){ b.remove(); return; }
        b.innerHTML = '<div class="jp-done">⏳ Set ho raha hai…</div>';
        saveToken(user, function(ok){
          b.innerHTML = ok
            ? '<div class="jp-done">✅ Ho gaya! Subah 7:37 pe plan, phir har 3 ghante nudge — raat 10 ke baad shant 📲</div>'
            : '<div class="jp-done">❌ Kuch gadbad — baad me try karna</div>';
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
