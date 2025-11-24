// netlify/functions/travels-api.js
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { Resend } = require('resend');

// YOUR SHEET ID
const SPREADSHEET_ID = '1eqSsdKzF71WR6KR7XFkEI8NW7ObtnxC16ZtavJeePq8';

const resend = new Resend(process.env.RESEND_API_KEY);

const generateBookingID = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(100 + Math.random() * 900);
    return `ST-${day}${month}-${random}`;
};

const getSheet = async (doc, sheetTitle) => {
    // In V3, we access sheets differently
    const sheet = doc.sheetsByTitle[sheetTitle];
    if (!sheet) throw new Error(`Tab "${sheetTitle}" not found.`);
    return sheet;
};

// ... (Keep your existing generateBookingEmail function here) ...
function generateBookingEmail(data, bookingID) {
    // Paste your existing email HTML generator logic here
    return `
    <body>
        <h2>New Booking: ${bookingID}</h2>
        <p>Name: ${data.Customer_Name}</p>
        <p>Phone: ${data.Mobile_Number}</p>
        <p>Route: ${data.Pickup_City} to ${data.Drop_City}</p>
    </body>`;
}

exports.handler = async function (event, context) {
    // Handle CORS preflight (Optional but good practice)
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: ''
        };
    }

    try {
        // 1. Setup Auth (V3 Style)
        const doc = new GoogleSpreadsheet(SPREADSHEET_ID);
        
        await doc.useServiceAccountAuth({
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        });

        await doc.loadInfo(); // loads document properties and worksheets

        // 2. Parse Data
        const { action } = event.queryStringParameters;
        const data = event.body ? JSON.parse(event.body) : {};
        const timestamp = new Date().toLocaleString('en-IN');

        let response = {};

        if (action === 'submitBooking') {
            const sheet = await getSheet(doc, 'bookings'); 
            const bookingID = generateBookingID();

            const rowData = {
                Booking_ID: bookingID,
                Timestamp: timestamp,
                Customer_Name: data.Customer_Name || 'Guest',
                Mobile_Number: data.Mobile_Number,
                Pickup_City: data.Pickup_City,
                Drop_City: data.Drop_City,
                Travel_Date: data.Travel_Date || '',
                Vehicle_Type: data.Vehicle_Type || 'Sedan', // Ensure matches JS
                Status: 'New',
                Driver_Assigned: 'Pending'
            };

            await sheet.addRow(rowData);
            
            // Email Logic (Wrapped in try/catch so it doesn't fail the booking if email fails)
            try {
                if (process.env.RESEND_API_KEY) {
                    await resend.emails.send({
                        from: 'Shrish Travels <travels@shrishgroup.com>',
                        to: ['travels@shrishgroup.com'],
                        cc: ['shrishtravels1@gmail.com'],
                        subject: `🚖 New Booking: ${rowData.Pickup_City}`,
                        html: generateBookingEmail(rowData, bookingID),
                    });
                }
            } catch (emailErr) {
                console.error("Email failed:", emailErr);
            }

            response = { success: true, id: bookingID };
        } else {
            return { statusCode: 400, body: JSON.stringify({ error: 'Invalid Action' }) };
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response)
        };

    } catch (error) {
        console.error('API Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, error: error.message })
        };
    }
};