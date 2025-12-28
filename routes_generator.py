import os
import json
import datetime
import traceback

# Try importing requests (for API), handle if missing
try:
    import requests
except ImportError:
    requests = None

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOCAL_DATA_FILE = os.path.join(BASE_DIR, 'assets', 'data', 'routes.json')
TEMPLATE_FILE = os.path.join(BASE_DIR, 'templates', 'route_template.html')
HEADER_FILE = os.path.join(BASE_DIR, 'components', '_header.html')
FOOTER_FILE = os.path.join(BASE_DIR, 'components', '_footer.html')
OUTPUT_DIR = os.path.join(BASE_DIR, 'routes')

# SITEMAP CONFIG
DOMAIN = "https://travels.shrishgroup.com"
SITEMAP_FILE = os.path.join(BASE_DIR, 'sitemap.xml')

# LIVE API ENDPOINT
API_URL = "https://admin.shrishgroup.com/.netlify/functions/api?action=getRoutes"

# --- HELPER: FIX RELATIVE PATHS ---
def fix_relative_paths(html_content):
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

# --- FETCH DATA ---
def get_routes_data():
    if requests:
        print(f"🌐 Attempting to fetch routes from: {API_URL}...")
        try:
            response = requests.get(API_URL, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list): return data
                if 'routes' in data: return data['routes']
        except Exception as e:
            print(f"❌ Network Error: {e}")

    print("📂 Switching to OFFLINE MODE (reading local routes.json)...")
    if os.path.exists(LOCAL_DATA_FILE):
        try:
            with open(LOCAL_DATA_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return []
    return []

# --- SITEMAP GENERATOR ---
def generate_sitemap(routes):
    print("🗺️  Generating Sitemap.xml...")
    
    static_pages = [
        "", "services.html", "routes.html", "tariff.html", 
        "booking.html", "contact.html", "about.html"
    ]
    
    current_date = datetime.datetime.now().strftime("%Y-%m-%d")
    
    xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

    for page in static_pages:
        priority = "1.0" if page == "" else "0.8"
        url = f"{DOMAIN}/{page}"
        xml_content += f'  <url>\n    <loc>{url}</loc>\n    <lastmod>{current_date}</lastmod>\n    <priority>{priority}</priority>\n  </url>\n'

    for route in routes:
        r_origin = route.get('Origin') or route.get('origin') or 'Chennai'
        r_dest = route.get('Destination') or route.get('destination') or 'Unknown'
        raw_slug = route.get('Route_Slug') or route.get('slug')
        if not raw_slug:
            raw_slug = f"{r_origin}-to-{r_dest}".lower().replace(' ', '-')
        
        url = f"{DOMAIN}/routes/{raw_slug}.html"
        xml_content += f'  <url>\n    <loc>{url}</loc>\n    <lastmod>{current_date}</lastmod>\n    <priority>0.7</priority>\n  </url>\n'

    xml_content += '</urlset>'

    with open(SITEMAP_FILE, 'w', encoding='utf-8') as f:
        f.write(xml_content)
    
    print(f"✅ Sitemap generated at: {SITEMAP_FILE}")

# --- MAIN GENERATOR ---
def generate():
    print("🚀 Starting Route Page Generation...")

    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    routes = get_routes_data()
    if not routes:
        print("❌ No routes data found. Aborting.")
        return

    # Load Templates
    try:
        with open(TEMPLATE_FILE, 'r', encoding='utf-8') as f: template = f.read()
        with open(HEADER_FILE, 'r', encoding='utf-8') as f: header = fix_relative_paths(f.read())
        with open(FOOTER_FILE, 'r', encoding='utf-8') as f: footer = fix_relative_paths(f.read())
    except Exception as e:
        print(f"❌ Critical Error loading templates: {e}")
        return

    count = 0
    for route in routes:
        r_slug = "Unknown" # Default for error handling
        try:
            # Data Mapping
            r_origin = route.get('Origin') or route.get('origin') or 'Chennai'
            r_dest = route.get('Destination') or route.get('destination') or 'Unknown'
            raw_slug = route.get('Route_Slug') or route.get('slug')
            if not raw_slug:
                raw_slug = f"{r_origin}-to-{r_dest}".lower().replace(' ', '-')
            r_slug = str(raw_slug)

            # Start with fresh template
            page = template

            # Inject Components (Safe Replace)
            if '<!--HEADER-->' in page:
                page = page.replace('<!--HEADER-->', header)
            if '<!--FOOTER-->' in page:
                page = page.replace('<!--FOOTER-->', footer)

            # INJECTION: Content
            page = page.replace('{origin}', str(r_origin))
            page = page.replace('{destination}', str(r_dest))
            page = page.replace('{destination_slug}', r_slug.replace('chennai-to-', ''))
            
            page = page.replace('{distance}', str(route.get('Distance_Km') or route.get('distance') or 0))
            page = page.replace('{duration}', str(route.get('Time_Hours') or route.get('duration') or 'N/A'))
            page = page.replace('{description}', str(route.get('Description') or route.get('description') or ''))
            
            img = route.get('Image_URL') or route.get('image')
            page = page.replace('{image_url}', str(img if img else '../assets/images/default-route.jpg'))
            
            # INJECTION: Pricing
            page = page.replace('{price_sedan}', str(route.get('Price_Sedan') or route.get('price_sedan') or 'Ask'))
            page = page.replace('{price_innova}', str(route.get('Price_Innova') or route.get('price_innova') or 'Ask'))
            page = page.replace('{price_crysta}', str(route.get('Price_Crysta') or route.get('price_crysta') or 'Ask'))
            page = page.replace('{price_tempo}', str(route.get('Price_Tempo') or route.get('price_tempo') or 'Ask'))

            # Save File
            filename = f"{r_slug}.html"
            filepath = os.path.join(OUTPUT_DIR, filename)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(page)
            
            # print(f"✅ Generated: routes/{filename}") # Uncomment if you want noisy output
            count += 1

        except Exception as e:
            print(f"⚠️ Failed to generate [{r_slug}]: {e}")
            # traceback.print_exc() # Uncomment for deep debugging

    print(f"\n🎉 Success! Generated {count} pages.")
    generate_sitemap(routes)

if __name__ == "__main__":
    generate()