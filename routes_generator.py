import os
import json
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

# --- FETCH DATA (HYBRID LOGIC) ---
def get_routes_data():
    # 1. Try Online API First
    if requests:
        print(f"🌐 Attempting to fetch routes from: {API_URL}...")
        try:
            response = requests.get(API_URL, timeout=10) # 10 second timeout
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list): return data
                if 'routes' in data: return data['routes']
                print("⚠️ API returned unexpected format.")
            else:
                print(f"⚠️ API Error: Status Code {response.status_code}")
        except Exception as e:
            print(f"❌ Network Error: Could not reach API. ({e})")
    else:
        print("⚠️ 'requests' library not installed. Skipping online fetch.")

    # 2. Fallback to Local JSON
    print("📂 Switching to OFFLINE MODE (reading local routes.json)...")
    if os.path.exists(LOCAL_DATA_FILE):
        try:
            with open(LOCAL_DATA_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"❌ Error reading local file: {e}")
            return []
    else:
        print("❌ Local 'routes.json' not found!")
        return []

# --- MAIN GENERATOR ---
def generate():
    print("🚀 Starting Route Page Generation...")

    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    # 1. Get Data
    routes = get_routes_data()
    if not routes:
        print("❌ No routes data found. Aborting.")
        return

    # 2. Load Templates
    try:
        with open(TEMPLATE_FILE, 'r', encoding='utf-8') as f:
            template = f.read()
        with open(HEADER_FILE, 'r', encoding='utf-8') as f:
            header = fix_relative_paths(f.read())
        with open(FOOTER_FILE, 'r', encoding='utf-8') as f:
            footer = fix_relative_paths(f.read())
    except Exception as e:
        print(f"❌ Critical Error loading templates: {e}")
        return

    # 3. Generate Pages
    count = 0
    for route in routes:
        try:
            page = template

            # Inject Components (Safe Replace)
            if '<!--HEADER-->' in page:
                page = page.replace('<!--HEADER-->', header)
            if '<!--FOOTER-->' in page:
                page = page.replace('<!--FOOTER-->', footer)

            # Data Mapping (Handles API vs Local keys)
            r_origin = route.get('Origin') or route.get('origin') or 'Chennai'
            r_dest = route.get('Destination') or route.get('destination') or 'Unknown'
            
            # Slug Logic
            raw_slug = route.get('Route_Slug') or route.get('slug')
            if not raw_slug:
                raw_slug = f"{r_origin}-to-{r_dest}".lower().replace(' ', '-')
            r_slug = str(raw_slug)

            # Text Injection
            page = page.replace('{origin}', str(r_origin))
            page = page.replace('{destination}', str(r_dest))
            page = page.replace('{destination_slug}', r_slug.replace('chennai-to-', ''))
            
            page = page.replace('{distance}', str(route.get('Distance_Km') or route.get('distance') or 0))
            page = page.replace('{duration}', str(route.get('Time_Hours') or route.get('duration') or 'N/A'))
            page = page.replace('{description}', str(route.get('Description') or route.get('description') or ''))
            
            img = route.get('Image_URL') or route.get('image')
            page = page.replace('{image_url}', str(img if img else '../assets/images/default-route.jpg'))
            
            # Pricing Injection
            page = page.replace('{price_sedan}', str(route.get('Price_Sedan') or route.get('price_sedan') or 'Ask'))
            page = page.replace('{price_innova}', str(route.get('Price_Innova') or route.get('price_innova') or 'Ask'))
            page = page.replace('{price_crysta}', str(route.get('Price_Crysta') or route.get('price_crysta') or 'Ask'))
            page = page.replace('{price_tempo}', str(route.get('Price_Tempo') or route.get('price_tempo') or 'Ask'))

            # Save
            filename = f"{r_slug}.html"
            filepath = os.path.join(OUTPUT_DIR, filename)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(page)
            
            print(f"✅ Generated: routes/{filename}")
            count += 1

        except Exception as e:
            print(f"⚠️ Failed to generate: {e}")

    print(f"\n🎉 Success! Generated {count} pages.")

if __name__ == "__main__":
    generate()