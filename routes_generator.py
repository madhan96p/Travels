import os
import json
import datetime
import traceback
import sys

# Try importing requests (for API), handle if missing
try:
    import requests
except ImportError:
    requests = None

# Try importing Google Sheets libraries
try:
    import gspread
    from oauth2client.service_account import ServiceAccountCredentials
except ImportError:
    gspread = None
    ServiceAccountCredentials = None

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

# GOOGLE SHEETS CONFIG
SCOPE = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
CREDS_FILE = "shrish-credentials.json"
SHEET_ID = "1eqSsdKzF71WR6KR7XFkEI8NW7ObtnxC16ZtavJeePq8"

# --- HELPER: CHECK DEPENDENCIES ---
def check_dependencies():
    """Checks for required third-party libraries and provides install instructions."""
    missing_gspread = gspread is None or ServiceAccountCredentials is None
    
    # Only show pip install message if gspread is missing
    if missing_gspread and '--no-sheets' not in sys.argv:
        print("Error: Missing packages for Google Sheets: 'gspread' and 'oauth2client'.")
        print("   Install them with: pip install gspread oauth2client")
        print("   Or run with '--no-sheets' to skip this feature.")
        sys.exit(1)
    
    if requests is None:
        print("Error: Missing package 'requests'. Install with: pip install requests")
        sys.exit(1)

# --- HELPER: FIX RELATIVE PATHS ---
def fix_relative_paths(html_content):
    """Adjusts asset and page links to be relative to the 'routes' subdirectory."""
    # Asset paths (CSS, JS, images)
    html_content = html_content.replace('src="assets/', 'src="../assets/')
    html_content = html_content.replace('href="assets/', 'href="../assets/')
    
    # Root-level page links
    pages = [
        "index.html", "about.html", "services.html", "routes.html", 
        "tariff.html", "booking.html", "contact.html", "career.html",
        "privacy-policy.html", "terms-of-service.html", "blog.html"
    ]
    for page in pages:
        html_content = html_content.replace(f'href="{page}"', f'href="../{page}"')
        
    return html_content

def normalize_route_keys(routes):
    """Converts all dictionary keys in a list of routes to lowercase for consistency."""
    if not isinstance(routes, list):
        return routes # Or handle error appropriately
        
    normalized_routes = []
    for route in routes:
        if isinstance(route, dict):
            normalized_route = {k.lower(): v for k, v in route.items()}
            normalized_routes.append(normalized_route)
        else:
            normalized_routes.append(route) # Keep non-dict items as is
    return normalized_routes

def get_google_sheets_data():
    """Fetches and returns data from the configured Google Sheet."""
    if '--no-sheets' in sys.argv:
        print("Skipping Google Sheets fetch as requested.")
        return None
        
    if gspread is None or ServiceAccountCredentials is None:
        return None # Dependencies not met

    creds = None
    # Priority 1: Netlify Environment Variable
    if "GOOGLE_CREDENTIALS" in os.environ:
        print("Loading Google credentials from environment variable...")
        try:
            creds_json = json.loads(os.environ["GOOGLE_CREDENTIALS"])
            creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_json, SCOPE)
        except Exception as e:
            print(f"Warning: Error parsing GOOGLE_CREDENTIALS: {e}")
            return None
    # Priority 2: Local credentials file
    elif os.path.exists(CREDS_FILE):
        print("Loading Google credentials from local file...")
        try:
            creds = ServiceAccountCredentials.from_json_keyfile_name(CREDS_FILE, SCOPE)
        except Exception as e:
            print(f"Warning: Error loading local credentials file: {e}")
            return None
    else:
        return None # No credentials found

    try:
        client = gspread.authorize(creds)
        sheet = client.open_by_key(SHEET_ID)
        records = sheet.worksheet("routes").get_all_records()
        print(f"Fetched {len(records)} routes from Google Sheets.")
        return records
    except Exception as e:
        print(f"Error connecting to Google Sheets: {e}")
        return None

