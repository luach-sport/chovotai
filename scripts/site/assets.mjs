// Example files for the screenshots on חובותיי's site: a small book (PDF) and a series of shiurim (audio).
// The book is printed by the browser from a page of Pirkei Avot (public domain) in the app's own font;
// the shiurim are quiet WAV files, so the player has real tracks to show.

const AVOT = [
  'משה קבל תורה מסיני, ומסרה ליהושע, ויהושע לזקנים, וזקנים לנביאים, ונביאים מסרוה לאנשי כנסת הגדולה. הם אמרו שלשה דברים: הוו מתונים בדין, והעמידו תלמידים הרבה, ועשו סיג לתורה.',
  'שמעון הצדיק היה משירי כנסת הגדולה. הוא היה אומר: על שלשה דברים העולם עומד, על התורה ועל העבודה ועל גמילות חסדים.',
  'אנטיגנוס איש סוכו קבל משמעון הצדיק. הוא היה אומר: אל תהיו כעבדים המשמשין את הרב על מנת לקבל פרס, אלא הוו כעבדים המשמשין את הרב שלא על מנת לקבל פרס, ויהי מורא שמים עליכם.',
  'יוסי בן יועזר איש צרדה ויוסי בן יוחנן איש ירושלים קבלו מהם. יוסי בן יועזר איש צרדה אומר: יהי ביתך בית ועד לחכמים, והוי מתאבק בעפר רגליהם, והוי שותה בצמא את דבריהם.',
  'יוסי בן יוחנן איש ירושלים אומר: יהי ביתך פתוח לרוחה, ויהיו עניים בני ביתך.',
  'יהושע בן פרחיה ונתאי הארבלי קבלו מהם. יהושע בן פרחיה אומר: עשה לך רב, וקנה לך חבר, והוי דן את כל האדם לכף זכות.',
  'נתאי הארבלי אומר: הרחק משכן רע, ואל תתחבר לרשע, ואל תתיאש מן הפורענות.',
  'יהודה בן טבאי ושמעון בן שטח קבלו מהם. שמעון בן שטח אומר: הוי מרבה לחקור את העדים, והוי זהיר בדבריך, שמא מתוכם ילמדו לשקר.'
];
const LETTERS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח'];

function bookHtml(base) {
  const page = (body, n) => '<section><div class="hd">פרקי אבות · פרק ראשון</div>' + body + '<div class="ft">' + n + '</div></section>';
  const pages = ['<section class="cover"><h1>פרקי אבות</h1><p>פרק ראשון</p><div class="orn">✦</div></section>']
    .concat(AVOT.map((t, i) => page('<h2>משנה ' + LETTERS[i] + '</h2><p>' + t + '</p>', i + 2)));
  return '<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><link rel="stylesheet" href="' + base + '/app/fonts/fonts.css"><style>' +
    '@page{size:A5;margin:0}body{margin:0;font-family:"Frank Ruhl Libre",serif;color:#2a2416;background:#fbf6ea}' +
    'section{width:148mm;height:210mm;box-sizing:border-box;padding:18mm 16mm;position:relative;page-break-after:always;background:#fbf6ea}' +
    '.cover{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.cover h1{font-size:44pt;margin:0}.cover p{font-size:20pt;margin:6mm 0}.orn{font-size:22pt;color:#9a7a3a}' +
    '.hd{text-align:center;font-size:10pt;color:#8a7a5a;border-bottom:1px solid #d9ccae;padding-bottom:3mm;margin-bottom:10mm}' +
    'h2{font-size:18pt;margin:0 0 6mm;color:#6b5320}p{font-size:17pt;line-height:1.75;text-align:justify;margin:0}.ft{position:absolute;bottom:10mm;left:0;right:0;text-align:center;font-size:11pt;color:#8a7a5a}' +
    '</style></head><body>' + pages.join('') + '</body></html>';
}

function wav(seconds) {
  const rate = 8000, n = rate * seconds;
  const b = Buffer.alloc(44 + n, 128);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n, 4); b.write('WAVE', 8); b.write('fmt ', 12);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(rate, 24);
  b.writeUInt32LE(rate, 28); b.writeUInt16LE(1, 32); b.writeUInt16LE(8, 34); b.write('data', 36); b.writeUInt32LE(n, 40);
  for (let i = 0; i < n; i++) b[44 + i] = 128 + Math.round(2 * Math.sin(i / 9));
  return b;
}

// Returned as file payloads (name + bytes): the browser gets the Hebrew file names exactly, which a path
// on disk doesn't always manage.
export async function makeAssets(page, base) {
  const printer = await page.context().browser().newPage();
  await printer.setContent(bookHtml(base));
  await printer.evaluate(() => document.fonts.ready);
  await printer.waitForTimeout(400);
  const pdf = { name: 'פרקי אבות.pdf', mimeType: 'application/pdf', buffer: await printer.pdf({ format: 'A5', printBackground: true }) };
  await printer.close();
  const audio = [1, 2, 3, 4, 5].map((i) => ({ name: 'הלכות שבת - שיעור ' + i + '.wav', mimeType: 'audio/wav', buffer: wav(150 + i * 20) }));
  return { pdf, audio };
}
