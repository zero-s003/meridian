"""Capture MERIDIAN at every chapter for visual review."""

import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:5174/"
if "desktop" in sys.argv:
    URL += "?tier=A&lock=1"
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "shots"

VIEWPORTS = {
    "desktop": {"width": 1440, "height": 900},
    "tablet": {"width": 834, "height": 1112},
    "mobile": {"width": 390, "height": 844},
}
LABEL = next((arg for arg in sys.argv[1:] if arg in VIEWPORTS), "desktop")
CHAPTERS = ["hero", "case", "dial", "crown", "calibre", "yours", "close"]


def main() -> None:
    errors = []
    out = OUT / LABEL
    out.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(
            channel="msedge",
            headless=True,
            args=["--use-gl=angle", "--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"],
        )
        context = browser.new_context(
            viewport=VIEWPORTS[LABEL],
            device_scale_factor=1,
            locale="zh-CN",
        )
        page = context.new_page()
        page.on(
            "console",
            lambda msg: errors.append(f"console.{msg.type}: {msg.text}")
            if msg.type in ("error", "warning")
            else None,
        )
        page.on("pageerror", lambda err: errors.append(f"pageerror: {err}"))

        page.goto(URL, wait_until="networkidle")
        page.wait_for_function("window.__MERIDIAN_READY__ === true", timeout=30000)
        page.wait_for_timeout(600)

        print("debug:", page.evaluate("window.__MERIDIAN_DEBUG__ ? {tier: window.__MERIDIAN_DEBUG__.tier, camera: window.__MERIDIAN_DEBUG__.camera} : null"))

        for index, name in enumerate(CHAPTERS):
            page.evaluate(
                """(index) => {
                    const section = document.querySelectorAll('.chapter')[index];
                    const rect = section.getBoundingClientRect();
                    const top = rect.top + window.scrollY + rect.height * 0.5 - window.innerHeight * 0.5;
                    window.scrollTo(0, top);
                }""",
                index,
            )
            page.wait_for_timeout(1600)
            page.screenshot(path=str(out / f"{index:02d}-{name}.png"))
            print("shot", LABEL, name)

        fps = page.evaluate("window.__MERIDIAN_FPS__")
        print("fps:", fps)
        browser.close()

    if errors:
        print("ERRORS:")
        for error in errors:
            print(" ", error)
    else:
        print("no console errors")


if __name__ == "__main__":
    main()
