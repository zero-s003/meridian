"""Behaviour checks for MERIDIAN. Run with the dev server on :5174."""

import hashlib
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:5174/"
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "shots" / "interact"

GPU_ARGS = [
    "--use-gl=angle",
    "--use-angle=d3d11",
    "--enable-gpu",
    "--ignore-gpu-blocklist",
]

results = []


def check(name, condition, detail=""):
    results.append((name, bool(condition), detail))
    print(("PASS " if condition else "FAIL ") + name + (f" — {detail}" if detail and not condition else ""))


def goto_chapter(page, index):
    page.evaluate(
        """(i) => {
            const section = document.querySelectorAll('.chapter')[i];
            const rect = section.getBoundingClientRect();
            window.scrollTo({ top: rect.top + window.scrollY + rect.height * 0.5 - innerHeight * 0.5, behavior: 'instant' });
        }""",
        index,
    )
    page.wait_for_timeout(1800)


def canvas_hash(page):
    data = page.locator("#stage").screenshot()
    return hashlib.sha1(data).hexdigest()


def main() -> None:
    errors = []
    bad_responses = []
    OUT.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="msedge", headless=True, args=GPU_ARGS)
        context = browser.new_context(viewport={"width": 1440, "height": 900}, locale="zh-CN")
        page = context.new_page()
        page.on("console", lambda msg: errors.append(f"console.{msg.type}: {msg.text}") if msg.type == "error" else None)
        page.on("pageerror", lambda err: errors.append(f"pageerror: {err}"))
        page.on("response", lambda res: bad_responses.append(f"{res.status} {res.url}") if res.status >= 400 else None)

        page.goto(URL + "?tier=A&lock=1", wait_until="networkidle")
        page.wait_for_function("window.__MERIDIAN_READY__ === true", timeout=30000)
        page.wait_for_timeout(800)

        check("chapters = 7", page.locator(".chapter").count() == 7)
        check("no horizontal overflow desktop", page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"))
        check("webgl booted", page.evaluate("window.__MERIDIAN_DEBUG__.hasWebGL === true"))
        check("desktop tier A", page.evaluate("window.__MERIDIAN_DEBUG__.tier") == "A")

        # skip link is the first tab stop
        page.keyboard.press("Tab")
        check("skip link first tab stop", page.evaluate("document.activeElement?.classList.contains('skip-link')"))

        # live clock
        first_time = page.locator("#dial-time").inner_text()
        page.wait_for_timeout(1300)
        second_time = page.locator("#dial-time").inner_text()
        check("live clock advances", first_time != second_time, f"{first_time} vs {second_time}")

        # drag inspection
        before = page.evaluate("window.__MERIDIAN_DEBUG__.camera.dragAz")
        page.mouse.move(820, 420)
        page.mouse.down()
        page.mouse.move(1060, 470, steps=12)
        page.mouse.up()
        page.wait_for_timeout(500)
        after = page.evaluate("window.__MERIDIAN_DEBUG__.camera.dragAz")
        check("drag rotates the watch", abs(after - before) > 0.05, f"{before} -> {after}")

        # case hotspots + dialog
        goto_chapter(page, 1)
        page.wait_for_timeout(600)
        check("chapter state follows scroll", page.evaluate("document.body.dataset.chapter") == "1")
        visible = page.locator(".hotspot.is-visible")
        check("case hotspots visible", visible.count() >= 1, str(visible.count()))
        if visible.count():
            visible.first.click()
            page.wait_for_timeout(300)
            check("hotspot dialog opens", page.evaluate("document.getElementById('hotspot-dialog').open === true"))
            check("dialog holds focus", page.evaluate("document.getElementById('hotspot-dialog').contains(document.activeElement)"))
            page.keyboard.press("Escape")
            page.wait_for_timeout(250)
            check("Escape closes dialog", page.evaluate("document.getElementById('hotspot-dialog').open === false"))

        # crown: buttons and pointer drag
        goto_chapter(page, 3)
        page.wait_for_timeout(700)
        reserve0 = page.evaluate("window.__MERIDIAN_DEBUG__.reserve")
        page.click('[data-wind="6"]')
        page.wait_for_timeout(250)
        reserve1 = page.evaluate("window.__MERIDIAN_DEBUG__.reserve")
        check("wind button adds reserve", reserve1 > reserve0, f"{reserve0} -> {reserve1}")
        page.click('[data-wind="72"]')
        page.wait_for_timeout(250)
        check("full wind reaches 72h", abs(page.evaluate("window.__MERIDIAN_DEBUG__.reserve") - 72) < 0.01)
        arc = page.evaluate("parseFloat(document.getElementById('reserve-arc').style.strokeDashoffset)")
        check("reserve arc updates", arc < 5, str(arc))

        page.evaluate("document.getElementById('hotspots').style.display = 'none'")
        page.evaluate("window.__MERIDIAN_DEBUG__.setReserve(30)")
        page.wait_for_timeout(400)
        crown = page.evaluate("window.__MERIDIAN_DEBUG__.projectPoint([2.06, 0, 0.02])")
        if 0 < crown["x"] < 1440 and 0 < crown["y"] < 900:
            before_drag = page.evaluate("window.__MERIDIAN_DEBUG__.reserve")
            page.mouse.move(crown["x"], crown["y"])
            page.mouse.down()
            page.mouse.move(crown["x"], crown["y"] + 130, steps=14)
            page.mouse.up()
            page.wait_for_timeout(400)
            after_drag = page.evaluate("window.__MERIDIAN_DEBUG__.reserve")
            check("crown drag winds", after_drag > before_drag + 2, f"{before_drag} -> {after_drag}")
        else:
            check("crown is on screen", False, str(crown))
        page.evaluate("document.getElementById('hotspots').style.display = ''")

        # calibre exploded view (start of the chapter, where the scroll story
        # has not already opened the movement)
        page.evaluate(
            """() => {
                const section = document.querySelectorAll('.chapter')[4];
                const rect = section.getBoundingClientRect();
                window.scrollTo({ top: rect.top + window.scrollY + rect.height * 0.18 - innerHeight * 0.5, behavior: 'instant' });
            }"""
        )
        page.wait_for_timeout(1800)
        page.click("#explode-toggle")
        page.wait_for_timeout(1600)
        exploded = page.evaluate("window.__MERIDIAN_DEBUG__.explode")
        check("manual explosion opens", exploded > 0.7, f"explode={exploded}")
        check("explode button pressed", page.get_attribute("#explode-toggle", "aria-pressed") == "true")
        page.screenshot(path=str(OUT / "exploded.png"))
        page.click("#explode-toggle")
        page.wait_for_timeout(1600)
        check("manual explosion closes", page.evaluate("window.__MERIDIAN_DEBUG__.explode") < 0.15)

        # configurator
        goto_chapter(page, 5)
        page.wait_for_timeout(800)
        hash_before = canvas_hash(page)
        page.locator('label:has-text("象牙")').click()
        page.wait_for_timeout(900)
        check("dial option updates hash", "d=iv" in page.evaluate("location.hash"))
        page.locator('label:has-text("18K 玫瑰金")').click()
        page.wait_for_timeout(900)
        check("rose gold option updates hash", "m=rg" in page.evaluate("location.hash"))
        check("price updates", "114,000" in page.locator("#price").inner_text())
        page.locator('label:has-text("棕色小牛皮")').click()
        page.wait_for_timeout(900)
        check("strap option updates hash", "s=br" in page.evaluate("location.hash"))
        hash_after = canvas_hash(page)
        check("materials change the render", hash_before != hash_after)
        page.screenshot(path=str(OUT / "configured.png"))

        # focus and overflow while scrolled
        check("no horizontal overflow at yours", page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"))

        # fps
        page.wait_for_timeout(1200)
        fps = page.evaluate("window.__MERIDIAN_FPS__")
        check("fps above 30 in headless GPU", (fps or 0) > 30, str(fps))

        context.close()

        # ——— mobile ———
        mobile = browser.new_context(
            viewport={"width": 390, "height": 844},
            locale="zh-CN",
            is_mobile=True,
            has_touch=True,
        )
        phone = mobile.new_page()
        phone.on("pageerror", lambda err: errors.append(f"mobile pageerror: {err}"))
        phone.goto(URL + "?tier=B&lock=1", wait_until="networkidle")
        phone.wait_for_function("window.__MERIDIAN_READY__ === true", timeout=30000)
        phone.wait_for_timeout(800)
        check("no horizontal overflow mobile", phone.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"))
        goto_chapter(phone, 3)
        phone.wait_for_timeout(600)
        phone.locator('[data-wind="6"]').tap()
        phone.wait_for_timeout(300)
        check("mobile wind tap works", phone.evaluate("window.__MERIDIAN_DEBUG__.reserve") > 12)
        phone.evaluate("document.querySelector('#hotspots .hotspot:not([hidden])')?.click()")
        phone.wait_for_timeout(300)
        opened = phone.evaluate("document.getElementById('hotspot-dialog').open")
        if opened:
            phone.keyboard.press("Escape")
        check("mobile hotspot sheet opens", opened)
        phone.screenshot(path=str(OUT / "mobile-crown.png"))
        mobile.close()

        # ——— reduced motion ———
        reduced = browser.new_context(
            viewport={"width": 1280, "height": 800},
            reduced_motion="reduce",
            locale="zh-CN",
        )
        rpage = reduced.new_page()
        rpage.on("pageerror", lambda err: errors.append(f"reduced pageerror: {err}"))
        rpage.goto(URL + "?tier=B&lock=1", wait_until="networkidle")
        rpage.wait_for_function("window.__MERIDIAN_READY__ === true", timeout=30000)
        check("reduced motion class present", rpage.evaluate("document.documentElement.classList.contains('reduced')"))
        goto_chapter(rpage, 2)
        rpage.wait_for_timeout(500)
        check("reduced motion keeps camera stable", rpage.evaluate("Math.abs(window.__MERIDIAN_DEBUG__.camera.dragAz) < 0.01"))
        reduced.close()

        # ——— no WebGL fallback ———
        fallback = browser.new_context(viewport={"width": 1280, "height": 800}, locale="zh-CN")
        fpage = fallback.new_page()
        fpage.add_init_script(
            """
            const original = HTMLCanvasElement.prototype.getContext;
            HTMLCanvasElement.prototype.getContext = function (type, ...args) {
              if (String(type).startsWith('webgl')) return null;
              return original.call(this, type, ...args);
            };
            """
        )
        fpage.goto(URL, wait_until="networkidle")
        fpage.wait_for_function("window.__MERIDIAN_READY__ === true", timeout=30000)
        fpage.wait_for_timeout(500)
        check("no-webgl fallback visible", fpage.evaluate("!document.getElementById('fallback').hidden"))
        check("no-webgl keeps the story", fpage.locator("h2").count() >= 5)
        check("fallback poster loaded", fpage.evaluate("document.querySelector('#fallback img').naturalWidth > 0"))
        fallback.close()
        browser.close()

    print("\n--- summary ---")
    passed = sum(1 for _, ok, _ in results if ok)
    print(f"{passed}/{len(results)} passed")
    if errors:
        print("console/page errors:")
        for error in errors:
            print(" ", error)
    if bad_responses:
        print("bad responses:")
        for response in bad_responses:
            print(" ", response)
    failed = [name for name, ok, detail in results if not ok]
    if failed:
        print("failed:", ", ".join(failed))
        sys.exit(1)


if __name__ == "__main__":
    main()
