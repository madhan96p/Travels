"""Dependency-free pre-deploy checks for metadata, canonical URLs, JSON-LD and sitemap coverage."""
import json
import re
import sys
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parent
DOMAIN = "https://travels.shrishgroup.com"


def value(source, pattern):
    found = re.search(pattern, source, re.I | re.S)
    return found.group(1).strip() if found else ""


def expected_url(path):
    relative = path.relative_to(ROOT).as_posix()
    return f"{DOMAIN}/" if relative == "index.html" else f"{DOMAIN}/{relative}"


def main():
    errors, indexable = [], []
    listed = {node.text for node in ET.parse(ROOT / "sitemap.xml").findall(".//{http://www.sitemaps.org/schemas/sitemap/0.9}loc")}
    for path in sorted(ROOT.rglob("*.html")):
        relative = path.relative_to(ROOT)
        if {"components", "templates", "node_modules"}.intersection(relative.parts) or path.name in {"404.html"} or path.name.startswith("google"):
            continue
        # Route pages are generated from the current build data. A legacy file that
        # is not in the sitemap is deliberately excluded until it is added to that
        # source-of-truth dataset.
        if relative.parts[0] == "routes" and expected_url(path) not in listed:
            continue
        source = path.read_text(encoding="utf-8")
        for label, pattern in [("title", r"<title[^>]*>(.*?)</title>"), ("description", r'<meta\s+name=["\']description["\'][^>]*content=["\']([^"\']*)'), ("canonical", r'<link[^>]*rel=["\']canonical["\'][^>]*href=["\']([^"\']*)')]:
            if not value(source, pattern):
                errors.append(f"{relative}: missing {label}")
        if len(re.findall(r"<h1\b", source, re.I)) != 1:
            errors.append(f"{relative}: expected exactly one H1")
        canonical = value(source, r'<link[^>]*rel=["\']canonical["\'][^>]*href=["\']([^"\']*)')
        if canonical and canonical != expected_url(path):
            errors.append(f"{relative}: canonical does not match its file URL")
        for block in re.findall(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', source, re.I | re.S):
            try:
                json.loads(block.strip())
            except json.JSONDecodeError as exc:
                errors.append(f"{relative}: invalid JSON-LD ({exc.msg})")
        indexable.append(expected_url(path))
    errors.extend(f"sitemap: missing {url}" for url in sorted(set(indexable) - listed))
    if errors:
        print("SEO validation failed:\n" + "\n".join(f"- {error}" for error in errors))
        return 1
    print(f"SEO validation passed for {len(indexable)} indexable pages and {len(listed)} sitemap URLs.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
