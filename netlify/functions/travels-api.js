const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
// const nodemailer = require('nodemailer'); // Uncomment if you want Zoho later

exports.handler = async function (event, context) {
    // 1. CORS Headers (Allows your website to talk to this function)
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle Pre-flight requests
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // 2. Security & Config Check
        if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SHEET_ID) {
            console.error("Missing Environment Variables");
            throw new Error("Server Configuration Error: Missing Google Credentials.");
        }

        // 3. Authenticate with Google
        const serviceAccountAuth = new JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        // 4. Load the Document
        // FIX: Use the Environment Variable, not the hardcoded string
        const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
        await doc.loadInfo();

        // 5. Select the Sheet (Robust Method)
        // Try to find 'bookings', otherwise default to the first sheet
        let sheet = doc.sheetsByTitle['bookings'];
        if (!sheet) {
            console.warn("Sheet 'bookings' not found. Falling back to index 0.");
            sheet = doc.sheetsByIndex[0];
        }

        // 6. Parse Data from Frontend
        const data = JSON.parse(event.body);
        const bookingID = `ST-${Date.now().toString().slice(-6)}`;
        const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

        // 7. Add Row to Google Sheet
        // Ensure these keys match your Google Sheet "Header Row" exactly!
        await sheet.addRow({
            Booking_ID: bookingID,
            Timestamp: timestamp,
            Customer_Name: data.Customer_Name || 'Guest',
            Mobile_Number: data.Mobile_Number || 'Pending',
            Pickup_City: data.Pickup_City || 'Unknown',
            Drop_City: data.Drop_City || 'Unknown',
            Travel_Date: data.Travel_Date || 'N/A',
            Vehicle_Type: data.Vehicle_Type || 'Sedan', // Default
            Status: 'New Inquiry',
            Driver_Assigned: 'Pending'
        });

        console.log(`Booking Saved: ${bookingID}`);

        // 8. Success Response
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true, 
                message: "Booking Saved Successfully!",
                id: bookingID 
            })
        };

    } catch (error) {
        console.error("API Error:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: "Internal Server Error",
                details: error.message
            })
        };
    }
};