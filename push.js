/* ============================================================
   JEE360 — Push Notifications (FCM)
   SIRF installed PWA app me chalta hai — browser site pe
   na permission popup, na token, na notification. Bilkul chup.
   ============================================================ */
(function(){
  /* VAPID public key — Firebase Console → Project settings →
     Cloud Messaging → Web Push certificates se milti hai */
  var VAPID = 'PASTE_VAPID_KEY_HERE';

  var isApp =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  if(!isApp) return;                                  // browser site: exit
  if(!('Notification' in window)) return;
  if(!('serviceWorker' in navigator)) return;
  if(!window.firebase || !window.JEE360_FIREBASE_CONFIG) return;
  if(VAPID.indexOf('PASTE') === 0){
    console.log('[push] VAPID key abhi set nahi hui — push off');
    return;
  }

  function saveToken(user){
    navigator.serviceWorker.ready.then(function(reg){
      var messaging = firebase.messaging();
      messaging.getToken({ vapidKey: VAPID, serviceWorkerRegistration: reg })
        .then(function(token){
          if(!token) return;
          var t = { tokens: {} };
          t.tokens[token] = Date.now();
          /* subcollection me — sync ka users/{uid} set() ise nahi chhuta */
          firebase.firestore()
            .collection('users').doc(user.uid)
            .collection('meta').doc('push')
            .set(t, { merge: true })
            .then(function(){ console.log('[push] token saved ✓'); })
            .catch(function(e){ console.warn('[push] save fail', e); });
        })
        .catch(function(e){ console.warn('[push] token fail', e); });
    });
  }

  function start(user){
    var s = document.createElement('script');
    s.src = 'https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js';
    s.onload = function(){
      if(Notification.permission === 'granted'){ saveToken(user); return; }
      if(Notification.permission === 'denied') return;
      Notification.requestPermission().then(function(perm){
        if(perm === 'granted') saveToken(user);
      });
    };
    document.head.appendChild(s);
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
