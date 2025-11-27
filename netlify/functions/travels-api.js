const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

exports.handler = async function (event, context) {
    // 1. CORS Headers (Allows your website to access this function)
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
    };

    // Handle "Pre-flight" checks
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // 2. Load Environment Variables (Using your EXISTING variable name)
        const clientEmail = process.env.GOOGLE_CLIENT_EMAIL; // <--- CHANGED THIS
        const privateKey = process.env.GOOGLE_PRIVATE_KEY;
        const sheetId = process.env.GOOGLE_SHEET_ID;

        if (!clientEmail || !privateKey || !sheetId) {
            throw new Error("Missing Google Credentials in Netlify.");
        }

        // 3. Authenticate (Standard V4 Method)
        const serviceAccountAuth = new JWT({
            email: clientEmail,
            key: privateKey.replace(/\\n/g, '\n'),
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        // 4. Load Document
        const doc = new GoogleSpreadsheet(sheetId, serviceAccountAuth);
        await doc.loadInfo();

        // 5. Route Actions (Like your old project)
        const action = event.queryStringParameters.action;
        let responseData = {};

        if (action === 'submitBooking') {
            const data = JSON.parse(event.body);
            
            // Connect to Sheet (Fallback to first sheet if 'bookings' is missing)
            let sheet = doc.sheetsByTitle['bookings'];
            if (!sheet) sheet = doc.sheetsByIndex[0];

            const bookingID = `ST-${Date.now().toString().slice(-6)}`;
            
            await sheet.addRow({
                Booking_ID: bookingID,
                Timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
                Customer_Name: data.Customer_Name || data.name || 'Web User',
                Mobile_Number: data.Mobile_Number || data.mobile || 'Pending',
                Pickup_City: data.Pickup_City || data.pickup,
                Drop_City: data.Drop_City || data.drop,
                Travel_Date: data.Travel_Date || data.date,
                Vehicle_Type: data.Vehicle_Type || 'Sedan',
                Status: 'New Inquiry'
            });

            responseData = { success: true, message: "Booking Saved", id: bookingID };
        } else {
            responseData = { error: "Invalid Action" };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(responseData)
        };

    } catch (error) {
        console.error("API Error:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};