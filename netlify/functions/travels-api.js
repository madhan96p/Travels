const { GoogleSpreadsheet } = require('google-spreadsheet');
const { Resend } = require('resend');

// YOUR SHEET ID
const SPREADSHEET_ID = '1eqSsdKzF71WR6KR7XFkEI8NW7ObtnxC16ZtavJeePq8';

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper: Generate Booking ID (e.g., ST-2511-893)
const generateBookingID = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(100 + Math.random() * 900); // 3 digit random
    return `ST-${day}${month}-${random}`;
};

// Helper: Get Sheet
const getSheet = async (doc, sheetTitle) => {
    try {
        const sheet = doc.sheetsByTitle[sheetTitle];
        if (!sheet) throw new Error(`Tab "${sheetTitle}" not found.`);
        return sheet;
    } catch (error) { throw new Error(error.message); }
};

// Email Template with Call Button
function generateBookingEmail(data, bookingID) {
    return `
    <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
            <h2 style="color: #2563eb;">🚖 New Booking Alert</h2>
            <p><strong>ID:</strong> ${bookingID}</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr><td style="padding:8px; border-bottom:1px solid #eee;"><strong>Name:</strong></td><td style="padding:8px; border-bottom:1px solid #eee;">${data.Customer_Name}</td></tr>
                <tr><td style="padding:8px; border-bottom:1px solid #eee;"><strong>Mobile:</strong></td><td style="padding:8px; border-bottom:1px solid #eee;">${data.Mobile_Number}</td></tr>
                <tr><td style="padding:8px; border-bottom:1px solid #eee;"><strong>Route:</strong></td><td style="padding:8px; border-bottom:1px solid #eee;">${data.Pickup_City} ➝ ${data.Drop_City}</td></tr>
                <tr><td style="padding:8px; border-bottom:1px solid #eee;"><strong>Date:</strong></td><td style="padding:8px; border-bottom:1px solid #eee;">${data.Travel_Date}</td></tr>
            </table>

            <div style="text-align: center; margin-top: 25px;">
                <a href="tel:${data.Mobile_Number}" style="background-color: #16a34a; color: white; padding: 12px 25px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px;">
                    📞 Call Client Now
                </a>
            </div>
             <p style="text-align:center; color: #666; font-size: 12px; margin-top: 20px;">
                Timestamp: ${new Date().toLocaleString('en-IN')}
            </p>
        </div>
    </body>`;
}

exports.handler = async function (event, context) {
    const sheetAuth = {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };

    const doc = new GoogleSpreadsheet(SPREADSHEET_ID);
    await doc.useServiceAccountAuth(sheetAuth);
    await doc.loadInfo();

    const { action } = event.queryStringParameters;

    try {
        const data = event.body ? JSON.parse(event.body) : {};
        const timestamp = new Date().toLocaleString('en-IN');

        switch (action) {
            case 'submitBooking': {
                const sheet = await getSheet(doc, 'bookings'); // Matches your new tab Name
                const bookingID = generateBookingID();

                // 1. Prepare Row Data (Exact Column Mapping)
                const rowData = {
                    Booking_ID: bookingID,
                    Timestamp: timestamp,
                    Customer_Name: data.Customer_Name || 'Guest',
                    Mobile_Number: data.Mobile_Number,
                    Pickup_City: data.Pickup_City,
                    Drop_City: data.Drop_City,
                    Travel_Date: data.Travel_Date || new Date().toISOString().split('T')[0],
                    Vehicle_Type: data.tripType || 'Sedan', // Default
                    Status: 'New',
                    Driver_Assigned: 'Pending'
                };

                // 2. Add to Sheet
                await sheet.addRow(rowData);

                // 3. Send Email
                const emailHtml = generateBookingEmail(rowData, bookingID);
                if (process.env.RESEND_API_KEY) {
                    await resend.emails.send({
                        from: 'Shrish Travels <travels@shrishgroup.com>',
                        to: ['travels@shrishgroup.com'],
                        cc: ['shrishtravels1@gmail.com'],
                        subject: `🚖 New Booking: ${rowData.Pickup_City} to ${rowData.Drop_City}`,
                        html: emailHtml,
                    });
                }

                return { statusCode: 200, body: JSON.stringify({ success: true, id: bookingID }) };
            }

            case 'submitContact': {
                const sheet = await getSheet(doc, 'travels_contacts');
                await sheet.addRow(data);

                const subject = `📧 NEW CONTACT MESSAGE from ${data.Name}`;
                const htmlBody = generatePublicFormEmail(subject, data);
                await sendEmail(subject, htmlBody);

                responseData = { success: true, message: 'Contact message submitted.' };
                break;
            }
            case 'submitCareer': {
                const sheet = await getSheet(doc, 'travels_careers');
                await sheet.addRow(data);

                const subject = `💼 NEW DRIVER APPLICATION from ${data.fullName}`;
                const htmlBody = generatePublicFormEmail(subject, data);
                await sendEmail(subject, htmlBody);

                responseData = { success: true, message: 'Career application submitted.' };
                break;
            }
            case 'getAllRoutes': {
                // For simplicity and speed, we will assume route data is in a sheet.
                // Alternatively, we could read the static 'assets/data/routes.json' here.
                const sheet = await getSheet(doc, 'routes_data');
                const rows = await sheet.getRows();
                const headers = sheet.headerValues;

                const routes = rows.map(row => {
                    const routeObject = {};
                    headers.forEach(header => {
                        routeObject[header] = row[header];
                    });
                    // IMPORTANT: Ensure array fields are parsed (e.g., from 'item1, item2')
                    routeObject.image_path = routeObject.image_path ? routeObject.image_path.split(',').map(s => s.trim()) : [];
                    routeObject.route_highlights = routeObject.route_highlights ? routeObject.route_highlights.split(',').map(s => s.trim()) : [];
                    routeObject.search_keywords = routeObject.search_keywords ? routeObject.search_keywords.split(',').map(s => s.trim()) : [];
                    routeObject.faq = JSON.parse(routeObject.faq || '[]'); // Assuming FAQ is stored as a JSON string array

                    return routeObject;
                });
                responseData = { success: true, routes: routes };
                break;
            }
            default:
                return { statusCode: 400, body: JSON.stringify({ error: 'Invalid Action' }) };
        }

    } catch (error) {
        console.error('API Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: 'Server error processing request. Please check the logs.',
                details: error.message
            })
        };
    }
};