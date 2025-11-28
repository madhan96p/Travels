import os
import json
import traceback

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, 'assets', 'data', 'routes.json')
TEMPLATE_FILE = os.path.join(BASE_DIR, 'templates', 'route_template.html')
HEADER_FILE = os.path.join(BASE_DIR, 'components', '_header.html')
FOOTER_FILE = os.path.join(BASE_DIR, 'components', '_footer.html')
OUTPUT_DIR = os.path.join(BASE_DIR, 'routes')

# --- HELPER: FIX RELATIVE PATHS ---
def fix_relative_paths(html_content):
    """
    Adjusts links so they work when moved inside the /routes/ subfolder.
    Example: href="index.html" becomes href="../index.html"
    """
    replacements = {
        'href="index.html"': 'href="../index.html"',
        'href="services.html"': 'href="../services.html"',
        'href="routes.html"': 'href="../routes.html"',
        'href="tariff.html"': 'href="../tariff.html"',
        'href="booking.html"': 'href="../booking.html"',
        'href="contact.html"': 'href="../contact.html"',
        'href="career.html"': 'href="../career.html"',
        'href="blog.html"': 'href="../blog.html"',
        'href="privacy-policy.html"': 'href="../privacy-policy.html"',
        'href="terms-of-service.html"': 'href="../terms-of-service.html"',
        'src="assets/': 'src="../assets/',
        'href="assets/': 'href="../assets/'
    }
    for old, new in replacements.items():
        html_content = html_content.replace(old, new)
    return html_content

# --- MAIN GENERATOR ---
def generate():
    print("🚀 Starting Route Page Generation...")

    # 1. Ensure Output Directory Exists
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        print(f"Created directory: {OUTPUT_DIR}")

    # 2. Load Files
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            routes = json.load(f)
        
        with open(TEMPLATE_FILE, 'r', encoding='utf-8') as f:
            template = f.read()

        with open(HEADER_FILE, 'r', encoding='utf-8') as f:
            header = fix_relative_paths(f.read())

        with open(FOOTER_FILE, 'r', encoding='utf-8') as f:
            footer = fix_relative_paths(f.read())

    except Exception as e:
        print(f"❌ Critical Error loading files: {e}")
        traceback.print_exc()
        return

    # 3. Generate Pages
    count = 0
    for route in routes:
        try:
            page = template

            # --- HEADER & FOOTER REPLACEMENT ---
            page = page.replace('<!--HEADER-->', header)
            page = page.replace('<!--FOOTER-->', footer)

            # --- DATA INJECTION ---
            page = page.replace('{origin}', str(route.get('origin', 'Chennai')))
            page = page.replace('{destination}', str(route.get('destination', 'Unknown')))
            page = page.replace('{destination_slug}', str(route.get('slug', '')).replace('chennai-to-', ''))
            page = page.replace('{distance}', str(route.get('distance', 0)))
            page = page.replace('{duration}', str(route.get('duration', 'N/A')))
            page = page.replace('{description}', str(route.get('description', '')))
            page = page.replace('{image_url}', str(route.get('image', '../assets/images/default-route.jpg')))

            # Pricing
            page = page.replace('{price_sedan}', str(route.get('price_sedan', 'Ask')))
            page = page.replace('{price_innova}', str(route.get('price_innova', 'Ask')))
            page = page.replace('{price_crysta}', str(route.get('price_crysta', 'Ask')))
            page = page.replace('{price_tempo}', str(route.get('price_tempo', 'Ask')))

            # --- SAVE FILE ---
            slug = str(route.get('slug', 'unknown'))
            filename = f"{slug}.html"
            filepath = os.path.join(OUTPUT_DIR, filename)

            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(page)

            print(f"✅ Generated: routes/{filename}")
            count += 1

        except Exception as e:
            print(f"⚠️ Failed to generate {route.get('slug', 'unknown')}: {e}")
            traceback.print_exc()

    print(f"\n🎉 Success! Generated {count} pages.")

if __name__ == "__main__":
    generate()
