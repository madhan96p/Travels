"""Write server-readable entity markup into static page heads during the build."""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DOMAIN = "https://travels.shrishgroup.com"
BUSINESS_ID = f"{DOMAIN}/#business"
WEBSITE_ID = f"{DOMAIN}/#website"
PAGE_TYPES = {"about.html": "AboutPage", "contact.html": "ContactPage", "routes.html": "CollectionPage", "services.html": "CollectionPage"}
ENTITY_GRAPH = json.loads((ROOT / "assets" / "data" / "schema.json").read_text(encoding="utf-8"))["@graph"]


def value(source, pattern):
    found = re.search(pattern, source, re.I | re.S)
    return html.unescape(found.group(1).strip()) if found else ""


def expected_url(path):
    return f"{DOMAIN}/" if path.name == "index.html" else f"{DOMAIN}/{path.name}"


def graph(path, source):
    canonical = value(source, r'<link[^>]*rel=["\']canonical["\'][^>]*href=["\']([^"\']*)') or expected_url(path)
    page = {
        "@type": PAGE_TYPES.get(path.name, "WebPage"), "@id": f"{canonical}#webpage", "url": canonical,
        "name": value(source, r"<title[^>]*>(.*?)</title>"),
        "description": value(source, r'<meta\s+name=["\']description["\'][^>]*content=["\']([^"\']*)'),
        "isPartOf": {"@id": WEBSITE_ID}, "about": {"@id": BUSINESS_ID}, "publisher": {"@id": BUSINESS_ID}
    }
    items = [page]
    if path.name == "services.html":
        for name, kind in [("Airport transfers", "Airport taxi"), ("Outstation packages", "Outstation taxi"), ("Hourly rentals", "Car rental"), ("Corporate employee transport", "Corporate transportation"), ("Wedding fleet management", "Event transportation")]:
            items.append({"@type": "Service", "name": name, "serviceType": kind, "provider": {"@id": BUSINESS_ID}, "url": canonical})
    return {"@context": "https://schema.org", "@graph": ENTITY_GRAPH + items}


def main():
    updated = 0
    for path in ROOT.glob("*.html"):
        if path.name == "404.html" or path.name.startswith("google"):
            continue
        source = path.read_text(encoding="utf-8")
        if "</head>" not in source:
            continue
        source = re.sub(r'\s*<script type="application/ld\+json" data-generated-entity-schema>.*?</script>', "", source, flags=re.S)
        tag = '    <script type="application/ld+json" data-generated-entity-schema>' + json.dumps(graph(path, source), ensure_ascii=False, separators=(",", ":")) + "</script>\n"
        path.write_text(source.replace("</head>", tag + "</head>", 1), encoding="utf-8")
        updated += 1
    print(f"Added server-rendered entity markup to {updated} static pages.")


if __name__ == "__main__":
    main()
