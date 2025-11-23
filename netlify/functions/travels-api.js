const { GoogleSpreadsheet } = require('google-spreadsheet');
const { Resend } = require('resend');

// *** IMPORTANT: USE YOUR EXISTING SPREADSHEET ID HERE ***
const SPREADSHEET_ID = '1eqSsdKzF71WR6KR7XFkEI8NW7ObtnxC16ZtavJeePq8';

// --- Global Resend Initialization ---
const resend = new Resend(process.env.RESEND_API_KEY);

// --- Sheet Authentication & Setup (Reusable) ---
const getSheet = async (doc, sheetTitle) => {
    try {
        const sheet = doc.sheetsByTitle[sheetTitle];
        if (!sheet) throw new Error(`Google Sheet tab titled "${sheetTitle}" not found.`);
        return sheet;
    } catch (error) {
        throw new Error(`Failed to load sheet "${sheetTitle}": ${error.message}`);
    }
};

// --- Email Templates (Simplified for public forms) ---

// Helper function to send email (reused from Admin API)
async function sendEmail(subject, htmlBody) {
    // Only send if API key is present
    if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY is missing. Email not sent.');
        return;
    }
    try {
        await resend.emails.send({
            from: 'Shrish Travels <travels@shrishgroup.com>',
            to: ['travels@shrishgroup.com'], // Primary Admin Email
            cc: ['shrishtravels1@gmail.com'], // Secondary/Backup Email
            subject: subject,
            html: htmlBody,
        });
        console.log('Email sent successfully via Resend.');
    } catch (error) {
        console.error('Error sending email with Resend:', error);
        throw error;
    }
}

// Generates a simple notification email body for Shrish Admins
function generatePublicFormEmail(title, data) {
    const dataHtml = Object.keys(data).map(key => {
        // Exclude empty optional fields from the email body
        if (!data[key]) return '';

        const displayKey = key.replace(/_/g, ' '); // Replace underscores for readability
        let value = data[key];
        
        // Custom formatting for fields
        if (displayKey.toLowerCase() === 'date of journey') {
            value = new Date(value).toLocaleDateString('en-IN');
        }

        return `<p style="margin: 0 0 8px 0;"><strong>${displayKey}:</strong> ${value}</p>`;
    }).join('');

    const footer = `
        <div style="text-align: center; padding: 20px 0 0 0; font-size: 12px; color: #6b7280; line-height: 1.5;">
            <p style="margin: 0;">This lead was submitted via travels.shrishgroup.com.</p>
            <p style="margin: 0;">For assistance, call +91 8883451668</p>
        </div>`;

    return `
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: auto; border: 1px solid #ccc; padding: 20px; border-radius: 8px;">
            <h2 style="color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">${title}</h2>
            <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN')}</p>
            <div style="margin: 20px 0; padding: 15px; border: 1px solid #eee; background-color: #f9f9f9; border-radius: 4px;">
                ${dataHtml}
            </div>
            ${footer}
        </div>
    </body>`;
}

// --- Main Handler ---
exports.handler = async function (event, context) {
    // --- 1. Authentication ---
    const sheetAuth = {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };

    const doc = new GoogleSpreadsheet(SPREADSHEET_ID);
    await doc.useServiceAccountAuth(sheetAuth);
    await doc.loadInfo();

    const { action } = event.queryStringParameters;
    let responseData = {};

    try {
        const data = event.body ? JSON.parse(event.body) : {};
        data.Timestamp = new Date().toISOString();

        // --- 2. API Actions (Public Site) ---
        switch (action) {
            case 'submitBooking': {
                const sheet = await getSheet(doc, 'travels_bookings');
                await sheet.addRow(data);
                
                const subject = `📥 NEW BOOKING REQUEST from ${data.Name} for ${data.Pickup}`;
                const htmlBody = generatePublicFormEmail(subject, data);
                await sendEmail(subject, htmlBody);

                responseData = { success: true, message: 'Booking request submitted.' };
                break;
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
            // Add other actions like getTariffData if needed later...
            default:
                responseData = { error: 'Invalid public site action.' };
        }
        
        return { statusCode: 200, body: JSON.stringify(responseData) };

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