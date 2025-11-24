// netlify/functions/travels-api.js
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library'); // Required for modern Google Sheets auth
const { Resend } = require('resend');

const SPREADSHEET_ID = '1eqSsdKzF71WR6KR7XFkEI8NW7ObtnxC16ZtavJeePq8';

// 1. Initialize Resend SAFELY
let resend;
if (process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
} else {
    console.warn("⚠️ RESEND_API_KEY is missing. Emails will be skipped.");
}

const generateBookingID = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(100 + Math.random() * 900);
    return `ST-${day}${month}-${random}`;
};

const getSheet = async (doc, sheetTitle) => {
    const sheet = doc.sheetsByTitle[sheetTitle];
    if (!sheet) throw new Error(`Tab "${sheetTitle}" not found. Check your Sheet tabs.`);
    return sheet;
};

function generateBookingEmail(data, bookingID) {
    return `
    <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
            <h2 style="color: #2563eb;">🚖 New Booking Alert</h2>
            <p><strong>ID:</strong> ${bookingID}</p>
            <p><strong>Name:</strong> ${data.Customer_Name}</p>
            <p><strong>Mobile:</strong> ${data.Mobile_Number}</p>
            <p><strong>Route:</strong> ${data.Pickup_City} ➝ ${data.Drop_City}</p>
            <p><strong>Date:</strong> ${data.Travel_Date}</p>
            <p><strong>Type:</strong> ${data.Vehicle_Type}</p>
             <p style="margin-top: 20px; font-size: 12px; color: #666;">Received via Website</p>
        </div>
    </body>`;
}

exports.handler = async function (event, context) {
    // Handle Preflight (CORS)
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
        // DEBUG: Check if keys exist (Do not log the actual keys for security)
        if (!process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
            throw new Error("Missing Google Credentials in Netlify Environment Variables.");
        }

        // 2. Authenticate with Google (New JWT Method)
        const serviceAccountAuth = new JWT({
            // FIXED: Changed from GOOGLE_CLIENT_EMAIL to match your Netlify settings
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
        
        // 3. Load Info
        await doc.loadInfo();

        const { action } = event.queryStringParameters;
        const data = event.body ? JSON.parse(event.body) : {};
        const timestamp = new Date().toLocaleString('en-IN');

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
                Travel_Date: data.Travel_Date || new Date().toISOString().split('T')[0],
                Vehicle_Type: data.Vehicle_Type || 'Sedan',
                Status: 'New',
                Driver_Assigned: 'Pending'
            };

            await sheet.addRow(rowData);
            
            // Send Email (Safe Check)
            if (resend) {
                try {
                    await resend.emails.send({
                        from: 'Shrish Travels <travels@shrishgroup.com>',
                        to: ['travels@shrishgroup.com'],
                        cc: ['shrishtravels1@gmail.com'], // Optional CC
                        subject: `🚖 New Booking: ${rowData.Pickup_City}`,
                        html: generateBookingEmail(rowData, bookingID),
                    });
                } catch (emailError) {
                    console.error("Email failed but lead saved:", emailError);
                }
            }

            return { statusCode: 200, body: JSON.stringify({ success: true, id: bookingID }) };
        } 
        
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid Action' }) };

    } catch (error) {
        console.error('API Error:', error);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ 
                success: false, 
                error: error.message || "Internal Server Error" 
            }) 
        };
    }
};