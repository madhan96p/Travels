import gspread
from oauth2client.service_account import ServiceAccountCredentials

# 1. Define Scope
scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]

# 2. Authenticate using your downloaded JSON
creds = ServiceAccountCredentials.from_json_keyfile_name("shrish-credentials.json", scope)
client = gspread.authorize(creds)

# 3. Open the Sheet (Make sure name matches EXACTLY)
sheet = client.open("Shrish Admin - Data")

# 4. Read the 'routes' tab
routes_tab = sheet.worksheet("routes")
print("Connection Successful!")
print("Existing Routes:", routes_tab.get_all_records())

# 5. Write a test booking to 'bookings' tab
booking_tab = sheet.worksheet("bookings")
booking_tab.append_row(["TEST-001", "2025-11-24", "Pragadeesh", "8903558066", "Chennai", "Thiruvarur", "2025-12-01", "Sedan", "New"])
print("Test Booking Added!")