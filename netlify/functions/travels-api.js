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

            const now = new Date();
            const day = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0');

            // Generate 4 random characters (excluding confusing ones like I, O, 0, 1)
            const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
            let randomStr = '';
            for (let i = 0; i < 4; i++) {
                randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            const prefix = (data.Source === 'ContactPage') ? 'SCT' : 'ST';
            const bookingID = `${prefix}-${day}${month}-${randomStr}`;

            await sheet.addRow({
                Booking_ID: bookingID,
                Timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
                Customer_Name: data.Customer_Name || 'Web User',
                Mobile_Number: data.Mobile_Number || 'Pending',
                Email: data.Email || 'N/A',
                Journey_Type: data.Journey_Type || 'One Way',
                Pickup_City: data.Pickup_City || 'Unknown',
                Drop_City: data.Drop_City || 'Unknown',
                Travel_Date: data.Travel_Date || 'N/A',
                Pickup_Time: data.Pickup_Time || 'N/A',
                Return_Date: data.Return_Date || 'N/A',
                Travelers: data.Travelers || '1',
                Vehicle_Type: data.Vehicle_Type || 'Sedan',
                Company_Name: data.Company_Name || 'N/A',
                Is_Corporate: data.Is_Corporate || 'No',
                Comments: data.Comments || '',
                Status: 'New Inquiry',
                Driver_Assigned: 'Pending'
            });

            responseData = { success: true, message: "Booking Saved", id: bookingID };
        }

        else if (action === 'submitLead') {
            const data = JSON.parse(event.body);

            // 1. Use Main Sheet ('bookings')
            let sheet = doc.sheetsByTitle['bookings'];
            if (!sheet) sheet = doc.sheetsByIndex[0];

            // 2. Generate WA- ID
            const now = new Date();
            const day = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
            let randomStr = '';
            for (let i = 0; i < 4; i++) randomStr += chars.charAt(Math.floor(Math.random() * chars.length));

            const bookingID = `WA-${day}${month}-${randomStr}`;

            // 3. Save Data (Mapping to your existing columns)
            await sheet.addRow({
                Booking_ID: bookingID,
                Timestamp: now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
                Pickup_City: data.pickup || 'Unknown',
                Drop_City: data.drop || 'Unknown',
                Travel_Date: data.date || 'N/A',
                Mobile_Number: data.mobile || 'Pending',
                Journey_Type: data.type || 'One Way',

                // Defaults for columns we don't have data for yet
                Customer_Name: 'WhatsApp User',
                Email: 'N/A',
                Pickup_Time: 'N/A',
                Return_Date: 'N/A',
                Travelers: 'N/A',
                Vehicle_Type: 'N/A',
                Company_Name: 'N/A',
                Is_Corporate: 'No',
                Comments: 'Quick Estimate Request',
                Status: 'WhatsApp Estimate',
                Driver_Assigned: 'Pending'
            });

            responseData = { success: true, message: "Lead Saved to Main Sheet" };
        }

        // --- CASE C: GET TARIFFS (Fetch Pricing from Sheet) ---
        else if (action === 'getTariff') {
            // 1. Load both sheets
            // Note: Ensure your sheet tabs are exactly named 'tariff_local' and 'tariff_outstation'
            const localSheet = doc.sheetsByTitle['tariff_local'];
            const outstationSheet = doc.sheetsByTitle['tariff_outstation'];

            // 2. Fetch Rows
            const localRows = localSheet ? await localSheet.getRows() : [];
            const outstationRows = outstationSheet ? await outstationSheet.getRows() : [];

            // 3. Helper to clean data (UPDATED TO FIX 500 ERROR)
            const cleanRow = (row) => {
                // Method A: Try the library's built-in converter (Works on v3/v4)
                if (typeof row.toObject === 'function') {
                    return row.toObject();
                }

                // Method B: Fallback (Manually copy keys)
                const obj = {};
                for (const key in row) {
                    // unexpected properties usually start with _ in this library
                    if (!key.startsWith('_') && typeof row[key] !== 'function') {
                        obj[key] = row[key];
                    }
                }
                return obj;
            };

            // 4. Send back as structured JSON
            responseData = {
                local: localRows.map(cleanRow),
                outstation: outstationRows.map(cleanRow)
            };
        }

        else if (action === 'getRoutes') {
            // 1. Connect to the 'routes' sheet
            let sheet = doc.sheetsByTitle['routes'];
            if (!sheet) {
                // Safety check: if tab is missing, return empty array
                responseData = [];
            } else {
                const rows = await sheet.getRows();

                // 2. Helper to clean data (Safe Version)
                const cleanRow = (row) => {
                    if (typeof row.toObject === 'function') return row.toObject();
                    const obj = {};
                    for (const key in row) {
                        if (!key.startsWith('_') && typeof row[key] !== 'function') {
                            obj[key] = row[key];
                        }
                    }
                    return obj;
                };

                // 3. Return the data
                responseData = rows.map(cleanRow);
            }
        }

        else {
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