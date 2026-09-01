/* ============================================================
   JEE360 PWA — service worker registration + install button
   ============================================================ */
(function(){
  /* ---- service worker ---- */
  if('serviceWorker' in navigator){
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(e => console.warn('[pwa] sw fail', e));
    });
  }

  /* ---- install (Download App) ---- */
  let deferred = null;
  const isStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  function btns(){ return document.querySelectorAll('[data-install-app]'); }
  function show(){ btns().forEach(b => { b.style.display = ''; }); }
  function hide(){ btns().forEach(b => { b.style.display = 'none'; }); }

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferred = e;
    if(!isStandalone()) show();
  });

  window.addEventListener('appinstalled', () => { deferred = null; hide(); });

  function wire(){
    hide();
    if(isStandalone()) return;               // app ke andar already
    if(isIOS) show();                        // iOS: manual add-to-home
    btns().forEach(b => {
      b.addEventListener('click', ev => {
        ev.preventDefault();
        if(deferred){
          deferred.prompt();
          deferred.userChoice.then(() => { deferred = null; });
        } else if(isIOS){
          alert('iPhone/iPad pe install karne ke liye:\n\n1. Safari mein ye site kholo\n2. Share button (⬆️) dabao\n3. "Add to Home Screen" chuno\n\nBas — app home screen pe aa jayegi! 📲');
        } else {
          alert('Install option browser menu (⋮) mein "Install app" / "Add to Home screen" se milega.\n\nTip: Chrome/Edge use karo — button apne aap aa jata hai.');
        }
      });
    });
  }

  if(document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', wire);
  else wire();
})();
