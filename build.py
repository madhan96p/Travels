import gspread
import json
import os
from oauth2client.service_account import ServiceAccountCredentials
from jinja2 import Environment, FileSystemLoader

# --- CONFIGURATION ---
SCOPE = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
CREDS_FILE = "shrish-credentials.json"

# 👇 REPLACE THIS WITH YOUR LONG ID FROM THE GOOGLE SHEET URL
SHEET_ID = "1eqSsdKzF71WR6KR7XFkEI8NW7ObtnxC16ZtavJeePq8" 

def fetch_data_and_build():
    print("🚀 Starting Build Process...")
    
    creds = None

    # PRIORITY 1: Try to load from Netlify Environment Variable
    if "GOOGLE_CREDENTIALS" in os.environ:
        print("☁️ Detect Netlify Environment. Loading keys from Env Var...")
        try:
            creds_json = json.loads(os.environ["GOOGLE_CREDENTIALS"])
            creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_json, SCOPE)
        except Exception as e:
            print(f"❌ Error parsing GOOGLE_CREDENTIALS: {e}")
            return
            
    # PRIORITY 2: Fallback to local file (For when you work on Laptop)
    else:
        print("💻 Local Environment. Loading keys from file...")
        try:
            creds_json = json.load(open(CREDS_FILE)) # Load json safely
            creds = ServiceAccountCredentials.from_json_keyfile_name(CREDS_FILE, SCOPE)
        except Exception as e:
            print(f"❌ Could not find local file '{CREDS_FILE}'.")
            return

    # 1. Connect to Google Sheets
    routes_data = []
    try:
        client = gspread.authorize(creds)
        sheet = client.open_by_key(SHEET_ID)
        routes_data = sheet.worksheet("routes").get_all_records()
        print(f"✅ Fetched {len(routes_data)} routes from Google Sheets.")
    except Exception as e:
        print(f"❌ Error connecting to Sheets: {e}")
        # We continue even if sheets fail, so we can at least build the homepage!

    # 2. Save Data to JSON (Caching for Frontend JS to use if needed)
    os.makedirs("assets/data", exist_ok=True)
    with open("assets/data/routes.json", "w") as f:
        json.dump(routes_data, f, indent=4)
    print("✅ Saved routes.json")

    # 3. Setup Template Engine (Jinja2)
    file_loader = FileSystemLoader('templates')
    env = Environment(loader=file_loader)

    # 4. Generate Route Pages (Dynamic)
    os.makedirs("routes", exist_ok=True)
    
    route_template = env.get_template('route_template.html')
    
    count = 0
    for route in routes_data:
        filename = f"{route['Origin'].lower()}-to-{route['Destination'].lower()}.html".replace(" ", "")
        
        output = route_template.render(
            origin=route['Origin'],
            destination=route['Destination'],
            distance=route['Distance_Km'],
            time=route['Time_Hours'],
            price_sedan=route['Price_Sedan'],
            price_innova=route['Price_Innova']
        )

        with open(f"routes/{filename}", "w", encoding="utf-8") as f:
            f.write(output)
        count += 1
        
    print(f"   👉 Generated {count} route pages.")

    # 5. Generate Static Pages (Home, etc.) 🟢 NEW SECTION
    # List any file in 'templates/' you want to compile to root
    static_pages = ['index.html'] 

    for page in static_pages:
        try:
            print(f"🏠 Building {page}...")
            template = env.get_template(page)
            # Render the template (Injects the headers/footers)
            output = template.render()
            
            # Save it to the ROOT folder (outside templates)
            with open(page, "w", encoding="utf-8") as f:
                f.write(output)
            print(f"   ✅ Processed: {page}")
        except Exception as e:
            print(f"   ❌ Error building {page}: {e}")

    print(f"🎉 Build Complete!")

if __name__ == "__main__":
    fetch_data_and_build()