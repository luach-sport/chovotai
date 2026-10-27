/* חובותיי — מעקב אחרי חובות הלימוד היומיות. JavaScript רגיל, בלי תלויות (pdf.js נטען רק כשפותחים ספר). */
(function () {
  'use strict';

  const APP_VERSION = '1.0.0';
  const STORE_KEY = 'chovotai.v1';
  const CHANNEL = 'chovotai-reminders';
  const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const DAY_LETTERS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
  const KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
  const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
  const MAX_TIMES = 5;
  const FREQ_TYPES = ['daily', 'days', 'interval', 'weekly', 'monthly'];
  const FREQ_LABEL = { daily: 'כל יום', days: 'ימים קבועים', interval: 'כל כמה ימים', weekly: 'בשבוע', monthly: 'בחודש' };
  const COLORS = ['#1E7A8C', '#4C56B0', '#8A4FA0', '#C2456A', '#C2791A', '#5F8A2A', '#2E8B5E', '#5C6B7A'];
  const OB_ICONS = ['book', 'scroll', 'headphones', 'star', 'flame', 'heart', 'sun', 'moon', 'pen', 'candle', 'target', 'layers'];
  // Small feature files loaded after this one (share-app.js) add their sheets and buttons here.
  const EXT = { sheets: {}, actions: {} };
  const SPEEDS = [0.8, 1, 1.25, 1.5, 1.75, 2];
  const ZOOMS = [1, 1.35, 1.75, 2.25, 3];

  const CITIES = [
    { id: 'jerusalem', name: 'ירושלים', lat: 31.7683, lon: 35.2137 },
    { id: 'tel-aviv', name: 'תל אביב', lat: 32.0853, lon: 34.7818 },
    { id: 'haifa', name: 'חיפה', lat: 32.794, lon: 34.9896 },
    { id: 'beer-sheva', name: 'באר שבע', lat: 31.252, lon: 34.7915 },
    { id: 'bnei-brak', name: 'בני ברק', lat: 32.0807, lon: 34.8338 },
    { id: 'petah-tikva', name: 'פתח תקווה', lat: 32.084, lon: 34.8878 },
    { id: 'netanya', name: 'נתניה', lat: 32.3215, lon: 34.8532 },
    { id: 'ashdod', name: 'אשדוד', lat: 31.8044, lon: 34.6553 },
    { id: 'ashkelon', name: 'אשקלון', lat: 31.6688, lon: 34.5743 },
    { id: 'rishon', name: 'ראשון לציון', lat: 31.973, lon: 34.7925 },
    { id: 'holon', name: 'חולון', lat: 32.0158, lon: 34.7874 },
    { id: 'bat-yam', name: 'בת ים', lat: 32.0231, lon: 34.7503 },
    { id: 'ramat-gan', name: 'רמת גן', lat: 32.0684, lon: 34.8248 },
    { id: 'herzliya', name: 'הרצליה', lat: 32.1663, lon: 34.8436 },
    { id: 'raanana', name: 'רעננה', lat: 32.1848, lon: 34.8713 },
    { id: 'kfar-saba', name: 'כפר סבא', lat: 32.175, lon: 34.9069 },
    { id: 'hadera', name: 'חדרה', lat: 32.434, lon: 34.9196 },
    { id: 'rehovot', name: 'רחובות', lat: 31.8928, lon: 34.8113 },
    { id: 'yavne', name: 'יבנה', lat: 31.8781, lon: 34.7397 },
    { id: 'rosh-haayin', name: 'ראש העין', lat: 32.0956, lon: 34.9566 },
    { id: 'elad', name: 'אלעד', lat: 32.0522, lon: 34.9511 },
    { id: 'modiin', name: 'מודיעין', lat: 31.8969, lon: 35.0095 },
    { id: 'modiin-illit', name: 'מודיעין עילית', lat: 31.9333, lon: 35.0414 },
    { id: 'beit-shemesh', name: 'בית שמש', lat: 31.747, lon: 34.9881 },
    { id: 'beitar-illit', name: 'ביתר עילית', lat: 31.697, lon: 35.121 },
    { id: 'maale-adumim', name: 'מעלה אדומים', lat: 31.777, lon: 35.298 },
    { id: 'ariel', name: 'אריאל', lat: 32.1066, lon: 35.1803 },
    { id: 'kiryat-gat', name: 'קריית גת', lat: 31.61, lon: 34.7642 },
    { id: 'afula', name: 'עפולה', lat: 32.6078, lon: 35.2898 },
    { id: 'tiberias', name: 'טבריה', lat: 32.7922, lon: 35.5312 },
    { id: 'safed', name: 'צפת', lat: 32.9646, lon: 35.496 },
    { id: 'karmiel', name: 'כרמיאל', lat: 32.917, lon: 35.295 },
    { id: 'nahariya', name: 'נהריה', lat: 33.0059, lon: 35.0941 },
    { id: 'eilat', name: 'אילת', lat: 29.5577, lon: 34.9519 }
  ];

  /** Ready-made obligations to start from. Everything can be changed after choosing. */
  const TEMPLATES = [
    { key: 'daf', name: 'דף יומי', icon: 'book', color: 0, text: 'דף גמרא אחד', desc: 'דף גמרא בכל יום, כדאי לחבר קובץ PDF של המסכת', freq: { type: 'daily' }, times: ['21:00'] },
    { key: 'mishna', name: 'משנה יומית', icon: 'scroll', color: 1, text: 'שתי משניות', desc: 'שתי משניות בכל יום', freq: { type: 'daily' }, times: ['07:30'] },
    { key: 'halacha', name: 'הלכה יומית', icon: 'pen', color: 6, text: 'סעיף במשנה ברורה', desc: 'הלכה למעשה בכל יום', freq: { type: 'daily' }, times: ['08:00'] },
    { key: 'rambam', name: 'רמב״ם יומי', icon: 'layers', color: 2, text: 'פרק אחד', desc: 'פרק רמב״ם בכל יום', freq: { type: 'daily' }, times: ['20:00'] },
    { key: 'chumash', name: 'חומש ורש״י', icon: 'star', color: 4, text: 'עלייה אחת מפרשת השבוע', desc: 'עלייה ליום, הפרשה כולה בשבוע', freq: { type: 'daily' }, times: ['07:00'] },
    { key: 'tehilim', name: 'תהילים', icon: 'heart', color: 3, text: 'לפי חלוקת החודש', desc: 'ספר תהילים כולו בכל חודש', freq: { type: 'daily' }, times: ['07:15'] },
    { key: 'shmiras', name: 'שמירת הלשון', icon: 'sun', color: 5, text: 'שתי הלכות', desc: 'חפץ חיים ושמירת הלשון', freq: { type: 'daily' }, times: ['13:00'] },
    { key: 'tanya', name: 'תניא יומי', icon: 'candle', color: 7, text: 'שיעור התניא היומי', desc: 'לפי החלוקה השנתית', freq: { type: 'daily' }, times: ['21:30'] },
    { key: 'shiur', name: 'שיעור לשמיעה', icon: 'headphones', color: 0, text: 'שיעור אחד', desc: 'שיעור מוקלט, כדאי לחבר קבצי שמע', freq: { type: 'daily' }, times: ['19:00'], audio: true },
    { key: 'mussar', name: 'ספר מוסר', icon: 'flame', color: 3, text: 'חצי פרק מסילת ישרים', desc: 'שלוש פעמים בשבוע: א׳, ג׳, ה׳', freq: { type: 'days', days: [0, 2, 4] }, times: ['22:00'] },
    { key: 'chazara', name: 'חזרה שבועית', icon: 'target', color: 1, text: 'חזרה על הלימוד של השבוע', desc: 'פעם אחת בשבוע, באיזה יום שנוח', freq: { type: 'weekly', count: 1 }, times: ['20:30'] },
    { key: 'kvius', name: 'קביעות עיתים', icon: 'moon', color: 4, text: 'חצי שעה של לימוד', desc: 'פעמיים ביום, בוקר וערב', freq: { type: 'daily', times: 2 }, times: ['06:45', '21:00'] }
  ];

  // ================= Icons (Lucide, ISC license) =================
  const P = {
    book: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    scroll: '<path d="M15 12h-5"/><path d="M15 8h-5"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"/>',
    headphones: '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
    star: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    pen: '<path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/>',
    candle: '<path d="M9 22h6"/><rect x="9" y="11" width="6" height="11" rx="1"/><path d="M12 11V9"/><path d="M12 2c1.5 2 2 3 2 4a2 2 0 0 1-4 0c0-1 .5-2 2-4z"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    layers: '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    chevR: '<path d="m9 18 6-6-6-6"/>',
    chevL: '<path d="m15 18-6-6 6-6"/>',
    chevUp: '<path d="m18 15-6-6-6 6"/>',
    chevDown: '<path d="m6 9 6 6 6-6"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    sparkle: '<path d="M12 3l1.9 5.8L20 10.7l-5.8 1.9L12 18.5l-1.9-5.9L4 10.7l6.1-1.9z"/>',
    edit: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
    play: '<path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z" fill="currentColor" stroke="none"/>',
    pause: '<rect x="14" y="4" width="4.5" height="16" rx="1.2" fill="currentColor" stroke="none"/><rect x="5.5" y="4" width="4.5" height="16" rx="1.2" fill="currentColor" stroke="none"/>',
    back: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    fwd: '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>',
    skipPrev: '<path d="M19 20 9 12l10-8z" fill="currentColor"/><path d="M5 19V5"/>',
    skipNext: '<path d="m5 4 10 8-10 8z" fill="currentColor"/><path d="M19 5v14"/>',
    zoomIn: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6"/><path d="M8 11h6"/>',
    zoomOut: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M8 11h6"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
    library: '<path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/>',
    more: '<circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
    pauseO: '<circle cx="12" cy="12" r="10"/><path d="M10 15V9"/><path d="M14 15V9"/>',
    playO: '<circle cx="12" cy="12" r="10"/><path d="m10 8 6 4-6 4z"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5 5.5 5.5 0 0 1-5.5 5.5H11"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    hash: '<path d="M4 9h16"/><path d="M4 15h16"/><path d="M10 3 8 21"/><path d="M16 3l-2 18"/>',
    bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98"/><path d="m15.41 6.51-6.82 3.98"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>'
  };
  function svg(name, size, sw) {
    const s = size || 20;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 2) +
      '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[name] || P.book) + '</svg>';
  }

  // ================= Small helpers =================
  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const pad = (n) => String(n).padStart(2, '0');
  const isObj = (o) => !!o && typeof o === 'object' && !Array.isArray(o);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const int = (v, d) => { const n = parseInt(v, 10); return isFinite(n) ? n : d; };
  const cleanText = (s, max) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, max || 80);
  const stripExt = (n) => String(n || '').replace(/\.[a-z0-9]{1,5}$/i, '').replace(/[_]+/g, ' ').trim();
  const clone = (o) => JSON.parse(JSON.stringify(o));
  function fmtSize(b) {
    if (!(b > 0)) return '0 MB';
    if (b < 1024 * 1024) return Math.max(1, Math.round(b / 1024)) + ' KB';
    if (b < 1024 * 1024 * 1024) return (b / 1024 / 1024).toFixed(b < 10 * 1024 * 1024 ? 1 : 0) + ' MB';
    return (b / 1024 / 1024 / 1024).toFixed(2) + ' GB';
  }
  function fmtTime(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return h ? h + ':' + pad(m) + ':' + pad(s) : m + ':' + pad(s);
  }
  function plural(n, one, many, two) {
    if (n === 1) return one;
    if (n === 2 && two) return two;
    return n + ' ' + many;
  }
  function hexRgb(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function mixHex(hex, to, amt) {
    const a = hexRgb(hex), b = hexRgb(to);
    return '#' + a.map((v, i) => pad(Math.round(v + (b[i] - v) * amt).toString(16))).join('');
  }

  // ================= Dates =================
  const keyOf = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const parseKey = (k) => { const a = k.split('-').map(Number); return new Date(a[0], a[1] - 1, a[2], 12); };
  const dateOnly = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12);
  const startOfWeek = (d) => addDays(d, -d.getDay());
  const diffDays = (a, b) => Math.round((dateOnly(b).getTime() - dateOnly(a).getTime()) / 864e5);
  /** The "learning day": until settings.dayStart (e.g. 02:00) we are still in yesterday. */
  function todayDate() {
    const h = state && state.settings ? state.settings.dayStart : 0;
    return dateOnly(new Date(Date.now() - h * 3600e3));
  }
  /** Wall-clock moment of hh:mm on learning-day d (times before the day start belong to the next morning). */
  function atTime(d, hhmm) {
    const t = hhmm.split(':').map(Number);
    const ds = state ? state.settings.dayStart : 0;
    const base = t[0] < ds ? addDays(d, 1) : d;
    return new Date(base.getFullYear(), base.getMonth(), base.getDate(), t[0], t[1], 0, 0);
  }
  const hhmm = (dt) => pad(dt.getHours()) + ':' + pad(dt.getMinutes());

  function fmt(locale, opts) { try { return new Intl.DateTimeFormat(locale, opts); } catch (e) { return null; } }
  const F_HEB = fmt('he-u-ca-hebrew', { day: 'numeric', month: 'long', year: 'numeric' });
  const F_HEB_EN = fmt('en-u-ca-hebrew', { day: 'numeric', month: 'long' });
  const F_GREG = fmt('he', { day: 'numeric', month: 'long', year: 'numeric' });
  const F_GREG_SHORT = fmt('he', { day: 'numeric', month: 'long' });

  function gematriya(n) {
    n = Math.floor(n);
    if (!(n > 0 && n < 1000)) return String(n);
    const ones = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
    const tens = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
    const hundreds = ['', 'ק', 'ר', 'ש', 'ת', 'תק', 'תר', 'תש', 'תת', 'תתק'];
    let s = hundreds[Math.floor(n / 100)];
    const r = n % 100;
    if (r === 15) s += 'טו';
    else if (r === 16) s += 'טז';
    else s += tens[Math.floor(r / 10)] + ones[r % 10];
    if (s.length === 1) return s + '׳';
    return s.slice(0, -1) + '״' + s.slice(-1);
  }
  const hebCache = {};
  function hebParts(d) {
    const k = keyOf(d);
    if (k in hebCache) return hebCache[k];
    let res = null;
    try {
      if (F_HEB && F_HEB_EN) {
        const parts = F_HEB.formatToParts(d);
        const get = (t) => { const p = parts.find((x) => x.type === t); return p ? p.value : ''; };
        const en = F_HEB_EN.formatToParts(d).find((x) => x.type === 'month');
        const day = parseInt(String(get('day')).replace(/\D/g, ''), 10);
        const year = parseInt(String(get('year') || get('relatedYear')).replace(/\D/g, ''), 10);
        if (day > 0) res = { day: day, month: get('month'), year: year, enMonth: en ? en.value : '' };
      }
    } catch (e) { res = null; }
    hebCache[k] = res;
    return res;
  }
  function hebDate(d, withYear) {
    const h = hebParts(d);
    if (!h) return '';
    return gematriya(h.day) + ' ב' + h.month + (withYear && h.year ? ' ' + gematriya(h.year % 1000) : '');
  }
  const gregDate = (d, short) => { const f = short ? F_GREG_SHORT : F_GREG; return f ? f.format(d) : keyOf(d); };
  /** First day of the Hebrew month containing d (falls back to the civil month). */
  function monthStart(d) {
    const h = hebParts(d);
    if (!h) return new Date(d.getFullYear(), d.getMonth(), 1, 12);
    return addDays(d, -(h.day - 1));
  }
  function monthEnd(d) {
    const s = monthStart(d);
    if (!hebParts(s)) return new Date(d.getFullYear(), d.getMonth() + 1, 0, 12);
    for (let i = 28; i <= 31; i++) { const x = addDays(s, i); const h = hebParts(x); if (h && h.day === 1) return addDays(x, -1); }
    return addDays(s, 29);
  }
  function relDay(d) {
    const n = diffDays(todayDate(), d);
    if (n === 0) return 'היום';
    if (n === 1) return 'מחר';
    if (n === -1) return 'אתמול';
    if (n > 1 && n < 7) return 'ביום ' + DAY_NAMES[d.getDay()];
    return gregDate(d, true);
  }

  // Yom Tov in Israel (one day, except Rosh Hashana)
  const YOMTOV = { Tishri: [1, 2, 10, 15, 22], Nisan: [15, 21], Sivan: [6] };
  function isYomTov(d) { const h = hebParts(d); if (!h) return false; const l = YOMTOV[h.enMonth]; return !!(l && l.indexOf(h.day) >= 0); }
  const isHoly = (d) => d.getDay() === 6 || isYomTov(d);

  // ================= Sun (NOAA almanac algorithm) =================
  const RAD = Math.PI / 180;
  const sinD = (x) => Math.sin(x * RAD), cosD = (x) => Math.cos(x * RAD), tanD = (x) => Math.tan(x * RAD);
  const norm360 = (x) => ((x % 360) + 360) % 360;
  function sunDown(d, lat, lon, zenith) {
    const y = d.getFullYear(), mo = d.getMonth(), da = d.getDate();
    const N = Math.round((Date.UTC(y, mo, da) - Date.UTC(y, 0, 0)) / 864e5);
    const lngHour = lon / 15;
    const t = N + ((18 - lngHour) / 24);
    const M = 0.9856 * t - 3.289;
    const L = norm360(M + 1.916 * sinD(M) + 0.02 * sinD(2 * M) + 282.634);
    let RA = norm360(Math.atan(0.91764 * tanD(L)) / RAD);
    RA = (RA + (Math.floor(L / 90) * 90 - Math.floor(RA / 90) * 90)) / 15;
    const sinDec = 0.39782 * sinD(L);
    const cosDec = Math.cos(Math.asin(sinDec));
    const cosH = (cosD(zenith) - sinDec * sinD(lat)) / (cosDec * cosD(lat));
    if (cosH > 1 || cosH < -1) return null;
    const H = Math.acos(cosH) / RAD / 15;
    const T = H + RA - 0.06571 * t - 6.622;
    const UT = ((T - lngHour) % 24 + 24) % 24;
    return new Date(Date.UTC(y, mo, da) + UT * 3600e3);
  }
  const sunset = (d, c) => sunDown(d, c.lat, c.lon, 90.833);
  const nightfall = (d, c) => sunDown(d, c.lat, c.lon, 98.5);
  const cityById = (id) => CITIES.find((c) => c.id === id) || CITIES[0];
  /** Is moment t inside Shabbat / Yom Tov (with margins)? */
  function inQuiet(t, city) {
    const d = dateOnly(t);
    if (isHoly(d)) {
      const nf = nightfall(d, city);
      if (!nf || t.getTime() < nf.getTime() + 15 * 60e3) return true;
    }
    if (isHoly(addDays(d, 1))) {
      const ss = sunset(d, city);
      if (!ss || t.getTime() > ss.getTime() - 45 * 60e3) return true;
    }
    return false;
  }

  // ================= State =================
  let state = null;
  const ui = {
    tab: 'home', day: null, todayKey: '', page: null, sheet: null, laterOpen: false,
    editor: null, reader: null, player: null, onb: null, importFor: null, perm: null, exact: null, demo: false, toastTimer: null
  };

  function defaults() {
    return {
      v: 1,
      createdAt: keyOf(todayDate()),
      obligations: [],
      log: {},
      library: [],
      settings: {
        onboarded: false,
        nightly: { on: true, time: '21:30' },
        shabbatQuiet: true,
        city: 'jerusalem',
        dayStart: 0,
        theme: 'auto',
        haptics: true,
        readerNight: false,
        speed: 1
      }
    };
  }
  function cleanTimes(arr) {
    const out = [];
    (Array.isArray(arr) ? arr : []).forEach((t) => { if (TIME_RE.test(t) && out.indexOf(t) < 0) out.push(t); });
    return out.sort().slice(0, MAX_TIMES);
  }
  function normFreq(f) {
    f = isObj(f) ? f : {};
    const type = FREQ_TYPES.indexOf(f.type) >= 0 ? f.type : 'daily';
    let days = Array.isArray(f.days) ? f.days.map(Number).filter((x) => x >= 0 && x <= 6) : [];
    days = days.filter((x, i) => days.indexOf(x) === i).sort();
    if (!days.length) days = [0, 1, 2, 3, 4, 5];
    return {
      type: type,
      times: clamp(int(f.times, 1), 1, 10),
      days: days,
      every: clamp(int(f.every, 2), 2, 60),
      count: clamp(int(f.count, 1), 1, type === 'monthly' ? 30 : 7)
    };
  }
  function normSrc(s) {
    if (!isObj(s)) return null;
    if (s.kind === 'pdf' && typeof s.item === 'string') {
      return { kind: 'pdf', item: s.item, page: Math.max(1, int(s.page, 1)), per: clamp(int(s.per, 1), 1, 500) };
    }
    if (s.kind === 'audio' && typeof s.item === 'string') {
      return {
        kind: 'audio', item: s.item, track: Math.max(0, int(s.track, 0)), time: Math.max(0, +s.time || 0),
        unit: s.unit === 'minutes' ? 'minutes' : 'tracks', per: clamp(int(s.per, 1), 1, s.unit === 'minutes' ? 600 : 50)
      };
    }
    return null;
  }
  function normOb(o) {
    if (!isObj(o) || typeof o.id !== 'string' || !o.id) return null;
    const r = isObj(o.reminders) ? o.reminders : {};
    return {
      id: o.id.slice(0, 40),
      name: cleanText(o.name, 40) || 'חובה',
      icon: OB_ICONS.indexOf(o.icon) >= 0 ? o.icon : 'book',
      color: COLORS.indexOf(o.color) >= 0 ? o.color : COLORS[0],
      paused: !!o.paused,
      createdAt: KEY_RE.test(o.createdAt) ? o.createdAt : keyOf(todayDate()),
      freq: normFreq(o.freq),
      task: { text: cleanText(isObj(o.task) ? o.task.text : '', 120), src: normSrc(isObj(o.task) ? o.task.src : null) },
      reminders: { on: r.on !== false, times: cleanTimes(r.times) }
    };
  }
  function normItem(it) {
    if (!isObj(it) || typeof it.id !== 'string') return null;
    if (it.kind === 'pdf' && typeof it.file === 'string') {
      return {
        id: it.id, kind: 'pdf', name: cleanText(it.name, 80) || 'ספר', file: it.file, size: +it.size || 0,
        pages: Math.max(0, int(it.pages, 0)), lastPage: Math.max(1, int(it.lastPage, 1)), color: COLORS.indexOf(it.color) >= 0 ? it.color : COLORS[1],
        addedAt: +it.addedAt || Date.now()
      };
    }
    if (it.kind === 'audio' && Array.isArray(it.tracks)) {
      const tracks = it.tracks.filter((t) => isObj(t) && typeof t.f === 'string').map((t) => ({
        f: t.f, name: cleanText(t.name, 120) || 'שיעור', size: +t.size || 0, dur: Math.max(0, +t.dur || 0)
      }));
      return {
        id: it.id, kind: 'audio', name: cleanText(it.name, 80) || 'שיעורים', tracks: tracks, color: COLORS.indexOf(it.color) >= 0 ? it.color : COLORS[0],
        lastTrack: clamp(int(it.lastTrack, 0), 0, Math.max(0, tracks.length - 1)), lastTime: Math.max(0, +it.lastTime || 0), addedAt: +it.addedAt || Date.now()
      };
    }
    return null;
  }
  function normalize(raw) {
    const out = defaults();
    if (!isObj(raw)) return out;
    if (KEY_RE.test(raw.createdAt)) out.createdAt = raw.createdAt;
    if (Array.isArray(raw.obligations)) {
      const seen = {};
      raw.obligations.forEach((o) => { const n = normOb(o); if (n && !seen[n.id]) { seen[n.id] = 1; out.obligations.push(n); } });
    }
    if (Array.isArray(raw.library)) {
      raw.library.forEach((it) => { const n = normItem(it); if (n) out.library.push(n); });
    }
    if (isObj(raw.log)) {
      Object.keys(raw.log).forEach((k) => {
        if (!KEY_RE.test(k) || !isObj(raw.log[k])) return;
        const day = {};
        Object.keys(raw.log[k]).forEach((id) => {
          const arr = raw.log[k][id];
          if (!Array.isArray(arr)) return;
          const clean = arr.filter(isObj).slice(0, 20).map((e) => {
            const x = { t: +e.t || 0, w: cleanText(e.w, 80) };
            if (isObj(e.p)) x.p = e.p;
            if (isObj(e.n)) x.n = e.n;
            return x;
          });
          if (clean.length) day[id] = clean;
        });
        if (Object.keys(day).length) out.log[k] = day;
      });
    }
    const s = isObj(raw.settings) ? raw.settings : {};
    const d = out.settings;
    d.onboarded = !!s.onboarded;
    if (isObj(s.nightly)) { d.nightly.on = s.nightly.on !== false; if (TIME_RE.test(s.nightly.time)) d.nightly.time = s.nightly.time; }
    if (typeof s.shabbatQuiet === 'boolean') d.shabbatQuiet = s.shabbatQuiet;
    if (CITIES.some((c) => c.id === s.city)) d.city = s.city;
    d.dayStart = clamp(int(s.dayStart, 0), 0, 4);
    if (['auto', 'light', 'dark'].indexOf(s.theme) >= 0) d.theme = s.theme;
    if (typeof s.haptics === 'boolean') d.haptics = s.haptics;
    d.readerNight = !!s.readerNight;
    if (SPEEDS.indexOf(+s.speed) >= 0) d.speed = +s.speed;
    return out;
  }

  async function loadState() {
    let raw = null;
    if (isNative()) {
      const r = await call('Preferences', 'get', { key: STORE_KEY });
      if (r && typeof r.value === 'string' && r.value) raw = r.value;
    }
    if (!raw) { try { raw = localStorage.getItem(STORE_KEY); } catch (e) { raw = null; } }
    let parsed = null;
    if (raw) { try { parsed = JSON.parse(raw); } catch (e) { parsed = null; } }
    state = normalize(parsed);
  }
  let saveTimer = null;
  function saveState() {
    clearTimeout(saveTimer);
    saveTimer = null;
    if (ui.demo) return;
    const raw = JSON.stringify(state);
    try { localStorage.setItem(STORE_KEY, raw); } catch (e) { /* ignore */ }
    if (isNative()) call('Preferences', 'set', { key: STORE_KEY, value: raw });
  }
  function saveSoon() { clearTimeout(saveTimer); saveTimer = setTimeout(saveState, 1500); }

  // ================= File storage (IndexedDB, stays on the phone) =================
  let dbPromise = null;
  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      let req;
      try { req = indexedDB.open('chovotai-files', 1); } catch (e) { reject(e); return; }
      req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains('files')) req.result.createObjectStore('files'); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    dbPromise.catch(() => { dbPromise = null; });
    return dbPromise;
  }
  async function idb(mode, fn) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('files', mode);
      const req = fn(tx.objectStore('files'));
      tx.oncomplete = () => resolve(req ? req.result : undefined);
      tx.onerror = () => reject(tx.error || new Error('idb'));
      tx.onabort = () => reject(tx.error || new Error('idb-abort'));
    });
  }
  const fileGet = (id) => idb('readonly', (st) => st.get(id));
  const filePut = (id, blob) => idb('readwrite', (st) => st.put(blob, id));
  const fileDel = (id) => idb('readwrite', (st) => st.delete(id));

  // ================= Capacitor bridge =================
  function capacitor() { const rt = window.ChovotaiCap; return (rt && rt.Capacitor) || window.Capacitor || null; }
  function isNative() {
    const C = capacitor();
    if (!C) return false;
    try {
      if (typeof C.isNativePlatform === 'function') return !!C.isNativePlatform();
      return C.isNative === true || C.platform === 'android' || C.platform === 'ios';
    } catch (e) { return false; }
  }
  const pluginCache = {};
  function plugin(name) {
    if (!isNative()) return null;
    if (Object.prototype.hasOwnProperty.call(pluginCache, name)) return pluginCache[name];
    let p = null;
    try {
      const rt = window.ChovotaiCap;
      if (rt && typeof rt.registerPlugin === 'function') p = rt.registerPlugin(name);
      else if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins[name]) p = window.Capacitor.Plugins[name];
    } catch (e) { p = null; }
    pluginCache[name] = p;
    return p;
  }
  async function callRaw(name, method, args) {
    const p = plugin(name);
    if (!p) throw new Error('no-plugin');
    const fn = p[method];
    if (typeof fn !== 'function') throw new Error('no-method');
    return fn.call(p, args);
  }
  async function call(name, method, args) {
    try { return await callRaw(name, method, args); } catch (e) { console.warn('[native]', name, method, e && (e.message || e)); return undefined; }
  }
  async function listen(name, event, cb) {
    const p = plugin(name);
    if (!p) return;
    try { await p.addListener(event, cb); } catch (e) { console.warn('[native] listen', name, event, e && e.message); }
  }
  function haptic(kind) {
    if (!state || !state.settings.haptics) return;
    if (isNative()) {
      if (kind === 'success') call('Haptics', 'notification', { type: 'SUCCESS' });
      else call('Haptics', 'impact', { style: 'LIGHT' });
    } else if (navigator.vibrate) {
      try { navigator.vibrate(kind === 'success' ? [20, 40, 20] : 10); } catch (e) { /* ignore */ }
    }
  }

  // ================= Theme & colors =================
  function isDark() {
    const t = state ? state.settings.theme : 'auto';
    if (t === 'dark') return true;
    if (t === 'light') return false;
    try { return window.matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) { return false; }
  }
  /** CSS custom properties for an obligation/book color: --c (strong) and --ct (tint). */
  function cvars(hex) {
    const c = isDark() ? mixHex(hex, '#ffffff', 0.32) : hex;
    const rgb = hexRgb(c);
    return '--c:' + c + ';--ct:rgba(' + rgb.join(',') + ',' + (isDark() ? 0.18 : 0.12) + ')';
  }
  function applyTheme() {
    const t = state.settings.theme;
    if (t === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
    const dark = isDark();
    const bg = dark ? '#11141A' : '#F5F0E6';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', bg);
    if (isNative()) {
      call('StatusBar', 'setBackgroundColor', { color: bg });
      call('StatusBar', 'setStyle', { style: dark ? 'DARK' : 'LIGHT' });
    }
  }

  // ================= Obligations: lookup & schedule logic =================
  const obById = (id) => state.obligations.find((o) => o.id === id) || null;
  const itemById = (id) => state.library.find((i) => i.id === id) || null;
  const isDayType = (o) => o.freq.type === 'daily' || o.freq.type === 'days' || o.freq.type === 'interval';
  function entries(key, id) { const d = state.log[key]; return d && d[id] ? d[id] : []; }
  const doneOn = (key, id) => entries(key, id).length;
  function countRange(id, from, to) {
    let n = 0;
    for (let d = from; d <= to; d = addDays(d, 1)) n += doneOn(keyOf(d), id);
    return n;
  }
  function lastDoneBefore(o, d) {
    const floor = parseKey(o.createdAt);
    for (let i = 1; i <= 400; i++) {
      const x = addDays(d, -i);
      if (doneOn(keyOf(x), o.id)) return x;
      if (x < addDays(floor, -400)) break;
    }
    return null;
  }
  function periodOf(o, d) {
    if (o.freq.type === 'weekly') { const s = startOfWeek(d); return { start: s, end: addDays(s, 6), label: 'השבוע', unit: 'בשבוע' }; }
    return { start: monthStart(d), end: monthEnd(d), label: 'החודש', unit: 'בחודש' };
  }

  /**
   * What does obligation o require on learning-day d?
   * kind 'day'    → due on this day: target sessions (times per day), done so far.
   * kind 'period' → weekly/monthly quota: shown every day until the quota is met.
   */
  function info(o, d) {
    const key = keyOf(d);
    const done = doneOn(key, o.id);
    const f = o.freq;
    const base = { o: o, key: key, done: done, due: false, target: 1, kind: 'day' };
    if (o.paused && !done) return base;
    if (key < o.createdAt && !done) return base;
    if (f.type === 'daily') return Object.assign(base, { due: true, target: f.times });
    if (f.type === 'days') return Object.assign(base, { due: f.days.indexOf(d.getDay()) >= 0 || done > 0, target: f.times });
    if (f.type === 'interval') {
      const last = lastDoneBefore(o, d);
      const next = last ? addDays(last, f.every) : parseKey(o.createdAt);
      const due = done > 0 || d >= next;
      return Object.assign(base, { due: due, target: f.times, next: next, late: due && !done ? diffDays(next, d) : 0 });
    }
    const p = periodOf(o, d);
    const before = countRange(o.id, p.start, addDays(d, -1));
    const target = f.count;
    return Object.assign(base, {
      kind: 'period', period: p, before: before, total: before + done, target: target,
      due: before < target || done > 0, met: before + done >= target
    });
  }
  /** Next date (after d) on which a day-type obligation is due, assuming nothing more is learned. */
  function nextDue(o, d) {
    if (o.paused) return null;
    const f = o.freq;
    if (f.type === 'daily') return addDays(d, 1);
    if (f.type === 'days') { for (let i = 1; i <= 7; i++) { const x = addDays(d, i); if (f.days.indexOf(x.getDay()) >= 0) return x; } return null; }
    if (f.type === 'interval') {
      const done = doneOn(keyOf(d), o.id);
      const last = done ? d : lastDoneBefore(o, d);
      const n = last ? addDays(last, f.every) : parseKey(o.createdAt);
      return n > d ? n : addDays(d, 1);
    }
    const p = periodOf(o, d);
    return addDays(p.end, 1);
  }

  /** Splits the obligations for day d into: due today, weekly/monthly quotas, and "not today". */
  function dayPlan(d) {
    const due = [], period = [], later = [];
    state.obligations.forEach((o) => {
      const inf = info(o, d);
      if (o.paused && !inf.done) { later.push(inf); return; }
      if (inf.kind === 'period') { if (inf.due && !(inf.met && inf.done === 0)) period.push(inf); else later.push(inf); return; }
      if (inf.due) due.push(inf); else later.push(inf);
    });
    return { due: due, period: period, later: later };
  }
  function dayScore(d) {
    let total = 0, done = 0;
    state.obligations.forEach((o) => {
      if (!isDayType(o)) return;
      const inf = info(o, d);
      if (!inf.due) return;
      total += inf.target;
      done += Math.min(inf.done, inf.target);
    });
    return { total: total, done: done };
  }
  function earliestDay() {
    let k = state.createdAt;
    state.obligations.forEach((o) => { if (o.createdAt < k) k = o.createdAt; });
    Object.keys(state.log).forEach((x) => { if (x < k) k = x; });
    return parseKey(k);
  }
  /** Consecutive days on which everything due was completed (today counts once it is complete). */
  function streak() {
    const today = todayDate();
    const first = earliestDay();
    let n = 0;
    const t = dayScore(today);
    if (t.total && t.done >= t.total) n++;
    for (let d = addDays(today, -1), i = 0; d >= first && i < 1500; d = addDays(d, -1), i++) {
      const s = dayScore(d);
      if (!s.total) continue;
      if (s.done >= s.total) n++; else break;
    }
    return n;
  }
  function bestStreak() {
    const today = todayDate();
    let best = 0, cur = 0;
    for (let d = earliestDay(), i = 0; d <= today && i < 2000; d = addDays(d, 1), i++) {
      const s = dayScore(d);
      if (!s.total) continue;
      if (s.done >= s.total) { cur++; best = Math.max(best, cur); } else if (keyOf(d) !== keyOf(today)) cur = 0;
    }
    return best;
  }
  function rate(days, id) {
    const today = todayDate();
    const first = earliestDay();
    let total = 0, done = 0;
    for (let i = 0; i < days; i++) {
      const d = addDays(today, -i);
      if (d < first) break;
      state.obligations.forEach((o) => {
        if (id && o.id !== id) return;
        if (!isDayType(o)) return;
        const inf = info(o, d);
        if (!inf.due) return;
        if (i === 0 && inf.done < inf.target) return; // today is not over yet
        total += inf.target;
        done += Math.min(inf.done, inf.target);
      });
    }
    return total ? Math.round((done / total) * 100) : null;
  }
  function obStreak(o) {
    const today = todayDate();
    let n = 0;
    for (let i = 0; i < 1000; i++) {
      const d = addDays(today, -i);
      if (keyOf(d) < o.createdAt) break;
      const inf = info(o, d);
      if (inf.kind === 'period') break;
      if (!inf.due) continue;
      if (inf.done >= inf.target) n++; else if (i > 0) break;
    }
    return n;
  }
  function totalSessions(id) {
    let n = 0;
    Object.keys(state.log).forEach((k) => { if (state.log[k][id]) n += state.log[k][id].length; });
    return n;
  }

  // ================= What to learn =================
  function srcInfo(o) {
    const s = o.task.src;
    if (!s) return null;
    const it = itemById(s.item);
    if (!it || it.kind !== s.kind) return { missing: true, s: s };
    if (s.kind === 'pdf') {
      const pages = it.pages || 0;
      const start = s.page;
      const end = pages ? Math.min(pages, start + s.per - 1) : start + s.per - 1;
      return { s: s, it: it, start: start, end: end, finished: pages > 0 && start > pages };
    }
    const n = it.tracks.length;
    return { s: s, it: it, n: n, finished: n > 0 && s.track >= n };
  }
  /** "עמודים 4–5" — the numbers are kept left-to-right, as ranges are usually written in Hebrew. */
  function rangeText(a, b, one, many) { return a === b ? one + ' ' + a : many + ' \u2066' + a + '–' + b + '\u2069'; }
  /** Track name without the series name in front ("הלכות שבת - שיעור 3" → "שיעור 3"). */
  function trackLabel(it, i) {
    const t = it.tracks[i];
    if (!t) return '';
    const n = t.name.indexOf(it.name) === 0 ? t.name.slice(it.name.length).replace(/^[\s\-_.:,·]+/, '') : t.name;
    return n || t.name;
  }
  /** Text describing the next session of o. */
  function assignment(o) {
    const si = srcInfo(o);
    if (!si) return o.task.text || freqText(o);
    if (si.missing) return 'הקובץ המקושר נמחק מהספרייה';
    if (si.s.kind === 'pdf') {
      if (si.finished) return 'סיימת את ' + si.it.name + '! 🎉';
      return rangeText(si.start, si.end, 'עמוד', 'עמודים') + ' · ' + si.it.name;
    }
    if (si.finished) return 'סיימת את כל השיעורים ב' + si.it.name + '! 🎉';
    const s = si.s;
    const tr = si.it.tracks[s.track];
    if (s.unit === 'minutes') return s.per + ' דק׳ · שיעור ' + (s.track + 1) + (s.time > 5 ? ' מ־' + fmtTime(s.time) : '') + ' · ' + si.it.name;
    if (s.per > 1) return rangeText(s.track + 1, Math.min(si.n, s.track + s.per), 'שיעור', 'שיעורים') + ' · ' + si.it.name;
    const lab = tr ? trackLabel(si.it, s.track) : '';
    return /^\D{0,8}\d+$/.test(lab) || !lab ? 'שיעור ' + (s.track + 1) + ' · ' + si.it.name : 'שיעור ' + (s.track + 1) + ': ' + lab;
  }
  function goLabel(o) {
    const si = srcInfo(o);
    if (!si || si.missing) return '';
    if (si.s.kind === 'pdf') return si.finished ? 'פתיחת הספר' : 'ללמוד עכשיו · עמוד ' + si.start;
    if (si.finished) return 'פתיחת השיעורים';
    return si.s.time > 5 ? 'להמשיך לשמוע · ' + fmtTime(si.s.time) : 'לשמוע עכשיו · שיעור ' + (si.s.track + 1);
  }
  function freqText(o) {
    const f = o.freq;
    const t = f.times > 1 ? (f.times === 2 ? 'פעמיים' : f.times + ' פעמים') + ' ' : '';
    if (f.type === 'daily') return f.times > 1 ? t + 'ביום' : 'כל יום';
    if (f.type === 'days') {
      if (f.days.length === 7) return f.times > 1 ? t + 'ביום' : 'כל יום';
      return (f.times > 1 ? t + 'ביום · ' : '') + 'ימים ' + f.days.map((x) => DAY_LETTERS[x]).join(' ');
    }
    if (f.type === 'interval') return (f.times > 1 ? t + 'ביום · ' : '') + (f.every === 2 ? 'פעם ביומיים' : 'פעם ב־' + f.every + ' ימים');
    const c = f.count === 1 ? 'פעם אחת' : f.count === 2 ? 'פעמיים' : f.count + ' פעמים';
    return c + ' ' + (f.type === 'weekly' ? 'בשבוע' : 'בחודש');
  }
  const snapshot = (o) => { const s = o.task.src; if (!s) return null; return s.kind === 'pdf' ? { page: s.page } : { track: s.track, time: Math.round(s.time) }; };
  const sameSnap = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  /** Text for a completed session (stored in the log). */
  function learnedText(o, opts) {
    const si = srcInfo(o);
    if (!si || si.missing) return o.task.text || '';
    if (si.s.kind === 'pdf') {
      const reached = opts && opts.page ? Math.max(si.end, opts.page) : si.end;
      return rangeText(si.start, Math.min(reached, si.it.pages || reached), 'עמוד', 'עמודים');
    }
    const s = si.s;
    if (s.unit === 'minutes') return s.per + ' דק׳ משיעור ' + (s.track + 1);
    const last = opts && opts.track != null ? Math.max(opts.track, s.track) : s.track + s.per - 1;
    return last > s.track ? rangeText(s.track + 1, Math.min(last, si.n - 1) + 1, 'שיעור', 'שיעורים') : 'שיעור ' + (s.track + 1);
  }
  /** Moves the book/series position forward after a session. opts may hold the actual page/position reached. */
  function advance(o, opts) {
    const si = srcInfo(o);
    if (!si || si.missing) return;
    const s = o.task.src;
    if (s.kind === 'pdf') {
      let last = si.end;
      if (opts && opts.page && opts.page > last) last = opts.page;
      s.page = si.it.pages ? Math.min(si.it.pages + 1, last + 1) : last + 1;
      return;
    }
    const tracks = si.it.tracks;
    if (s.unit === 'minutes') {
      if (opts && opts.track != null) { s.track = opts.track; s.time = opts.time || 0; }
      else s.time += s.per * 60;
      while (s.track < tracks.length && tracks[s.track].dur > 0 && s.time >= tracks[s.track].dur - 2) { s.time -= tracks[s.track].dur; s.track++; if (s.time < 0) s.time = 0; }
      if (s.track >= tracks.length) s.time = 0;
      return;
    }
    let next = s.track + s.per;
    if (opts && opts.track != null) next = Math.max(next, opts.track + 1);
    s.track = Math.min(tracks.length, next);
    s.time = 0;
  }
  function restore(o, snap) {
    const s = o.task.src;
    if (!s || !snap) return;
    if (s.kind === 'pdf' && snap.page) s.page = snap.page;
    if (s.kind === 'audio' && snap.track != null) { s.track = snap.track; s.time = snap.time || 0; }
  }

  /** Records one learning session of o on dateKey. Returns the log entry. */
  function complete(o, key, opts) {
    const before = snapshot(o);
    const w = learnedText(o, opts);
    advance(o, opts);
    const e = { t: Date.now(), w: w };
    if (before) { e.p = before; e.n = snapshot(o); }
    if (!state.log[key]) state.log[key] = {};
    if (!state.log[key][o.id]) state.log[key][o.id] = [];
    state.log[key][o.id].push(e);
    saveState();
    scheduleSoon();
    return e;
  }
  /** Removes the last session of o on dateKey (and moves the position back if nothing else moved it). */
  function uncomplete(o, key) {
    const arr = entries(key, o.id);
    if (!arr.length) return null;
    const e = arr.pop();
    if (!arr.length) { delete state.log[key][o.id]; if (!Object.keys(state.log[key]).length) delete state.log[key]; }
    if (e.p && sameSnap(snapshot(o), e.n)) restore(o, e.p);
    saveState();
    scheduleSoon();
    return e;
  }

  // ================= Views: shared bits =================
  function switchHtml(action, on, label, extra) {
    return '<label class="switch"><input type="checkbox" data-change="' + action + '"' + (extra || '') + (on ? ' checked' : '') + ' aria-label="' + esc(label) + '"><i></i></label>';
  }
  function stepper(action, value, min, max, label) {
    return '<span class="stepper" role="group" aria-label="' + esc(label) + '">' +
      '<button type="button" data-action="' + action + '" data-d="1"' + (value >= max ? ' disabled' : '') + ' aria-label="הוספה">' + svg('plus', 18) + '</button>' +
      '<output class="num">' + value + '</output>' +
      '<button type="button" data-action="' + action + '" data-d="-1"' + (value <= min ? ' disabled' : '') + ' aria-label="הפחתה">' + svg('minus', 18) + '</button></span>';
  }
  function greeting() {
    const h = new Date().getHours();
    if (h < 5) return 'לילה טוב';
    if (h < 12) return 'בוקר טוב';
    if (h < 17) return 'צהריים טובים';
    if (h < 21) return 'ערב טוב';
    return 'לילה טוב';
  }
  function nextReminder(o, d) {
    if (!o.reminders.on || !o.reminders.times.length) return null;
    const now = Date.now();
    for (let i = 0; i < o.reminders.times.length; i++) {
      const t = o.reminders.times[i];
      if (atTime(d, t).getTime() > now) return t;
    }
    return null;
  }

  // ================= Home =================
  function viewHome() {
    const today = todayDate();
    const d = ui.day || today;
    const isToday = keyOf(d) === keyOf(today);
    const back = diffDays(d, today);
    let h = '<header class="head"><div>';
    h += '<div class="greet">' + (isToday ? greeting() : back === 1 ? 'אתמול' : 'לפני ' + back + ' ימים') + '</div>';
    h += '<h1>' + esc(hebDate(d) || gregDate(d)) + '</h1>';
    h += '<div class="sub">יום ' + DAY_NAMES[d.getDay()] + ' · ' + esc(gregDate(d)) + '</div></div>';
    h += '<div class="daynav"><button type="button" class="icon-btn" data-action="day-prev" aria-label="היום הקודם">' + svg('chevR') + '</button>';
    h += '<button type="button" class="icon-btn" data-action="day-next" aria-label="היום הבא"' + (isToday ? ' disabled' : '') + '>' + svg('chevL') + '</button></div></header>';
    if (!isToday) h += '<button type="button" class="back-today" data-action="day-today">' + svg('undo', 16) + ' חזרה להיום</button>';
    if (!state.obligations.length) {
      return h + '<div class="card empty"><div class="art">' + svg('book', 40, 1.7) + '</div><h3>מה אתה לוקח על עצמך?</h3>' +
        '<p>בחר חובות לימוד מהרשימה או צור חובה משלך. לכל חובה אפשר לחבר ספר PDF או שיעורים לשמיעה, ולקבל תזכורת בשעה שתבחר.</p>' +
        '<button type="button" class="btn primary block" data-action="add-ob">' + svg('plus', 18) + ' בחירת חובות</button></div>';
    }
    const plan = dayPlan(d);
    const sc = dayScore(d);
    const pct = sc.total ? Math.round((sc.done / sc.total) * 100) : 0;
    const allDone = sc.total > 0 && sc.done >= sc.total;
    let msg;
    if (!sc.total) msg = 'אין חובות קבועות ליום הזה';
    else if (allDone) msg = isToday ? 'השלמת את כל החובות של היום' : 'כל החובות הושלמו';
    else if (!sc.done) msg = isToday ? 'עוד לא התחלת. בהצלחה!' : 'לא סומן כלום ביום הזה';
    else msg = 'עוד ' + (sc.total - sc.done) + ' להשלמה';
    const st = isToday ? streak() : 0;
    h += '<section class="card progress-card" aria-label="ההתקדמות היום">';
    h += '<div class="pc-top"><div><div class="pc-big num">' + sc.done + ' <small>מתוך ' + sc.total + '</small></div><div class="pc-label">' + (isToday ? 'החובות של היום' : 'החובות של היום הזה') + '</div></div>';
    h += '<div class="pc-pct num">' + pct + '%</div></div>';
    h += '<div class="bar' + (allDone ? ' done' : '') + '" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><i style="width:' + pct + '%"></i></div>';
    h += '<div class="pc-foot"><span>' + esc(msg) + '</span>' + (st > 0 ? '<span class="streak">' + svg('flame', 15) + ' ' + (st === 1 ? 'יום ראשון ברצף' : st + ' ימים ברצף') + '</span>' : '') + '</div>';
    h += '</section>';

    if (plan.due.length) {
      const order = plan.due.slice().sort((a, b) => (a.done >= a.target) - (b.done >= b.target));
      h += '<div class="section-title"><h2>' + (isToday ? 'החובות של היום' : 'החובות של יום ' + DAY_NAMES[d.getDay()]) + '</h2><span class="aside">' + plan.due.length + '</span></div>';
      h += '<div class="list">' + order.map((inf) => obCard(inf, d, isToday)).join('') + '</div>';
    }
    if (allDone && isToday) {
      h += '<div class="all-done">' + svg('sparkle', 26) + '<div><div class="serif">יישר כוח!</div><div>כל החובות של היום הושלמו.</div></div></div>';
    }
    if (plan.period.length) {
      h += '<div class="section-title"><h2>יעדים לשבוע ולחודש</h2></div>';
      h += '<div class="list">' + plan.period.map((inf) => obCard(inf, d, isToday)).join('') + '</div>';
    }
    if (plan.later.length) {
      h += '<button type="button" class="collapser" data-action="toggle-later" aria-expanded="' + ui.laterOpen + '"><span>לא ' + (isToday ? 'להיום' : 'ליום הזה') + ' (' + plan.later.length + ')</span>' + svg(ui.laterOpen ? 'chevUp' : 'chevDown', 18) + '</button>';
      if (ui.laterOpen) h += '<div class="later">' + plan.later.map((inf) => laterCard(inf, d)).join('') + '</div>';
    }
    h += '<button type="button" class="add-btn" data-action="add-ob">' + svg('plus', 18) + ' הוספת חובה</button>';
    return h;
  }

  function obCard(inf, d, isToday) {
    const o = inf.o;
    const isPeriod = inf.kind === 'period';
    const full = isPeriod ? inf.total >= inf.target && inf.done > 0 : inf.done >= inf.target;
    const part = !full && inf.done > 0;
    const es = entries(inf.key, o.id);
    let what = assignment(o);
    if (full && es.length) {
      const ws = es.map((e) => e.w).filter(Boolean);
      what = '✓ ' + (ws.length ? ws.join(' · ') : 'הושלם');
    }
    const tags = [];
    if (!isPeriod && inf.target > 1) {
      let dots = '';
      for (let i = 0; i < inf.target; i++) dots += '<i' + (i < inf.done ? ' class="on"' : '') + '></i>';
      tags.push('<span class="tag"><span class="dots">' + dots + '</span> ' + Math.min(inf.done, inf.target) + '/' + inf.target + '</span>');
    }
    if (isPeriod) tags.push('<span class="tag gold num">' + Math.min(inf.total, inf.target) + '/' + inf.target + ' ' + inf.period.label + '</span>');
    if (inf.late > 0) tags.push('<span class="tag warn">באיחור של ' + plural(inf.late, 'יום', 'ימים', 'יומיים') + '</span>');
    if (o.freq.type !== 'daily' && !isPeriod) tags.push('<span class="tag">' + esc(freqText(o)) + '</span>');
    if (isToday && !full) {
      const nr = nextReminder(o, d);
      if (nr) tags.push('<span class="tag">' + svg('bell', 12) + ' <span class="num">' + nr + '</span></span>');
    }
    if (o.paused) tags.push('<span class="tag">מושהה</span>');
    let checkInner = svg('check', 24, 2.6);
    if (part && (isPeriod || inf.target > 1)) checkInner = '<span class="cnt num">' + (isPeriod ? inf.total : inf.done) + '/' + inf.target + '</span>';
    const label = full ? 'ביטול הסימון של ' + o.name : 'סימון: למדתי ' + o.name;
    let h = '<article class="ob' + (full ? ' done' : '') + '" style="' + cvars(o.color) + '" data-ob="' + o.id + '">';
    h += '<button type="button" class="tap" data-action="ob-sheet" data-id="' + o.id + '" data-date="' + inf.key + '" aria-label="פרטים על ' + esc(o.name) + '"></button>';
    h += '<div class="ic">' + svg(o.icon, 24) + '</div>';
    h += '<div class="body"><div class="name">' + esc(o.name) + '</div><div class="what">' + esc(what) + '</div>' + (tags.length ? '<div class="meta">' + tags.join('') + '</div>' : '') + '</div>';
    h += '<button type="button" class="check' + (full ? ' full' : part ? ' part' : '') + '" data-action="ob-check" data-id="' + o.id + '" data-date="' + inf.key + '" aria-label="' + esc(label) + '" aria-pressed="' + full + '">' + checkInner + '</button>';
    const gl = goLabel(o);
    if (gl && !full) h += '<button type="button" class="go" data-action="ob-learn" data-id="' + o.id + '" data-date="' + inf.key + '">' + svg(o.task.src.kind === 'pdf' ? 'book' : 'headphones', 18) + ' ' + esc(gl) + '</button>';
    h += '</article>';
    return h;
  }

  function laterCard(inf, d) {
    const o = inf.o;
    let sub;
    if (o.paused) sub = 'מושהה';
    else if (inf.kind === 'period' && inf.met) sub = 'היעד ' + inf.period.label + ' הושלם ✓';
    else { const nd = nextDue(o, d); sub = nd ? 'הבא: ' + relDay(nd) : freqText(o); }
    return '<article class="ob" style="' + cvars(o.color) + '"><button type="button" class="tap" data-action="ob-sheet" data-id="' + o.id + '" data-date="' + keyOf(d) + '" aria-label="פרטים על ' + esc(o.name) + '"></button>' +
      '<div class="ic">' + svg(o.paused ? 'pauseO' : o.icon, 20) + '</div><div class="body"><div class="name">' + esc(o.name) + '</div><div class="what">' + esc(sub) + '</div></div><span class="muted">' + svg('chevL', 18) + '</span></article>';
  }

  // ================= Library =================
  function linkedObs(itemId) { return state.obligations.filter((o) => o.task.src && o.task.src.item === itemId); }
  function itemMeta(it) {
    if (it.kind === 'pdf') return (it.pages ? it.pages + ' עמודים · ' : '') + fmtSize(it.size);
    const total = it.tracks.reduce((a, t) => a + (t.size || 0), 0);
    const dur = it.tracks.reduce((a, t) => a + (t.dur || 0), 0);
    return plural(it.tracks.length, 'שיעור אחד', 'שיעורים') + (dur ? ' · ' + fmtTime(dur) : '') + ' · ' + fmtSize(total);
  }
  function bookCard(it) {
    const links = linkedObs(it.id);
    let prog = '';
    if (it.kind === 'pdf' && it.pages) {
      const p = clamp(it.lastPage, 1, it.pages);
      prog = '<div class="bar thin"><i style="width:' + Math.round((p / it.pages) * 100) + '%"></i></div>';
    } else if (it.kind === 'audio' && it.tracks.length) {
      prog = '<div class="bar thin"><i style="width:' + Math.round((it.lastTrack / it.tracks.length) * 100) + '%"></i></div>';
    }
    const where = it.kind === 'pdf' ? 'נקרא לאחרונה: עמוד ' + it.lastPage : 'הושמע לאחרונה: שיעור ' + (it.lastTrack + 1);
    return '<div class="book" style="' + cvars(it.color) + '">' +
      '<button type="button" class="cover' + (it.kind === 'audio' ? ' audio' : '') + '" data-action="lib-open" data-id="' + it.id + '" aria-label="פתיחת ' + esc(it.name) + '">' + svg(it.kind === 'pdf' ? 'book' : 'headphones', 24) + '</button>' +
      '<button type="button" style="text-align:start;min-width:0" data-action="lib-open" data-id="' + it.id + '"><b>' + esc(it.name) + '</b><small>' + esc(itemMeta(it)) + '</small>' +
      '<small>' + esc(where) + (links.length ? ' · ' + esc(links.map((o) => o.name).join(', ')) : '') + '</small>' + prog + '</button>' +
      '<button type="button" class="icon-btn plain" data-action="lib-menu" data-id="' + it.id + '" aria-label="אפשרויות">' + svg('more') + '</button></div>';
  }
  function viewLibrary() {
    const books = state.library.filter((i) => i.kind === 'pdf');
    const series = state.library.filter((i) => i.kind === 'audio');
    let h = '<header class="head"><div><div class="greet">כל הקבצים נשמרים בטלפון</div><h1>הספרייה</h1><div class="sub">' +
      (state.library.length ? plural(books.length, 'ספר אחד', 'ספרים') + ' · ' + plural(series.length, 'סדרת שיעורים אחת', 'סדרות שיעורים') : 'ספרים וקבצי שמע ללימוד') + '</div></div></header>';
    h += '<div class="lib-actions">' +
      '<button type="button" data-action="import-pdf"><span class="li" style="' + cvars(COLORS[1]) + ';background:var(--ct);color:var(--c)">' + svg('book', 22) + '</span><b>הוספת ספר</b><small>קובץ PDF מהטלפון</small></button>' +
      '<button type="button" data-action="import-audio"><span class="li" style="' + cvars(COLORS[0]) + ';background:var(--ct);color:var(--c)">' + svg('headphones', 22) + '</span><b>הוספת שיעורים</b><small>קובץ שמע אחד או סדרה שלמה</small></button></div>';
    if (!state.library.length) {
      h += '<div class="card empty" style="margin-top:14px"><div class="art">' + svg('library', 38, 1.7) + '</div><h3>הספרייה עוד ריקה</h3>' +
        '<p>הוסף ספר PDF או שיעורים מוקלטים, וחבר אותם לחובה. בלחיצה על "ללמוד עכשיו" במסך הבית, הספר ייפתח בדיוק בעמוד שצריך.</p></div>';
      return h;
    }
    if (books.length) h += '<div class="section-title"><h2>ספרים</h2><span class="aside">' + books.length + '</span></div><div class="list">' + books.map(bookCard).join('') + '</div>';
    if (series.length) h += '<div class="section-title"><h2>שיעורים לשמיעה</h2><span class="aside">' + series.length + '</span></div><div class="list">' + series.map(bookCard).join('') + '</div>';
    h += '<p class="storage" id="storage-line">&nbsp;</p>';
    return h;
  }
  function updateStorageLine() {
    const el = $('#storage-line');
    if (!el) return;
    const total = state.library.reduce((a, it) => a + (it.kind === 'pdf' ? it.size : it.tracks.reduce((b, t) => b + (t.size || 0), 0)), 0);
    el.textContent = 'הספרייה תופסת ' + fmtSize(total) + ' בטלפון';
  }

  // ================= Progress =================
  function viewProgress() {
    let h = '<header class="head"><div><div class="greet">כל יום מצטרף</div><h1>ההתקדמות שלי</h1><div class="sub">רצפים, אחוזים ומקום בספרים</div></div></header>';
    if (!state.obligations.length) {
      return h + '<div class="card empty"><div class="art">' + svg('target', 38, 1.7) + '</div><h3>עוד אין מה להראות</h3><p>אחרי שתוסיף חובות ותסמן אותן, כאן יופיעו הרצפים וההתקדמות.</p>' +
        '<button type="button" class="btn primary block" data-action="add-ob">' + svg('plus', 18) + ' הוספת חובה</button></div>';
    }
    const today = todayDate();
    const st = streak(), best = bestStreak(), r30 = rate(30);
    const ws = startOfWeek(today);
    let week = 0;
    for (let i = 0; i < 7; i++) { const k = keyOf(addDays(ws, i)); if (state.log[k]) Object.keys(state.log[k]).forEach((id) => { week += state.log[k][id].length; }); }
    h += '<div class="tiles">' +
      '<div class="tile"><div class="v num">' + st + ' <small>ימים</small></div><div class="k">רצף נוכחי</div></div>' +
      '<div class="tile"><div class="v num">' + best + ' <small>ימים</small></div><div class="k">הרצף הארוך ביותר</div></div>' +
      '<div class="tile"><div class="v num">' + week + '</div><div class="k">פעמי לימוד השבוע</div></div>' +
      '<div class="tile"><div class="v num">' + (r30 == null ? '–' : r30 + '%') + '</div><div class="k">השלמה ב־30 הימים האחרונים</div></div></div>';
    // calendar: last 5 weeks
    const start = addDays(ws, -28);
    const first = earliestDay();
    h += '<div class="section-title"><h2>חמשת השבועות האחרונים</h2><span class="aside">לחץ על יום כדי לראות ולסמן</span></div>';
    h += '<div class="card pad"><div class="heat" role="grid">' + DAY_LETTERS.map((l) => '<div class="dn">' + l + '</div>').join('');
    for (let i = 0; i < 35; i++) {
      const d = addDays(start, i);
      const k = keyOf(d);
      let cls = '';
      let lab = '';
      if (d > today) { cls = 'off'; lab = 'עוד לא הגיע'; }
      else if (d < first) { cls = 'off'; lab = 'לפני תחילת המעקב'; }
      else {
        const s = dayScore(d);
        if (!s.total) { cls = 'none'; lab = 'אין חובות'; }
        else {
          const p = s.done / s.total;
          cls = p >= 1 ? 'l3' : p >= 0.5 ? 'l2' : p > 0 ? 'l1' : '';
          lab = s.done + ' מתוך ' + s.total;
        }
      }
      if (k === keyOf(today)) cls += ' today';
      h += '<button type="button" class="' + cls + '" data-action="goto-day" data-date="' + k + '"' + (d > today || d < first ? ' disabled' : '') + ' aria-label="' + esc(gregDate(d, true) + ': ' + lab) + '"><span class="num">' + d.getDate() + '</span></button>';
    }
    h += '</div><div class="legend">פחות <i style="background:var(--surface-2);border:1px solid var(--line)"></i><i style="background:color-mix(in srgb,var(--ok) 22%,var(--surface))"></i><i style="background:color-mix(in srgb,var(--ok) 50%,var(--surface))"></i><i style="background:var(--ok)"></i> הכל</div></div>';
    // per obligation
    h += '<div class="section-title"><h2>לפי חובה</h2></div><div class="card">';
    h += state.obligations.map((o) => {
      const r = rate(30, o.id);
      const total = totalSessions(o.id);
      const ost = obStreak(o);
      let extra = '';
      const si = srcInfo(o);
      if (si && !si.missing && si.s.kind === 'pdf' && si.it.pages) {
        const done = clamp(si.s.page - 1, 0, si.it.pages);
        const p = Math.round((done / si.it.pages) * 100);
        extra += '<div class="bar thin" style="margin-top:10px"><i style="width:' + p + '%"></i></div><div class="s"><span>' + esc(si.it.name) + ': ' + done + ' מתוך ' + si.it.pages + ' עמודים (' + p + '%)</span>' + finishEstimate(o, si.it.pages - done, si.s.per) + '</div>';
      } else if (si && !si.missing && si.s.kind === 'audio' && si.n) {
        const done = clamp(si.s.track, 0, si.n);
        const p = Math.round((done / si.n) * 100);
        extra += '<div class="bar thin" style="margin-top:10px"><i style="width:' + p + '%"></i></div><div class="s"><span>' + esc(si.it.name) + ': ' + done + ' מתוך ' + si.n + ' שיעורים</span>' + (si.s.unit === 'tracks' ? finishEstimate(o, si.n - done, si.s.per) : '') + '</div>';
      }
      return '<div class="obstat" style="' + cvars(o.color) + '"><div class="h"><span class="ic">' + svg(o.icon, 18) + '</span><b>' + esc(o.name) + '</b><span class="pct num">' + (r == null ? '' : r + '%') + '</span></div>' +
        (r != null ? '<div class="bar thin"><i style="width:' + r + '%"></i></div>' : '') +
        '<div class="s"><span>' + esc(freqText(o)) + '</span><span>' + plural(total, 'פעם אחת', 'פעמים', 'פעמיים') + ' בסך הכול</span>' + (ost > 1 ? '<span>' + ost + ' ברצף</span>' : '') + '</div>' + extra + '</div>';
    }).join('');
    h += '</div>';
    return h;
  }
  /** "At this pace you'll finish on…" for book/series obligations. */
  function finishEstimate(o, remaining, per) {
    if (remaining <= 0) return '<span>סיימת! 🎉</span>';
    const f = o.freq;
    let perDay;
    if (f.type === 'daily') perDay = f.times;
    else if (f.type === 'days') perDay = (f.days.length * f.times) / 7;
    else if (f.type === 'interval') perDay = f.times / f.every;
    else if (f.type === 'weekly') perDay = f.count / 7;
    else perDay = f.count / 29.5;
    const days = Math.ceil(remaining / per / perDay);
    if (!isFinite(days) || days > 3650) return '';
    const end = addDays(todayDate(), days);
    return '<span>בקצב הזה תסיים ב' + esc(hebDate(end, true) || gregDate(end)) + '</span>';
  }

  // ================= Settings =================
  function viewSettings() {
    const s = state.settings;
    let h = '<header class="head"><div><div class="greet">הכל נשמר רק בטלפון שלך</div><h1>הגדרות</h1></div></header>';
    // obligations
    h += '<div class="group-title">החובות שלי</div><div class="group">';
    if (!state.obligations.length) h += '<div class="row"><div class="rl"><b>עוד אין חובות</b><small>אפשר לבחור מתוך רשימה או ליצור חובה משלך</small></div></div>';
    state.obligations.forEach((o, i) => {
      const rem = o.reminders.on && o.reminders.times.length ? ' · 🔔 ' + o.reminders.times.join(', ') : '';
      h += '<div class="row" style="' + cvars(o.color) + '">' +
        '<button type="button" class="row link" style="border:0;padding:0;min-height:0;flex:1" data-action="ob-edit" data-id="' + o.id + '">' +
        '<span class="ic" style="width:38px;height:38px;border-radius:11px;display:grid;place-items:center;background:var(--ct);color:var(--c);flex:none">' + svg(o.paused ? 'pauseO' : o.icon, 19) + '</span>' +
        '<span class="rl" style="flex:1"><b>' + esc(o.name) + '</b><small>' + esc(freqText(o) + rem) + (o.paused ? ' · מושהה' : '') + '</small></span></button>' +
        '<span class="ri"><button type="button" class="icon-btn plain" style="width:34px;height:34px" data-action="ob-move" data-id="' + o.id + '" data-d="-1"' + (i === 0 ? ' disabled' : '') + ' aria-label="הזזה למעלה">' + svg('chevUp', 18) + '</button>' +
        '<button type="button" class="icon-btn plain" style="width:34px;height:34px" data-action="ob-move" data-id="' + o.id + '" data-d="1"' + (i === state.obligations.length - 1 ? ' disabled' : '') + ' aria-label="הזזה למטה">' + svg('chevDown', 18) + '</button></span></div>';
    });
    h += '<button type="button" class="row link" data-action="add-ob"><span class="rl"><b style="color:var(--accent)">+ הוספת חובה</b></span></button></div>';
    // library
    const nb = state.library.filter((i) => i.kind === 'pdf').length, na = state.library.length - nb;
    h += '<div class="group-title">ספרים ושיעורים</div><div class="group">' +
      '<button type="button" class="row link" data-action="tab" data-tab="library"><span class="rl"><b>הספרייה</b><small>' + plural(nb, 'ספר אחד', 'ספרים') + ' · ' + plural(na, 'סדרת שיעורים אחת', 'סדרות שיעורים') + '</small></span><span class="ri">' + svg('chevL', 18) + '</span></button>' +
      '<button type="button" class="row link" data-action="import-pdf"><span class="rl"><b>הוספת ספר PDF</b></span><span class="ri">' + svg('book', 18) + '</span></button>' +
      '<button type="button" class="row link" data-action="import-audio"><span class="rl"><b>הוספת קבצי שמע</b></span><span class="ri">' + svg('headphones', 18) + '</span></button></div>';
    // reminders
    h += '<div class="group-title">תזכורות</div><div class="group">';
    if (isNative() && ui.perm && ui.perm !== 'granted') {
      h += '<div class="row"><div class="rl"><b style="color:var(--danger)">ההתראות כבויות</b><small>בלי הרשאה לא יגיעו תזכורות</small></div><button type="button" class="btn sm primary" data-action="perm-request">הפעלה</button></div>';
    }
    if (isNative() && ui.exact === 'denied') {
      h += '<div class="row"><div class="rl"><b>תזכורות בשעה מדויקת</b><small>בלי זה התזכורת עלולה להגיע באיחור</small></div><button type="button" class="btn sm" data-action="exact-request">אישור</button></div>';
    }
    h += '<div class="row"><div class="rl"><b>סיכום בסוף היום</b><small>תזכורת על מה שעוד לא הושלם</small></div>' + switchHtml('nightly-on', s.nightly.on, 'סיכום בסוף היום') + '</div>';
    h += '<div class="row"><div class="rl"><b>שעת הסיכום</b></div><input type="time" class="input" style="width:120px;text-align:center" data-change="nightly-time" value="' + s.nightly.time + '"' + (s.nightly.on ? '' : ' disabled') + ' aria-label="שעת הסיכום"></div>';
    h += '<div class="row"><div class="rl"><b>שקט בשבת ובחג</b><small>בלי תזכורות מלפני כניסת השבת ועד צאתה</small></div>' + switchHtml('quiet', s.shabbatQuiet, 'שקט בשבת ובחג') + '</div>';
    h += '<div class="row"><div class="rl"><b>עיר</b><small>לזמני כניסת שבת</small></div><select class="input" style="width:150px" data-change="city" aria-label="עיר"' + (s.shabbatQuiet ? '' : ' disabled') + '>' +
      CITIES.map((c) => '<option value="' + c.id + '"' + (c.id === s.city ? ' selected' : '') + '>' + esc(c.name) + '</option>').join('') + '</select></div>';
    h += '<button type="button" class="row link" data-action="test-notif"><span class="rl"><b>שליחת התראת בדיקה</b><small>' + (isNative() ? 'תגיע בעוד 5 שניות' : 'זמין באפליקציה המותקנת') + '</small></span><span class="ri">' + svg('bell', 18) + '</span></button>';
    h += '</div>';
    if (!isNative()) h += '<p class="note">התזכורות פועלות באפליקציה המותקנת בטלפון (APK). בגרסת הדפדפן אפשר לנסות את כל השאר.</p>';
    // general
    h += '<div class="group-title">תצוגה ושימוש</div><div class="group">';
    h += '<div class="field"><span class="lbl">ערכת צבעים</span><div class="seg">' +
      [['auto', 'לפי הטלפון'], ['light', 'בהירה'], ['dark', 'כהה']].map((t) => '<button type="button" data-action="theme" data-v="' + t[0] + '" aria-pressed="' + (s.theme === t[0]) + '">' + t[1] + '</button>').join('') + '</div></div>';
    h += '<div class="row"><div class="rl"><b>היום מתחלף בשעה</b><small>מי שלומד אחרי חצות יכול לסמן על היום הקודם</small></div><select class="input" style="width:110px" data-change="day-start" aria-label="שעת החלפת היום">' +
      [0, 1, 2, 3, 4].map((x) => '<option value="' + x + '"' + (x === s.dayStart ? ' selected' : '') + '>' + pad(x) + ':00</option>').join('') + '</select></div>';
    h += '<div class="row"><div class="rl"><b>רטט בסימון</b></div>' + switchHtml('haptics', s.haptics, 'רטט בסימון') + '</div>';
    h += '</div>';
    // backup
    h += '<div class="group-title">גיבוי</div><div class="group">' +
      '<button type="button" class="row link" data-action="backup"><span class="rl"><b>גיבוי לקובץ</b><small>החובות, הסימונים וההגדרות (בלי הספרים עצמם)</small></span><span class="ri">' + svg('download', 18) + '</span></button>' +
      '<button type="button" class="row link" data-action="restore"><span class="rl"><b>שחזור מגיבוי</b></span><span class="ri">' + svg('upload', 18) + '</span></button>' +
      '<button type="button" class="row link" data-action="reset"><span class="rl"><b style="color:var(--danger)">מחיקת כל הסימונים</b><small>החובות והספרים יישארו</small></span><span class="ri">' + svg('trash', 18) + '</span></button></div>';
    // sharing the app with friends (share-app.js)
    h += '<div class="group-title">שיתוף</div><div class="group">' +
      '<button type="button" class="row link" data-action="share-app"><span class="rl"><b>שיתוף האפליקציה</b><small>לשלוח לחברים קישור לאתר של חובותיי, או את האפליקציה עצמה כקובץ</small></span><span class="ri">' + svg('share', 18) + '</span></button></div>';
    h += '<p class="version">חובותיי · גרסה ' + APP_VERSION + '<br>עובדת בלי אינטרנט. שום מידע לא יוצא מהטלפון.<br>פותח על ידי <b>Itzko</b></p>';
    return h;
  }

  // ================= Bottom sheets =================
  function openSheet(s) { ui.sheet = s; renderSheet(true); }
  function renderSheet(animate) {
    const root = $('#sheet-root');
    if (!ui.sheet) { root.innerHTML = ''; return; }
    const html = sheetHtml(ui.sheet);
    if (html == null) { ui.sheet = null; root.innerHTML = ''; return; }
    const still = animate ? '' : ' style="animation:none"';
    root.innerHTML = '<div class="backdrop" data-action="sheet-close"' + still + '></div><div class="sheet" role="dialog" aria-modal="true"' + still + '><div class="grab"></div>' + html + '</div>';
    if (animate) { const f = root.querySelector('.sheet input:not([type=checkbox]), .sheet .menu button'); if (f && f.tagName === 'INPUT') setTimeout(() => { try { f.focus(); } catch (e) { /* ignore */ } }, 250); }
  }
  function closeSheet() {
    const root = $('#sheet-root');
    ui.sheet = null;
    const sh = root.querySelector('.sheet'), bd = root.querySelector('.backdrop');
    if (!sh) { root.innerHTML = ''; return; }
    sh.classList.add('closing'); if (bd) bd.classList.add('closing');
    setTimeout(() => { if (!ui.sheet) root.innerHTML = ''; }, 190);
  }
  function confirmSheet(o) { ui.confirm = o; openSheet({ type: 'confirm' }); }

  function sheetHtml(s) {
    if (s.type === 'ob') return sheetOb(s);
    if (s.type === 'templates') return sheetTemplates();
    if (s.type === 'pos') return sheetPos(s);
    if (s.type === 'lib') return sheetLib(s);
    if (s.type === 'rename') {
      const it = itemById(s.id);
      if (!it) return null;
      return '<h3>שינוי שם</h3><p class="lead">' + (it.kind === 'pdf' ? 'שם הספר' : 'שם סדרת השיעורים') + '</p>' +
        '<input class="input" id="rename-input" maxlength="80" value="' + esc(it.name) + '" data-enter="rename-save">' +
        '<div class="btn-row" style="margin-top:14px"><button type="button" class="btn primary" data-action="rename-save" data-id="' + it.id + '">שמירה</button><button type="button" class="btn" data-action="sheet-close">ביטול</button></div>';
    }
    if (s.type === 'jump') {
      const r = ui.reader;
      if (!r) return null;
      return '<h3>מעבר לעמוד</h3><p class="lead">בספר יש ' + (r.pages || '?') + ' עמודים</p>' +
        '<input class="input num" id="jump-input" type="number" inputmode="numeric" min="1" max="' + (r.pages || 9999) + '" value="' + r.page + '" data-enter="jump-go" style="text-align:center;font-size:22px;font-weight:800">' +
        (r.ob ? '<button type="button" class="btn block" style="margin-top:10px" data-action="jump-target">' + svg('bookmark', 18) + ' חזרה לעמוד של היום (' + r.start + ')</button>' : '') +
        '<div class="btn-row" style="margin-top:12px"><button type="button" class="btn primary" data-action="jump-go">מעבר</button><button type="button" class="btn" data-action="sheet-close">ביטול</button></div>';
    }
    if (s.type === 'confirm') {
      const c = ui.confirm || {};
      return '<h3>' + esc(c.title) + '</h3><p class="lead">' + esc(c.text) + '</p><div class="btn-row"><button type="button" class="btn ' + (c.danger ? 'danger' : 'primary') + '" data-action="confirm-ok">' + esc(c.ok || 'אישור') + '</button><button type="button" class="btn" data-action="sheet-close">ביטול</button></div>';
    }
    if (EXT.sheets[s.type]) return EXT.sheets[s.type](s);
    return null;
  }

  function sheetOb(s) {
    const o = obById(s.id);
    if (!o) return null;
    const d = parseKey(s.date);
    const inf = info(o, d);
    const es = entries(s.date, o.id);
    const isToday = s.date === keyOf(todayDate());
    const si = srcInfo(o);
    let h = '<div style="display:flex;gap:12px;align-items:center;margin-bottom:10px;' + cvars(o.color) + '"><span class="ic" style="width:48px;height:48px;border-radius:14px;display:grid;place-items:center;background:var(--ct);color:var(--c);flex:none">' + svg(o.icon, 24) + '</span>' +
      '<div style="min-width:0"><h3>' + esc(o.name) + '</h3><div class="lead" style="margin:0">' + esc(freqText(o)) + (o.paused ? ' · מושהה' : '') + '</div></div></div>';
    h += '<div class="session" style="background:var(--accent-soft)"><span><b>הבא בתור:</b> ' + esc(assignment(o)) + '</span></div>';
    if (si && o.task.text) h += '<p class="note" style="margin:8px 2px">' + esc(o.task.text) + '</p>';
    const dayLabel = isToday ? 'היום' : 'ביום ' + DAY_NAMES[d.getDay()] + ' ' + gregDate(d, true);
    if (es.length) {
      h += '<div class="group-title" style="margin-top:14px">מה למדת ' + esc(dayLabel) + '</div><div class="sessions">';
      es.forEach((e, i) => {
        const t = e.t ? hhmm(new Date(e.t)) : '';
        h += '<div class="session"><span>' + svg('check', 16) + ' ' + esc(e.w || 'הושלם') + (t ? ' <span class="muted num">· ' + t + '</span>' : '') + '</span>' +
          (i === es.length - 1 ? '<button type="button" class="btn sm ghost" data-action="ob-undo" data-id="' + o.id + '" data-date="' + s.date + '">' + svg('undo', 16) + ' ביטול</button>' : '') + '</div>';
      });
      h += '</div>';
    }
    h += '<div class="menu">';
    const full = inf.kind === 'period' ? inf.total >= inf.target : inf.done >= inf.target;
    const fut = s.date > keyOf(todayDate());
    if (!fut) {
      h += '<button type="button" data-action="ob-mark" data-id="' + o.id + '" data-date="' + s.date + '"><span class="mi" style="background:var(--ok-soft);color:var(--ok)">' + svg('check', 18) + '</span><span>' +
        (full || es.length ? 'סימון לימוד נוסף' : 'סימון: למדתי') + '<small>' + esc(dayLabel) + '</small></span></button>';
    }
    if (si && !si.missing) {
      h += '<button type="button" data-action="ob-learn" data-id="' + o.id + '" data-date="' + s.date + '"><span class="mi">' + svg(si.s.kind === 'pdf' ? 'book' : 'headphones', 18) + '</span><span>' + esc(goLabel(o)) + '<small>' + esc(si.it.name) + '</small></span></button>';
      h += '<button type="button" data-action="pos-sheet" data-id="' + o.id + '"><span class="mi">' + svg('bookmark', 18) + '</span><span>שינוי המקום ' + (si.s.kind === 'pdf' ? 'בספר' : 'בסדרה') + '<small>' +
        (si.s.kind === 'pdf' ? 'עכשיו: עמוד ' + si.s.page + ', ' + plural(si.s.per, 'עמוד אחד', 'עמודים') + ' בכל פעם' : 'עכשיו: שיעור ' + (si.s.track + 1)) + '</small></span></button>';
    }
    h += '<button type="button" data-action="ob-edit" data-id="' + o.id + '"><span class="mi">' + svg('edit', 18) + '</span><span>עריכת החובה<small>שם, תדירות, ספר ותזכורות</small></span></button>';
    h += '<button type="button" data-action="ob-pause" data-id="' + o.id + '"><span class="mi">' + svg(o.paused ? 'playO' : 'pauseO', 18) + '</span><span>' + (o.paused ? 'חידוש החובה' : 'השהיה זמנית') + '<small>' + (o.paused ? 'תחזור למסך הבית ולתזכורות' : 'בלי תזכורות ובלי לפגוע ברצף') + '</small></span></button>';
    h += '</div>';
    return h;
  }

  function sheetPos(s) {
    const o = obById(s.id);
    const si = o ? srcInfo(o) : null;
    if (!si || si.missing) return null;
    if (si.s.kind === 'pdf') {
      return '<h3>המקום בספר</h3><p class="lead">' + esc(si.it.name) + (si.it.pages ? ' · ' + si.it.pages + ' עמודים' : '') + '</p>' +
        '<div class="field" style="border:0"><label for="pos-page">הלימוד הבא מתחיל בעמוד</label><input class="input num" id="pos-page" type="number" inputmode="numeric" min="1" max="' + (si.it.pages || 9999) + '" value="' + si.s.page + '" style="text-align:center;font-size:20px;font-weight:800"></div>' +
        '<div class="btn-row"><button type="button" class="btn primary" data-action="pos-save" data-id="' + o.id + '">שמירה</button><button type="button" class="btn" data-action="sheet-close">ביטול</button></div>';
    }
    return '<h3>המקום בסדרה</h3><p class="lead">' + esc(si.it.name) + '</p>' +
      '<div class="field" style="border:0"><label for="pos-track">הלימוד הבא מתחיל בשיעור</label><select class="input" id="pos-track">' +
      si.it.tracks.map((t, i) => '<option value="' + i + '"' + (i === si.s.track ? ' selected' : '') + '>' + (i + 1) + '. ' + esc(t.name) + '</option>').join('') + '</select></div>' +
      '<div class="btn-row"><button type="button" class="btn primary" data-action="pos-save" data-id="' + o.id + '">שמירה</button><button type="button" class="btn" data-action="sheet-close">ביטול</button></div>';
  }

  function tplHtml(t, pressed, action) {
    const has = state.obligations.some((o) => o.name === t.name);
    return '<button type="button" class="tpl" style="' + cvars(COLORS[t.color]) + '" data-action="' + action + '" data-key="' + t.key + '"' + (pressed != null ? ' aria-pressed="' + pressed + '"' : '') + '>' +
      '<span class="ic">' + svg(t.icon, 22) + '</span><span><b>' + esc(t.name) + '</b><small>' + esc(t.desc) + (has && pressed == null ? ' · כבר קיימת' : '') + '</small></span>' +
      (pressed != null ? '<span class="mark">' + svg('check', 16, 3) + '</span>' : '<span class="plus">' + svg('plus', 20) + '</span>') + '</button>';
  }
  function sheetTemplates() {
    return '<h3>הוספת חובה</h3><p class="lead">בחר מהרשימה, ותוכל לשנות הכל לפני השמירה</p>' +
      '<div class="tpls"><button type="button" class="tpl" style="' + cvars('#1E5F74') + '" data-action="tpl-custom"><span class="ic">' + svg('pen', 22) + '</span><span><b>חובה חדשה משלי</b><small>שם, תדירות ומה לומדים, לבחירתך</small></span><span class="plus">' + svg('plus', 20) + '</span></button>' +
      TEMPLATES.map((t) => tplHtml(t, null, 'tpl-pick')).join('') + '</div>';
  }
  function sheetLib(s) {
    const it = itemById(s.id);
    if (!it) return null;
    const links = linkedObs(it.id);
    let h = '<h3>' + esc(it.name) + '</h3><p class="lead">' + esc(itemMeta(it)) + (links.length ? ' · מחובר ל: ' + esc(links.map((o) => o.name).join(', ')) : '') + '</p><div class="menu">';
    h += '<button type="button" data-action="lib-open" data-id="' + it.id + '"><span class="mi">' + svg(it.kind === 'pdf' ? 'book' : 'headphones', 18) + '</span><span>' + (it.kind === 'pdf' ? 'פתיחת הספר' : 'האזנה') + '</span></button>';
    h += '<button type="button" data-action="ob-from-item" data-id="' + it.id + '"><span class="mi">' + svg('plus', 18) + '</span><span>יצירת חובה מ' + (it.kind === 'pdf' ? 'הספר' : 'הסדרה') + '<small>למשל: ' + (it.kind === 'pdf' ? 'שני עמודים בכל יום' : 'שיעור אחד בכל יום') + '</small></span></button>';
    if (it.kind === 'audio') h += '<button type="button" data-action="lib-add-tracks" data-id="' + it.id + '"><span class="mi">' + svg('music', 18) + '</span><span>הוספת שיעורים לסדרה</span></button>';
    h += '<button type="button" data-action="rename" data-id="' + it.id + '"><span class="mi">' + svg('edit', 18) + '</span><span>שינוי שם</span></button>';
    h += '<button type="button" class="danger" data-action="lib-delete" data-id="' + it.id + '"><span class="mi">' + svg('trash', 18) + '</span><span>מחיקה מהטלפון<small>' + fmtSize(it.kind === 'pdf' ? it.size : it.tracks.reduce((a, t) => a + t.size, 0)) + ' יתפנו</small></span></button>';
    return h + '</div>';
  }

  // ================= Full-screen pages =================
  function openPage(type) {
    ui.page = type;
    document.body.classList.add('page-open');
    renderPage(true);
  }
  function renderPage(animate) {
    const root = $('#page-root');
    let html = '';
    if (ui.page === 'editor') html = pageEditor();
    else if (ui.page === 'onb') html = pageOnboarding();
    else return;
    const prev = root.querySelector('.page-body');
    const scroll = prev ? prev.scrollTop : 0;
    root.innerHTML = html;
    const pg = root.querySelector('.page');
    if (!animate && pg) pg.style.animation = 'none';
    const body = root.querySelector('.page-body');
    if (body && !animate) body.scrollTop = scroll;
  }
  function closePage() {
    const root = $('#page-root');
    const type = ui.page;
    if (type === 'reader') readerTeardown();
    if (type === 'player') playerTeardown();
    ui.page = null;
    ui.editor = null;
    document.body.classList.remove('page-open');
    const pg = root.querySelector('.page');
    if (pg) { pg.classList.add('closing'); setTimeout(() => { if (!ui.page) root.innerHTML = ''; }, 190); } else root.innerHTML = '';
    renderScreen();
  }

  // ---------- Editor ----------
  function newDraft(t) {
    const d = {
      id: uid(), name: t ? t.name : '', icon: t ? t.icon : 'book', color: COLORS[t ? t.color : 0], paused: false, createdAt: keyOf(todayDate()),
      freq: normFreq(t ? t.freq : null), task: { text: t ? t.text : '', src: null }, reminders: { on: true, times: t ? t.times.slice() : ['20:00'] }
    };
    return d;
  }
  function openEditor(draft, isNew) {
    const src = draft.task.src;
    ui.editor = { d: draft, isNew: isNew, srcKind: src ? src.kind : 'none' };
    openPage('editor');
  }
  function pageEditor() {
    const e = ui.editor;
    const d = e.d;
    const f = d.freq;
    let h = '<div class="page" style="' + cvars(d.color) + '"><div class="page-bar"><button type="button" class="icon-btn plain" data-action="page-close" aria-label="סגירה">' + svg('x') + '</button>' +
      '<div class="title"><b>' + (e.isNew ? 'חובה חדשה' : 'עריכת חובה') + '</b><small>' + esc(d.name || 'בלי שם') + '</small></div>' +
      '<button type="button" class="btn sm primary" data-action="ed-save">שמירה</button></div><div class="page-body">';
    // name + look
    h += '<div class="group"><div class="field"><label for="ed-name">שם החובה</label><input class="input" id="ed-name" maxlength="40" data-bind="name" placeholder="למשל: דף יומי" value="' + esc(d.name) + '"></div>';
    h += '<div class="field"><span class="lbl">סמל וצבע</span><div class="icons">' + OB_ICONS.map((ic) => '<button type="button" data-action="ed-icon" data-v="' + ic + '" aria-pressed="' + (d.icon === ic) + '" aria-label="' + ic + '">' + svg(ic, 22) + '</button>').join('') + '</div>' +
      '<div class="colors">' + COLORS.map((c) => '<button type="button" style="' + cvars(c) + '" data-action="ed-color" data-v="' + c + '" aria-pressed="' + (d.color === c) + '" aria-label="צבע"></button>').join('') + '</div></div></div>';
    // frequency
    h += '<div class="group-title">כל כמה זמן</div><div class="group"><div class="field"><div class="seg">' +
      FREQ_TYPES.map((t) => '<button type="button" data-action="ed-freq" data-v="' + t + '" aria-pressed="' + (f.type === t) + '">' + FREQ_LABEL[t] + '</button>').join('') + '</div></div>';
    if (f.type === 'days') {
      h += '<div class="field"><span class="lbl">באילו ימים</span><div class="days">' + DAY_LETTERS.map((l, i) => '<button type="button" data-action="ed-day" data-v="' + i + '" aria-pressed="' + (f.days.indexOf(i) >= 0) + '" aria-label="יום ' + DAY_NAMES[i] + '">' + l + '</button>').join('') + '</div></div>';
    }
    if (f.type === 'interval') h += '<div class="field"><div class="step-line"><span>פעם בכל כמה ימים</span>' + stepper('ed-every', f.every, 2, 60, 'מספר ימים') + '</div><div class="hint">' + esc(freqText(d)) + '. אם פספסת, החובה מחכה לך עד שתשלים.</div></div>';
    if (f.type === 'weekly' || f.type === 'monthly') {
      h += '<div class="field"><div class="step-line"><span>כמה פעמים ' + (f.type === 'weekly' ? 'בשבוע' : 'בחודש') + '</span>' + stepper('ed-count', f.count, 1, f.type === 'weekly' ? 7 : 30, 'מספר פעמים') + '</div>' +
        '<div class="hint">' + (f.type === 'weekly' ? 'בכל יום שנוח לך. השבוע מתחיל ביום ראשון.' : 'לפי החודש העברי.') + '</div></div>';
    } else {
      h += '<div class="field"><div class="step-line"><span>כמה פעמים ביום</span>' + stepper('ed-times', f.times, 1, 10, 'פעמים ביום') + '</div></div>';
    }
    h += '</div>';
    // what to learn
    h += '<div class="group-title">מה לומדים</div><div class="group"><div class="field"><label for="ed-text">תיאור קצר</label><input class="input" id="ed-text" maxlength="120" data-bind="task.text" placeholder="למשל: שתי משניות" value="' + esc(d.task.text) + '"></div>';
    h += '<div class="field"><span class="lbl">לחבר קובץ מהספרייה?</span><div class="seg">' +
      [['none', 'בלי קובץ'], ['pdf', 'ספר PDF'], ['audio', 'קובץ שמע']].map((x) => '<button type="button" data-action="ed-src" data-v="' + x[0] + '" aria-pressed="' + (e.srcKind === x[0]) + '">' + x[1] + '</button>').join('') + '</div>';
    if (e.srcKind === 'none') h += '<div class="hint">כשמחברים ספר, "ללמוד עכשיו" פותח אותו בדיוק בעמוד שצריך, והמקום מתקדם לבד.</div>';
    h += '</div>';
    if (e.srcKind !== 'none') {
      const items = state.library.filter((i) => i.kind === e.srcKind);
      const src = d.task.src && d.task.src.kind === e.srcKind ? d.task.src : null;
      h += '<div class="field"><span class="lbl">' + (e.srcKind === 'pdf' ? 'איזה ספר' : 'איזו סדרת שיעורים') + '</span><div class="pick">';
      items.forEach((it) => {
        h += '<button type="button" data-action="ed-item" data-id="' + it.id + '" aria-pressed="' + (!!src && src.item === it.id) + '"><span class="pi">' + svg(it.kind === 'pdf' ? 'book' : 'headphones', 20) + '</span><span style="min-width:0"><b>' + esc(it.name) + '</b><small>' + esc(itemMeta(it)) + '</small></span></button>';
      });
      h += '<button type="button" data-action="' + (e.srcKind === 'pdf' ? 'import-pdf' : 'import-audio') + '"><span class="pi" style="color:var(--accent)">' + svg('plus', 20) + '</span><span><b style="color:var(--accent)">' + (e.srcKind === 'pdf' ? 'הוספת ספר PDF מהטלפון' : 'הוספת קבצי שמע מהטלפון') + '</b><small>' + (e.srcKind === 'pdf' ? 'הקובץ יישמר באפליקציה ויעבוד בלי אינטרנט' : 'אפשר לבחור כמה קבצים יחד, הם יסודרו לפי השם') + '</small></span></button></div></div>';
      if (src) {
        const it = itemById(src.item);
        if (src.kind === 'pdf') {
          h += '<div class="field"><div class="step-line"><span>מתחילים מעמוד</span><input class="input short num" type="number" inputmode="numeric" min="1" max="' + ((it && it.pages) || 9999) + '" data-bind="task.src.page" data-num="1" value="' + src.page + '" aria-label="עמוד התחלה"></div>' +
            '<div class="step-line"><span>עמודים בכל פעם</span>' + stepper('ed-per', src.per, 1, 100, 'עמודים בכל פעם') + '</div><div class="hint">אחרי כל סימון, ההמשך מתחיל מהעמוד הבא. מספרי העמודים לפי הקובץ' + (it && it.pages ? ' (1 עד ' + it.pages + ')' : '') + '.</div></div>';
        } else {
          h += '<div class="field"><span class="lbl">בכל פעם</span><div class="seg">' +
            [['tracks', 'שיעורים שלמים'], ['minutes', 'מספר דקות']].map((x) => '<button type="button" data-action="ed-unit" data-v="' + x[0] + '" aria-pressed="' + (src.unit === x[0]) + '">' + x[1] + '</button>').join('') + '</div>' +
            '<div class="step-line" style="margin-top:8px"><span>' + (src.unit === 'minutes' ? 'דקות בכל פעם' : 'שיעורים בכל פעם') + '</span>' + stepper('ed-per', src.per, src.unit === 'minutes' ? 5 : 1, src.unit === 'minutes' ? 240 : 10, 'כמות') + '</div>';
          if (it && it.tracks.length) {
            h += '<div class="step-line"><span>מתחילים משיעור</span><select class="input" style="width:170px" data-bind="task.src.track" data-num="1" aria-label="שיעור התחלה">' +
              it.tracks.map((t, i) => '<option value="' + i + '"' + (i === src.track ? ' selected' : '') + '>' + (i + 1) + '. ' + esc(t.name.slice(0, 26)) + '</option>').join('') + '</select></div>';
          }
          h += '</div>';
        }
      }
    }
    h += '</div>';
    // reminders
    const r = d.reminders;
    h += '<div class="group-title">תזכורות</div><div class="group"><div class="row"><div class="rl"><b>תזכורת לחובה הזאת</b><small>נשלחת רק אם עוד לא סימנת</small></div>' + switchHtml('ed-rem-on', r.on, 'תזכורת') + '</div>';
    if (r.on) {
      h += '<div class="field"><div class="times">';
      r.times.forEach((t, i) => {
        h += '<div class="time-row"><input type="time" class="input num" value="' + t + '" data-change="ed-time" data-i="' + i + '" aria-label="שעת תזכורת ' + (i + 1) + '">' +
          '<button type="button" class="icon-btn" data-action="ed-time-del" data-i="' + i + '" aria-label="מחיקת השעה">' + svg('trash', 18) + '</button></div>';
      });
      h += '</div>' + (r.times.length < MAX_TIMES ? '<button type="button" class="btn sm ghost" style="margin-top:8px;padding:0 4px" data-action="ed-time-add">' + svg('plus', 16) + ' הוספת שעה</button>' : '') + '</div>';
    }
    h += '</div>';
    if (!e.isNew) {
      h += '<div class="btn-row" style="margin-top:6px"><button type="button" class="btn" data-action="ed-pause">' + svg(d.paused ? 'playO' : 'pauseO', 18) + ' ' + (d.paused ? 'חידוש' : 'השהיה') + '</button>' +
        '<button type="button" class="btn danger" data-action="ed-delete">' + svg('trash', 18) + ' מחיקה</button></div>';
    }
    h += '</div><div class="page-foot"><div class="inner"><button type="button" class="btn primary block" data-action="ed-save">' + svg('check', 20) + ' ' + (e.isNew ? 'הוספת החובה' : 'שמירת השינויים') + '</button></div></div></div>';
    return h;
  }
  function setPath(obj, path, v) {
    const ks = path.split('.');
    let o = obj;
    for (let i = 0; i < ks.length - 1; i++) { if (!isObj(o[ks[i]])) return; o = o[ks[i]]; }
    o[ks[ks.length - 1]] = v;
  }
  function edSetSrcItem(it) {
    const e = ui.editor;
    if (!e) return;
    const old = e.d.task.src;
    if (it.kind === 'pdf') e.d.task.src = { kind: 'pdf', item: it.id, page: old && old.item === it.id ? old.page : 1, per: old && old.kind === 'pdf' ? old.per : 1 };
    else e.d.task.src = { kind: 'audio', item: it.id, track: old && old.item === it.id ? old.track : 0, time: 0, unit: old && old.kind === 'audio' ? old.unit : 'tracks', per: old && old.kind === 'audio' ? old.per : 1 };
    e.srcKind = it.kind;
  }
  function saveEditor() {
    const e = ui.editor;
    if (!e) return;
    const d = e.d;
    d.name = cleanText(d.name, 40);
    if (!d.name) { toast({ title: 'צריך לתת שם לחובה', icon: 'alert', tone: 'muted' }); const n = $('#ed-name'); if (n) n.focus(); return; }
    if (e.srcKind === 'none') d.task.src = null;
    else if (!d.task.src || d.task.src.kind !== e.srcKind) {
      toast({ title: e.srcKind === 'pdf' ? 'בחר ספר מהרשימה' : 'בחר סדרת שיעורים', sub: 'או סמן "בלי קובץ"', icon: 'alert', tone: 'muted' });
      return;
    }
    if (d.task.src && d.task.src.kind === 'pdf') {
      const it = itemById(d.task.src.item);
      if (it && it.pages) d.task.src.page = clamp(d.task.src.page, 1, it.pages);
    }
    const clean = normOb(d);
    const idx = state.obligations.findIndex((o) => o.id === clean.id);
    if (idx >= 0) state.obligations[idx] = clean; else state.obligations.push(clean);
    saveState();
    scheduleSoon();
    const isNew = e.isNew;
    closePage();
    if (isNew) ensurePermission();
    toast({ title: isNew ? 'החובה נוספה' : 'השינויים נשמרו', sub: clean.name + ' · ' + freqText(clean), icon: 'check' });
  }

  // ---------- Onboarding ----------
  function pageOnboarding() {
    const st = ui.onb;
    let h = '<div class="page onb"><div class="page-body">';
    if (st.step === 1) {
      h += '<div class="onb-hero"><div class="logo"><img src="icon.png" alt=""></div><h1>חובותיי</h1><p>קבע לעצמך חוק לימוד, סמן כל יום מה למדת, וקבל תזכורת כשצריך.</p><div class="steps"><i class="on"></i><i></i></div></div>';
      h += '<div class="group-title">מה תרצה לקחת על עצמך?</div><div class="tpls">' + TEMPLATES.map((t) => tplHtml(t, st.picked.indexOf(t.key) >= 0, 'onb-pick')).join('') + '</div>';
      h += '<p class="note">אפשר לשנות, למחוק ולהוסיף חובות בכל זמן. ספרי PDF ושיעורים לשמיעה מחברים בעריכת החובה.</p>';
      h += '</div><div class="page-foot"><div class="inner"><button type="button" class="btn primary block" data-action="onb-next">' +
        (st.picked.length ? 'המשך עם ' + plural(st.picked.length, 'חובה אחת', 'חובות', 'שתי חובות') : 'אבחר אחר כך, המשך') + '</button></div></div></div>';
      return h;
    }
    const s = state.settings;
    h += '<div class="onb-hero"><div class="logo"><img src="icon.png" alt=""></div><h1>תזכורת בסוף היום</h1><p>בשעה שתבחר תקבל סיכום של מה שעוד לא הושלם. אם הכל הושלם, לא תקבל כלום.</p><div class="steps"><i class="on"></i><i class="on"></i></div></div>';
    h += '<div class="group"><div class="row"><div class="rl"><b>סיכום בסוף היום</b></div>' + switchHtml('nightly-on', s.nightly.on, 'סיכום בסוף היום') + '</div>' +
      '<div class="row"><div class="rl"><b>באיזו שעה</b></div><input type="time" class="input" style="width:120px;text-align:center" data-change="nightly-time" value="' + s.nightly.time + '" aria-label="שעת הסיכום"></div>' +
      '<div class="row"><div class="rl"><b>שקט בשבת ובחג</b><small>לפי זמני העיר</small></div><select class="input" style="width:150px" data-change="city" aria-label="עיר">' +
      CITIES.map((c) => '<option value="' + c.id + '"' + (c.id === s.city ? ' selected' : '') + '>' + esc(c.name) + '</option>').join('') + '</select></div></div>';
    h += '<p class="note">לכל חובה יש גם תזכורות משלה, בשעות שתבחר בעריכת החובה. התזכורות מגיעות גם כשהאפליקציה סגורה ובלי אינטרנט.</p>';
    h += '</div><div class="page-foot"><div class="inner"><div class="btn-row"><button type="button" class="btn" style="flex:0 0 auto" data-action="onb-back">' + svg('chevR', 18) + ' חזרה</button><button type="button" class="btn primary" data-action="onb-finish">בואו נתחיל</button></div></div></div></div>';
    return h;
  }
  async function finishOnboarding() {
    const picked = ui.onb ? ui.onb.picked : [];
    TEMPLATES.filter((t) => picked.indexOf(t.key) >= 0).forEach((t) => { state.obligations.push(normOb(newDraft(t))); });
    state.settings.onboarded = true;
    ui.onb = null;
    saveState();
    closePage();
    if (isNative()) await requestPermission();
    scheduleSoon();
    toast({ title: picked.length ? 'מתחילים!' : 'ברוך הבא!', sub: picked.length ? 'לחץ על העיגול כדי לסמן שלמדת' : 'לחץ על "בחירת חובות" כדי להתחיל', icon: 'sparkle' });
  }

  // ================= PDF reader =================
  let pdfjsPromise = null;
  function loadPdfjs() {
    if (!pdfjsPromise) {
      pdfjsPromise = import('./lib/pdfjs/pdf.min.mjs').then((lib) => {
        lib.GlobalWorkerOptions.workerSrc = new URL('lib/pdfjs/pdf.worker.min.mjs', location.href).href;
        return lib;
      });
      pdfjsPromise.catch(() => { pdfjsPromise = null; });
    }
    return pdfjsPromise;
  }
  /** Opens a stored PDF. Big files are read in ranges straight from storage, so a 500-page scan opens fast. */
  async function openPdf(fileId) {
    const blob = await fileGet(fileId);
    if (!blob) { const e = new Error('missing'); e.code = 'missing'; throw e; }
    const lib = await loadPdfjs();
    const base = new URL('lib/pdfjs/', location.href).href;
    const opts = {
      wasmUrl: base + 'wasm/', standardFontDataUrl: base + 'standard_fonts/', cMapUrl: base + 'cmaps/', cMapPacked: true, iccUrl: base + 'iccs/',
      isEvalSupported: false, enableXfa: false, verbosity: 0
    };
    const CH = 1 << 18;
    if (blob.size > 12 * 1024 * 1024) {
      const first = new Uint8Array(await blob.slice(0, CH).arrayBuffer());
      const tr = new lib.PDFDataRangeTransport(blob.size, first);
      tr.requestDataRange = function (begin, end) {
        blob.slice(begin, end).arrayBuffer().then((buf) => { this.onDataRange(begin, new Uint8Array(buf)); }, (err) => console.warn('range', err));
      };
      Object.assign(opts, { range: tr, length: blob.size, rangeChunkSize: CH, disableAutoFetch: true, disableStream: true });
    } else {
      opts.data = new Uint8Array(await blob.arrayBuffer());
    }
    return lib.getDocument(opts);
  }

  async function openReader(itemId, obId, dateKey) {
    const it = itemById(itemId);
    if (!it) return;
    if (ui.sheet) closeSheet();
    const o = obId ? obById(obId) : null;
    let page = it.lastPage || 1, start = 0, end = 0;
    const si = o ? srcInfo(o) : null;
    const linked = !!(si && !si.missing && si.s.kind === 'pdf' && si.it.id === it.id);
    if (linked) { start = si.start; end = si.end; page = si.finished ? (it.pages || 1) : si.start; }
    ui.reader = { it: it, ob: linked ? o : null, dateKey: dateKey || keyOf(todayDate()), page: page, pages: it.pages || 0, start: start, end: end, zoom: 1, seq: 0, doc: null, task: null, renderTask: null };
    ui.page = 'reader';
    document.body.classList.add('page-open');
    $('#page-root').innerHTML = readerHtml();
    bindReaderGestures();
    rdChrome();
    const r = ui.reader;
    try {
      r.task = await openPdf(it.file);
      const doc = await r.task.promise;
      if (ui.reader !== r) { r.task.destroy(); return; }
      r.doc = doc;
      r.pages = doc.numPages;
      if (it.pages !== doc.numPages) { it.pages = doc.numPages; saveSoon(); }
      r.page = clamp(r.page, 1, doc.numPages);
      if (r.ob) r.end = Math.min(r.end, doc.numPages);
      rdChrome();
      await rdRender(true);
    } catch (err) {
      if (ui.reader !== r) return;
      const st = $('#rd-state');
      if (!st) return;
      st.hidden = false;
      if (err && err.code === 'missing') {
        st.innerHTML = '<div>' + svg('alert', 34) + '<p><b>הקובץ לא נמצא בטלפון</b><br>אולי שוחזר גיבוי במכשיר אחר. אפשר לבחור את קובץ ה־PDF מחדש.</p><button type="button" class="btn primary" data-action="rd-relink">בחירת הקובץ</button></div>';
      } else {
        console.warn('pdf', err);
        st.innerHTML = '<div>' + svg('alert', 34) + '<p><b>לא הצלחתי לפתוח את הקובץ</b><br>ייתכן שהוא פגום או מוגן בסיסמה.</p></div>';
      }
    }
  }
  function readerHtml() {
    const r = ui.reader;
    const night = state.settings.readerNight;
    return '<div class="page reader' + (night ? ' night' : '') + '" id="reader" style="' + cvars(r.it.color) + '">' +
      '<div class="page-bar"><button type="button" class="icon-btn plain" data-action="page-close" aria-label="סגירה">' + svg('x') + '</button>' +
      '<div class="title"><b>' + esc(r.it.name) + '</b><small id="rd-sub">פותח…</small></div>' +
      '<button type="button" class="icon-btn plain" data-action="rd-night" aria-pressed="' + night + '" aria-label="מצב לילה">' + svg(night ? 'sun' : 'moon') + '</button></div>' +
      (r.ob ? '<div class="rd-target" id="rd-target"></div>' : '') +
      '<div class="rd-view" id="rd-view"><div class="rd-canvas-wrap" id="rd-wrap"></div><div class="rd-state" id="rd-state"><div><div class="spinner"></div>פותח את הספר…</div></div></div>' +
      '<div class="rd-foot"><div class="rd-tools"><button type="button" class="icon-btn" data-action="rd-zoom" data-d="-1" aria-label="הקטנה">' + svg('zoomOut', 19) + '</button>' +
      '<span class="zoom-label num" id="rd-zoom">100%</span><button type="button" class="icon-btn" data-action="rd-zoom" data-d="1" aria-label="הגדלה">' + svg('zoomIn', 19) + '</button></div>' +
      '<div class="rd-ctrl"><button type="button" class="icon-btn" data-action="rd-prev" id="rd-prev" aria-label="העמוד הקודם">' + svg('chevR', 22) + '</button>' +
      '<button type="button" class="rd-pg" data-action="rd-jump" id="rd-pg" aria-label="מעבר לעמוד">…</button>' +
      '<button type="button" class="icon-btn" data-action="rd-next" id="rd-next" aria-label="העמוד הבא">' + svg('chevL', 22) + '</button>' +
      (r.ob ? '<button type="button" class="rd-done" data-action="rd-done">' + svg('check', 18, 3) + ' סיימתי</button>' : '') + '</div></div></div>';
  }
  function rdChrome() {
    const r = ui.reader;
    if (!r) return;
    const n = r.pages;
    const sub = $('#rd-sub');
    if (sub) sub.textContent = n ? 'עמוד ' + r.page + ' מתוך ' + n : 'פותח…';
    const pg = $('#rd-pg');
    if (pg) pg.innerHTML = '<span class="num">' + r.page + '</span><small>' + (n ? 'מתוך ' + n : '') + '</small>';
    const prev = $('#rd-prev'), next = $('#rd-next');
    if (prev) prev.disabled = r.page <= 1;
    if (next) next.disabled = !!n && r.page >= n;
    const z = $('#rd-zoom');
    if (z) z.textContent = Math.round(r.zoom * 100) + '%';
    const t = $('#rd-target');
    if (t && r.ob) {
      const range = rangeText(r.start, r.end, 'עמוד', 'עמודים');
      if (r.page > r.end) { t.className = 'rd-target ok'; t.innerHTML = svg('check', 16) + ' קראת את ' + range + '. לחץ "סיימתי" לסימון'; }
      else if (r.page >= r.start) { t.className = 'rd-target'; t.innerHTML = svg('bookmark', 16) + ' הלימוד של היום: ' + range + (r.end > r.start ? ' · ' + (r.page - r.start + 1) + ' מתוך ' + (r.end - r.start + 1) : ''); }
      else { t.className = 'rd-target'; t.innerHTML = svg('bookmark', 16) + ' הלימוד של היום מתחיל בעמוד ' + r.start; }
    }
    if (r.it.lastPage !== r.page && r.doc) { r.it.lastPage = r.page; saveSoon(); }
  }
  function rdGo(n) {
    const r = ui.reader;
    if (!r || !r.doc) return;
    n = clamp(n, 1, r.pages || 1);
    if (n === r.page) return;
    r.page = n;
    rdChrome();
    rdRender(true);
    haptic();
  }
  function rdSetZoom(z, anchor) {
    const r = ui.reader;
    if (!r) return;
    const nz = clamp(Math.round(z * 100) / 100, 1, 4);
    if (nz === r.zoom) return;
    const v = $('#rd-view');
    const ratio = nz / r.zoom;
    const ax = anchor ? anchor.x : (v ? v.clientWidth / 2 : 0), ay = anchor ? anchor.y : 0;
    const sx = v ? v.scrollLeft : 0, sy = v ? v.scrollTop : 0;
    r.zoom = nz;
    rdChrome();
    rdRender(false).then(() => {
      const v2 = $('#rd-view');
      if (!v2) return;
      v2.scrollLeft = (sx + ax) * ratio - ax;
      v2.scrollTop = (sy + ay) * ratio - ay;
    });
  }
  function rdZoomStep(dir) {
    const r = ui.reader;
    if (!r) return;
    let i = 0;
    for (let k = 0; k < ZOOMS.length; k++) if (ZOOMS[k] <= r.zoom + 0.01) i = k;
    const target = dir > 0 ? ZOOMS[Math.min(ZOOMS.length - 1, ZOOMS[i] < r.zoom - 0.01 ? i : i + 1)] : ZOOMS[Math.max(0, ZOOMS[i] < r.zoom - 0.01 ? i : i - 1)];
    rdSetZoom(target);
  }
  async function rdRender(resetScroll) {
    const r = ui.reader;
    if (!r || !r.doc) return;
    const seq = ++r.seq;
    if (r.renderTask) { try { r.renderTask.cancel(); } catch (e) { /* ignore */ } r.renderTask = null; }
    const slow = setTimeout(() => { if (ui.reader === r && r.seq === seq) { const st = $('#rd-state'); if (st) { st.hidden = false; st.innerHTML = '<div><div class="spinner"></div></div>'; } } }, 350);
    let page;
    try { page = await r.doc.getPage(r.page); } catch (e) { clearTimeout(slow); return; }
    if (seq !== r.seq || ui.reader !== r) { clearTimeout(slow); return; }
    const view = $('#rd-view'), wrap = $('#rd-wrap');
    if (!view || !wrap) { clearTimeout(slow); return; }
    const avail = Math.max(200, view.clientWidth - 20);
    const base = page.getViewport({ scale: 1 });
    const css = (avail / base.width) * r.zoom;
    let dpr = Math.min(window.devicePixelRatio || 1, 3);
    const px = base.width * css * dpr * base.height * css * dpr;
    const MAX = 16e6;
    if (px > MAX) dpr *= Math.sqrt(MAX / px);
    const vp = page.getViewport({ scale: css * dpr });
    const cv = document.createElement('canvas');
    cv.width = Math.floor(vp.width);
    cv.height = Math.floor(vp.height);
    cv.style.width = Math.floor(base.width * css) + 'px';
    cv.style.height = Math.floor(base.height * css) + 'px';
    cv.setAttribute('role', 'img');
    cv.setAttribute('aria-label', 'עמוד ' + r.page);
    const task = page.render({ canvasContext: cv.getContext('2d'), viewport: vp });
    r.renderTask = task;
    try { await task.promise; } catch (e) {
      clearTimeout(slow);
      if (e && e.name === 'RenderingCancelledException') return;
      console.warn('render', e);
      return;
    }
    clearTimeout(slow);
    if (seq !== r.seq || ui.reader !== r) return;
    r.renderTask = null;
    wrap.replaceChildren(cv);
    const st = $('#rd-state');
    if (st) st.hidden = true;
    if (resetScroll) { view.scrollTop = 0; view.scrollLeft = view.scrollWidth; }
    // warm up the next page
    if (r.page < r.pages) r.doc.getPage(r.page + 1).catch(() => {});
  }
  function bindReaderGestures() {
    const v = $('#rd-view');
    if (!v) return;
    let sx = null, sy = 0, st = 0, lastTap = 0, pinch = null;
    const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    v.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        const rect = v.getBoundingClientRect();
        pinch = { d0: dist(e.touches), ratio: 1, x: (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left, y: (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top };
        sx = null;
        return;
      }
      if (e.touches.length !== 1) { sx = null; return; }
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = Date.now();
    }, { passive: true });
    v.addEventListener('touchmove', (e) => {
      if (!pinch || e.touches.length !== 2) return;
      const r = ui.reader;
      if (!r) return;
      pinch.ratio = clamp(dist(e.touches) / pinch.d0, 1 / r.zoom, 4 / r.zoom);
      const cv = $('#rd-wrap canvas');
      if (cv) {
        const cr = cv.getBoundingClientRect(), vr = v.getBoundingClientRect();
        cv.style.transformOrigin = (pinch.x + vr.left - cr.left) + 'px ' + (pinch.y + vr.top - cr.top) + 'px';
        cv.style.transform = 'scale(' + pinch.ratio + ')';
      }
    }, { passive: true });
    v.addEventListener('touchend', (e) => {
      const r = ui.reader;
      if (!r) return;
      if (pinch) {
        if (e.touches.length === 0) {
          const p = pinch;
          pinch = null;
          if (Math.abs(p.ratio - 1) > 0.05) rdSetZoom(r.zoom * p.ratio, { x: p.x, y: p.y });
          else { const cv = $('#rd-wrap canvas'); if (cv) cv.style.transform = ''; }
        }
        return;
      }
      if (sx == null) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - sx, dy = t.clientY - sy, dt = Date.now() - st;
      sx = null;
      if (Math.abs(dx) < 12 && Math.abs(dy) < 12 && dt < 300) {
        const now = Date.now();
        if (now - lastTap < 320) {
          lastTap = 0;
          const rect = v.getBoundingClientRect();
          rdSetZoom(r.zoom > 1.01 ? 1 : 2, { x: t.clientX - rect.left, y: t.clientY - rect.top });
        } else lastTap = now;
        return;
      }
      // Hebrew book: swiping to the right brings the next page
      const atEdge = r.zoom <= 1.01 || (dx > 0 ? v.scrollLeft <= 1 : v.scrollLeft >= v.scrollWidth - v.clientWidth - 1);
      if (atEdge && Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6 && dt < 700) rdGo(r.page + (dx > 0 ? 1 : -1));
    }, { passive: true });
    let wheelZoom = null;
    v.addEventListener('wheel', (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      clearTimeout(wheelZoom);
      wheelZoom = setTimeout(() => rdZoomStep(e.deltaY < 0 ? 1 : -1), 60);
    }, { passive: false });
  }
  function readerTeardown() {
    const r = ui.reader;
    if (!r) return;
    ui.reader = null;
    try { if (r.renderTask) r.renderTask.cancel(); } catch (e) { /* ignore */ }
    try { if (r.task) r.task.destroy(); } catch (e) { /* ignore */ }
    saveState();
  }
  function rdDone() {
    const r = ui.reader;
    if (!r || !r.ob) return;
    const o = obById(r.ob.id);
    if (!o) return;
    const key = r.dateKey;
    const before = dayScore(parseKey(key));
    const e = complete(o, key, { page: r.page });
    closePage();
    haptic('success');
    markToast(o, key, e, before);
  }

  // ================= Audio player =================
  const audio = new Audio();
  audio.preload = 'metadata';
  let lastPosSave = 0;
  function openPlayer(itemId, obId, dateKey) {
    const it = itemById(itemId);
    if (!it || !it.tracks.length) { toast({ title: 'אין שיעורים בסדרה', icon: 'alert', tone: 'muted' }); return; }
    if (ui.sheet) closeSheet();
    const o = obId ? obById(obId) : null;
    const si = o ? srcInfo(o) : null;
    const linked = !!(si && !si.missing && si.s.kind === 'audio' && si.it.id === it.id);
    let track = clamp(it.lastTrack, 0, it.tracks.length - 1), time = it.lastTime || 0;
    let goal = null;
    if (linked) {
      const s = si.s;
      if (si.finished) { track = 0; time = 0; }
      else {
        track = s.track; time = s.time;
        if (s.unit === 'tracks' && it.lastTrack >= s.track && it.lastTrack < s.track + s.per) { track = it.lastTrack; time = it.lastTrack === s.track ? Math.max(it.lastTime, s.time) : it.lastTime; }
        if (s.unit === 'minutes' && it.lastTrack === s.track && it.lastTime > s.time) time = it.lastTime;
        goal = s.unit === 'tracks' ? { lastTrack: Math.min(it.tracks.length - 1, s.track + s.per - 1) } : { abs: absPos(it, s.track, s.time) + s.per * 60, minutes: s.per };
      }
    }
    ui.player = { it: it, ob: linked ? o : null, dateKey: dateKey || keyOf(todayDate()), track: track, url: null, goal: goal, reached: false, loading: true };
    ui.page = 'player';
    document.body.classList.add('page-open');
    $('#page-root').innerHTML = playerHtml();
    plTracks();
    plLoad(track, time, true);
  }
  function absPos(it, track, time) { let a = 0; for (let i = 0; i < track && i < it.tracks.length; i++) a += it.tracks[i].dur || 0; return a + (time || 0); }
  function playerHtml() {
    const p = ui.player;
    const sp = state.settings.speed;
    return '<div class="page player" id="player" style="' + cvars(p.it.color) + '"><div class="page-bar"><button type="button" class="icon-btn plain" data-action="page-close" aria-label="סגירה">' + svg('x') + '</button>' +
      '<div class="title"><b>' + esc(p.it.name) + '</b><small id="pl-count"></small></div></div><div class="page-body">' +
      '<div class="pl-art">' + svg('headphones', 86, 1.4) + '</div><div class="pl-title" id="pl-title"></div><div class="pl-sub" id="pl-sub"></div>' +
      '<div class="pl-seek"><input type="range" class="range" id="pl-range" min="0" max="100" step="1" value="0" aria-label="מיקום בשיעור"><div class="pl-times"><span id="pl-cur" class="num">0:00</span><span id="pl-dur" class="num">0:00</span></div></div>' +
      '<div class="pl-ctrls"><button type="button" class="trk" data-action="pl-prev" aria-label="השיעור הקודם">' + svg('skipPrev', 22) + '</button>' +
      '<button type="button" class="skip" data-action="pl-skip" data-d="-15" aria-label="15 שניות אחורה">' + svg('back', 40, 1.6) + '<span>15</span></button>' +
      '<button type="button" class="play" data-action="pl-toggle" id="pl-play" aria-label="ניגון">' + svg('play', 34) + '</button>' +
      '<button type="button" class="skip" data-action="pl-skip" data-d="30" aria-label="30 שניות קדימה">' + svg('fwd', 40, 1.6) + '<span>30</span></button>' +
      '<button type="button" class="trk" data-action="pl-next" aria-label="השיעור הבא">' + svg('skipNext', 22) + '</button></div>' +
      '<div class="speeds" role="group" aria-label="מהירות">' + SPEEDS.map((x) => '<button type="button" data-action="pl-speed" data-v="' + x + '" aria-pressed="' + (x === sp) + '">' + x + '×</button>').join('') + '</div>' +
      '<div id="pl-banner"></div><div class="group-title">השיעורים בסדרה</div><div class="group tracks" id="pl-tracks" style="padding:0"></div></div>' +
      (p.ob ? '<div class="page-foot"><div class="inner"><button type="button" class="btn ok block" data-action="pl-done">' + svg('check', 20, 3) + ' סיימתי, לסמן את ' + esc(p.ob.name) + '</button></div></div>' : '') + '</div>';
  }
  function plTracks() {
    const p = ui.player;
    const el = $('#pl-tracks');
    if (!p || !el) return;
    el.innerHTML = p.it.tracks.map((t, i) => '<button type="button" class="track' + (i === p.track ? ' cur' : i < p.track ? ' past' : '') + '" data-action="pl-track" data-i="' + i + '"><span class="n num">' + (i === p.track ? svg(audio.paused ? 'playO' : 'music', 16) : i + 1) + '</span><span class="tn">' + esc(trackLabel(p.it, i)) + '</span><span class="td num">' + (t.dur ? fmtTime(t.dur) : '') + '</span></button>').join('');
  }
  async function plLoad(i, t, play) {
    const p = ui.player;
    if (!p) return;
    const tr = p.it.tracks[i];
    if (!tr) return;
    p.track = i;
    p.loading = true;
    plChrome();
    plTracks();
    let blob = null;
    try { blob = await fileGet(tr.f); } catch (e) { blob = null; }
    if (ui.player !== p || p.track !== i) return;
    if (!blob) { $('#pl-sub').textContent = 'הקובץ לא נמצא בטלפון. אפשר להוסיף אותו מחדש מהספרייה.'; return; }
    if (p.url) URL.revokeObjectURL(p.url);
    p.url = URL.createObjectURL(blob);
    audio.src = p.url;
    await new Promise((res) => {
      const done = () => { audio.removeEventListener('loadedmetadata', done); audio.removeEventListener('error', done); res(); };
      audio.addEventListener('loadedmetadata', done);
      audio.addEventListener('error', done);
      setTimeout(done, 6000);
    });
    if (ui.player !== p || p.track !== i) return;
    if (isFinite(audio.duration) && audio.duration > 0 && Math.abs((tr.dur || 0) - audio.duration) > 1) { tr.dur = audio.duration; saveSoon(); plTracks(); }
    if (t > 0 && isFinite(audio.duration)) { try { audio.currentTime = Math.min(t, Math.max(0, audio.duration - 2)); } catch (e) { /* ignore */ } }
    audio.defaultPlaybackRate = state.settings.speed;
    audio.playbackRate = state.settings.speed;
    p.loading = false;
    plChrome();
    if (play) audio.play().catch(() => plChrome());
  }
  function plChrome() {
    const p = ui.player;
    if (!p) return;
    const tr = p.it.tracks[p.track];
    const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
    set('#pl-count', 'שיעור ' + (p.track + 1) + ' מתוך ' + p.it.tracks.length);
    set('#pl-title', tr ? trackLabel(p.it, p.track) : '');
    let sub = '';
    if (p.ob && p.goal) {
      if (p.goal.lastTrack != null) sub = p.goal.lastTrack > p.ob.task.src.track ? 'הלימוד של היום: ' + rangeText(p.ob.task.src.track + 1, p.goal.lastTrack + 1, 'שיעור', 'שיעורים') : 'הלימוד של היום: השיעור הזה';
      else sub = 'הלימוד של היום: ' + p.goal.minutes + ' דקות';
    }
    if (p.loading) sub = 'טוען…';
    set('#pl-sub', sub);
    const dur = isFinite(audio.duration) && audio.duration > 0 ? audio.duration : (tr && tr.dur) || 0;
    const cur = audio.currentTime || 0;
    set('#pl-cur', fmtTime(cur));
    set('#pl-dur', dur ? '-' + fmtTime(dur - cur) : '0:00');
    const rg = $('#pl-range');
    if (rg && !p.seeking) {
      rg.max = String(Math.max(1, Math.floor(dur)));
      rg.value = String(Math.floor(cur));
      rg.style.setProperty('--p', (dur ? (cur / dur) * 100 : 0) + '%');
    }
    const pb = $('#pl-play');
    if (pb) { pb.innerHTML = svg(audio.paused ? 'play' : 'pause', 34); pb.setAttribute('aria-label', audio.paused ? 'ניגון' : 'השהיה'); }
    plGoal();
  }
  function plGoal() {
    const p = ui.player;
    if (!p || !p.ob || !p.goal || p.reached) return;
    let hit = false;
    if (p.goal.abs != null) hit = absPos(p.it, p.track, audio.currentTime || 0) >= p.goal.abs - 1;
    else if (p.goal.lastTrack != null) hit = p.track > p.goal.lastTrack || (p.track === p.goal.lastTrack && audio.ended);
    if (!hit) return;
    p.reached = true;
    const b = $('#pl-banner');
    if (b) b.innerHTML = '<div class="pl-banner">' + svg('sparkle', 22) + '<span>השלמת את הלימוד של היום! לחץ "סיימתי" כדי לסמן.</span></div>';
    haptic('success');
  }
  audio.addEventListener('timeupdate', () => {
    const p = ui.player;
    if (!p) return;
    plChrome();
    const now = Date.now();
    if (now - lastPosSave > 4000) {
      lastPosSave = now;
      p.it.lastTrack = p.track;
      p.it.lastTime = Math.floor(audio.currentTime || 0);
      saveSoon();
    }
  });
  audio.addEventListener('play', () => { plChrome(); plTracks(); });
  audio.addEventListener('pause', () => {
    const p = ui.player;
    if (!p) return;
    p.it.lastTrack = p.track;
    p.it.lastTime = Math.floor(audio.currentTime || 0);
    saveSoon();
    plChrome();
    plTracks();
  });
  audio.addEventListener('ended', () => {
    const p = ui.player;
    if (!p) return;
    plGoal();
    const stopHere = p.ob && p.goal && p.goal.lastTrack != null && p.track >= p.goal.lastTrack;
    if (!stopHere && p.track + 1 < p.it.tracks.length) { plLoad(p.track + 1, 0, true); return; }
    if (!p.ob && p.track + 1 >= p.it.tracks.length) {
      const b = $('#pl-banner');
      if (b) b.innerHTML = '<div class="pl-banner">' + svg('sparkle', 22) + '<span>סיימת את כל השיעורים בסדרה!</span></div>';
    }
  });
  function playerTeardown() {
    const p = ui.player;
    if (!p) return;
    p.it.lastTrack = p.track;
    p.it.lastTime = Math.floor(audio.currentTime || 0);
    ui.player = null;
    try { audio.pause(); } catch (e) { /* ignore */ }
    audio.removeAttribute('src');
    try { audio.load(); } catch (e) { /* ignore */ }
    if (p.url) URL.revokeObjectURL(p.url);
    saveState();
  }
  function plDone() {
    const p = ui.player;
    if (!p || !p.ob) return;
    const o = obById(p.ob.id);
    if (!o) return;
    const key = p.dateKey;
    const before = dayScore(parseKey(key));
    const near = isFinite(audio.duration) && audio.duration - (audio.currentTime || 0) < 20;
    const opts = o.task.src.unit === 'minutes'
      ? { track: p.track, time: Math.floor(audio.currentTime || 0) }
      : { track: p.track };
    if (o.task.src.unit === 'minutes' && near && p.track + 1 < p.it.tracks.length) { opts.track = p.track + 1; opts.time = 0; }
    const e = complete(o, key, opts);
    closePage();
    haptic('success');
    markToast(o, key, e, before);
  }

  // ================= Marking & feedback =================
  const CHEERS = ['יישר כוח!', 'כל הכבוד!', 'חזק וברוך!', 'אשריך!'];
  function nextShort(o) {
    const si = srcInfo(o);
    if (!si || si.missing) return '';
    if (si.finished) return si.s.kind === 'pdf' ? 'סוף הספר' : 'סוף הסדרה';
    return si.s.kind === 'pdf' ? 'עמוד ' + si.s.page : 'שיעור ' + (si.s.track + 1);
  }
  function markToast(o, key, e, scBefore) {
    const sc = dayScore(parseKey(key));
    const allNow = sc.total > 0 && sc.done >= sc.total && scBefore.done < scBefore.total;
    const nx = nextShort(o);
    renderScreen();
    toast({
      title: allNow ? (key === keyOf(todayDate()) ? 'יישר כוח! השלמת הכל היום' : 'יישר כוח! היום הזה הושלם') : CHEERS[Math.floor(Math.random() * CHEERS.length)],
      sub: o.name + (e && e.w ? ': ' + e.w : '') + (nx ? ' · הבא: ' + nx : ''),
      icon: allNow ? 'sparkle' : 'check',
      action: { label: 'ביטול', fn: () => { uncomplete(o, key); renderAll(); toast({ title: 'הסימון בוטל', sub: o.name, icon: 'undo', tone: 'muted' }); } }
    });
  }
  function popCheck(id) {
    const el = document.querySelector('.ob[data-ob="' + id + '"] .check');
    if (el) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
  }
  function onCheck(id, key) {
    const o = obById(id);
    if (!o) return;
    const inf = info(o, parseKey(key));
    const full = inf.kind === 'period' ? inf.total >= inf.target && inf.done > 0 : inf.done >= inf.target;
    if (full) {
      uncomplete(o, key);
      haptic();
      renderScreen();
      toast({ title: 'הסימון בוטל', sub: o.name, icon: 'undo', tone: 'muted', action: { label: 'החזרה', fn: () => { complete(o, key); renderScreen(); popCheck(id); } } });
      return;
    }
    const before = dayScore(parseKey(key));
    const e = complete(o, key);
    haptic('success');
    markToast(o, key, e, before);
    popCheck(id);
  }
  function learn(o, key) {
    const si = srcInfo(o);
    if (!si) { openSheet({ type: 'ob', id: o.id, date: key }); return; }
    if (si.missing) { toast({ title: 'הקובץ נמחק מהספרייה', sub: 'אפשר לחבר קובץ אחר בעריכת החובה', icon: 'alert', tone: 'muted' }); return; }
    if (si.s.kind === 'pdf') openReader(si.it.id, o.id, key); else openPlayer(si.it.id, o.id, key);
  }

  // ================= Toast & busy =================
  function toast(o) {
    const root = $('#toast-root');
    clearTimeout(ui.toastTimer);
    ui.toastAct = o.action ? o.action.fn : null;
    root.innerHTML = '<div class="toast' + (o.tone === 'muted' ? ' muted' : '') + '"><span class="ti">' + svg(o.icon || 'check', 18) + '</span><div class="tt"><b>' + esc(o.title) + '</b>' +
      (o.sub ? '<small>' + esc(o.sub) + '</small>' : '') + '</div>' + (o.action ? '<button type="button" data-action="toast-act">' + esc(o.action.label) + '</button>' : '') + '</div>';
    ui.toastTimer = setTimeout(hideToast, o.action ? 6000 : 3400);
  }
  function hideToast() {
    const t = $('#toast-root .toast');
    ui.toastAct = null;
    if (!t) return;
    t.classList.add('out');
    setTimeout(() => { if (t.parentNode) t.parentNode.removeChild(t); }, 200);
  }
  function busy(title, sub) {
    let el = $('#busy');
    if (!el) { el = document.createElement('div'); el.id = 'busy'; el.className = 'busy'; document.body.appendChild(el); }
    el.innerHTML = '<div class="box"><div class="spinner"></div><b>' + esc(title) + '</b><small>' + esc(sub || '') + '</small></div>';
  }
  function unbusy() { const el = $('#busy'); if (el) el.remove(); }

  // ================= Importing files =================
  function pickFile(kind, purpose) {
    ui.importFor = purpose || null;
    const el = $(kind === 'pdf' ? '#file-pdf' : kind === 'audio' ? '#file-audio' : '#file-backup');
    el.value = '';
    el.click();
  }
  async function onFilePicked(input) {
    const files = Array.prototype.slice.call(input.files || []);
    input.value = '';
    if (!files.length) return;
    if (input.id === 'file-pdf') await importPdf(files[0]);
    else if (input.id === 'file-audio') await importAudio(files);
    else importBackup(files[0]);
  }
  function requestPersist() { try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* ignore */ } }
  function importError(e) {
    unbusy();
    const quota = e && (e.name === 'QuotaExceededError' || /quota/i.test(String(e.message)));
    toast({ title: quota ? 'אין מספיק מקום בטלפון' : e && e.code === 'bad' ? 'הקובץ לא נפתח כ־PDF' : 'ההוספה לא הצליחה', sub: quota ? 'פנה מקום ונסה שוב' : 'נסה קובץ אחר', icon: 'alert', tone: 'muted' });
  }
  async function importPdf(file) {
    const purpose = ui.importFor;
    ui.importFor = null;
    if (!/pdf/i.test(file.type) && !/\.pdf$/i.test(file.name)) { toast({ title: 'זה לא קובץ PDF', sub: file.name, icon: 'alert', tone: 'muted' }); return; }
    busy('מוסיף את הספר…', file.name + ' · ' + fmtSize(file.size));
    const relink = purpose && purpose.relink ? itemById(purpose.relink) : null;
    const id = relink ? relink.id : uid();
    const fid = 'f_' + uid();
    try {
      await filePut(fid, file);
      let pages = 0;
      try {
        const task = await openPdf(fid);
        const doc = await task.promise;
        pages = doc.numPages;
        await task.destroy();
      } catch (e) {
        await fileDel(fid).catch(() => {});
        const err = new Error('bad'); err.code = 'bad'; throw err;
      }
      let it;
      if (relink) {
        const old = relink.file;
        relink.file = fid; relink.size = file.size; relink.pages = pages;
        fileDel(old).catch(() => {});
        it = relink;
      } else {
        it = { id: id, kind: 'pdf', name: stripExt(file.name) || 'ספר', file: fid, size: file.size, pages: pages, lastPage: 1, color: COLORS[(state.library.length + 1) % COLORS.length], addedAt: Date.now() };
        state.library.push(it);
      }
      saveState();
      requestPersist();
      unbusy();
      afterImport(it, purpose);
    } catch (e) { importError(e); }
  }
  function probeDuration(file) {
    return new Promise((resolve) => {
      const a = document.createElement('audio');
      const url = URL.createObjectURL(file);
      let done = false;
      const fin = (v) => { if (done) return; done = true; URL.revokeObjectURL(url); a.removeAttribute('src'); resolve(v); };
      a.preload = 'metadata';
      a.onloadedmetadata = () => fin(isFinite(a.duration) ? a.duration : 0);
      a.onerror = () => fin(0);
      setTimeout(() => fin(0), 5000);
      a.src = url;
    });
  }
  function seriesName(files) {
    const names = files.map((f) => stripExt(f.name));
    if (names.length === 1) return names[0] || 'שיעור';
    let p = names[0];
    names.forEach((n) => { let i = 0; while (i < p.length && i < n.length && p[i] === n[i]) i++; p = p.slice(0, i); });
    p = p.replace(/[\s\-_.0-9()[\]#]+$/, '').replace(/(שיעור|שיעורים|חלק|פרק|lesson|part)$/i, '').replace(/[\s\-_.0-9()[\]#]+$/, '').trim();
    return p.length >= 3 ? p : 'סדרת שיעורים';
  }
  const AUDIO_EXT = /\.(mp3|m4a|m4b|aac|wav|ogg|oga|opus|flac|wma|amr|3gp|webm|mp4)$/i;
  async function importAudio(files) {
    const purpose = ui.importFor;
    ui.importFor = null;
    files = files.filter((f) => /^audio\//.test(f.type) || AUDIO_EXT.test(f.name));
    if (!files.length) { toast({ title: 'לא נמצאו קבצי שמע', icon: 'alert', tone: 'muted' }); return; }
    files.sort((a, b) => a.name.localeCompare(b.name, 'he', { numeric: true, sensitivity: 'base' }));
    const tracks = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        busy(files.length > 1 ? 'מוסיף שיעורים…' : 'מוסיף את השיעור…', files.length > 1 ? (i + 1) + ' מתוך ' + files.length : f.name);
        const fid = 'f_' + uid();
        await filePut(fid, f);
        const dur = await probeDuration(f);
        tracks.push({ f: fid, name: stripExt(f.name) || 'שיעור ' + (i + 1), size: f.size, dur: dur });
      }
    } catch (e) {
      tracks.forEach((t) => fileDel(t.f).catch(() => {}));
      importError(e);
      return;
    }
    let it = purpose && purpose.addTo ? itemById(purpose.addTo) : null;
    if (it) it.tracks = it.tracks.concat(tracks);
    else {
      it = { id: uid(), kind: 'audio', name: seriesName(files), tracks: tracks, lastTrack: 0, lastTime: 0, color: COLORS[(state.library.length + 2) % COLORS.length], addedAt: Date.now() };
      state.library.push(it);
    }
    saveState();
    requestPersist();
    unbusy();
    afterImport(it, purpose);
  }
  function afterImport(it, purpose) {
    if (purpose === 'editor' && ui.editor) {
      edSetSrcItem(it);
      renderPage(false);
      toast({ title: it.kind === 'pdf' ? 'הספר נוסף וחובר' : 'השיעורים נוספו וחוברו', sub: it.name + ' · ' + itemMeta(it), icon: 'check' });
      return;
    }
    if (ui.sheet) closeSheet();
    renderScreen();
    if (purpose && purpose.relink) { toast({ title: 'הקובץ חובר מחדש', sub: it.name, icon: 'check' }); return; }
    toast({
      title: it.kind === 'pdf' ? 'הספר נוסף לספרייה' : (purpose && purpose.addTo ? 'השיעורים נוספו לסדרה' : 'השיעורים נוספו לספרייה'),
      sub: it.name + ' · ' + itemMeta(it), icon: 'check',
      action: linkedObs(it.id).length ? null : { label: 'יצירת חובה', fn: () => obFromItem(it) }
    });
  }
  function obFromItem(it) {
    const d = newDraft(null);
    d.name = it.name.slice(0, 40);
    d.icon = it.kind === 'pdf' ? 'book' : 'headphones';
    d.color = it.color;
    d.task.text = '';
    edSetSrcItemDraft(d, it);
    openEditor(d, true);
  }
  function edSetSrcItemDraft(d, it) {
    d.task.src = it.kind === 'pdf' ? { kind: 'pdf', item: it.id, page: 1, per: 1 } : { kind: 'audio', item: it.id, track: 0, time: 0, unit: 'tracks', per: 1 };
  }
  async function deleteItem(it) {
    const files = it.kind === 'pdf' ? [it.file] : it.tracks.map((t) => t.f);
    state.library = state.library.filter((x) => x.id !== it.id);
    state.obligations.forEach((o) => { if (o.task.src && o.task.src.item === it.id) o.task.src = null; });
    saveState();
    renderScreen();
    for (const f of files) { try { await fileDel(f); } catch (e) { /* ignore */ } }
    toast({ title: 'נמחק מהטלפון', sub: it.name, icon: 'trash', tone: 'muted' });
  }

  // ================= Notifications =================
  let notifSetup = false;
  async function setupNotifications() {
    if (notifSetup) return;
    notifSetup = true;
    await call('LocalNotifications', 'createChannel', {
      id: CHANNEL, name: 'תזכורות לימוד', description: 'תזכורות לחובות וסיכום בסוף היום', importance: 4, visibility: 1, vibration: true
    });
    await call('LocalNotifications', 'registerActionTypes', {
      types: [
        { id: 'OB', actions: [{ id: 'done', title: 'סיימתי ✓' }, { id: 'open', title: 'ללמוד עכשיו' }] },
        { id: 'OBT', actions: [{ id: 'done', title: 'סיימתי ✓' }] }
      ]
    });
  }
  function joinNames(n) {
    if (n.length <= 1) return n.join('');
    return n.slice(0, -1).join(', ') + ' ו' + n[n.length - 1];
  }
  /** All local notifications for the next 7 days. Pure: depends only on state and now. */
  function buildSchedule(now) {
    const s = state.settings;
    const city = cityById(s.city);
    const out = [];
    const today = todayDate();
    for (let i = 0; i < 7; i++) {
      const d = addDays(today, i);
      const key = keyOf(d);
      let slot = 0;
      const push = (at, n) => {
        if (!at || isNaN(at.getTime())) return;
        if (at.getTime() <= now.getTime() + 15e3) return;
        if (s.shabbatQuiet && inQuiet(at, city)) return;
        if (slot >= 40) return;
        n.id = 1000 + i * 40 + slot;
        slot++;
        n.schedule = { at: at, allowWhileIdle: true };
        n.channelId = CHANNEL;
        n.smallIcon = 'ic_stat_chovotai';
        n.iconColor = '#1E5F74';
        out.push(n);
      };
      const open = [];
      state.obligations.forEach((o) => {
        if (o.paused) return;
        const inf = info(o, d);
        if (!inf.due) return;
        const left = inf.kind === 'period' ? inf.target - inf.total : inf.target - inf.done;
        if (left <= 0) return;
        open.push(o.name);
        if (!o.reminders.on) return;
        const si = srcInfo(o);
        const hasSrc = !!(si && !si.missing && !si.finished);
        o.reminders.times.forEach((t) => {
          push(atTime(d, t), {
            title: o.name,
            body: i === 0 ? assignment(o) : (hasSrc ? 'זמן ללמוד · ' + si.it.name : (o.task.text || 'זמן ללמוד')),
            actionTypeId: hasSrc ? 'OB' : 'OBT',
            extra: { kind: 'ob', id: o.id, date: key }
          });
        });
      });
      if (s.nightly.on && open.length) {
        const sc = dayScore(d);
        push(atTime(d, s.nightly.time), {
          title: open.length === 1 ? 'נשארה חובה אחת להיום' : 'נשארו ' + open.length + ' חובות להיום',
          body: (i === 0 && sc.done ? 'השלמת ' + sc.done + ' מתוך ' + sc.total + '. ' : '') + 'עוד לא סומנו: ' + joinNames(open),
          extra: { kind: 'night', date: key }
        });
      }
    }
    return out;
  }
  let schedTimer = null;
  let schedChain = Promise.resolve();
  function runReschedule() { schedChain = schedChain.then(rescheduleAll, rescheduleAll); return schedChain; }
  function scheduleSoon() {
    if (!isNative()) return;
    clearTimeout(schedTimer);
    schedTimer = setTimeout(runReschedule, 700);
  }
  async function rescheduleAll() {
    if (!isNative() || !state) return;
    const perm = await call('LocalNotifications', 'checkPermissions');
    if (!perm || perm.display !== 'granted') return;
    await setupNotifications();
    const pending = await call('LocalNotifications', 'getPending');
    const ids = pending && Array.isArray(pending.notifications) ? pending.notifications.map((n) => ({ id: +n.id })).filter((n) => n.id < 90000) : [];
    if (ids.length) await call('LocalNotifications', 'cancel', { notifications: ids });
    const list = buildSchedule(new Date());
    if (list.length) await call('LocalNotifications', 'schedule', { notifications: list });
  }
  async function refreshPermissions() {
    if (!isNative()) return;
    const p = await call('LocalNotifications', 'checkPermissions');
    const ex = await call('LocalNotifications', 'checkExactNotificationSetting');
    const perm = p && p.display ? p.display : null;
    const exact = ex && ex.exact_alarm ? ex.exact_alarm : null;
    if (perm !== ui.perm || exact !== ui.exact) {
      ui.perm = perm;
      ui.exact = exact;
      if (ui.tab === 'settings') renderScreen();
    }
  }
  async function requestPermission() {
    if (!isNative()) return;
    const r = await call('LocalNotifications', 'requestPermissions');
    await refreshPermissions();
    if (r && r.display === 'granted') { clearTimeout(schedTimer); await runReschedule(); }
    else if (r) toast({ title: 'ההתראות כבויות', sub: 'אפשר להפעיל אותן בהגדרות', icon: 'bell', tone: 'muted' });
  }
  async function ensurePermission() {
    if (!isNative()) return;
    const p = await call('LocalNotifications', 'checkPermissions');
    if (p && p.display && p.display !== 'granted') await requestPermission();
  }
  async function testNotification() {
    if (!isNative()) { toast({ title: 'זמין באפליקציה המותקנת', sub: 'בדפדפן אין התראות', icon: 'bell', tone: 'muted' }); return; }
    const perm = await call('LocalNotifications', 'checkPermissions');
    if (!perm || perm.display !== 'granted') { await requestPermission(); return; }
    await setupNotifications();
    await call('LocalNotifications', 'schedule', {
      notifications: [{
        id: 99001, title: 'בדיקה · חובותיי', body: 'ככה ייראו התזכורות שלך. אפשר ללחוץ על "סיימתי".',
        schedule: { at: new Date(Date.now() + 5000), allowWhileIdle: true }, channelId: CHANNEL, smallIcon: 'ic_stat_chovotai', iconColor: '#1E5F74',
        actionTypeId: 'OBT', extra: { kind: 'test' }
      }]
    });
    toast({ title: 'ההתראה תגיע בעוד 5 שניות', sub: 'אפשר לצאת מהאפליקציה כדי לראות אותה', icon: 'bell' });
  }
  const pendingActions = [];
  function queueAction(ev) { pendingActions.push(ev); if (state) flushActions(); }
  function flushActions() { while (pendingActions.length) handleNotifAction(pendingActions.shift()); }
  function closeAllUi() {
    if (ui.sheet) { ui.sheet = null; renderSheet(false); }
    if (ui.page && ui.page !== 'onb') { const t = ui.page; if (t === 'reader') readerTeardown(); if (t === 'player') playerTeardown(); ui.page = null; ui.editor = null; $('#page-root').innerHTML = ''; document.body.classList.remove('page-open'); }
  }
  function handleNotifAction(ev) {
    const n = ev && ev.notification ? ev.notification : {};
    const ex = n.extra || {};
    const act = ev ? ev.actionId : '';
    if (ex.kind === 'test') { if (act === 'done') toast({ title: 'הכפתור עובד!', sub: 'זו הייתה רק בדיקה, שום דבר לא סומן', icon: 'check' }); return; }
    const today = keyOf(todayDate());
    const date = typeof ex.date === 'string' && KEY_RE.test(ex.date) && ex.date <= today ? ex.date : today;
    closeAllUi();
    ui.tab = 'home';
    ui.day = date === today ? null : parseKey(date);
    renderScreen();
    if (ex.kind !== 'ob') return;
    const o = obById(ex.id);
    if (!o) return;
    if (act === 'done') {
      const inf = info(o, parseKey(date));
      const full = inf.kind === 'period' ? inf.total >= inf.target : inf.done >= inf.target;
      if (full) { toast({ title: 'כבר סומן', sub: o.name, icon: 'check' }); return; }
      const before = dayScore(parseKey(date));
      const e = complete(o, date);
      markToast(o, date, e, before);
      return;
    }
    if (act === 'open' || o.task.src) { learn(o, date); return; }
    openSheet({ type: 'ob', id: o.id, date: date });
  }

  // ================= Backup =================
  async function doBackup() {
    const json = JSON.stringify({ app: 'chovotai', version: APP_VERSION, exportedAt: new Date().toISOString(), data: state }, null, 1);
    const name = 'chovotai-backup-' + keyOf(todayDate()) + '.json';
    if (isNative()) {
      const w = await call('Filesystem', 'writeFile', { path: name, data: json, directory: 'CACHE', encoding: 'utf8' });
      if (w && w.uri) {
        try { await callRaw('Share', 'share', { title: 'גיבוי חובותיי', url: w.uri, dialogTitle: 'איפה לשמור את הגיבוי?' }); } catch (e) { /* cancelled */ }
        return;
      }
      toast({ title: 'הגיבוי לא הצליח', sub: 'נסה שוב', icon: 'x', tone: 'muted' });
      return;
    }
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast({ title: 'הגיבוי נשמר', sub: name, icon: 'download' });
  }
  function importBackup(file) {
    const reader = new FileReader();
    reader.onload = () => {
      let obj = null;
      try { obj = JSON.parse(String(reader.result)); } catch (e) { obj = null; }
      const data = obj && obj.app === 'chovotai' && isObj(obj.data) ? obj.data : null;
      if (!data) { toast({ title: 'הקובץ לא מתאים', sub: 'בחר קובץ גיבוי של חובותיי', icon: 'x', tone: 'muted' }); return; }
      const n = Array.isArray(data.obligations) ? data.obligations.length : 0;
      confirmSheet({
        title: 'לשחזר מהגיבוי?', text: 'בגיבוי יש ' + plural(n, 'חובה אחת', 'חובות') + '. הנתונים הנוכחיים יוחלפו. ספרים שלא נמצאים בטלפון יבקשו בחירה מחדש של הקובץ.', ok: 'שחזור',
        fn: () => {
          state = normalize(data);
          state.settings.onboarded = true;
          saveState();
          applyTheme();
          ui.day = null;
          renderScreen();
          scheduleSoon();
          toast({ title: 'השחזור הושלם', sub: plural(n, 'חובה אחת', 'חובות') + ' חזרו', icon: 'check' });
        }
      });
    };
    reader.onerror = () => toast({ title: 'לא הצלחתי לקרוא את הקובץ', icon: 'x', tone: 'muted' });
    reader.readAsText(file);
  }

  // ================= Rendering & navigation =================
  function renderScreen() {
    const scr = $('#screen');
    if (!scr || !state) return;
    let html;
    if (ui.tab === 'library') html = viewLibrary();
    else if (ui.tab === 'progress') html = viewProgress();
    else if (ui.tab === 'settings') html = viewSettings();
    else html = viewHome();
    scr.innerHTML = html;
    document.querySelectorAll('#tabs button').forEach((b) => {
      if (b.getAttribute('data-tab') === ui.tab) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    if (ui.tab === 'library') updateStorageLine();
  }
  function renderAll() {
    renderScreen();
    if (ui.sheet) renderSheet(false);
    if (ui.page === 'editor' || ui.page === 'onb') renderPage(false);
  }
  function switchTab(tab) {
    ui.tab = tab;
    if (tab === 'home') ui.day = null;
    renderScreen();
    window.scrollTo(0, 0);
    if (tab === 'settings') refreshPermissions();
  }
  function checkDayChange() {
    if (!state) return;
    const k = keyOf(todayDate());
    if (k === ui.todayKey) return;
    ui.todayKey = k;
    if (!ui.page) { ui.day = null; renderScreen(); }
    scheduleSoon();
  }
  function onResume() { checkDayChange(); scheduleSoon(); if (ui.tab === 'settings') refreshPermissions(); }
  function onBack() {
    if ($('#busy')) return;
    if (ui.sheet) { closeSheet(); return; }
    if (ui.page === 'onb') { if (ui.onb && ui.onb.step === 2) { ui.onb.step = 1; renderPage(false); return; } call('App', 'minimizeApp'); return; }
    if (ui.page) { closePage(); return; }
    if (ui.tab !== 'home') { switchTab('home'); return; }
    if (ui.day) { ui.day = null; renderScreen(); return; }
    call('App', 'minimizeApp');
  }

  // ================= Events =================
  function edStep(field, delta, min, max) {
    const e = ui.editor;
    if (!e) return;
    if (field === 'per') { const s = e.d.task.src; if (!s) return; const step = s.unit === 'minutes' ? 5 : 1; s.per = clamp(s.per + delta * step, min, max); }
    else e.d.freq[field] = clamp(e.d.freq[field] + delta, min, max);
    renderPage(false);
  }
  const ACTIONS = {
    'tab': (el) => switchTab(el.getAttribute('data-tab')),
    'day-prev': () => { ui.day = addDays(ui.day || todayDate(), -1); renderScreen(); },
    'day-next': () => { const n = addDays(ui.day || todayDate(), 1); ui.day = keyOf(n) >= keyOf(todayDate()) ? null : n; renderScreen(); },
    'day-today': () => { ui.day = null; renderScreen(); },
    'goto-day': (el) => { const k = el.getAttribute('data-date'); ui.tab = 'home'; ui.day = k === keyOf(todayDate()) ? null : parseKey(k); renderScreen(); window.scrollTo(0, 0); },
    'toggle-later': () => { ui.laterOpen = !ui.laterOpen; renderScreen(); },
    'add-ob': () => openSheet({ type: 'templates' }),
    'tpl-pick': (el) => { const t = TEMPLATES.find((x) => x.key === el.getAttribute('data-key')); if (!t) return; closeSheet(); const d = newDraft(t); if (t.audio) { const a = state.library.find((i) => i.kind === 'audio'); if (a) edSetSrcItemDraft(d, a); openEditor(d, true); ui.editor.srcKind = 'audio'; renderPage(false); return; } openEditor(d, true); },
    'tpl-custom': () => { closeSheet(); openEditor(newDraft(null), true); },
    'ob-sheet': (el) => openSheet({ type: 'ob', id: el.getAttribute('data-id'), date: el.getAttribute('data-date') }),
    'ob-check': (el) => onCheck(el.getAttribute('data-id'), el.getAttribute('data-date')),
    'ob-mark': (el) => { const o = obById(el.getAttribute('data-id')); const key = el.getAttribute('data-date'); if (!o) return; closeSheet(); const before = dayScore(parseKey(key)); const e = complete(o, key); haptic('success'); markToast(o, key, e, before); popCheck(o.id); },
    'ob-undo': (el) => { const o = obById(el.getAttribute('data-id')); const key = el.getAttribute('data-date'); if (!o) return; uncomplete(o, key); renderScreen(); renderSheet(false); toast({ title: 'הסימון בוטל', sub: o.name, icon: 'undo', tone: 'muted' }); },
    'ob-learn': (el) => { const o = obById(el.getAttribute('data-id')); if (o) learn(o, el.getAttribute('data-date') || keyOf(todayDate())); },
    'ob-edit': (el) => { const o = obById(el.getAttribute('data-id')); if (!o) return; if (ui.sheet) closeSheet(); openEditor(clone(o), false); },
    'ob-pause': (el) => { const o = obById(el.getAttribute('data-id')); if (!o) return; o.paused = !o.paused; saveState(); scheduleSoon(); closeSheet(); renderScreen(); toast({ title: o.paused ? 'החובה הושהתה' : 'החובה חזרה', sub: o.name, icon: o.paused ? 'pauseO' : 'playO', tone: o.paused ? 'muted' : '' }); },
    'ob-move': (el) => { const id = el.getAttribute('data-id'); const d = int(el.getAttribute('data-d'), 0); const i = state.obligations.findIndex((o) => o.id === id); const j = i + d; if (i < 0 || j < 0 || j >= state.obligations.length) return; const a = state.obligations; const t = a[i]; a[i] = a[j]; a[j] = t; saveState(); renderScreen(); },
    'ob-from-item': (el) => { const it = itemById(el.getAttribute('data-id')); if (!it) return; closeSheet(); obFromItem(it); },
    'pos-sheet': (el) => openSheet({ type: 'pos', id: el.getAttribute('data-id') }),
    'pos-save': (el) => {
      const o = obById(el.getAttribute('data-id'));
      if (!o || !o.task.src) return;
      if (o.task.src.kind === 'pdf') { const it = itemById(o.task.src.item); const v = int(($('#pos-page') || {}).value, o.task.src.page); o.task.src.page = clamp(v, 1, it && it.pages ? it.pages : 99999); }
      else { o.task.src.track = int(($('#pos-track') || {}).value, o.task.src.track); o.task.src.time = 0; }
      saveState(); scheduleSoon(); closeSheet(); renderScreen();
      toast({ title: 'המקום עודכן', sub: o.name + ' · הבא: ' + nextShort(o), icon: 'bookmark' });
    },
    'import-pdf': () => pickFile('pdf', ui.page === 'editor' ? 'editor' : null),
    'import-audio': () => pickFile('audio', ui.page === 'editor' ? 'editor' : null),
    'lib-open': (el) => { const it = itemById(el.getAttribute('data-id')); if (!it) return; if (it.kind === 'pdf') openReader(it.id); else openPlayer(it.id); },
    'lib-menu': (el) => openSheet({ type: 'lib', id: el.getAttribute('data-id') }),
    'lib-add-tracks': (el) => { closeSheet(); pickFile('audio', { addTo: el.getAttribute('data-id') }); },
    'lib-delete': (el) => {
      const it = itemById(el.getAttribute('data-id'));
      if (!it) return;
      const links = linkedObs(it.id);
      confirmSheet({ title: 'למחוק את ' + it.name + '?', text: 'הקובץ יימחק מהטלפון.' + (links.length ? ' החובות ' + links.map((o) => o.name).join(', ') + ' יישארו, בלי קובץ מחובר.' : ''), ok: 'מחיקה', danger: true, fn: () => deleteItem(it) });
    },
    'rename': (el) => openSheet({ type: 'rename', id: el.getAttribute('data-id') }),
    'rename-save': () => { const it = itemById(ui.sheet && ui.sheet.id); const v = cleanText(($('#rename-input') || {}).value, 80); if (!it || !v) return; it.name = v; saveState(); closeSheet(); renderScreen(); },
    'theme': (el) => { state.settings.theme = el.getAttribute('data-v'); saveState(); applyTheme(); renderScreen(); },
    'perm-request': () => requestPermission(),
    'exact-request': () => call('LocalNotifications', 'changeExactNotificationSetting').then(refreshPermissions),
    'test-notif': () => testNotification(),
    'backup': () => doBackup(),
    'restore': () => pickFile('backup'),
    'reset': () => confirmSheet({ title: 'למחוק את כל הסימונים?', text: 'כל ההיסטוריה תימחק. החובות, הספרים וההגדרות יישארו. אי אפשר לבטל את זה.', ok: 'מחיקה', danger: true, fn: () => { state.log = {}; state.createdAt = keyOf(todayDate()); saveState(); renderScreen(); scheduleSoon(); toast({ title: 'כל הסימונים נמחקו', icon: 'trash', tone: 'muted' }); } }),
    'sheet-close': () => closeSheet(),
    'confirm-ok': () => { const c = ui.confirm; ui.confirm = null; closeSheet(); if (c && c.fn) c.fn(); },
    'toast-act': () => { const fn = ui.toastAct; hideToast(); if (fn) fn(); },
    'page-close': () => closePage(),
    // editor
    'ed-save': () => saveEditor(),
    'ed-icon': (el) => { ui.editor.d.icon = el.getAttribute('data-v'); renderPage(false); },
    'ed-color': (el) => { ui.editor.d.color = el.getAttribute('data-v'); renderPage(false); },
    'ed-freq': (el) => { ui.editor.d.freq.type = el.getAttribute('data-v'); if (ui.editor.d.freq.type === 'monthly' && ui.editor.d.freq.count > 30) ui.editor.d.freq.count = 30; if (ui.editor.d.freq.type === 'weekly') ui.editor.d.freq.count = Math.min(ui.editor.d.freq.count, 7); renderPage(false); },
    'ed-day': (el) => { const f = ui.editor.d.freq; const v = int(el.getAttribute('data-v'), 0); const i = f.days.indexOf(v); if (i >= 0) { if (f.days.length > 1) f.days.splice(i, 1); } else { f.days.push(v); f.days.sort(); } renderPage(false); },
    'ed-every': (el) => edStep('every', int(el.getAttribute('data-d'), 0), 2, 60),
    'ed-count': (el) => edStep('count', int(el.getAttribute('data-d'), 0), 1, ui.editor.d.freq.type === 'weekly' ? 7 : 30),
    'ed-times': (el) => edStep('times', int(el.getAttribute('data-d'), 0), 1, 10),
    'ed-per': (el) => { const s = ui.editor.d.task.src; if (!s) return; edStep('per', int(el.getAttribute('data-d'), 0), s.kind === 'audio' && s.unit === 'minutes' ? 5 : 1, s.kind === 'pdf' ? 100 : s.unit === 'minutes' ? 240 : 10); },
    'ed-src': (el) => { const e = ui.editor; e.srcKind = el.getAttribute('data-v'); if (e.srcKind !== 'none' && (!e.d.task.src || e.d.task.src.kind !== e.srcKind)) { const items = state.library.filter((i) => i.kind === e.srcKind); if (items.length === 1) edSetSrcItem(items[0]); } renderPage(false); },
    'ed-item': (el) => { const it = itemById(el.getAttribute('data-id')); if (it) edSetSrcItem(it); renderPage(false); },
    'ed-unit': (el) => { const s = ui.editor.d.task.src; if (!s) return; s.unit = el.getAttribute('data-v'); s.per = s.unit === 'minutes' ? 20 : 1; renderPage(false); },
    'ed-time-add': () => { const r = ui.editor.d.reminders; if (r.times.length >= MAX_TIMES) return; const last = r.times.length ? r.times[r.times.length - 1] : '19:00'; const h = (int(last.split(':')[0], 19) + 2) % 24; let t = pad(h) + ':' + last.split(':')[1]; while (r.times.indexOf(t) >= 0) t = pad((int(t, 0) + 1) % 24) + ':00'; r.times.push(t); r.times.sort(); renderPage(false); },
    'ed-time-del': (el) => { ui.editor.d.reminders.times.splice(int(el.getAttribute('data-i'), 0), 1); renderPage(false); },
    'ed-pause': () => { ui.editor.d.paused = !ui.editor.d.paused; renderPage(false); },
    'ed-delete': () => { const d = ui.editor.d; confirmSheet({ title: 'למחוק את ' + (d.name || 'החובה') + '?', text: 'החובה וכל הסימונים שלה יימחקו. הספרים יישארו בספרייה.', ok: 'מחיקה', danger: true, fn: () => deleteOb(d.id) }); },
    // onboarding
    'onb-pick': (el) => { const k = el.getAttribute('data-key'); const p = ui.onb.picked; const i = p.indexOf(k); if (i >= 0) p.splice(i, 1); else p.push(k); haptic(); renderPage(false); },
    'onb-next': () => { ui.onb.step = 2; renderPage(true); },
    'onb-back': () => { ui.onb.step = 1; renderPage(true); },
    'onb-finish': () => finishOnboarding(),
    // reader
    'rd-prev': () => rdGo(ui.reader.page - 1),
    'rd-next': () => rdGo(ui.reader.page + 1),
    'rd-zoom': (el) => rdZoomStep(int(el.getAttribute('data-d'), 1)),
    'rd-jump': () => { if (ui.reader && ui.reader.doc) openSheet({ type: 'jump' }); },
    'jump-go': () => { const v = int(($('#jump-input') || {}).value, 0); closeSheet(); if (v) rdGo(v); },
    'jump-target': () => { closeSheet(); if (ui.reader) rdGo(ui.reader.start); },
    'rd-done': () => rdDone(),
    'rd-night': (el) => { state.settings.readerNight = !state.settings.readerNight; saveSoon(); const pg = $('#reader'); if (pg) pg.classList.toggle('night', state.settings.readerNight); el.innerHTML = svg(state.settings.readerNight ? 'sun' : 'moon'); el.setAttribute('aria-pressed', String(state.settings.readerNight)); },
    'rd-relink': () => { if (ui.reader) { const id = ui.reader.it.id; closePage(); pickFile('pdf', { relink: id }); } },
    // player
    'pl-toggle': () => { if (!ui.player || ui.player.loading) return; if (audio.paused) audio.play().catch(() => {}); else audio.pause(); },
    'pl-skip': (el) => { if (!ui.player) return; const d = int(el.getAttribute('data-d'), 0); try { audio.currentTime = clamp((audio.currentTime || 0) + d, 0, isFinite(audio.duration) ? audio.duration - 0.5 : 1e9); } catch (e) { /* ignore */ } plChrome(); },
    'pl-prev': () => { const p = ui.player; if (!p) return; if ((audio.currentTime || 0) > 5 || p.track === 0) { audio.currentTime = 0; plChrome(); } else plLoad(p.track - 1, 0, !audio.paused); },
    'pl-next': () => { const p = ui.player; if (p && p.track + 1 < p.it.tracks.length) plLoad(p.track + 1, 0, !audio.paused); },
    'pl-track': (el) => { const p = ui.player; if (!p) return; const i = int(el.getAttribute('data-i'), 0); if (i === p.track) { if (audio.paused) audio.play().catch(() => {}); else audio.pause(); return; } plLoad(i, 0, true); },
    'pl-speed': (el) => { const v = +el.getAttribute('data-v'); state.settings.speed = v; audio.playbackRate = v; audio.defaultPlaybackRate = v; saveSoon(); document.querySelectorAll('.speeds button').forEach((b) => b.setAttribute('aria-pressed', String(+b.getAttribute('data-v') === v))); },
    'pl-done': () => plDone()
  };
  function deleteOb(id) {
    state.obligations = state.obligations.filter((o) => o.id !== id);
    Object.keys(state.log).forEach((k) => { if (state.log[k][id]) { delete state.log[k][id]; if (!Object.keys(state.log[k]).length) delete state.log[k]; } });
    saveState();
    scheduleSoon();
    closePage();
    toast({ title: 'החובה נמחקה', icon: 'trash', tone: 'muted' });
  }
  function onClick(e) {
    const el = e.target.closest ? e.target.closest('[data-action]') : null;
    if (!el || el.disabled) return;
    const name = el.getAttribute('data-action');
    const fn = ACTIONS[name] || EXT.actions[name];
    if (!fn) return;
    e.preventDefault();
    try { fn(el, e); } catch (err) { console.error(err); }
  }
  function onChange(e) {
    const t = e.target;
    const act = t.getAttribute && t.getAttribute('data-change');
    if (!act) {
      if (t.getAttribute && t.getAttribute('data-bind') && t.getAttribute('data-num') && ui.editor) {
        setPath(ui.editor.d, t.getAttribute('data-bind'), Math.max(t.getAttribute('data-bind').endsWith('page') ? 1 : 0, int(t.value, 0)));
      }
      return;
    }
    const s = state.settings;
    switch (act) {
      case 'nightly-on': s.nightly.on = t.checked; break;
      case 'nightly-time': if (TIME_RE.test(t.value)) s.nightly.time = t.value; break;
      case 'quiet': s.shabbatQuiet = t.checked; break;
      case 'city': if (CITIES.some((c) => c.id === t.value)) s.city = t.value; break;
      case 'day-start': s.dayStart = clamp(int(t.value, 0), 0, 4); ui.todayKey = keyOf(todayDate()); ui.day = null; break;
      case 'haptics': s.haptics = t.checked; break;
      case 'ed-rem-on': if (ui.editor) { ui.editor.d.reminders.on = t.checked; if (t.checked && !ui.editor.d.reminders.times.length) ui.editor.d.reminders.times = ['20:00']; renderPage(false); } return;
      case 'ed-time': if (ui.editor && TIME_RE.test(t.value)) { const r = ui.editor.d.reminders; r.times[int(t.getAttribute('data-i'), 0)] = t.value; r.times = cleanTimes(r.times); renderPage(false); } return;
      default: return;
    }
    saveState();
    scheduleSoon();
    if (ui.page === 'onb') renderPage(false); else renderScreen();
  }
  function onInput(e) {
    const t = e.target;
    const b = t.getAttribute && t.getAttribute('data-bind');
    if (b && ui.editor && !t.getAttribute('data-num')) {
      setPath(ui.editor.d, b, t.value);
      if (b === 'name') { const sm = document.querySelector('.page-bar .title small'); if (sm) sm.textContent = t.value || 'בלי שם'; }
    }
    if (t.id === 'pl-range' && ui.player) {
      ui.player.seeking = true;
      try { audio.currentTime = +t.value; } catch (err) { /* ignore */ }
      t.style.setProperty('--p', ((+t.value / Math.max(1, +t.max)) * 100) + '%');
      clearTimeout(ui.seekT);
      ui.seekT = setTimeout(() => { if (ui.player) ui.player.seeking = false; }, 400);
    }
  }
  function onKey(e) {
    if (e.key === 'Escape') { if (ui.sheet) closeSheet(); else if (ui.page && ui.page !== 'onb') closePage(); return; }
    if (e.key === 'Enter' && e.target && e.target.getAttribute) {
      const act = e.target.getAttribute('data-enter');
      if (act && ACTIONS[act]) { e.preventDefault(); ACTIONS[act](e.target, e); }
      return;
    }
    if (ui.page === 'reader' && !ui.sheet && e.target === document.body) {
      if (e.key === 'ArrowLeft' || e.key === 'PageDown') rdGo(ui.reader.page + 1);
      if (e.key === 'ArrowRight' || e.key === 'PageUp') rdGo(ui.reader.page - 1);
    }
  }

  // ================= Demo data (used for screenshots and trying the app) =================
  function seedDemo() {
    const today = todayDate();
    const pdf = state.library.find((i) => i.kind === 'pdf');
    const au = state.library.find((i) => i.kind === 'audio');
    const mk = (t, extra) => { const d = normOb(Object.assign(newDraft(TEMPLATES.find((x) => x.key === t)), extra || {})); d.createdAt = keyOf(addDays(today, -40)); return d; };
    const obs = [
      mk('daf', pdf ? { name: 'פרקי אבות', task: { text: 'שני עמודים', src: { kind: 'pdf', item: pdf.id, page: 1, per: 2 } } } : null),
      mk('mishna'),
      mk('halacha', { reminders: { on: true, times: ['08:00', '22:00'] } }),
      mk('shiur', au ? { task: { text: 'שיעור אחד', src: { kind: 'audio', item: au.id, track: 0, time: 0, unit: 'tracks', per: 1 } } } : null),
      mk('chazara'),
      mk('mussar')
    ];
    state.obligations = obs;
    state.createdAt = keyOf(addDays(today, -40));
    state.log = {};
    let seed = 7;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let i = 40; i >= 1; i--) {
      const d = addDays(today, -i);
      const k = keyOf(d);
      obs.forEach((o) => {
        const inf = info(o, d);
        if (!inf.due) return;
        if (inf.kind === 'period' && inf.before >= inf.target) return;
        const miss = i < 9 ? 0 : 0.17;
        if (rnd() < miss) return;
        if (inf.kind === 'period' && d.getDay() !== 4) return;
        for (let n = 0; n < inf.target; n++) {
          if (!state.log[k]) state.log[k] = {};
          if (!state.log[k][o.id]) state.log[k][o.id] = [];
          const s = o.task.src;
          let w = o.task.text;
          if (s && s.kind === 'pdf') { w = 'עמודים ' + s.page + '–' + (s.page + 1); s.page += 2; if (pdf && pdf.pages && s.page > pdf.pages - 4) s.page = 3; }
          if (s && s.kind === 'audio') { w = 'שיעור ' + (s.track + 1); s.track = au && s.track + 1 < au.tracks.length - 1 ? s.track + 1 : 1; }
          state.log[k][o.id].push({ t: d.getTime() + n * 3600e3, w: w });
        }
      });
    }
    // today: some done
    const tk = keyOf(today);
    state.log[tk] = {};
    state.log[tk][obs[1].id] = [{ t: Date.now() - 3 * 3600e3, w: 'שתי משניות' }];
    state.log[tk][obs[2].id] = [{ t: Date.now() - 5 * 3600e3, w: 'סעיף במשנה ברורה' }];
    if (pdf) { obs[0].task.src.page = Math.min(4, pdf.pages || 4); pdf.lastPage = obs[0].task.src.page; }
    if (au) { obs[3].task.src.track = 2; au.lastTrack = 2; au.lastTime = 0; }
    state.settings.onboarded = true;
    saveState();
    ui.day = null;
    renderScreen();
  }

  // ================= Init =================
  async function initNative() {
    if (!isNative()) return;
    await listen('LocalNotifications', 'localNotificationActionPerformed', queueAction);
    await listen('App', 'backButton', onBack);
    await listen('App', 'appStateChange', (st) => { if (st && st.isActive) onResume(); });
  }
  async function init() {
    document.addEventListener('click', onClick);
    document.addEventListener('change', onChange);
    document.addEventListener('input', onInput);
    document.addEventListener('keydown', onKey);
    ['#file-pdf', '#file-audio', '#file-backup'].forEach((sel) => { const el = $(sel); if (el) el.addEventListener('change', () => onFilePicked(el)); });
    initNative();
    await loadState();
    applyTheme();
    try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (state.settings.theme === 'auto') { applyTheme(); renderAll(); } }); } catch (e) { /* ignore */ }
    ui.todayKey = keyOf(todayDate());
    renderScreen();
    if (!state.settings.onboarded) { ui.onb = { step: 1, picked: [] }; openPage('onb'); }
    flushActions();
    scheduleSoon();
    if (isNative()) refreshPermissions();
    setInterval(checkDayChange, 60e3);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) onResume(); else if (state) saveState(); });
    window.addEventListener('pagehide', () => { if (state) saveState(); });
  }

  // A tiny surface for automated checks and demo screenshots.
  window.__chovotai = {
    get state() { return state; }, set state(v) { state = normalize(v); renderAll(); },
    ui: ui, info: info, dayPlan: dayPlan, dayScore: dayScore, streak: streak, bestStreak: bestStreak, rate: rate,
    buildSchedule: (now) => buildSchedule(now), complete: complete, uncomplete: uncomplete, assignment: assignment,
    normalize: normalize, seedDemo: seedDemo, render: renderAll, keyOf: keyOf, parseKey: parseKey, todayDate: todayDate,
    openReader: openReader, openPlayer: openPlayer, openSheet: openSheet, inQuiet: inQuiet, hebDate: hebDate, fileGet: fileGet,
    // for feature files (share-app.js)
    ext: EXT, closeSheet: closeSheet, toast: toast, svg: svg, esc: esc, isNative: isNative, callRaw: callRaw, version: () => APP_VERSION
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
