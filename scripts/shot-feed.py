from pathlib import Path
from playwright.sync_api import sync_playwright

out = Path.cwd()
html_path = out / 'feed-preview.html'
if not html_path.exists():
    html_path = Path(__file__).resolve().parent.parent / '.preview' / 'feed-preview.html'
shot = out / 'feed-preview.png' if out.name == '.preview' else html_path.with_name('feed-preview.png')
html = html_path.resolve().as_uri()

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 440, 'height': 720})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(html, wait_until='domcontentloaded')
    page.wait_for_timeout(800)
    info = page.evaluate(
        """() => ({
          progress: document.getElementById('progress')?.textContent,
          cards: document.querySelectorAll('.card').length,
          chrome: !!document.querySelector('.card-chrome'),
          title: document.querySelector('.card-title')?.textContent || '',
          body: (document.querySelector('.card-body')?.textContent || '').slice(0, 160),
          hasCountdown: !!document.getElementById('closeCountdown'),
          hasKeepOpen: !!document.getElementById('keepOpenBtn'),
        })"""
    )
    if info.get('hasCountdown') and info.get('hasKeepOpen'):
        page.evaluate('() => { if (typeof startCloseCountdown === "function") startCloseCountdown(); }')
        page.wait_for_timeout(200)
        countdown = page.evaluate(
            """() => ({
              visible: document.getElementById('closeCountdown')?.classList.contains('visible'),
              number: document.getElementById('countdownNumber')?.textContent,
              keepLabel: document.getElementById('keepOpenBtn')?.textContent,
            })"""
        )
        info['countdown'] = countdown
        page.screenshot(path=str(shot))
        if not countdown['visible'] or countdown['number'] != '3' or 'Keep' not in (countdown['keepLabel'] or ''):
            browser.close()
            raise SystemExit('PREVIEW FAIL: countdown overlay ' + str(countdown))
    else:
        page.screenshot(path=str(shot))
    browser.close()
    print(info)
    if errors:
        raise SystemExit('PAGEERROR: ' + '; '.join(errors))
    if info['cards'] < 1 or not info['chrome'] or info['progress'] in ('— / —', '- / -'):
        raise SystemExit('PREVIEW FAIL: empty UI ' + str(info))
    if len(info['body'].strip()) < 40:
        raise SystemExit('PREVIEW FAIL: summary too short ' + str(info))
    if not info.get('hasCountdown') or not info.get('hasKeepOpen'):
        raise SystemExit('PREVIEW FAIL: missing countdown chrome ' + str(info))
    print('PREVIEW OK')
