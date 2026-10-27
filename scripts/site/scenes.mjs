// The screenshots on חובותיי's site, taken by the Itzko site kit (kit/lib/shots.mjs in luach-sport/itzko).
// The app starts empty, so the first scenes go through the first-run screens, then a book and a series of
// shiurim are added and __chovotai.seedDemo() fills six weeks of learning. Each scene's `run` drives the
// page from Node; `scroll: null` keeps the scroll position the scene set.
import { makeAssets } from './assets.mjs';
import { notificationsHtml } from './notifications.mjs';

export async function prepare(page, { base }) {
  const files = await makeAssets(page, base);
  return { files, base };
}

// Before every scene: close a bottom sheet if one is open, and clear the little messages.
export const reset = () => {
  const C = window.__chovotai;
  if (C && C.ui.sheet) C.closeSheet();
  const t = document.querySelector('#toast-root');
  if (t) t.innerHTML = '';
};

const close = (page) => page.evaluate(() => { const b = document.querySelector('[data-action=page-close]'); if (b) b.click(); }).then(() => page.waitForTimeout(350));
const tab = (page, name) => page.click('[data-action=tab][data-tab=' + name + ']').then(() => page.evaluate(() => window.scrollTo(0, 0)));
const ids = (page) => page.evaluate(() => window.__chovotai.state.obligations.map((o) => o.id));
const top = (page) => page.evaluate(() => window.scrollTo(0, 0));

export const SCENES = [
  { name: 'onb', scroll: null, run: async (page) => {
    await page.waitForSelector('.onb');
    for (const k of ['daf', 'mishna', 'halacha', 'shiur', 'chazara']) await page.click('[data-action=onb-pick][data-key=' + k + ']');
    await page.evaluate(() => { document.querySelectorAll('.page .page-body, .onb').forEach((el) => { el.scrollTop = 0; }); window.scrollTo(0, 0); });
  } },
  { name: 'onb-reminder', scroll: null, run: (page) => page.click('[data-action=onb-next]') },
  { name: 'home', scroll: null, wait: 700, run: async (page, { files }) => {
    await page.click('[data-action=onb-finish]');
    await page.waitForSelector('.ob');
    await page.waitForTimeout(1200);
    await page.setInputFiles('#file-pdf', files.pdf);
    await page.waitForFunction(() => window.__chovotai.state.library.length === 1, null, { timeout: 30000 });
    await page.setInputFiles('#file-audio', files.audio);
    await page.waitForFunction(() => window.__chovotai.state.library.length === 2, null, { timeout: 60000 });
    await page.evaluate(() => window.__chovotai.seedDemo());
    await page.waitForTimeout(400);
    await page.evaluate(() => { document.querySelector('#toast-root').innerHTML = ''; window.scrollTo(0, 0); });
  } },
  { name: 'home-more', scroll: null, run: (page) => page.evaluate(() => window.scrollTo(0, 560)) },
  { name: 'marked', scroll: null, wait: 300, run: async (page) => {
    await top(page);
    const list = await ids(page);
    await page.click('.ob[data-ob="' + list[3] + '"] .check');
  } },
  { name: 'ob-sheet', scroll: null, wait: 700, run: async (page) => {
    await top(page);
    const list = await ids(page);
    await page.evaluate((id) => { const C = window.__chovotai; C.uncomplete(C.state.obligations.find((o) => o.id === id), C.keyOf(C.todayDate())); C.render(); }, list[3]);
    await page.click('.ob[data-ob="' + list[0] + '"] .tap');
  } },
  { name: 'editor', scroll: null, wait: 700, run: async (page) => {
    const list = await ids(page);
    await page.waitForTimeout(300);
    await page.click('.ob[data-ob="' + list[0] + '"] .tap');
    await page.click('.sheet [data-action=ob-edit]');
  } },
  { name: 'editor-more', scroll: null, run: (page) => page.evaluate(() => { document.querySelector('.page .page-body').scrollTop = 600; }) },
  { name: 'reader', scroll: null, wait: 900, run: async (page) => {
    await close(page);
    await top(page);
    const list = await ids(page);
    await page.click('.ob[data-ob="' + list[0] + '"] .go');
    await page.waitForSelector('#rd-wrap canvas', { timeout: 30000 });
  } },
  { name: 'reader-night', scroll: null, wait: 700, run: (page) => page.click('[data-action=rd-night]') },
  { name: 'player', scroll: null, wait: 600, run: async (page) => {
    await page.click('[data-action=rd-night]');
    await close(page);
    await top(page);
    const list = await ids(page);
    await page.click('.ob[data-ob="' + list[3] + '"] .go');
    await page.waitForSelector('#player');
    await page.waitForFunction(() => !window.__chovotai.ui.player || !window.__chovotai.ui.player.loading, null, { timeout: 30000 });
    for (let i = 0; i < 3; i++) await page.click('[data-action=pl-skip][data-d="30"]');
    await page.evaluate(() => { const b = document.querySelector('#player .page-body'); if (b) b.scrollTop = 0; });
  } },
  { name: 'library', run: async (page) => { await close(page); await tab(page, 'library'); } },
  { name: 'progress', run: (page) => tab(page, 'progress') },
  { name: 'progress-more', scroll: null, run: (page) => page.evaluate(() => window.scrollTo(0, 620)) },
  { name: 'settings', run: (page) => tab(page, 'settings') },
  { name: 'settings-more', scroll: null, run: (page) => page.evaluate(() => window.scrollTo(0, 820)) },
  { name: 'settings-end', scroll: 'bottom', run: (page) => tab(page, 'settings') },
  { name: 'share-app', scroll: 'bottom', wait: 700, run: (page) => page.click('[data-action=share-app]') },
  { name: 'add', wait: 700, run: async (page) => { await tab(page, 'home'); await page.click('.add-btn'); } },
  { name: 'notif', scroll: null, run: async (page, { base }) => { await page.setContent(notificationsHtml(base)); await page.waitForTimeout(400); } }
];
