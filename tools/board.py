"""Builds docs/screens/overview.png: all the main screens on one board.

Usage: python3 tools/board.py <shots-dir> <out-png>   (needs Playwright + Chromium)
"""
import asyncio
import os
import sys

from playwright.async_api import async_playwright

SHOTS, OUT = os.path.abspath(sys.argv[1]), sys.argv[2]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ITEMS = [
    ('01-onboarding', 'פתיחה', 'בוחרים חובות מרשימה מוכנה'),
    ('02-home', 'מסך הבית', 'פס ההתקדמות של היום והחובות'),
    ('03-marked', 'סימון בלחיצה', 'עם אפשרות לבטל מיד'),
    ('04-sheet', 'פרטי חובה', 'מה הבא בתור, מה למדת היום'),
    ('05-editor', 'הגדרת חובה', 'שם, סמל ותדירות'),
    ('05b-editor-more', 'מה לומדים', 'ספר PDF, עמוד התחלה וכמות'),
    ('06-reader', 'הספר נפתח בעמוד הנכון', 'וכפתור "סיימתי"'),
    ('07-player', 'נגן שיעורים', 'ממשיך מאיפה שעצרת'),
    ('08-library', 'הספרייה', 'ספרים וקבצי שמע בטלפון'),
    ('09-progress', 'התקדמות', 'רצפים, אחוזים ולוח חודשי'),
    ('10-settings', 'הגדרות', 'החובות, תזכורות וגיבוי'),
    ('14-notifications', 'תזכורות', 'לכל חובה, וסיכום בסוף היום'),
]


async def main():
    cards = ''.join(
        '<figure><div class="ph"><img src="file://%s/%s.png"></div><figcaption><b>%s</b><span>%s</span></figcaption></figure>'
        % (SHOTS, f, t, s) for f, t, s in ITEMS)
    html = '''<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8">
<link rel="stylesheet" href="file://%s/www/fonts/fonts.css">
<style>
body{margin:0;background:#EFE8DA;font-family:Heebo,sans-serif;color:#1D2433;padding:44px 48px 40px;width:1456px}
header{display:flex;align-items:center;gap:18px;margin-bottom:30px}
header img{width:72px;height:72px;border-radius:20px}
h1{font-family:'Frank Ruhl Libre',serif;font-size:44px;margin:0;line-height:1}
p{margin:6px 0 0;color:#545B6B;font-size:18px}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:34px 30px}
figure{margin:0;text-align:center}
.ph{background:#1D2433;border-radius:38px;padding:9px;box-shadow:0 14px 34px rgba(40,30,10,.22)}
.ph img{width:100%%;display:block;border-radius:30px}
figcaption{margin-top:12px}
figcaption b{display:block;font-size:19px}
figcaption span{display:block;color:#545B6B;font-size:15px}
</style></head><body><header><img src="file://%s/www/icon.png"><div><h1>חובותיי · סקיצות מסכים</h1><p>גרסה ראשונה · צילומי מסך מהאפליקציה עצמה, עם נתוני דוגמה</p></div></header>
<div class="grid">%s</div></body></html>''' % (ROOT, ROOT, cards)
    path = os.path.join(os.path.dirname(os.path.abspath(OUT)), '_board.html')
    with open(path, 'w', encoding='utf8') as f:
        f.write(html)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1552, 'height': 900}, device_scale_factor=1)
        await pg.goto('file://' + path)
        await pg.wait_for_timeout(800)
        await pg.screenshot(path=OUT, full_page=True)
        await b.close()
    os.remove(path)


asyncio.run(main())
