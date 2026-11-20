"""Render the packaged static assets offline and exercise the workshop journey."""
from pathlib import Path
from urllib.parse import urlparse
import mimetypes
import shutil

from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
assets = root / "dist"
shots = root / "docs" / "screenshots"
shots.mkdir(exist_ok=True)


def release_asset(route):
    url = urlparse(route.request.url)
    if url.netloc != "release.invalid":
        route.abort()
        return
    path = (assets / (url.path.strip("/") or "index.html")).resolve()
    if assets not in path.parents or not path.is_file():
        route.fulfill(status=404, body="")
        return
    route.fulfill(body=path.read_bytes(), content_type=mimetypes.guess_type(path)[0] or "application/octet-stream")


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(executable_path=shutil.which("chromium"), headless=True)
    for name, width, height in [("desktop", 1440, 1000), ("mobile", 390, 844)]:
        context = browser.new_context(viewport={"width": width, "height": height}, device_scale_factor=1)
        context.route("**/*", release_asset)
        page = context.new_page()
        errors = []
        page.on("pageerror", lambda exc: errors.append(str(exc)))
        page.goto("https://release.invalid/")
        page.get_by_role("button", name="Continue to workspace").click()
        page.get_by_role("heading", name="Command centre", exact=True).wait_for()

        def check():
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), (name, page.url)
            assert not errors, errors

        def capture(screen):
            check()
            page.screenshot(path=shots / f"{name}-{screen}.png", animations="disabled")

        def navigate(label):
            if width < 600:
                page.get_by_role("button", name="Open navigation").click()
            page.locator("a.nav").get_by_text(label, exact=True).click()
            page.get_by_role("heading", name=label, exact=True).wait_for()
            check()

        capture("command")
        page.get_by_role("link", name="Open intelligence terminal").click()
        page.get_by_role("button", name="Propose hypothesis").wait_for()
        capture("oracle")
        page.get_by_role("button", name="Propose hypothesis").click()
        page.get_by_role("button", name="Run statistical test").click()
        page.get_by_role("button", name="Open paper experiment").wait_for()
        capture("hypothesis")
        page.get_by_role("button", name="Open paper experiment").click()
        page.get_by_role("button", name="Review buy order").click()
        page.get_by_role("button", name="Confirm paper buy").click()
        page.get_by_role("button", name="Advance session").click()
        page.get_by_role("button", name="Sell", exact=True).click()
        page.get_by_role("button", name="Review sell order").click()
        page.get_by_role("button", name="Confirm paper sell").click()
        navigate("Trade autopsy")
        page.get_by_text("Entry hypothesis", exact=True).wait_for()
        capture("autopsy")
        for label in ["RIFT laboratory", "Shadow portfolio", "Portfolio lab", "Strategy foundry", "Market intelligence"]:
            navigate(label)
        context.close()
        print(f"{name}: offline Chromium flow passed, four release captures written")
    browser.close()
