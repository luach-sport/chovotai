"""End-to-end checks for חובותיי in headless Chromium.

Usage: serve www/ on http://127.0.0.1:8765 (python3 -m http.server 8765 -d www), then
       python3 tools/test_app.py <assets-dir>
assets-dir must hold: a small PDF named 'פרקי אבות.pdf', big.pdf (>12MB) and audio/*.wav
"""
import asyncio
import glob
import json
import os
import sys

from playwright.async_api import async_playwright

URL = 'http://127.0.0.1:8765/index.html'
A = sys.argv[1]
OK = []


def plain(t):
    return t.replace('\u2066', '').replace('\u2069', '')


def check(cond, msg):
    if not cond:
        raise AssertionError(msg)
    OK.append(msg)


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 393, 'height': 852}, device_scale_factor=2, locale='he-IL',
                                  timezone_id='Asia/Jerusalem', has_touch=True)
        page = await ctx.new_page()
        errors = []
        page.on('console', lambda m: errors.append(m.type + ': ' + m.text) if m.type == 'error' else None)
        page.on('pageerror', lambda e: errors.append('pageerror: ' + str(e)))
        ev = page.evaluate
        await page.goto(URL)
        await page.wait_for_selector('.onb')
        for k in ['daf', 'mishna', 'halacha', 'shiur']:
            await page.click('[data-action=onb-pick][data-key=%s]' % k)
        await page.click('[data-action=onb-next]')
        await page.click('[data-action=onb-finish]')
        await page.wait_for_selector('.ob')
        check(await ev('__chovotai.state.obligations.length') == 4, 'onboarding creates the picked obligations')
        ids = await ev('__chovotai.state.obligations.map(o => o.id)')
        tk = await ev('__chovotai.keyOf(__chovotai.todayDate())')

        # mark + unmark from home
        await page.click('.ob[data-ob="%s"] .check' % ids[1])
        check(await ev('(__chovotai.state.log["%s"]||{})["%s"].length' % (tk, ids[1])) == 1, 'check marks one session')
        check('1 מתוך' in await page.inner_text('.progress-card'), 'progress card updates')
        await page.click('.ob[data-ob="%s"] .check' % ids[1])
        check(await ev('!(__chovotai.state.log["%s"]||{})["%s"]' % (tk, ids[1])), 'second tap undoes')

        # import a PDF
        await page.click('[data-action=tab][data-tab=library]')
        await page.set_input_files('#file-pdf', os.path.join(A, 'פרקי אבות.pdf'))
        await page.wait_for_function('__chovotai.state.library.length === 1', timeout=20000)
        lib = await ev('__chovotai.state.library[0]')
        check(lib['pages'] == 7 and lib['name'] == 'פרקי אבות', 'PDF import counts pages and names the book')
        # import audio series
        files = sorted(glob.glob(os.path.join(A, 'audio', '*.wav')))
        await page.set_input_files('#file-audio', files)
        await page.wait_for_function('__chovotai.state.library.length === 2', timeout=60000)
        au = await ev('__chovotai.state.library[1]')
        check(len(au['tracks']) == 5 and au['name'] == 'הלכות שבת', 'audio import makes one named series: ' + au['name'])
        check(all(t['dur'] > 1000 for t in au['tracks']), 'audio durations are read')

        # link daf to the PDF through the editor
        await page.click('[data-action=tab][data-tab=home]')
        await page.click('.ob[data-ob="%s"] .tap' % ids[0])
        await page.click('.sheet [data-action=ob-edit]')
        await page.click('[data-action=ed-src][data-v=pdf]')
        await page.click('[data-action=ed-per][data-d="1"]')
        await page.click('.page-foot [data-action=ed-save]')
        src = await ev('__chovotai.state.obligations[0].task.src')
        check(src and src['kind'] == 'pdf' and src['per'] == 2 and src['page'] == 1, 'editor links a book with 2 pages per session')
        check('עמודים 1–2' in plain(await page.inner_text('.ob[data-ob="%s"]' % ids[0])), 'card shows the pages to learn')

        # reader opens at the right page, done advances
        await page.click('.ob[data-ob="%s"] .go' % ids[0])
        await page.wait_for_selector('#rd-wrap canvas', timeout=20000)
        check((await page.inner_text('#rd-sub')).startswith('עמוד 1 מתוך 7'), 'reader opens at page 1')
        await page.click('#rd-next')
        await page.wait_for_function('document.querySelector("#rd-sub").textContent.startsWith("עמוד 2")')
        await page.click('#rd-next')
        await page.wait_for_function('document.querySelector("#rd-sub").textContent.startsWith("עמוד 3")')
        check('קראת את' in await page.inner_text('#rd-target'), 'reader shows the daily part is done')
        await page.click('[data-action=rd-done]')
        await page.wait_for_selector('.toast')
        e = await ev('__chovotai.state.log["%s"]["%s"][0]' % (tk, ids[0]))
        src = await ev('__chovotai.state.obligations[0].task.src')
        check(plain(e['w']) == 'עמודים 1–3' and src['page'] == 4, 'done in reader logs pages read and moves to page 4')
        await page.click('[data-action=toast-act]')
        src = await ev('__chovotai.state.obligations[0].task.src')
        check(src['page'] == 1, 'undo moves the book back')
        # reopen: it must open at page 1 again and show page in sheet
        await page.click('.ob[data-ob="%s"] .go' % ids[0])
        await page.wait_for_selector('#rd-wrap canvas')
        check((await page.inner_text('#rd-sub')).startswith('עמוד 1'), 'reader reopens at the obligation page')
        # swipe right = next page
        box = await page.locator('#rd-view').bounding_box()
        y = box['y'] + 300
        await page.evaluate('''([x0,x1,y]) => { const v=document.querySelector('#rd-view');
          const mk=(t,x)=>new TouchEvent(t,{bubbles:true,touches:t==='touchend'?[]:[new Touch({identifier:1,target:v,clientX:x,clientY:y})],changedTouches:[new Touch({identifier:1,target:v,clientX:x,clientY:y})]});
          v.dispatchEvent(mk('touchstart',x0)); v.dispatchEvent(mk('touchend',x1)); }''', [box['x'] + 80, box['x'] + 300, y])
        await page.wait_for_function('document.querySelector("#rd-sub").textContent.startsWith("עמוד 2")')
        check(True, 'swipe to the right turns to the next page')
        await page.click('[data-action=page-close]')

        # big PDF via range loading
        await page.click('[data-action=tab][data-tab=library]')
        await page.set_input_files('#file-pdf', os.path.join(A, 'big.pdf'))
        await page.wait_for_function('__chovotai.state.library.length === 3', timeout=60000)
        check(await ev('__chovotai.state.library[2].pages') == 16, 'big PDF (range loading) counts 16 pages')
        bid = await ev('__chovotai.state.library[2].id')
        await page.click('.book [data-action=lib-open][data-id="%s"]' % bid)
        await page.wait_for_selector('#rd-wrap canvas', timeout=30000)
        await page.click('#rd-pg')
        await page.fill('#jump-input', '16')
        await page.click('[data-action=jump-go]')
        await page.wait_for_function('document.querySelector("#rd-sub").textContent.startsWith("עמוד 16")')
        await page.wait_for_function('document.querySelector("#rd-wrap canvas") && document.querySelector("#rd-wrap canvas").getAttribute("aria-label")==="עמוד 16"', timeout=30000)
        check(True, 'big PDF renders its last page')
        await page.click('[data-action=rd-zoom][data-d="1"]')
        await page.wait_for_function('document.querySelector("#rd-zoom").textContent==="135%"')
        check(True, 'zoom works')
        await page.click('[data-action=page-close]')

        # link the shiur obligation to the audio series and play
        await page.click('[data-action=tab][data-tab=home]')
        await page.click('.ob[data-ob="%s"] .tap' % ids[3])
        await page.click('.sheet [data-action=ob-edit]')
        await page.click('[data-action=ed-src][data-v=audio]')
        await page.click('.page-foot [data-action=ed-save]')
        check(await ev('__chovotai.state.obligations[3].task.src.kind') == 'audio', 'shiur linked to the series')
        await page.click('.ob[data-ob="%s"] .go' % ids[3])
        await page.wait_for_selector('#player')
        await page.wait_for_function('!__chovotai.ui.player.loading', timeout=20000)
        check('שיעור 1 מתוך 5' in await page.inner_text('#pl-count'), 'player opens at lesson 1')
        await page.click('[data-action=pl-skip][data-d="30"]')
        await page.click('[data-action=pl-done]')
        src = await ev('__chovotai.state.obligations[3].task.src')
        check(src['track'] == 1, 'done in player moves to the next lesson')

        # schedule logic
        res = await ev('''() => {
          const C = window.__chovotai, s = C.state, today = C.todayDate();
          const add = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12);
          const base = { id: 'x', name: 'x', createdAt: C.keyOf(add(today, -10)), task: { text: '' }, reminders: { on: true, times: ['10:00'] } };
          const st = C.normalize({ settings: { onboarded: true }, obligations: [
            Object.assign({}, base, { id: 'iv', freq: { type: 'interval', every: 3 } }),
            Object.assign({}, base, { id: 'wk', freq: { type: 'weekly', count: 2 } }),
            Object.assign({}, base, { id: 'dy', freq: { type: 'days', days: [today.getDay()] } }) ] });
          st.log[C.keyOf(add(today, -1))] = { iv: [{ t: 1, w: '' }] };
          C.state = st;
          const ivToday = C.info(C.state.obligations[0], today).due;
          const ivIn2 = C.info(C.state.obligations[0], add(today, 2)).due;
          const dyToday = C.info(C.state.obligations[2], today).due;
          const dyTomorrow = C.info(C.state.obligations[2], add(today, 1)).due;
          const wk = C.info(C.state.obligations[1], today);
          const sched = C.buildSchedule(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 1));
          const quietBad = sched.filter(n => C.inQuiet(n.schedule.at, { lat: 31.7683, lon: 35.2137 })).length;
          return { ivToday, ivIn2, dyToday, dyTomorrow, wkDue: wk.due, wkKind: wk.kind, n: sched.length, quietBad, ids: new Set(sched.map(n => n.id)).size };
        }''')
        check(res['ivToday'] is False and res['ivIn2'] is True, 'every-3-days logic')
        check(res['dyToday'] is True and res['dyTomorrow'] is False, 'fixed weekdays logic')
        check(res['wkDue'] is True and res['wkKind'] == 'period', 'weekly quota logic')
        check(res['n'] > 3 and res['quietBad'] == 0 and res['ids'] == res['n'], 'schedule: %d notifications, none on Shabbat, unique ids' % res['n'])

        # backup round trip
        same = await ev('() => { const C = window.__chovotai; const a = JSON.stringify(C.state); return JSON.stringify(C.normalize(JSON.parse(a))) === a; }')
        check(same, 'backup round trip is lossless')

        bad = [x for x in errors if 'cap-runtime' not in x and '404' not in x]
        check(not bad, 'no console errors' + (': ' + json.dumps(bad, ensure_ascii=False) if bad else ''))
        await b.close()


try:
    asyncio.run(main())
finally:
    for m in OK:
        print('✓', m)
