import gspread
from oauth2client.service_account import ServiceAccountCredentials
import sys

# 1. Define Scope
scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]

try:
    # 2. Authenticate using your downloaded JSON
    creds = ServiceAccountCredentials.from_json_keyfile_name("shrish-credentials.json", scope)
    client = gspread.authorize(creds)

    # 3. Open the Sheet
    try:
        sheet = client.open("Shrish Admin - Data")
    except gspread.exceptions.SpreadsheetNotFound:
        print("❌ Error: Spreadsheet 'Shrish Admin - Data' not found.")
        print("   Please make sure the name is correct and you have shared the sheet with the service account email.")
        sys.exit(1)

    # 4. Read the 'routes' tab
    routes_tab = sheet.worksheet("routes")
    print("✅ Connection Successful!")
    print("Existing Routes:", routes_tab.get_all_records())

    # 5. Write a test booking to 'bookings' tab
    booking_tab = sheet.worksheet("bookings")
    test_booking_data = ["TEST-001", "2025-11-24", "Pragadeesh", "8903558066", "Chennai", "Thiruvarur", "2025-12-01", "Sedan", "New"]
    booking_tab.append_row(test_booking_data)
    print("✅ Test Booking Added!")

except FileNotFoundError:
    print("❌ Error: 'shrish-credentials.json' not found.")
    print("   Please make sure the credentials file is in the same directory.")
    sys.exit(1)
except Exception as e:
    print(f"An unexpected error occurred: {e}")
    sys.exit(1)