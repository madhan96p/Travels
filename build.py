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
            creds = ServiceAccountCredentials.from_json_keyfile_name(CREDS_FILE, SCOPE)
        except Exception as e:
            print(f"❌ Could not find local file '{CREDS_FILE}'.")
            return

    # 1. Connect to Google Sheets
    try:
        # 🛑 I REMOVED THE BAD LINE HERE. We use the 'creds' we just loaded above.
        client = gspread.authorize(creds)
        
        # USE ID, NOT NAME (It is much safer)
        sheet = client.open_by_key(SHEET_ID)
        
        routes_data = sheet.worksheet("routes").get_all_records()
        print(f"✅ Fetched {len(routes_data)} routes from Google Sheets.")
    except Exception as e:
        print(f"❌ Error connecting to Sheets: {e}")
        return

    # 2. Save Data to JSON (Caching for Frontend JS to use if needed)
    os.makedirs("assets/data", exist_ok=True)
    with open("assets/data/routes.json", "w") as f:
        json.dump(routes_data, f, indent=4)
    print("✅ Saved routes.json")

    # 3. Setup Template Engine (Jinja2)
    file_loader = FileSystemLoader('templates')
    env = Environment(loader=file_loader)
    template = env.get_template('route_template.html')

    # 4. Generate HTML Pages
    os.makedirs("routes", exist_ok=True) # Create 'routes' folder if missing
    
    count = 0
    for route in routes_data:
        # Create a clean filename: "chennai-to-thiruvarur.html"
        filename = f"{route['Origin'].lower()}-to-{route['Destination'].lower()}.html"
        filename = filename.replace(" ", "") # Remove spaces
        
        # Render the HTML
        output = template.render(
            origin=route['Origin'],
            destination=route['Destination'],
            distance=route['Distance_Km'],
            time=route['Time_Hours'],
            price_sedan=route['Price_Sedan'],
            price_innova=route['Price_Innova']
        )

        # Write the file
        with open(f"routes/{filename}", "w", encoding="utf-8") as f:
            f.write(output)
        
        count += 1
        print(f"   👉 Generated: routes/{filename}")

    print(f"🎉 Build Complete! Generated {count} pages.")

if __name__ == "__main__":
    fetch_data_and_build()