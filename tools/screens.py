"""Takes the screenshots used in docs/SPEC.md from the real app (headless Chromium).

Usage: serve www/ on http://127.0.0.1:8765, then
       python3 tools/screens.py <assets-dir> <out-dir>
"""
import asyncio
import glob
import os
import sys

from playwright.async_api import async_playwright

URL = 'http://127.0.0.1:8765/index.html'
A, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)

NOTIF = """<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8">
<link rel="stylesheet" href="http://127.0.0.1:8765/fonts/fonts.css">
<style>
body{margin:0;height:100vh;font-family:Heebo,sans-serif;background:linear-gradient(160deg,#2b4a57,#16262d 60%,#0f1a1f);color:#fff}
.sb{display:flex;justify-content:space-between;padding:14px 22px 0;font-size:14px;opacity:.9;direction:ltr}
.clock{text-align:center;font-size:64px;font-weight:300;margin:34px 0 0;direction:ltr}
.date{text-align:center;font-size:16px;opacity:.85;margin-bottom:26px}
.n{margin:10px 12px;background:rgba(245,240,230,.96);color:#1D2433;border-radius:22px;padding:14px 16px 10px;box-shadow:0 8px 24px rgba(0,0,0,.25)}
.h{display:flex;align-items:center;gap:8px;font-size:12.5px;color:#545B6B}
.ic{width:22px;height:22px;border-radius:50%;background:#1E5F74;display:grid;place-items:center}
.t{font-weight:700;font-size:16px;margin-top:6px}
.b{font-size:14.5px;color:#3a4150;margin-top:2px}
.a{display:flex;gap:18px;margin-top:10px;padding-top:8px;border-top:1px solid rgba(0,0,0,.08)}
.a span{color:#1E5F74;font-weight:700;font-size:14px}
.cap{margin:22px 18px 0;font-size:13px;opacity:.75;text-align:center;line-height:1.5}
</style></head><body>
<div class="sb"><span>21:30</span><span>▾ ◉ ▮</span></div>
<div class="clock">21:30</div><div class="date">יום שני, 12 באוקטובר · א׳ בחשון</div>
<div class="n"><div class="h"><span class="ic"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg></span>חובותיי · עכשיו</div>
<div class="t">נשארו 2 חובות להיום</div><div class="b">השלמת 2 מתוך 4. עוד לא סומנו: פרקי אבות ושיעור לשמיעה</div></div>
<div class="n"><div class="h"><span class="ic"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg></span>חובותיי · 21:00</div>
<div class="t">פרקי אבות</div><div class="b">עמודים ⁦4–5⁩ · פרקי אבות</div>
<div class="a"><span>סיימתי ✓</span><span>ללמוד עכשיו</span></div></div>
<div class="n"><div class="h"><span class="ic"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg></span>חובותיי · 19:00</div>
<div class="t">שיעור לשמיעה</div><div class="b">שיעור 3 · הלכות שבת</div>
<div class="a"><span>סיימתי ✓</span><span>ללמוד עכשיו</span></div></div>
<div class="cap">איור להמחשה. "סיימתי" מסמן ישר מההתראה,<br>"ללמוד עכשיו" פותח את הספר בעמוד הנכון.</div>
</body></html>"""


