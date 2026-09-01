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

  /* ============================================================
     Continue session: plan bana hua hai aur user dashboard ke
     alawa kisi bhi page pe hai (front page, chapters, planner...)
     → floating "Planner continue karo" button → click = dashboard
     ============================================================ */
  function continueBtn(){
    let hasPlan = false;
    try{ hasPlan = !!localStorage.getItem('jee360.plan'); }catch(e){}
    const onDash = /dashboard\.html/i.test(location.pathname);
    if(!hasPlan || onDash) return;
    const a = document.createElement('a');
    a.href = 'dashboard.html';
    a.id = 'jeeContinue';
    a.innerHTML = '▶&nbsp; Planner continue karo';
    a.style.cssText =
      'position:fixed;right:18px;bottom:96px;z-index:9998;' +
      'display:inline-flex;align-items:center;gap:8px;padding:12px 22px;border-radius:99px;' +
      'background:linear-gradient(135deg,#22d3ee,#3b82f6);color:#fff;font-weight:800;' +
      'font-size:.9rem;font-family:inherit;text-decoration:none;white-space:nowrap;' +
      'box-shadow:0 6px 24px rgba(59,130,246,.45);transition:transform .15s,box-shadow .15s;';
    a.onmouseenter = () => { a.style.transform = 'scale(1.05)'; a.style.boxShadow = '0 8px 30px rgba(59,130,246,.6)'; };
    a.onmouseleave = () => { a.style.transform = 'none'; a.style.boxShadow = '0 6px 24px rgba(59,130,246,.45)'; };
    document.body.appendChild(a);
  }
  if(document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', continueBtn);
  else continueBtn();
})();
