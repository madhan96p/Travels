import os
import json
import requests # You might need to install this: pip install requests
import traceback 

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_FILE = os.path.join(BASE_DIR, 'templates', 'route_template.html')
HEADER_FILE = os.path.join(BASE_DIR, 'components', '_header.html')
FOOTER_FILE = os.path.join(BASE_DIR, 'components', '_footer.html')
OUTPUT_DIR = os.path.join(BASE_DIR, 'routes')

# YOUR LIVE API ENDPOINT
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

# --- MAIN GENERATOR ---
def generate():
    print("🚀 Connecting to Admin API to fetch routes...")

    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    # 1. Fetch Data from API (Instead of local JSON)
    try:
        response = requests.get(API_URL)
        if response.status_code == 200:
            data = response.json()
            # Handle API response structure
            if isinstance(data, list):
                routes = data
            elif 'routes' in data:
                routes = data['routes']
            else:
                routes = []
            print(f"✅ Fetched {len(routes)} routes from Cloud.")
        else:
            print(f"❌ API Error: {response.status_code}")
            return

        # Load Templates
        with open(TEMPLATE_FILE, 'r', encoding='utf-8') as f:
            template = f.read()
        with open(HEADER_FILE, 'r', encoding='utf-8') as f:
            header = fix_relative_paths(f.read())
        with open(FOOTER_FILE, 'r', encoding='utf-8') as f:
            footer = fix_relative_paths(f.read())

    except Exception as e:
        print(f"❌ Error: {e}")
        print("💡 Hint: Did you run 'pip install requests'?")
        return

    # 2. Generate Pages
    count = 0
    for route in routes:
        try:
            page = template

            # Tags
            if '' in page:
                page = page.replace('<!--HEADER-->', header)
            if '' in page:
                page = page.replace('<!--FOOTER-->', footer)

            # Data Injection (Handling API Key Names)
            # API keys might be PascalCase (Origin) or lowercase (origin) depending on sheet
            r_origin = route.get('Origin') or route.get('origin') or 'Chennai'
            r_dest = route.get('Destination') or route.get('destination') or 'Unknown'
            
            raw_slug = route.get('Route_Slug') or route.get('slug')
            if not raw_slug:
                raw_slug = f"{r_origin}-to-{r_dest}".lower().replace(' ', '-')
            
            r_slug = str(raw_slug)
            
            page = page.replace('{origin}', str(r_origin))
            page = page.replace('{destination}', str(r_dest))
            page = page.replace('{destination_slug}', r_slug.replace('chennai-to-', ''))
            
            page = page.replace('{distance}', str(route.get('Distance_Km') or route.get('distance') or 0))
            page = page.replace('{duration}', str(route.get('Time_Hours') or route.get('duration') or 'N/A'))
            page = page.replace('{description}', str(route.get('Description') or route.get('description') or ''))
            
            img = route.get('Image_URL') or route.get('image')
            page = page.replace('{image_url}', str(img if img else '../assets/images/default-route.jpg'))
            
            # Pricing
            page = page.replace('{price_sedan}', str(route.get('Price_Sedan') or route.get('price_sedan') or 'Ask'))
            page = page.replace('{price_innova}', str(route.get('Price_Innova') or route.get('price_innova') or 'Ask'))
            page = page.replace('{price_crysta}', str(route.get('Price_Crysta') or route.get('price_crysta') or 'Ask'))
            page = page.replace('{price_tempo}', str(route.get('Price_Tempo') or route.get('price_tempo') or 'Ask'))

            # Save
            filename = f"{r_slug}.html"
            filepath = os.path.join(OUTPUT_DIR, filename)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(page)
            
            count += 1

        except Exception as e:
            print(f"⚠️ Failed to generate: {e}")

    print(f"\n🎉 Success! Generated {count} pages from Live Data.")

if __name__ == "__main__":
    generate()