async def shot(page, name, full=False):
    await page.wait_for_timeout(450)
    await page.screenshot(path=os.path.join(OUT, name + '.png'), full_page=full)
    print('saved', name)


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 393, 'height': 852}, device_scale_factor=2, locale='he-IL',
                                  timezone_id='Asia/Jerusalem', has_touch=True, color_scheme='light')
        page = await ctx.new_page()
        await page.goto(URL)
        await page.wait_for_selector('.onb')
        for k in ['daf', 'mishna', 'halacha', 'shiur', 'chazara']:
            await page.click('[data-action=onb-pick][data-key=%s]' % k)
        await shot(page, '01-onboarding')
        await page.click('[data-action=onb-next]')
        await shot(page, '01b-onboarding-reminder')
        await page.click('[data-action=onb-finish]')
        await page.wait_for_selector('.ob')
        await page.wait_for_timeout(3600)
        # library content
        await page.set_input_files('#file-pdf', os.path.join(A, 'פרקי אבות.pdf'))
        await page.wait_for_function('__chovotai.state.library.length === 1', timeout=20000)
        await page.set_input_files('#file-audio', sorted(glob.glob(os.path.join(A, 'audio', '*.wav'))))
        await page.wait_for_function('__chovotai.state.library.length === 2', timeout=60000)
        await page.evaluate('__chovotai.seedDemo()')
        await page.evaluate('document.querySelector("#toast-root").innerHTML = ""')
        await page.evaluate('window.scrollTo(0,0)')
        await shot(page, '02-home')
        await page.evaluate('window.scrollTo(0, 560)')
        await shot(page, '02b-home-more')
        await page.evaluate('window.scrollTo(0,0)')
        ids = await page.evaluate('__chovotai.state.obligations.map(o => o.id)')
        # mark one to show the toast
        await page.click('.ob[data-ob="%s"] .check' % ids[3])
        await page.wait_for_timeout(300)
        await shot(page, '03-marked')
        await page.evaluate('document.querySelector("#toast-root").innerHTML = ""')
        # details sheet
        await page.click('.ob[data-ob="%s"] .tap' % ids[0])
        await shot(page, '04-sheet')
        await page.click('.sheet [data-action=ob-edit]')
        await shot(page, '05-editor')
        await page.evaluate('document.querySelector(".page .page-body").scrollTop = 600')
        await shot(page, '05b-editor-more')
        await page.click('[data-action=page-close]')
        await page.wait_for_timeout(300)
        # reader
        await page.click('.ob[data-ob="%s"] .go' % ids[0])
        await page.wait_for_selector('#rd-wrap canvas', timeout=20000)
        await shot(page, '06-reader')
        await page.click('[data-action=page-close]')
        await page.wait_for_timeout(300)
        # player (open from the library entry so it doesn't autoplay into silence)
        await page.evaluate('__chovotai.uncomplete(__chovotai.state.obligations[3], __chovotai.keyOf(__chovotai.todayDate())); __chovotai.render()')
        await page.click('.ob[data-ob="%s"] .go' % ids[3])
        await page.wait_for_selector('#player')
        await page.wait_for_function('!__chovotai.ui.player.loading', timeout=20000)
        await page.evaluate('() => { const a = [...document.querySelectorAll("audio")]; }')
        await page.click('[data-action=pl-skip][data-d="30"]')
        for _ in range(16):
            await page.click('[data-action=pl-skip][data-d="30"]')
        await page.wait_for_timeout(600)
        await page.evaluate('document.querySelector("#player .page-body").scrollTop = 0')
        await shot(page, '07-player')
        await page.click('[data-action=page-close]')
        await page.wait_for_timeout(300)
        # tabs
        await page.click('[data-action=tab][data-tab=library]')
        await shot(page, '08-library')
        await page.click('[data-action=tab][data-tab=progress]')
        await shot(page, '09-progress')
        await page.evaluate('window.scrollTo(0, 620)')
        await shot(page, '09b-progress-more')
        await page.click('[data-action=tab][data-tab=settings]')
        await shot(page, '10-settings')
        await page.evaluate('window.scrollTo(0, 820)')
        await shot(page, '10b-settings-more')
        await page.click('[data-action=tab][data-tab=home]')
        await page.click('.add-btn')
        await shot(page, '11-add')
        await page.mouse.click(200, 30)
        await page.wait_for_timeout(300)
        # dark theme
        await page.evaluate('__chovotai.state.settings.theme = "dark"; document.documentElement.setAttribute("data-theme","dark"); __chovotai.render(); window.scrollTo(0,0)')
        await shot(page, '12-dark')
        await page.click('.ob[data-ob="%s"] .go' % ids[0])
        await page.wait_for_selector('#rd-wrap canvas', timeout=20000)
        await page.click('[data-action=rd-night]')
        await shot(page, '13-reader-night')
        await page.set_content(NOTIF)
        await page.wait_for_timeout(500)
        await shot(page, '14-notifications')
        await b.close()


asyncio.run(main())
