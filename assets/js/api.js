// assets/js/api.js

const API_CONFIG = {
    // POINT TO YOUR NETLIFY FUNCTION, NOT GOOGLE APPS SCRIPT
    FUNCTION_URL: "/.netlify/functions/travels-api", 
    WHATSAPP_NUM: "918883451668"
};

const ApiService = {
    /**
     * Send lead data to Netlify Function (Google Sheets API)
     * @param {FormData} formData - The raw form data from the HTML form
     */
    submitLead: async (formData) => {
        try {
            // 1. Convert FormData to Plain JSON Object
            const plainData = Object.fromEntries(formData.entries());

            // 2. Send to Netlify Function
            const response = await fetch(`${API_CONFIG.FUNCTION_URL}?action=submitBooking`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify(plainData)
            });

            if (!response.ok) {
                throw new Error(`Server Error: ${response.statusText}`);
            }

            return await response.json();
            
        } catch (error) {
            console.error("API Error:", error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Generate WhatsApp Link
     */
    getWhatsAppLink: (text) => {
        return `https://wa.me/${API_CONFIG.WHATSAPP_NUM}?text=${text}`;
    },

    /**
     * Fetch Routes Data
     */
    getRoutes: async () => {
        try {
            // If you want to fetch routes from the Sheet via API:
            // const response = await fetch(`${API_CONFIG.FUNCTION_URL}?action=getAllRoutes`);
            
            // For now, keep it fast using the JSON file:
            const response = await fetch('assets/data/routes.json');
            return await response.json();
        } catch (e) {
            console.error("Failed to load routes", e);
            return [];
        }
    }
};

window.ApiService = ApiService;