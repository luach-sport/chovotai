// The notifications picture on חובותיי's site: an illustration of the phone's lock screen with the app's
// reminders (the real notifications can't be photographed in a browser). Uses the app's own font.
const today = () => {
  const d = new Date();
  const g = new Intl.DateTimeFormat('he', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Jerusalem' }).format(d);
  const h = new Intl.DateTimeFormat('he-u-ca-hebrew', { day: 'numeric', month: 'long', timeZone: 'Asia/Jerusalem' }).format(d);
  return g + ' · ' + h;
};

export const notificationsHtml = (base) =>
  '<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8">' +
  '<link rel="stylesheet" href="' + base + '/app/fonts/fonts.css">' +
  '<style>' +
  'body{margin:0;height:100vh;font-family:Heebo,sans-serif;background:linear-gradient(160deg,#2b4a57,#16262d 60%,#0f1a1f);color:#fff}' +
  '.sb{display:flex;justify-content:space-between;padding:14px 22px 0;font-size:14px;opacity:.9;direction:ltr}' +
  '.clock{text-align:center;font-size:64px;font-weight:300;margin:34px 0 0;direction:ltr}' +
  '.date{text-align:center;font-size:16px;opacity:.85;margin-bottom:26px}' +
  '.n{margin:10px 12px;background:rgba(245,240,230,.96);color:#1D2433;border-radius:22px;padding:14px 16px 10px;box-shadow:0 8px 24px rgba(0,0,0,.25)}' +
  '.h{display:flex;align-items:center;gap:8px;font-size:12.5px;color:#545B6B}' +
  '.ic{width:22px;height:22px;border-radius:50%;background:#1E5F74;display:grid;place-items:center}' +
  '.t{font-weight:700;font-size:16px;margin-top:6px}' +
  '.b{font-size:14.5px;color:#3a4150;margin-top:2px}' +
  '.a{display:flex;gap:18px;margin-top:10px;padding-top:8px;border-top:1px solid rgba(0,0,0,.08)}' +
  '.a span{color:#1E5F74;font-weight:700;font-size:14px}' +
  '.cap{margin:22px 18px 0;font-size:13px;opacity:.75;text-align:center;line-height:1.5}' +
  '</style></head><body>' +
  '<div class="sb"><span>21:30</span><span>▾ ◉ ▮</span></div>' +
  '<div class="clock">21:30</div><div class="date">' + today() + '</div>' +
  '<div class="n"><div class="h"><span class="ic"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg></span>חובותיי · עכשיו</div>' +
  '<div class="t">נשארו 2 חובות להיום</div><div class="b">השלמת 2 מתוך 4. עוד לא סומנו: פרקי אבות ושיעור לשמיעה</div></div>' +
  '<div class="n"><div class="h"><span class="ic"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg></span>חובותיי · 21:00</div>' +
  '<div class="t">פרקי אבות</div><div class="b">עמודים ⁦4–5⁩ · פרקי אבות</div>' +
  '<div class="a"><span>סיימתי ✓</span><span>ללמוד עכשיו</span></div></div>' +
  '<div class="n"><div class="h"><span class="ic"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg></span>חובותיי · 19:00</div>' +
  '<div class="t">שיעור לשמיעה</div><div class="b">שיעור 3 · הלכות שבת</div>' +
  '<div class="a"><span>סיימתי ✓</span><span>ללמוד עכשיו</span></div></div>' +
  '<div class="cap">איור להמחשה. "סיימתי" מסמן ישר מההתראה,<br>"ללמוד עכשיו" פותח את הספר בעמוד הנכון.</div>' +
  '</body></html>';