# --- FETCH DATA ---
def get_routes_data():
    """Fetches route data from Sheets, API, or local file. Normalizes keys."""
    
    # 1. Try Google Sheets first
    sheets_data = get_google_sheets_data()
    if sheets_data:
        # Also save to local file as a cache
        os.makedirs(os.path.dirname(LOCAL_DATA_FILE), exist_ok=True)
        with open(LOCAL_DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(sheets_data, f, indent=2)
        return normalize_route_keys(sheets_data)

    # 2. Fallback to API
    if requests:
        print(f"Attempting to fetch routes from API: {API_URL}...")
        try:
            response = requests.get(API_URL, timeout=10)
            if response.status_code == 200:
                data = response.json()
                routes = data if isinstance(data, list) else data.get('routes', [])
                print(f"Successfully fetched {len(routes)} routes from API.")
                return normalize_route_keys(routes)
            else:
                print(f"Warning: API returned status {response.status_code}.")
        except Exception as e:
            print(f"Error: Network Error: {e}.")

    # 3. Fallback to local file
    print("Reading local routes.json as final fallback...")
    if os.path.exists(LOCAL_DATA_FILE):
        try:
            with open(LOCAL_DATA_FILE, 'r', encoding='utf-8') as f:
                local_routes = json.load(f)
                print(f"Successfully loaded {len(local_routes)} routes from local file.")
                return normalize_route_keys(local_routes)
        except Exception as e:
            print(f"Error reading local file: {e}")
            return []
    
    print("Error: No data source found. Build failed.")
    return []

# --- SITEMAP GENERATOR ---
def generate_sitemap(routes):
    print("Generating Sitemap.xml...")
    
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
        r_origin = route.get('origin', 'Chennai')
        r_dest = route.get('destination', 'Unknown')
        raw_slug = route.get('route_slug') or route.get('slug')
        if not raw_slug:
            raw_slug = f"{r_origin}-to-{r_dest}".lower().replace(' ', '-')
        
        url = f"{DOMAIN}/routes/{raw_slug}.html"
        xml_content += f'  <url>\n    <loc>{url}</loc>\n    <lastmod>{current_date}</lastmod>\n    <priority>0.7</priority>\n  </url>\n'

    xml_content += '</urlset>'

    with open(SITEMAP_FILE, 'w', encoding='utf-8') as f:
        f.write(xml_content)
    
    print(f"Sitemap generated at: {SITEMAP_FILE}")

# --- MAIN GENERATOR ---
def generate():
    print("Starting Route Page Generation...")

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
            # Data Mapping (using normalized keys)
            r_origin = route.get('origin', 'Chennai')
            r_dest = route.get('destination', 'Unknown')
            raw_slug = route.get('route_slug') or route.get('slug') # 'slug' is a common fallback
            if not raw_slug:
                raw_slug = f"{r_origin}-to-{r_dest}".lower().replace(' ', '-')
            r_slug = str(raw_slug)

            # Start with fresh template
            page = template

            # Inject Components
            if '<!--HEADER-->' in page: page = page.replace('<!--HEADER-->', header)
            if '<!--FOOTER-->' in page: page = page.replace('<!--FOOTER-->', footer)

            # INJECTION: Content
            page = page.replace('{origin}', str(r_origin))
            page = page.replace('{destination}', str(r_dest))
            page = page.replace('{destination_slug}', r_slug.replace('chennai-to-', ''))
            
            page = page.replace('{distance}', str(route.get('distance_km', 0)))
            page = page.replace('{duration}', str(route.get('time_hours', 'N/A')))
            page = page.replace('{description}', str(route.get('description', '')))
            
            img = route.get('image_url') or route.get('image')
            page = page.replace('{image_url}', str(img if img else '../assets/images/default-route.jpg'))
            
            # INJECTION: Pricing
            page = page.replace('{price_sedan}', str(route.get('price_sedan', 'Ask')))
            page = page.replace('{price_innova}', str(route.get('price_innova', 'Ask')))
            page = page.replace('{price_crysta}', str(route.get('price_crysta', 'Ask')))
            page = page.replace('{price_tempo}', str(route.get('price_tempo', 'Ask')))

            # Save File
            filename = f"{r_slug}.html"
            filepath = os.path.join(OUTPUT_DIR, filename)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(page)
            
            count += 1

        except Exception as e:
            print(f"⚠️ Failed to generate [{r_slug}]: {e}")
            # traceback.print_exc() # Uncomment for deep debugging

    print(f"\nSuccess! Generated {count} pages.")
    generate_sitemap(routes)

if __name__ == "__main__":
    generate()