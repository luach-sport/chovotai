/* Sharing חובותיי with friends (הגדרות ← שיתוף האפליקציה): a short personal message with the link to the
   app's site, or the app itself as an APK file (Bluetooth, WhatsApp, Nearby Share, file manager…).
   The APK file is the one installed on this phone, so it works without internet. If that copy can't be
   reached, the latest APK is downloaded from GitHub instead. Hooks into app.js through __chovotai.ext. */
(function () {
  'use strict';
  const C = window.__chovotai;
  if (!C || !C.ext) return;
  const SITE = 'https://luach-sport.github.io/chovotai/';
  const APK = 'https://github.com/luach-sport/chovotai/releases/latest/download/chovotai.apk';
  const FILE = 'share/chovotai.apk';
  const TEXT = 'היי! אני משתמש באפליקציה חובותיי. מסדרים בה את חוק הלימוד היומי, עם ספרים, שיעורים ותזכורות, והכל עובד בלי אינטרנט. אשמח מאוד לשתף אותך:';
  const message = () => TEXT + '\n' + SITE;
  const say = (title, sub, icon) => C.toast({ title: title, sub: sub || '', icon: icon || 'check', tone: icon === 'x' ? 'muted' : '' });

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); say('הקישור הועתק', text.replace(/^https:\/\//, '')); return; } catch (e) { /* fall back */ }
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    say(ok ? 'הקישור הועתק' : 'לא הצלחתי להעתיק', text.replace(/^https:\/\//, ''), ok ? 'check' : 'x');
  }

  async function shareLink() {
    if (C.isNative()) {
      try { await C.callRaw('Share', 'share', { title: 'חובותיי', text: message(), dialogTitle: 'שיתוף חובותיי' }); return; } catch (e) {
        if (/cancel/i.test(String(e && (e.message || e)))) return;
      }
    } else if (navigator.share) {
      try { await navigator.share({ title: 'חובותיי', text: TEXT, url: SITE }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    copy(message());
  }

  // Where Android installed this app: the line with base.apk in the process memory map.
  async function installedApk() {
    const r = await C.callRaw('Filesystem', 'readFile', { path: '/proc/self/maps', encoding: 'utf8' });
    const m = String((r && r.data) || '').match(/(\/data\/app\/\S+?\/base\.apk)/);
    if (!m) throw new Error('no base.apk');
    return m[1];
  }

  async function prepareFile() {
    try { await C.callRaw('Filesystem', 'deleteFile', { path: FILE, directory: 'CACHE' }); } catch (e) { /* not there */ }
    try { await C.callRaw('Filesystem', 'mkdir', { path: 'share', directory: 'CACHE', recursive: true }); } catch (e) { /* exists */ }
    try {
      await C.callRaw('Filesystem', 'copy', { from: await installedApk(), to: FILE, toDirectory: 'CACHE' });
    } catch (e) {
      console.warn('apk copy', e && (e.message || e));
      if (navigator.onLine === false) throw new Error('offline');
      say('מוריד את הקובץ…', 'זה לוקח כמה שניות', 'download');
      await C.callRaw('Filesystem', 'downloadFile', { url: APK, path: FILE, directory: 'CACHE', recursive: true });
    }
    const st = await C.callRaw('Filesystem', 'stat', { path: FILE, directory: 'CACHE' });
    if (!st || st.size < 500000) throw new Error('small file');
    return (await C.callRaw('Filesystem', 'getUri', { path: FILE, directory: 'CACHE' })).uri;
  }

  let busy = false;
  async function shareApk() {
    if (!C.isNative()) { window.open(APK, '_blank'); return; }
    if (busy) return;
    busy = true;
    say('מכין את הקובץ…', 'חובותיי.apk', 'download');
    try {
      const uri = await prepareFile();
      await C.callRaw('Share', 'share', { title: 'חובותיי', text: message(), files: [uri], dialogTitle: 'שליחת האפליקציה כקובץ' });
    } catch (e) {
      const msg = String(e && (e.message || e));
      if (!/cancel/i.test(msg)) {
        console.warn('share apk', msg);
        say('לא הצלחתי להכין את הקובץ', msg === 'offline' ? 'אין אינטרנט כרגע. אפשר לשלוח קישור לאתר' : 'אפשר לשלוח קישור לאתר במקום', 'x');
      }
    } finally {
      busy = false;
    }
  }

  const row = (action, icon, title, sub) => '<button type="button" class="row link" data-action="' + action + '"><span class="rl"><b>' + C.esc(title) + '</b><small>' + C.esc(sub) + '</small></span><span class="ri">' + C.svg(icon, 18) + '</span></button>';

  C.ext.sheets.shareApp = () => '<h3>שיתוף האפליקציה</h3><p class="lead">אפשר לשלוח לחברים קישור לאתר של חובותיי, עם הסבר והורדה, או את האפליקציה עצמה כקובץ.</p>' +
    '<div class="group">' +
    row('share-app-link', 'link', 'שליחת קישור לאתר', 'הודעה קצרה עם הקישור, לוואטסאפ ולכל מקום') +
    row('share-app-apk', 'download', 'שליחת האפליקציה כקובץ (APK)', 'בבלוטות\', בוואטסאפ או במנהל הקבצים. עובד גם בלי אינטרנט') +
    row('share-app-copy', 'copy', 'העתקת הקישור לאתר', SITE.replace(/^https:\/\//, '').replace(/\/$/, '')) +
    '</div><p class="lead" style="margin-top:14px;font-size:13.5px">ההודעה שנשלחת: ' + C.esc(TEXT) + ' <span dir="ltr">' + C.esc(SITE) + '</span></p>';

  C.ext.actions['share-app'] = () => C.openSheet({ type: 'shareApp' });
  C.ext.actions['share-app-link'] = () => { C.closeSheet(); shareLink(); };
  C.ext.actions['share-app-apk'] = () => { C.closeSheet(); shareApk(); };
  C.ext.actions['share-app-copy'] = () => { C.closeSheet(); copy(SITE); };
})();
