const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const { Resend } = require('resend');

const SPREADSHEET_ID = '1eqSsdKzF71WR6KR7XFkEI8NW7ObtnxC16ZtavJeePq8';

exports.handler = async function (event, context) {
    // 1. CORS Headers (Allow request from anywhere)
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // 2. CHECK: Are the libraries loaded?
        if (!GoogleSpreadsheet || !JWT) throw new Error("Dependencies not loaded. Check package.json");

        // 3. CHECK: Are variables set?
        if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
            throw new Error(`Missing Env Vars: Email=${!!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL}, Key=${!!process.env.GOOGLE_PRIVATE_KEY}`);
        }

        // 4. Setup Auth
        const serviceAccountAuth = new JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
        await doc.loadInfo(); // This checks connection to Sheet

        // 5. Check if 'bookings' sheet exists
        const sheet = doc.sheetsByTitle['bookings'];
        if (!sheet) throw new Error("Sheet 'bookings' not found. Check tab name in Google Sheets.");

        // 6. Process Data
        const data = JSON.parse(event.body);
        const bookingID = `ST-${Date.now().toString().slice(-6)}`;

        await sheet.addRow({
            Booking_ID: bookingID,
            Timestamp: new Date().toLocaleString('en-IN'),
            Customer_Name: data.Customer_Name || 'Guest',
            Mobile_Number: data.Mobile_Number,
            Pickup_City: data.Pickup_City,
            Drop_City: data.Drop_City,
            Travel_Date: data.Travel_Date,
            Vehicle_Type: data.Vehicle_Type || 'Sedan',
            Status: 'New',
            Driver_Assigned: 'Pending'
        });

        // 7. Send Email (Optional - Wrapped to prevent crash)
        if (process.env.RESEND_API_KEY) {
            try {
                const resend = new Resend(process.env.RESEND_API_KEY);
                await resend.emails.send({
                    from: 'Shrish Travels <travels@shrishgroup.com>',
                    to: ['travels@shrishgroup.com'],
                    subject: `New Booking: ${data.Pickup_City}`,
                    html: `<p>New booking received from ${data.Customer_Name}</p>`
                });
            } catch (e) { console.warn("Email failed:", e); }
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, message: "Booking Saved!" })
        };

    } catch (error) {
        console.error("Server Error:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message,
                stack: error.stack // sending stack trace to frontend for debugging
            })
        };
    }
};